import { useEffect, useRef, useState } from 'react'

const CAPTURE_INTERVAL_MS = 2000
const DEFAULT_UPLOAD_URL = 'https://mattieballt-py--so100-live-splat-upload-frame.modal.run'

export default function CameraCapture() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isCapturing, setIsCapturing] = useState(false)
  const [status, setStatus] = useState('Idle')

  const uploadUrl = import.meta.env.VITE_FRAME_UPLOAD_URL || DEFAULT_UPLOAD_URL

  const stopStream = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const sendFrame = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('file', blob, `frame-${Date.now()}.jpg`)

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Upload failed (${response.status}):`, errorText)
        setStatus(`Error: ${response.status} - ${errorText.substring(0, 100)}`)
        return
      }

      const result = await response.json()
      console.log('Frame uploaded:', result)
      setStatus(`Capturing... (last upload: ${new Date().toLocaleTimeString()})`)
    } catch (error) {
      console.error('Upload error:', error)
      setStatus(`Network error: ${error}`)
    }
  }

  const captureFrame = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92)
    })

    if (!blob) return
    await sendFrame(blob)
  }

  const startCapture = async () => {
    if (isCapturing) return

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsCapturing(true)
      setStatus('Capturing 1 frame every 2 seconds...')

      await captureFrame()
      intervalRef.current = setInterval(captureFrame, CAPTURE_INTERVAL_MS)
    } catch (error) {
      console.error('Camera error:', error)
      setStatus('Camera access denied or unavailable.')
      stopStream()
    }
  }

  const stopCapture = () => {
    setIsCapturing(false)
    setStatus('Stopped')
    stopStream()
  }

  useEffect(() => {
    return () => {
      stopStream()
    }
  }, [])

  return (
    <section id="capture" className="capture-section">
      <div className="capture-container">
        <h2 className="section-title">Live Frame Capture</h2>
        <p className="section-subtitle">Send frames to the backend every 2 seconds</p>

        <div className="capture-actions">
          <button className="action-btn primary" onClick={startCapture} disabled={isCapturing}>
            <span className="btn-icon">📷</span>
            Start Capture
          </button>
          <button className="action-btn secondary" onClick={stopCapture} disabled={!isCapturing}>
            <span className="btn-icon">⏹</span>
            Stop Capture
          </button>
        </div>

        <div className="capture-preview">
          <video ref={videoRef} className="capture-video" autoPlay muted playsInline />
          <canvas ref={canvasRef} className="capture-canvas" />
        </div>

        <p className="capture-status">{status}</p>
      </div>
    </section>
  )
}
