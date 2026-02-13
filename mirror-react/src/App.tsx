import { useState, useEffect } from 'react'
import './App.css'
import LiveScanHero from './components/LiveScanHero.tsx'
import SplatViewer from './components/SplatViewer.tsx'
import RoboticsLab from './components/RoboticsLab.tsx'

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
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <img src="/Mirrorv0.svg" alt="Mirror logo" className="nav-logo" />
            <div>
              <p className="nav-name">Mirror Labs</p>
              <p className="nav-tagline">Incremental 3D Gaussian Splatting</p>
            </div>
          </div>

          <div className="nav-links">
            <a href="#scan">Live Scan</a>
            <a href="#viewer">Reconstruction</a>
            <a href="#robotics">Robotics Lab</a>
            <a href="#docs">Docs</a>
          </div>

          <a className="nav-cta" href="#contact">
            I want this
          </a>
        </div>
      </nav>

      <LiveScanHero />
      <SplatViewer />
      <RoboticsLab />

      <footer className="footer" id="contact">
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <h2 className="footer-logo">Mirror Labs</h2>
              <p className="footer-tagline">
                Precision 3D reconstruction and robotics lab infrastructure for
                reliable spatial intelligence.
              </p>
            </div>

            <div className="footer-column" id="docs">
              <h3>Site</h3>
              <a href="#">Platform</a>
              <a href="#">Security</a>
              <a href="#">Pricing</a>
              <a href="#">Contact</a>
            </div>

            <div className="footer-column">
              <h3>Docs</h3>
              <a href="https://github.com/mattieballt-py/Mirror" target="_blank" rel="noreferrer">
                Frontend Repository
              </a>
              <a href="https://github.com/mattieballt-py/Mirror_Backend" target="_blank" rel="noreferrer">
                Backend Repository
              </a>
              <a href="#">API Reference</a>
              <a href="#">Deployment Guide</a>
            </div>

            <div className="footer-column">
              <h3>Research</h3>
              <a href="https://arxiv.org/abs/2308.04079" target="_blank" rel="noreferrer">
                3D Gaussian Splatting (2023)
              </a>
              <a href="https://arxiv.org/abs/2003.08934" target="_blank" rel="noreferrer">
                NeRF (2020)
              </a>
              <a href="https://arxiv.org/abs/2302.11283" target="_blank" rel="noreferrer">
                Instant-NGP (2022)
              </a>
              <a href="https://arxiv.org/abs/2312.03880" target="_blank" rel="noreferrer">
                Spatio-Temporal Splats (2023)
              </a>
            </div>

            <div className="footer-column">
              <h3>Stay Updated</h3>
              <p className="footer-note">Get product updates and research releases.</p>
              <form className="footer-form">
                <input type="email" placeholder="Email address" aria-label="Email address" />
                <button type="submit">Subscribe</button>
              </form>
            </div>
          </div>

          <div className="footer-bottom">
            <p>&copy; 2026 Mirror Labs. All rights reserved.</p>
            <div className="footer-links">
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Status</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
