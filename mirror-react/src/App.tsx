import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import './App.css'
import LandingPage from './components/LandingPage'
import ContactForm from './components/ContactForm'
import TestingPage from './components/TestingPage'
import Footer from './components/Footer'

function Navigation() {
  const location = useLocation()
  const isTestingPage = location.pathname === '/testing'

  if (isTestingPage) {
    // Original navigation for testing page
    return (
      <nav className="nav">
        <div className="nav-inner">
          <div className="nav-brand">
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/Mirrorv0.svg" alt="Mirror logo" className="nav-logo" />
            </Link>
            <div>
              <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ textDecoration: 'none' }}>
                <p className="nav-name">Mirror Labs</p>
                <p className="nav-tagline">Incremental 3D Gaussian Splatting</p>
              </Link>
            </div>
          </div>

          <div className="nav-links">
            <a href="#scan">Live Scan</a>
            <a href="#viewer">Reconstruction</a>
            <a href="#robotics">Robotics Lab</a>
            <a href="#docs">Docs</a>
          </div>

          <Link className="nav-cta" to="/contact">
            Early Access
          </Link>
        </div>
      </nav>
    )
  }

  // Landing page navigation
  return (
    <nav className="nav">
      <div className="nav-inner">
        <div className="nav-brand">
          <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/Mirrorv0.svg" alt="Mirror logo" className="nav-logo" />
          </Link>
          <div>
            <Link to="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} style={{ textDecoration: 'none' }}>
              <p className="nav-name">Mirror Labs</p>
              <p className="nav-tagline">Spatial Intelligence Platform</p>
            </Link>
          </div>
        </div>

        <div className="nav-links">
          <a href="#benefits">Benefits</a>
          <a href="#use-cases">Use Cases</a>
          <a href="#technology">Technology</a>
          <a href="#contact">Contact</a>
        </div>

        <Link className="nav-cta" to="/contact">
          Early Access
        </Link>
      </div>
    </nav>
  )
}

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
          <p className="loader-subtitle">Spatial Intelligence Platform</p>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="app">
        <Navigation />

        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/contact" element={<ContactForm />} />
          <Route path="/testing" element={<TestingPage />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  )
}

export default App
