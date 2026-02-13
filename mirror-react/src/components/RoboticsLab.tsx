export default function RoboticsLab() {
  return (
    <section className="robotics-section" id="robotics">
      <div className="robotics-container">
        <div className="robotics-text">
          <h2>Robotics Lab Testing</h2>
          <p>
            Mirror is built for precision robotics research. Our platform integrates seamlessly with 
            sophisticated robotic arms (SO-100 series) for automated 3D scene capture and analysis.
          </p>
          <ul className="robotics-features">
            <li>Real-time kinematic synchronization</li>
            <li>Multi-camera sensor fusion</li>
            <li>Incremental Gaussian splatting for dynamic scenes</li>
            <li>Sub-millisecond frame processing on GPU</li>
            <li>Research-grade accuracy and repeatability</li>
          </ul>
        </div>
        <div className="robotics-image">
          <img src="/so101arms.png" alt="SO-100 Robotic Arms" className="arms-image" />
        </div>
      </div>

      <div className="research-grid">
        <div className="research-card">
          <div className="card-icon" aria-hidden="true">
            <svg className="card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M4 19V5" />
              <path d="M4 19H20" />
              <path d="M7 15L11 11L14 14L19 9" />
              <circle cx="11" cy="11" r="1.2" />
              <circle cx="14" cy="14" r="1.2" />
              <circle cx="19" cy="9" r="1.2" />
            </svg>
          </div>
          <h3>Development</h3>
          <p>Test and iterate 3D reconstruction algorithms with full control over capture parameters.</p>
        </div>
        <div className="research-card">
          <div className="card-icon" aria-hidden="true">
            <svg className="card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M10 2H14" />
              <path d="M12 2V8" />
              <path d="M8 8H16" />
              <path d="M6 20H18" />
              <path d="M7 20L10 8" />
              <path d="M17 20L14 8" />
              <path d="M9 14H15" />
            </svg>
          </div>
          <h3>Research</h3>
          <p>Leverage robotics-grade precision for academic papers and novel computer vision research.</p>
        </div>
        <div className="research-card">
          <div className="card-icon" aria-hidden="true">
            <svg className="card-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 20H21" />
              <path d="M5 20V10L10 13V10L15 13V10L19 12V20" />
              <path d="M5 8V6L8 4V8" />
              <path d="M9 20V16H12V20" />
            </svg>
          </div>
          <h3>Production</h3>
          <p>Deploy deterministic scanning pipelines for quality control and 3D asset creation.</p>
        </div>
      </div>
    </section>
  )
}
