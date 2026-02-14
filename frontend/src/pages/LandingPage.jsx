import { useNavigate } from 'react-router-dom'

function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing-container">
      <div className="landing-header">
        <h1>PhysioLens</h1>
        <p>
          AI-powered physical therapy platform with real-time voice coaching
          and computer vision analysis for professional-grade rehabilitation at home
        </p>
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
      </div>
    </div>
  )
}

export default LandingPage