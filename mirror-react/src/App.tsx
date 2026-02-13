import { useState, useEffect } from 'react'
import './App.css'
import LiveScanHero from './components/LiveScanHero'
import SplatViewer from './components/SplatViewer'
import RoboticsLab from './components/RoboticsLab'

function App() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(() => setLoading(false), 400)
          return 100
        }
        return prev + 3
      })
    }, 25)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="loader">
        <div className="loader-content">
          <h1 className="loader-text">Mirror</h1>
          <p className="loader-subtitle">3D Gaussian Splatting</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">MIRROR</h1>
          <p className="tagline">Incremental 3D Gaussian Splatting</p>
        </div>
      </header>

      <LiveScanHero />
      <SplatViewer />
      <RoboticsLab />

      <footer className="footer">
        <div className="footer-inner">
          <p>&copy; 2026 Mirror Labs. Professional 3D Scanning &amp; Robotics.</p>
        </div>
      </footer>
    </div>
  )
}

export default App
