import { useState } from 'react'
import { Link } from 'react-router-dom'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    useCase: 'warehouse',
    message: ''
  })
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In production, send this to your backend
    console.log('Form submitted:', formData)
    setSubmitted(true)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (submitted) {
    return (
      <section className="contact-section">
        <div className="contact-container">
          <div className="contact-success">
            <div className="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h1 className="success-title">Request Received!</h1>
            <p className="success-message">
              Thank you for your interest in Mirror Labs. Our team will review your request
              and get back to you within 24-48 hours.
            </p>
            <Link to="/" className="cta-primary">
              Back to Home
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="contact-section">
      <div className="contact-container">
        <div className="contact-header">
          <h1 className="contact-title">Request Early Access</h1>
          <p className="contact-subtitle">
            Join the waitlist for pilot programs. Limited spots available for
            warehouses, research labs, and manufacturing facilities.
          </p>
        </div>

        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="John Smith"
            />
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Work Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="john@company.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="company" className="form-label">
              Company Name *
            </label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              required
              className="form-input"
              placeholder="Acme Corporation"
            />
          </div>

          <div className="form-group">
            <label htmlFor="useCase" className="form-label">
              Primary Use Case *
            </label>
            <select
              id="useCase"
              name="useCase"
              value={formData.useCase}
              onChange={handleChange}
              required
              className="form-select"
            >
              <option value="warehouse">Warehouse Automation</option>
              <option value="lab">Research Laboratory</option>
              <option value="assembly">Assembly Line / Manufacturing</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="message" className="form-label">
              Tell us about your project (Optional)
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={5}
              className="form-textarea"
              placeholder="What challenges are you trying to solve? What are your automation goals?"
            />
          </div>

          <button type="submit" className="form-submit">
            Submit Request
          </button>

          <p className="form-note">
            By submitting this form, you agree to receive communications from Mirror Labs
            about our products and services. We respect your privacy.
          </p>
        </form>

        <div className="contact-info">
          <h3>Questions?</h3>
          <p>Email us at <a href="mailto:hello@mirrorlabs.ai">hello@mirrorlabs.ai</a></p>
        </div>
      </div>
    </section>
  )
}
