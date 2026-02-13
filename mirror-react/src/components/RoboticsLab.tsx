export default function RoboticsLab() {
  return (
    <section className="robotics-section">
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
          <div className="card-icon">📊</div>
          <h3>Development</h3>
          <p>Test and iterate 3D reconstruction algorithms with full control over capture parameters.</p>
        </div>
        <div className="research-card">
          <div className="card-icon">🔬</div>
          <h3>Research</h3>
          <p>Leverage robotics-grade precision for academic papers and novel computer vision research.</p>
        </div>
        <div className="research-card">
          <div className="card-icon">🏭</div>
          <h3>Production</h3>
          <p>Deploy deterministic scanning pipelines for quality control and 3D asset creation.</p>
        </div>
      </div>
    </section>
  )
}
