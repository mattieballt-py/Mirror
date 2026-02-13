import { useState, useRef, useEffect } from 'react'

interface Device {
  deviceId: string
  label: string
}

export default function LiveScanHero() {
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

  useEffect(() => {
    const getDevices = async () => {
      try {
        const deviceList = await navigator.mediaDevices.enumerateDevices()
        const cameras = deviceList.filter(d => d.kind === 'videoinput')
        setDevices(cameras as Device[])
      } catch (error) {
        console.error('Error enumerating devices:', error)
      }
    }
    getDevices()
  }, [])

  const uploadFrameUrl = 'https://mattieballt-py--so100-live-splat-upload-frame.modal.run'

  const uploadFrame = async (blob: Blob) => {
    const formData = new FormData()
    formData.append('file', blob, `frame-${Date.now()}.jpg`)

    try {
      const response = await fetch(uploadFrameUrl, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Upload error: ${response.status}:`, errorText)
      } else {
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
    setStatus('Scanning stopped')
  }

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-left">
          <h1 className="hero-title">Live 3D Scanning</h1>
          <p className="hero-description">
            Capture real-time 3D scenes using incremental Gaussian splatting.
            Start streaming frames from your camera, optionally synchronized with robotic arm kinematics.
          </p>

          <div className="controls-panel">
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

            {roboticsEnabled && (
              <>
                <div className="control-group">
                  <label htmlFor="leader-arm" className="control-label">
                    Leader Arm Camera
                  </label>
                  <select
                    id="leader-arm"
                    value={leaderArm}
                    onChange={e => setLeaderArm(e.target.value)}
                    className="control-select"
                  >
                    <option value="">Select camera...</option>
                    {devices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Camera ${d.deviceId.substring(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>

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
              </>
            )}

            <div className="button-group">
              <button
                className={`scan-btn ${isScanning ? 'active' : ''}`}
                onClick={isScanning ? stopScanning : startScanning}
              >
                {isScanning ? '⏹ Stop Scanning' : '🎥 Start Scanning'}
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
                <svg className="camera-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
                <p>Camera Stream</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
