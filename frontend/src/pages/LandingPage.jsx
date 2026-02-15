import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useMeetingMode } from '../contexts/MeetingModeContext'
import '../styles/LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const { enabled, setEnabled } = useMeetingMode()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const handleToggleMeetingMode = () => {
    if (!enabled) {
      if (confirm('Enable Meeting Mode? This will allow voice monitoring during your session.')) {
        setEnabled(true)
      }
    } else {
      setEnabled(false)
    }
  }

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
              <img src="/logo.png" alt="PhysioLens Logo" className="logo-image" />
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
            <h2 className="landing-section-title">Choose Your View</h2>
            <p className="landing-section-description">
              Select your specialized interface to begin your rehabilitation journey.
            </p>
          </div>

          {/* Meeting Mode Toggle */}

          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            borderRadius: '24px',
            padding: '30px 40px',
            marginBottom: '50px',
            maxWidth: '640px',
            margin: '60px auto 50px auto'
          }} className="animate-on-scroll">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '30px' }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  color: '#ffffff',
                  fontSize: '1.4rem',
                  fontWeight: '600',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}>
                  Meeting Mode
                  {enabled && <span style={{
                    fontSize: '0.8rem',
                    background: 'rgba(16, 185, 129, 0.2)',
                    color: '#10b981',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontWeight: '700'
                  }}>ENABLED</span>}
                </h3>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem', margin: 0 }}>
                  Enable voice monitoring for emergency detection, meeting scheduling, and clinical summaries
                </p>
              </div>

              <label style={{
                position: 'relative',
                display: 'inline-block',
                width: '60px',
                height: '34px',
                flexShrink: 0
              }}>
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={handleToggleMeetingMode}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: enabled ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.2)',
                  transition: '0.4s',
                  borderRadius: '34px',
                  border: enabled ? '2px solid #10b981' : '2px solid rgba(255, 255, 255, 0.3)'
                }}>
                  <span style={{
                    position: 'absolute',
                    content: '',
                    height: '26px',
                    width: '26px',
                    left: enabled ? '30px' : '4px',
                    bottom: '2px',
                    background: 'white',
                    transition: '0.4s',
                    borderRadius: '50%',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}></span>
                </span>
              </label>
            </div>
          </div>

          <div className="landing-roles-grid anim-stagger animate-on-scroll">
            <div
              className="landing-role-card-premium animate-on-scroll"
              onClick={() => navigate('/doctor')}
            >
              <div className="landing-role-image-container">
                <img
                  src="/doctor.png"
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
                  src="/patient.png"
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
                  src="/analysis.png"
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

            {/* Clinical Notes Card */}
            <div
              className="landing-role-card-premium animate-on-scroll"
              onClick={() => navigate('/clinical-notes')}
            >
              <div className="landing-role-image-container">
                <img
                  src="/reports.png"
                  alt="Clinical Notes"
                  className="landing-role-image"
                  onError={(e) => { e.target.src = '/analysis.png' }} // Fallback if image missing
                />
                <div className="landing-role-overlay"></div>
              </div>
              <div className="landing-role-content">
                <div className="landing-role-info">
                  <h3 className="landing-role-title">Clinical Notes</h3>
                  <p className="landing-role-subtitle">AI Summaries & Meetings</p>
                </div>
                <div className="landing-role-tags">
                  <span className="landing-role-tag">Documentation</span>
                  <span className="landing-role-tag">AI Generated</span>
                  <span className="landing-role-tag">Reports</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Competitor Analysis Section */}
      < section id="comparison" className="landing-section" >
        <div className="landing-container">
          <div className="landing-section-header">
            <span className="landing-section-badge">
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
              Competitive Edge
            </span>
            <h2 className="landing-section-title animate-on-scroll">Why PhysioLens Leads</h2>
            <p className="landing-section-description animate-on-scroll">
              Compare our AI-powered platform against traditional physical therapy and other digital solutions
            </p>
          </div>

          <div className="comparison-table-container animate-on-scroll">
            <div className="comparison-table">
              {/* Header Row */}
              <div className="comparison-header">
                <div className="comparison-cell feature-cell">
                  <span className="feature-label">Features</span>
                </div>
                <div className="comparison-cell competitor-cell">
                  <span className="competitor-name">Traditional PT</span>
                </div>
                <div className="comparison-cell competitor-cell">
                  <span className="competitor-name">Video Apps</span>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <div className="physiolens-badge">
                    <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
                    </svg>
                    <span className="competitor-name">PhysioLens</span>
                  </div>
                </div>
              </div>

              {/* Feature Rows */}
              <div className="comparison-row">
                <div className="comparison-cell feature-cell">Real-time AI Feedback</div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell feature-cell">Computer Vision Analysis</div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell feature-cell">Voice Coaching</div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-partial" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell feature-cell">24/7 Availability</div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell feature-cell">Professional Oversight</div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-no" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="m18 6-12 12M6 6l12 12" />
                  </svg>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell feature-cell">Progress Analytics</div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-partial" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <div className="comparison-cell competitor-cell">
                  <svg className="icon-partial" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" />
                  </svg>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <svg className="icon-yes" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <div className="comparison-row">
                <div className="comparison-cell feature-cell">Cost per Session</div>
                <div className="comparison-cell competitor-cell">
                  <span className="cost-high">$100-200</span>
                </div>
                <div className="comparison-cell competitor-cell">
                  <span className="cost-medium">$20-50</span>
                </div>
                <div className="comparison-cell physiolens-cell">
                  <span className="cost-low">$10-15</span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="landing-copyright-simple">
            <p>© 2025 PhysioLens. All rights reserved.</p>
          </div>
        </div>
      </section >
    </div >
  )
}

export default LandingPage