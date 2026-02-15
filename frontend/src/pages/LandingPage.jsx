// frontend/src/pages/LandingPage.jsx

import { useNavigate } from 'react-router-dom'
import { useMeetingMode } from '../contexts/MeetingModeContext'

function LandingPage() {
  const navigate = useNavigate()
  const { enabled, setEnabled } = useMeetingMode()

  const handleToggleMeetingMode = () => {
    if (!enabled) {
      if (confirm('Enable Meeting Mode? This will allow voice monitoring during your session.')) {
        setEnabled(true)
      }
    } else {
      setEnabled(false)
    }
  }

  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1>PhysioLens</h1>
        <p>
          AI-powered physical therapy platform with real-time voice coaching
          and computer vision analysis for professional-grade rehabilitation at home
        </p>
      </div>

      {/* Meeting Mode Toggle */}
      <div style={{
        background: 'rgba(102, 126, 234, 0.1)',
        border: '2px solid rgba(102, 126, 234, 0.3)',
        borderRadius: '20px',
        padding: '25px 35px',
        marginBottom: '40px',
        maxWidth: '600px',
        margin: '0 auto 40px auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              color: '#667eea', 
              fontSize: '1.3rem', 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              🎤 Meeting Mode
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

      <div className="role-buttons">
        <button 
          className="role-button"
          onClick={() => navigate('/doctor')}
        >
          <div className="role-button-icon">👨‍⚕️</div>
          <h2>Doctor View</h2>
          <p>Assign exercises to patients</p>
        </button>

        <button 
          className="role-button"
          onClick={() => navigate('/patient')}
        >
          <div className="role-button-icon">🏃‍♂️</div>
          <h2>Patient View</h2>
          <p>View and start your exercises</p>
        </button>

        <button 
          className="role-button"
          onClick={() => navigate('/session-history')}
        >
          <div className="role-button-icon">📹</div>
          <h2>Session History</h2>
          <p>Review recorded sessions</p>
        </button>

            <button 
            className="role-button"
            onClick={() => navigate('/clinical-notes')}
            >
            <div className="role-button-icon">📋</div>
            <h2>Clinical Notes</h2>
            <p>AI summaries & meetings</p>
            </button>
      </div>
    </div>
  )
}

export default LandingPage