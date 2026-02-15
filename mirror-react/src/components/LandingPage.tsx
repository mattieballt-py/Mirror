import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.6, -0.05, 0.01, 0.99] }
}

const fadeInLeft = {
  initial: { opacity: 0, x: -60 },
  animate: { opacity: 1, x: 0 },
  transition: { duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: [0.6, -0.05, 0.01, 0.99] }
}

export default function LandingPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-container">
          <motion.div
            className="landing-hero-content"
            initial="initial"
            animate="animate"
            variants={staggerContainer}
          >
            <motion.h1
              className="landing-hero-title"
              variants={fadeInLeft}
            >
              Robotic Automation<br />
              Powered by World Models
            </motion.h1>
            <motion.p
              className="landing-hero-subtitle"
              variants={fadeInLeft}
              transition={{ delay: 0.2 }}
            >
              Transform your warehouses, labs, and assembly lines with AI-driven spatial intelligence.
              Create digital twins in real-time for risk-free optimization and 25-70% productivity gains.
            </motion.p>
            <motion.div
              className="landing-hero-cta"
              variants={fadeInLeft}
              transition={{ delay: 0.4 }}
            >
              <Link to="/contact" className="cta-primary">
                Request Early Access
              </Link>
              <a href="#benefits" className="cta-secondary">
                Learn More
              </a>
            </motion.div>
          </motion.div>
          <motion.div
            className="landing-hero-image"
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1, ease: [0.6, -0.05, 0.01, 0.99] }}
          >
            <img src="/so101arms.png" alt="Robotic Arms" className="hero-robot-image" />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <motion.div
          className="stats-container"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.div className="stat-card" variants={scaleIn}>
            <div className="stat-number">25-70%</div>
            <div className="stat-label">Productivity Increase</div>
          </motion.div>
          <motion.div className="stat-card" variants={scaleIn}>
            <div className="stat-number">6-18mo</div>
            <div className="stat-label">Average ROI Timeline</div>
          </motion.div>
          <motion.div className="stat-card" variants={scaleIn}>
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Picking Accuracy</div>
          </motion.div>
          <motion.div className="stat-card" variants={scaleIn}>
            <div className="stat-number">$59B</div>
            <div className="stat-label">Market by 2030</div>
          </motion.div>
        </motion.div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section" id="benefits">
        <div className="benefits-container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Why World Model Automation?
          </motion.h2>
          <motion.p
            className="section-subtitle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Digital twins enable simulation without operational risk. Test demand spikes,
            optimize workflows, and maximize throughput before physical deployment.
          </motion.p>

          <motion.div
            className="benefits-grid"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div className="benefit-card" variants={fadeInUp}>
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
                </svg>
              </div>
              <h3>30-40% Throughput Gains</h3>
              <p>
                Optimize material flow and reduce bottlenecks with real-time spatial AI.
                See processing times drop by up to 60% when volume, SKU mix, and labor economics align.
              </p>
            </motion.div>

            <motion.div className="benefit-card" variants={fadeInUp}>
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>
              <h3>Fast ROI: 6-18 Months</h3>
              <p>
                Most companies achieve full ROI within 18 months. Year 5 ROI often exceeds 300-400%.
                Lower upfront costs with autonomous systems mean faster payback.
              </p>
            </motion.div>

            <motion.div className="benefit-card" variants={fadeInUp}>
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
                </svg>
              </div>
              <h3>Digital Twin Validation</h3>
              <p>
                Simulate changes before release with virtual commissioning.
                Reduce development time by 25-50% and eliminate errors in real-world deployment.
              </p>
            </motion.div>

            <motion.div className="benefit-card" variants={fadeInUp}>
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
              </div>
              <h3>50% Cost Reduction</h3>
              <p>
                Automated package sorting lowers sortation costs by 50% through minimal errors and rework.
                Reduce inventory and labor costs by 15-30% in high-volume environments.
              </p>
            </motion.div>

            <motion.div className="benefit-card" variants={fadeInUp}>
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                  <line x1="12" y1="22.08" x2="12" y2="12" />
                </svg>
              </div>
              <h3>Spatial AI Precision</h3>
              <p>
                Advanced computer vision with 3D depth cameras creates continuous digital twins.
                Robots learn, predict, and optimize - achieving 99.5-99.9% accuracy.
              </p>
            </motion.div>

            <motion.div className="benefit-card" variants={fadeInUp}>
              <div className="benefit-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3>Edge AI Optimization</h3>
              <p>
                Assembly lines sense, learn, and reconfigure in minutes.
                Tune quality mid-cycle and rebalance around constraints without engineering queues.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="use-cases-section" id="use-cases">
        <div className="use-cases-container">
          <motion.h2
            className="section-title"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            Built for Critical Operations
          </motion.h2>

          <motion.div
            className="use-cases-grid"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, amount: 0.2 }}
            variants={staggerContainer}
          >
            <motion.div className="use-case-card" variants={fadeInUp}>
              <div className="use-case-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80"
                  alt="Modern warehouse"
                  className="use-case-image"
                />
              </div>
              <div className="use-case-content">
                <h3>Warehouses</h3>
                <p>
                  Increase throughput by 30-40% with autonomous mobile robots and real-time
                  inventory tracking. 80% of warehouses still operate manually - don't be left behind.
                </p>
                <ul className="use-case-features">
                  <li>Autonomous picking & sorting</li>
                  <li>Real-time inventory visibility</li>
                  <li>Dynamic route optimization</li>
                </ul>
              </div>
            </motion.div>

            <motion.div className="use-case-card" variants={fadeInUp}>
              <div className="use-case-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1582719471137-c3967ffb1c42?w=800&q=80"
                  alt="Research laboratory"
                  className="use-case-image"
                />
              </div>
              <div className="use-case-content">
                <h3>Research Labs</h3>
                <p>
                  Precision robotics for repeatable experiments. Kinematic synchronization ensures
                  sub-millisecond accuracy for academic and industrial research.
                </p>
                <ul className="use-case-features">
                  <li>Multi-camera sensor fusion</li>
                  <li>Research-grade repeatability</li>
                  <li>Real-time data capture</li>
                </ul>
              </div>
            </motion.div>

            <motion.div className="use-case-card" variants={fadeInUp}>
              <div className="use-case-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&q=80"
                  alt="Manufacturing assembly line"
                  className="use-case-image"
                />
              </div>
              <div className="use-case-content">
                <h3>Assembly Lines</h3>
                <p>
                  Reconfigure production in minutes, not hours. Digital twins validate changes
                  before deployment, reducing commissioning time by 25-30%.
                </p>
                <ul className="use-case-features">
                  <li>Virtual commissioning</li>
                  <li>Collaborative robots (cobots)</li>
                  <li>Quality control automation</li>
                </ul>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Technology Section */}
      <section className="technology-section" id="technology">
        <div className="technology-container">
          <motion.div
            className="technology-content"
            initial={{ opacity: 0, x: -60 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
          >
            <h2 className="section-title">Powered by 3D Gaussian Splatting</h2>
            <p className="technology-description">
              Our platform uses cutting-edge incremental 3D Gaussian splatting to create
              photorealistic world models in real-time. Capture spatial intelligence from any
              camera or robotic system.
            </p>
            <motion.ul
              className="technology-features"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.li variants={fadeInLeft}>
                <strong>Real-time reconstruction:</strong> Build digital twins as you move through space
              </motion.li>
              <motion.li variants={fadeInLeft}>
                <strong>GPU-accelerated:</strong> Sub-millisecond frame processing on modern hardware
              </motion.li>
              <motion.li variants={fadeInLeft}>
                <strong>Universal compatibility:</strong> Works with any camera or robotic arm
              </motion.li>
              <motion.li variants={fadeInLeft}>
                <strong>Cloud storage:</strong> Automatic sync to Cloudflare R2 for distributed access
              </motion.li>
            </motion.ul>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              <Link to="/contact" className="cta-primary">
                Get Early Access
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            className="technology-image"
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
          >
            <img src="/so101arms.png" alt="Technology demonstration" className="tech-demo-image" />
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <motion.div
          className="cta-container"
          initial="initial"
          whileInView="animate"
          viewport={{ once: true }}
          variants={staggerContainer}
        >
          <motion.h2 className="cta-title" variants={scaleIn}>
            Ready to Transform Your Operations?
          </motion.h2>
          <motion.p className="cta-subtitle" variants={scaleIn}>
            Join leading warehouses, labs, and manufacturers using spatial AI for competitive advantage.
          </motion.p>
          <motion.div variants={scaleIn}>
            <Link to="/contact" className="cta-primary-large">
              Request Early Access
            </Link>
          </motion.div>
          <motion.p className="cta-note" variants={scaleIn}>
            Limited spots available for pilot programs • No credit card required
          </motion.p>
        </motion.div>
      </section>
    </>
  )
}
