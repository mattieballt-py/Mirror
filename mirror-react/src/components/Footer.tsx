import { Link } from 'react-router-dom'

export default function Footer() {
  return (
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
            <Link to="/">Platform</Link>
            <a href="#">Security</a>
            <a href="#">Pricing</a>
            <Link to="/contact">Contact</Link>
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
            <Link to="/testing" className="footer-testing-link">testing</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
