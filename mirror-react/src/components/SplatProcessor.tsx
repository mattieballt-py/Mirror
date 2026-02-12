import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import './SplatProcessor.css'
import GaussianSplatViewer from './GaussianSplatViewer'

type Mode = 'upload' | 'record'

interface ProcessingStatus {
  progress: number
  current_chunk: number
  total_chunks: number
  chunks: string[]
  complete: boolean
  error?: string
}

export default function SplatProcessor() {
  const [mode, setMode] = useState<Mode>('upload')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobId, setJobId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null)
  const [loadedChunks, setLoadedChunks] = useState<Set<string>>(new Set())
  const [plyUrls, setPlyUrls] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const videoInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Timer for recording
  useEffect(() => {
    if (!isRecording) return

    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      setError(null)
      const response = await axios.post('http://localhost:8000/start-recording')
      if (response.status === 200) {
        setIsRecording(true)
        setRecordingTime(0)
      }
    } catch (err) {
      setError('Failed to start recording. Make sure LeRobot server is running at localhost:8000')
      console.error('Recording start error:', err)
    }
  }

  const stopRecording = async () => {
    try {
      setIsRecording(false)
      const response = await axios.post('http://localhost:8000/stop-recording')
      
      if (response.data.video_file && response.data.csv_file) {
        // The server returns local file paths or base64 data
        // Create File objects from the response
        const videoBlob = new Blob([response.data.video_file], { type: 'video/mp4' })
        const csvBlob = new Blob([response.data.csv_file], { type: 'text/csv' })
        
        setVideoFile(new File([videoBlob], 'recording.mp4', { type: 'video/mp4' }))
        setCsvFile(new File([csvBlob], 'encoders.csv', { type: 'text/csv' }))
      }
    } catch (err) {
      setError('Failed to stop recording')
      console.error('Recording stop error:', err)
    }
  }

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'video/mp4') {
      setVideoFile(file)
      setError(null)
    } else {
      setError('Please select a valid .mp4 file')
    }
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'text/csv') {
      setCsvFile(file)
      setError(null)
    } else {
      setError('Please select a valid .csv file')
    }
  }

  const processStatusJson = (data: any): ProcessingStatus => {
    return {
      progress: data.progress || 0,
      current_chunk: data.current_chunk || 0,
      total_chunks: data.total_chunks || 0,
      chunks: data.chunks || [],
      complete: data.complete || false,
      error: data.error
    }
  }

  const pollStatus = async (currentJobId: string) => {
    try {
      const r2PublicUrl = import.meta.env.VITE_R2_PUBLIC_URL
      const statusUrl = `${r2PublicUrl}/${currentJobId}/status.json`
      
      const response = await axios.get(statusUrl)
      const status = processStatusJson(response.data)
      setProcessingStatus(status)

      // Download new chunks
      if (status.chunks && status.chunks.length > 0) {
        const newChunks = status.chunks.filter(chunk => !loadedChunks.has(chunk))
        
        for (const chunkPath of newChunks) {
          try {
            const chunkUrl = `${r2PublicUrl}/${chunkPath}`
            const newPlyUrls = [...plyUrls]
            if (!newPlyUrls.includes(chunkUrl)) {
              newPlyUrls.push(chunkUrl)
              setPlyUrls(newPlyUrls)
            }
            
            loadedChunks.add(chunkPath)
            setLoadedChunks(new Set(loadedChunks))
          } catch (err) {
            console.error('Error loading chunk:', chunkPath, err)
          }
        }
      }

      // Stop polling if complete
      if (status.complete) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
        setProcessingStatus({ ...status, complete: true })
      }
    } catch (err) {
      console.error('Error polling status:', err)
      // Continue polling even if there's an error (file might not exist yet)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!videoFile || !csvFile) {
      setError('Please select both video and CSV files')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('video', videoFile)
      formData.append('encoders', csvFile)

      const modalEndpoint = import.meta.env.VITE_MODAL_ENDPOINT
      
      const response = await axios.post(modalEndpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const { job_id } = response.data
      setJobId(job_id)
      setProcessingStatus({
        progress: 0,
        current_chunk: 0,
        total_chunks: 0,
        chunks: [],
        complete: false
      })
      setLoadedChunks(new Set())
      setPlyUrls([])

      // Start polling
      pollingIntervalRef.current = setInterval(() => {
        pollStatus(job_id)
      }, 4000)

      // Initial poll
      await pollStatus(job_id)
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit files to Modal')
      console.error('Submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <section id="splat-processor" className="splat-processor">
      <div className="processor-container">
        <h2 className="processor-title">3D Scene Generator</h2>
        <p className="processor-subtitle">Upload files or record from LeRobot</p>

        {!jobId ? (
          <div className="processor-form">
            {/* Mode Selector */}
            <div className="mode-selector">
              <button
                className={`mode-btn ${mode === 'upload' ? 'active' : ''}`}
                onClick={() => setMode('upload')}
              >
                📤 Upload Files
              </button>
              <button
                className={`mode-btn ${mode === 'record' ? 'active' : ''}`}
                onClick={() => setMode('record')}
              >
                🎥 Record
              </button>
            </div>

            {/* Upload Mode */}
            {mode === 'upload' && (
              <div className="upload-area">
                <div className="file-input-group">
                  <label className="file-label">
                    <span className="file-icon">📁</span>
                    <span className="file-text">Video File (.mp4)</span>
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept=".mp4"
                      onChange={handleVideoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {videoFile && (
                    <div className="file-selected">
                      ✓ {videoFile.name}
                    </div>
                  )}
                </div>

                <div className="file-input-group">
                  <label className="file-label">
                    <span className="file-icon">📊</span>
                    <span className="file-text">Encoder Data (.csv)</span>
                    <input
                      ref={csvInputRef}
                      type="file"
                      accept=".csv"
                      onChange={handleCsvUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                  {csvFile && (
                    <div className="file-selected">
                      ✓ {csvFile.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Record Mode */}
            {mode === 'record' && (
              <div className="record-area">
                <div className="record-display">
                  <div className={`recording-indicator ${isRecording ? 'active' : ''}`}>
                    <span className="pulse"></span>
                    {isRecording ? 'RECORDING' : 'READY'}
                  </div>
                  <div className="recording-time">{formatTime(recordingTime)}</div>
                </div>

                <div className="record-buttons">
                  <button
                    className="record-btn start"
                    onClick={startRecording}
                    disabled={isRecording}
                  >
                    ▶ Start Recording
                  </button>
                  <button
                    className="record-btn stop"
                    onClick={stopRecording}
                    disabled={!isRecording}
                  >
                    ⏹ Stop Recording
                  </button>
                </div>

                {videoFile && csvFile && (
                  <div className="record-status">
                    <p className="record-confirm">Recording captured ✓</p>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠</span>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!videoFile || !csvFile || isSubmitting}
            >
              {isSubmitting ? 'Processing...' : 'Generate 3D Scene'}
            </button>
          </div>
        ) : (
          <div className="processing-area">
            {/* Progress Bar */}
            {processingStatus && (
              <div className="progress-section">
                <div className="progress-header">
                  <h3>Processing: {processingStatus.current_chunk}/{processingStatus.total_chunks}</h3>
                  <span className="progress-percent">{Math.round(processingStatus.progress)}%</span>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill"
                    style={{ width: `${processingStatus.progress}%` }}
                  />
                </div>
                <p className="progress-status">
                  {processingStatus.complete 
                    ? '✓ Processing complete!' 
                    : `Building Gaussian splat... ${processingStatus.current_chunk} chunks loaded`}
                </p>
              </div>
            )}

            {/* 3D Viewer */}
            {plyUrls.length > 0 && (
              <div className="viewer-container">
                <GaussianSplatViewer plyUrls={plyUrls} />
              </div>
            )}

            {/* Reset Button */}
            {processingStatus?.complete && (
              <button
                className="reset-btn"
                onClick={() => {
                  setJobId(null)
                  setProcessingStatus(null)
                  setLoadedChunks(new Set())
                  setPlyUrls([])
                  setVideoFile(null)
                  setCsvFile(null)
                }}
              >
                Process Another Scene
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
