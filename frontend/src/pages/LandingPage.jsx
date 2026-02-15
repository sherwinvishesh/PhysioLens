import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import '../styles/LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate')
          }
        })
      },
      { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
    )

    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [])

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
    document.body.style.overflow = !isMenuOpen ? 'hidden' : ''
  }

  return (
    <div className="landing-page">
      {/* Background with blur effect */}
      <div className="landing-bg" />

      {/* Navigation */}
      <header className="landing-header">
        <div className="landing-nav-container">
          <div className="landing-nav">
            <div className="landing-logo">
              <img src="/physiology.png" alt="PhysioLens Logo" className="logo-image" />
            </div>

            {/* Desktop Navigation */}
            <nav className="landing-nav-desktop">
              <a href="#features" className="landing-nav-link">Features</a>
              <a href="#how-it-works" className="landing-nav-link">How It Works</a>
              <a href="#roles" className="landing-nav-link">Get Started</a>
              <button
                className="landing-nav-cta"
                onClick={() => navigate('/doctor')}
              >
                Start Training
              </button>
            </nav>

            {/* Mobile Menu Button */}
            <button className="landing-mobile-menu-btn" onClick={toggleMenu}>
              {isMenuOpen ? (
                <>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                  <span>Close</span>
                </>
              ) : (
                <>
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 5h16M4 12h16M4 19h16" />
                  </svg>
                  <span>Menu</span>
                </>
              )}
            </button>
          </div>

          {/* Mobile Navigation Menu */}
          {isMenuOpen && (
            <div className="landing-mobile-menu">
              <div className="landing-mobile-menu-content">
                <button className="landing-mobile-close" onClick={toggleMenu}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </button>

                <nav className="landing-mobile-nav">
                  <a href="#features" onClick={toggleMenu}>Features</a>
                  <a href="#how-it-works" onClick={toggleMenu}>How It Works</a>
                  <a href="#roles" onClick={toggleMenu}>Get Started</a>

                  <div className="landing-mobile-nav-divider" />

                  <button
                    className="landing-mobile-cta"
                    onClick={() => { navigate('/doctor'); toggleMenu(); }}
                  >
                    Start Training
                  </button>
                </nav>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-container">
          <div className="landing-hero-grid">
            {/* Left Column - Heading */}
            <div className="landing-hero-heading">
              <h1 className="landing-hero-title">
                Stronger.<br />
                Sharper.<br />
                Unstoppable.
              </h1>
            </div>

            {/* Right Column - Content */}
            <div className="landing-hero-content">
              <div className="landing-hero-badge">
                <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                </svg>
                <span className="badge-rating">4.9</span>
                <span className="badge-text">rating</span>
                <div className="badge-divider" />
                <span className="badge-subtext">AI-powered therapy</span>
              </div>

              <p className="landing-hero-description">
                AI-powered physical therapy platform with real-time voice coaching and
                computer vision analysis for professional-grade rehabilitation at home.
              </p>

              <div className="landing-hero-actions">
                <button
                  className="landing-hero-btn-primary"
                  onClick={() => navigate('/patient')}
                >
                  <span>Start Now</span>
                  <svg className="icon" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="landing-hero-divider" />

                <button
                  className="landing-hero-btn-secondary"
                  onClick={() => navigate('/session-history')}
                >
                  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z" />
                  </svg>
                  View Sessions
                </button>
              </div>

              <div className="landing-hero-footer">
                <p>Professional-grade rehabilitation from the comfort of your home.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z" />
              </svg>
              AI-Powered Features
            </span>
            <h2 className="landing-section-title animate-on-scroll">Elite Training Protocol</h2>
            <p className="landing-section-description animate-on-scroll">
              Cutting-edge technology meets professional physical therapy. Real-time analysis,
              voice coaching, and computer vision for perfect form every time.
            </p>
          </div>

          <div className="landing-features-grid animate-on-scroll">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <p className="landing-feature-title">Computer Vision</p>
              <p className="landing-feature-description">
                Real-time pose detection and form analysis using advanced AI
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                  <line x1="12" x2="12" y1="19" y2="22" />
                </svg>
              </div>
              <p className="landing-feature-title">Voice Coaching</p>
              <p className="landing-feature-description">
                Real-time audio feedback and guidance throughout your session
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <p className="landing-feature-title">Professional Support</p>
              <p className="landing-feature-description">
                Doctor-assigned exercises tailored to your rehabilitation needs
              </p>
            </div>

            <div className="landing-feature-card">
              <div className="landing-feature-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                  <path d="M7 11.207a.5.5 0 0 1 .146-.353l2-2a.5.5 0 0 1 .708 0l3.292 3.292a.5.5 0 0 0 .708 0l4.292-4.292a.5.5 0 0 1 .854.353V16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1z" />
                </svg>
              </div>
              <p className="landing-feature-title">Progress Tracking</p>
              <p className="landing-feature-description">
                Detailed session history and performance analytics over time
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="3" />
                <path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.5A2 2 0 0 0 17.48 8Z" />
              </svg>
              Simple Process
            </span>
            <h2 className="landing-section-title animate-on-scroll">How PhysioLens Works</h2>
            <p className="landing-section-description animate-on-scroll">
              Three simple steps to start your professional rehabilitation journey
            </p>
          </div>

          <div className="landing-steps-grid animate-on-scroll">
            <div className="landing-step-card">
              <div className="landing-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 12h-5M15 8h-5M19 17V5a2 2 0 0 0-2-2H4" />
                  <path d="M8 21h12a2 2 0 0 0 2-2v-1a1 1 0 0 0-1-1H11a1 1 0 0 0-1 1v1a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v2a1 1 0 0 0 1 1h3" />
                </svg>
              </div>
              <p className="landing-step-title">Get Assigned</p>
              <p className="landing-step-subtitle">Step 1</p>
              <p className="landing-step-description">
                Your doctor assigns personalized exercises based on your rehabilitation needs
              </p>
            </div>

            <div className="landing-step-card">
              <div className="landing-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" />
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                </svg>
              </div>
              <p className="landing-step-title">Start Session</p>
              <p className="landing-step-subtitle">Step 2</p>
              <p className="landing-step-description">
                Follow AI-powered voice coaching with real-time computer vision feedback
              </p>
            </div>

            <div className="landing-step-card">
              <div className="landing-step-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                  <path d="m22 10-7.5 7.5L13 16" />
                </svg>
              </div>
              <p className="landing-step-title">Track Progress</p>
              <p className="landing-step-subtitle">Step 3</p>
              <p className="landing-step-description">
                Review your session history and monitor your rehabilitation progress
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Roles Section */}
      <section id="roles" className="landing-section">
        <div className="landing-container">
          <div className="landing-section-header-wide animate-on-scroll">
            <div className="landing-section-header-text">
              <h2 className="landing-section-title">Choose Your View</h2>
              <p className="landing-section-description">
                Select your specialized interface to begin your rehabilitation journey.
              </p>
            </div>
          </div>

          <div className="landing-roles-grid anim-stagger animate-on-scroll">
            <div
              className="landing-role-card-premium animate-on-scroll"
              onClick={() => navigate('/doctor')}
            >
              <div className="landing-role-image-container">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/f6789185-8288-444d-b735-bb2e99496645_800w.jpg"
                  alt="Doctor Interface"
                  className="landing-role-image"
                />
                <div className="landing-role-overlay"></div>
              </div>
              <div className="landing-role-content">
                <div className="landing-role-info">
                  <h3 className="landing-role-title">Clinical Portal</h3>
                  <p className="landing-role-subtitle">For Licensed Therapists</p>
                </div>
                <div className="landing-role-tags">
                  <span className="landing-role-tag">Management</span>
                  <span className="landing-role-tag">Analysis</span>
                  <span className="landing-role-tag">Assignment</span>
                </div>
              </div>
            </div>

            <div
              className="landing-role-card-premium animate-on-scroll"
              onClick={() => navigate('/patient')}
            >
              <div className="landing-role-image-container">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/578af862-1f22-4fc5-80fa-63d65b09b74b_800w.jpg"
                  alt="Patient Interface"
                  className="landing-role-image"
                />
                <div className="landing-role-overlay"></div>
              </div>
              <div className="landing-role-content">
                <div className="landing-role-info">
                  <h3 className="landing-role-title">Patient Console</h3>
                  <p className="landing-role-subtitle">Interactive Recovery System</p>
                </div>
                <div className="landing-role-tags">
                  <span className="landing-role-tag">Real-time AI</span>
                  <span className="landing-role-tag">Voice Guides</span>
                  <span className="landing-role-tag">Rehab</span>
                </div>
              </div>
            </div>

            <div
              className="landing-role-card-premium animate-on-scroll"
              onClick={() => navigate('/session-history')}
            >
              <div className="landing-role-image-container">
                <img
                  src="https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/00552811-c9ca-4219-a1c3-c56163ce4db1_800w.jpg"
                  alt="Session Analytics"
                  className="landing-role-image"
                />
                <div className="landing-role-overlay"></div>
              </div>
              <div className="landing-role-content">
                <div className="landing-role-info">
                  <h3 className="landing-role-title">Progress Analytics</h3>
                  <p className="landing-role-subtitle">Performance History</p>
                </div>
                <div className="landing-role-tags">
                  <span className="landing-role-tag">Data Insights</span>
                  <span className="landing-role-tag">Recordings</span>
                  <span className="landing-role-tag">KPIs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          {/* Main Footer Grid */}
          <div className="landing-footer-grid">
            {/* Brand + Newsletter */}
            <div className="landing-footer-col brand-col">
              <div className="landing-logo">
                <img src="/physiology.png" alt="PhysioLens Logo" className="logo-image-footer" />
              </div>
              <p className="landing-footer-desc">
                Join the PhysioLens family today for life-changing fitness and rehabilitation coaching.
              </p>
              <form className="landing-newsletter-form">
                <input
                  type="email"
                  placeholder="Email address"
                  className="landing-newsletter-input"
                />
                <button type="submit" className="landing-newsletter-btn">
                  Subscribe
                </button>
              </form>
              <p className="landing-newsletter-note">Unsubscribe anytime.</p>
            </div>

            {/* Programs (Empty Column) */}
            <div className="landing-footer-col"></div>

            {/* Resources */}
            <div className="landing-footer-col">
              <p className="landing-footer-heading">Resources</p>
              <ul className="landing-footer-list">
                <li><a href="#">Meet our Coaches</a></li>
                <li><a href="#">See client transformations</a></li>
              </ul>
            </div>

            {/* Company */}
            <div className="landing-footer-col">
              <p className="landing-footer-heading">Company</p>
              <ul className="landing-footer-list">
                <li><a href="#">About</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="landing-footer-bottom-bar">
            <p className="landing-copyright">© 2025 PhysioLens. All rights reserved.</p>
            <div className="landing-legal-links">
              <a href="#">Terms</a>
              <span className="separator"></span>
              <a href="#">Privacy</a>
              <span className="separator"></span>
              <a href="#">Cookies</a>
              <span className="separator"></span>
              <a href="#" className="status-link">
                Status
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="icon">
                  <path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage