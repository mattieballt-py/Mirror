import { useState, useRef, useEffect } from 'react'

interface Device {
  deviceId: string
  label: string
}

interface LiveScanHeroProps {
  onJobIdReceived?: (jobId: string) => void
}

export default function LiveScanHero({ onJobIdReceived }: LiveScanHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isScanning, setIsScanning] = useState(false)
  const [roboticsEnabled, setRoboticsEnabled] = useState(false)
  const [devices, setDevices] = useState<Device[]>([])
  const [followerArm, setFollowerArm] = useState('')
  const [leaderArm, setLeaderArm] = useState('')
  const [status, setStatus] = useState('Ready to scan')
  const [frameCount, setFrameCount] = useState(0)
  const [detectingCameras, setDetectingCameras] = useState(false)
  const [currentJobId, setCurrentJobId] = useState<string | null>(null)

  const detectCameras = async () => {
    setDetectingCameras(true)
    try {
      // Request camera permission to get device labels
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      // Stop the stream immediately - we just needed permission
      stream.getTracks().forEach(track => track.stop())

      // Now enumerate devices - labels will be populated after permission
      const deviceList = await navigator.mediaDevices.enumerateDevices()
      const cameras = deviceList.filter(d => d.kind === 'videoinput')
      setDevices(cameras as Device[])
      setStatus(`Found ${cameras.length} camera(s)`)
    } catch (error) {
      console.error('Error detecting cameras:', error)
      setStatus('Unable to detect cameras. Check permissions.')
    } finally {
      setDetectingCameras(false)
    }
  }

  useEffect(() => {
    // Try to enumerate devices without requesting permission first
    const queryDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices()
        const cameras = deviceList.filter(d => d.kind === 'videoinput')
        if (cameras.length > 0) {
          setDevices(cameras as Device[])
        }
      } catch (error) {
        console.error('Error querying devices:', error)
      }
    }
    queryDevices()
  }, [])

  const uploadFrameUrl = 'https://mattieballt-py--so100-live-splat-upload-frame.modal.run'

  const uploadFrame = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('file', blob, `frame-${Date.now()}.jpg`)
    
    // Include job_id if we have one
    if (currentJobId) {
      formData.append('job_id', currentJobId)
    }

    try {
      const response = await fetch(uploadFrameUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Upload error: ${response.status}:`, errorText)
      } else {
        const data = await response.json()
        
        // If this is the first frame, we receive a job_id
        if (data.job_id && !currentJobId) {
          setCurrentJobId(data.job_id)
          if (onJobIdReceived) {
            onJobIdReceived(data.job_id)
          }
          console.log('Received job_id:', data.job_id)
        }
        
        setFrameCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Network error:', error)
    }
  }

  const captureFrame = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || video.videoWidth === 0 || video.videoHeight === 0) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(blob => {
      if (blob) uploadFrame(blob)
    }, 'image/jpeg', 0.92)
  }

  const startScanning = async () => {
    if (isScanning) return

    try {
      const constraints: MediaStreamConstraints = {
        video: leaderArm ? { deviceId: { exact: leaderArm } } : true,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setIsScanning(true)
      setStatus('Scanning... 1 frame per second')
      setFrameCount(0)

      captureFrame()
      intervalRef.current = setInterval(captureFrame, 1000)
    } catch (error) {
      console.error('Camera error:', error)
      setStatus('Unable to access camera')
    }
  }

  const stopScanning = () => {
    if (intervalRef.current) clearInterval(intervalRef.current)

    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }

    setIsScanning(false)
    setStatus('Scanning stopped - processing PLY chunks...')
    // Don't reset currentJobId - we need it for the viewer to poll
  }

  return (
    <section className="hero-section" id="scan">
      <div className="hero-container">
        <div className="hero-left">
          <h1 className="hero-title">Live 3D Scanning</h1>
          <p className="hero-description">
            Capture real-time 3D scenes using incremental Gaussian splatting.
            Start streaming frames from your camera, optionally synchronized with robotic arm kinematics.
          </p>

          <div className="controls-panel">
            {devices.length === 0 && (
              <div className="control-group">
                <button
                  onClick={detectCameras}
                  disabled={detectingCameras}
                  className="detect-btn"
                >
                  {detectingCameras ? 'Detecting cameras...' : 'Detect Cameras'}
                </button>
              </div>
            )}

            <div className="control-group">
              <label className="control-label">Robot Arm Integration</label>
              <div className="radio-toggle">
                <input
                  type="radio"
                  id="robot-off"
                  name="robot"
                  checked={!roboticsEnabled}
                  onChange={() => setRoboticsEnabled(false)}
                />
                <label htmlFor="robot-off">Disabled</label>

                <input
                  type="radio"
                  id="robot-on"
                  name="robot"
                  checked={roboticsEnabled}
                  onChange={() => setRoboticsEnabled(true)}
                />
                <label htmlFor="robot-on">Enabled</label>
              </div>
            </div>

            <div className="control-group">
              <label htmlFor="leader-arm" className="control-label">
                Select Camera
              </label>
              <select
                id="leader-arm"
                value={leaderArm}
                onChange={e => setLeaderArm(e.target.value)}
                className="control-select"
              >
                <option value="">Choose a camera...</option>
                {devices.map(d => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${d.deviceId.substring(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>

            {roboticsEnabled && (
              <div className="control-group">
                <label htmlFor="follower-arm" className="control-label">
                  Follower Arm (for reference)
                </label>
                <select
                  id="follower-arm"
                  value={followerArm}
                  onChange={e => setFollowerArm(e.target.value)}
                  className="control-select"
                >
                  <option value="">Select arm...</option>
                  <option value="arm-1">Arm 1</option>
                  <option value="arm-2">Arm 2</option>
                </select>
              </div>
            )}

            <div className="button-group">
              <button
                className={`scan-btn ${isScanning ? 'active' : ''}`}
                onClick={isScanning ? stopScanning : startScanning}
              >
                <img
                  src={
                    isScanning
                      ? '/stop-circle-svgrepo-com.svg'
                      : '/record-square-svgrepo-com.svg'
                  }
                  alt=""
                  className="button-icon"
                />
                {isScanning ? 'Stop Scanning' : 'Start Scanning'}
              </button>
            </div>

            <div className="status-display">
              <p className="status-text">{status}</p>
              {isScanning && <p className="frame-count">Frames: {frameCount}</p>}
            </div>
          </div>
        </div>

        <div className="hero-right">
          <div className="video-container">
            <video ref={videoRef} className="hero-video" autoPlay muted playsInline />
            <canvas ref={canvasRef} className="hidden-canvas" />
            {!isScanning && (
              <div className="video-placeholder">
                <img
                  src="/camera-minimalistic-svgrepo-com.svg"
                  alt=""
                  className="placeholder-icon"
                />
                <p>Camera Stream</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
