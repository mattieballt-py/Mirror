import { useState, useEffect, useRef } from 'react'
import './App.css'
import SplatProcessor from './components/SplatProcessor'
import CameraCapture from './components/CameraCapture'

function App() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isRecording, setIsRecording] = useState(false)
  const [uploadedVideo, setUploadedVideo] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setLoading(false), 500)
          return 100
        }
        return prev + 2
      })
    }, 30)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file)
      setUploadedVideo(url)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setUploadedVideo(url)
        stream.getTracks().forEach(track => track.stop())
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Error accessing camera:', err)
      alert('Unable to access camera. Please grant permission.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach(track => track.stop())
        videoRef.current.srcObject = null
      }
    }
  }

  const howItWorks = [
    { step: '01', title: 'Upload or Record', desc: 'Drop in your video or record directly in your browser' },
    { step: '02', title: 'Process', desc: 'Our AI analyzes and enhances your content with precision' },
    { step: '03', title: 'Mirror', desc: 'Experience your world reflected with stunning clarity' }
  ]

  const galleryItems = [
    { title: 'Architecture', subtitle: 'Precision mirroring' },
    { title: 'Nature', subtitle: 'Natural beauty reflected' },
    { title: 'Urban', subtitle: 'City life captured' },
    { title: 'Portrait', subtitle: 'Human connection' },
    { title: 'Events', subtitle: 'Moments preserved' },
    { title: 'Creative', subtitle: 'Artistic vision' }
  ]

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-content">
          <h1 className="loader-text">Mirror</h1>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <p className="progress-number">{progress}%</p>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="navbar" style={{ 
        background: scrollY > 50 ? 'rgba(255, 255, 255, 0.95)' : 'transparent',
        boxShadow: scrollY > 50 ? '0 2px 20px rgba(0,0,0,0.05)' : 'none'
      }}>
        <div className="nav-brand">MIRROR</div>
        <div className="nav-links">
          <a href="#hero">Home</a>
          <a href="#upload">Upload</a>
          <a href="#capture">Capture</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#gallery">Gallery</a>
          <a href="#splat-processor">3D Scenes</a>
        </div>
      </nav>

      <section id="hero" className="hero" style={{
        transform: `translateY(${scrollY * 0.5}px)`,
        opacity: 1 - (scrollY / 800)
      }}>
        <div className="hero-content">
          <h1 className="hero-title">Mirror Your World</h1>
          <p className="hero-subtitle">Capture, Explore, Transform</p>
          <p className="hero-description">
            Experience the future of visual storytelling with AI-powered precision
          </p>
        </div>
        <div className="scroll-indicator">↓</div>
      </section>

      <section id="upload" className="upload-section">
        <div className="upload-container">
          <h2 className="section-title">Start Your Journey</h2>
          <p className="section-subtitle">Upload a video or record directly</p>
          
          <div className="video-actions">
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
            
            <button 
              className="action-btn primary"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="btn-icon">📁</span>
              Upload Video
            </button>
            
            <button 
              className={`action-btn ${isRecording ? 'recording' : 'secondary'}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              <span className="btn-icon">{isRecording ? '⏹' : '🎥'}</span>
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
          </div>

          <div className="video-preview">
            {isRecording && (
              <video ref={videoRef} className="preview-video" autoPlay muted />
            )}
            {uploadedVideo && !isRecording && (
              <video src={uploadedVideo} className="preview-video" controls />
            )}
            {!uploadedVideo && !isRecording && (
              <div className="preview-placeholder">
                <p>Your video will appear here</p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="how-it-works">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">Simple, powerful, transformative</p>
        
        <div className="steps-grid">
          {howItWorks.map((item, idx) => (
            <div key={idx} className="step-card" style={{
              transform: scrollY > 800 ? 'translateY(0)' : 'translateY(50px)',
              opacity: scrollY > 800 ? 1 : 0,
              transitionDelay: `${idx * 0.2}s`
            }}>
              <div className="step-number">{item.step}</div>
              <h3 className="step-title">{item.title}</h3>
              <p className="step-desc">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="gallery" className="gallery">
        <h2 className="section-title">Gallery</h2>
        <p className="section-subtitle">Explore possibilities</p>
        
        <div className="gallery-grid">
          {galleryItems.map((item, idx) => (
            <div key={idx} className="gallery-item">
              <div className="gallery-overlay">
                <h3>{item.title}</h3>
                <p>{item.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <CameraCapture />

      <SplatProcessor />

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-cta">
            <h2 className="footer-title">Create Your World in 3D</h2>
            <p className="footer-desc">
              Transform your videos into immersive 3D scenes with AI-powered precision.
              Experience the future of spatial computing.
            </p>
            <button className="cta-btn">Get Started</button>
          </div>
          <div className="footer-divider"></div>
          <div className="footer-bottom">
            <h3>Mirror</h3>
            <p>Reflect your world with precision</p>
            <div className="footer-links">
              <a href="#hero">Back to top</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
