import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/ExerciseDetail.css'

function ExerciseDetail() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const [exercise, setExercise] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recordingEnabled, setRecordingEnabled] = useState(false)

  useEffect(() => {
    fetchExerciseDetails()
  }, [exerciseId])

  const fetchExerciseDetails = async () => {
    try {
      const response = await fetch('http://localhost:8000/assigned-exercises')
      const data = await response.json()
      const foundExercise = data.exercises.find(ex => ex.id === parseInt(exerciseId))

      if (foundExercise) {
        setExercise(foundExercise)
      } else {
        navigate('/patient')
      }
      setLoading(false)
    } catch (error) {
      console.error('Error fetching exercise:', error)
      setLoading(false)
    }
  }

  const handleStartExercise = () => {
    navigate(`/session/${exerciseId}`, { state: { recordingEnabled } })
  }

  if (loading) {
    return (
      <div className="detail-page">
        <div className="detail-bg" />
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner-minimal" />
        </div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="detail-page">
        <div className="detail-bg" />
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <h2>Exercise not found</h2>
          <button className="btn-back" onClick={() => navigate('/patient')} style={{ marginTop: '20px', position: 'static' }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="detail-page">
      <div className="detail-bg" />

      {/* Back Button */}
      <div className="back-nav">
        <button className="btn-back" onClick={() => navigate('/patient')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Exercises
        </button>
      </div>

      <div className="detail-container">
        {/* Header Section */}
        <div className="detail-header animate-enter">
          <h1 className="detail-title">Exercise Details</h1>
          <p className="detail-subtitle">Review the instructions before starting your session</p>
        </div>

        {/* content card */}
        <div className="detail-card animate-enter" style={{ animationDelay: '0.1s' }}>

          {/* Hero / Title Area */}
          <div className="detail-hero">
            <h2 className="exercise-name">{exercise.name}</h2>

            <div className="exercise-meta">
              <span className="meta-badge">
                <span className={`difficulty-dot ${exercise.difficulty.toLowerCase()}`}></span>
                {exercise.difficulty}
              </span>
              <span className="meta-badge">
                {exercise.duration}
              </span>
              <span className="meta-badge target">
                Target: {exercise.target_reps} reps
              </span>
            </div>

            <p className="exercise-desc">{exercise.description}</p>
          </div>

          {/* Instructions */}
          <div className="instructions-section">
            <h3 className="section-title">
              How to Perform This Exercise
            </h3>
            <div className="instructions-list">
              {exercise.instructions.map((instruction, index) => (
                <div key={index} className="instruction-item">
                  <div className="step-num">{index + 1}</div>
                  <div className="step-text">{instruction}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Ready / Actions Area */}
          <div className="ready-box">
            <h3 className="ready-title animate-enter" style={{ animationDelay: '0.2s' }}>
              Ready to Begin?
            </h3>
            <p className="ready-text animate-enter" style={{ animationDelay: '0.25s' }}>
              Make sure you have enough space and your camera is positioned correctly.
            </p>

            {/* Recording Toggle */}
            <div className={`recording-toggle-container animate-enter ${recordingEnabled ? 'active' : ''}`} style={{ animationDelay: '0.3s' }}>
              <div className="toggle-label" onClick={() => setRecordingEnabled(!recordingEnabled)}>
                <div style={{ fontSize: '1.5rem' }}>🎥</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  Video Guided Session
                </div>
                <div className={`toggle-switch ${recordingEnabled ? 'checked' : ''}`}>
                  <div className="toggle-knob"></div>
                </div>
              </div>
              <div className={`toggle-info ${recordingEnabled ? 'active' : ''}`}>
                {recordingEnabled
                  ? 'Session will be recorded for AI analysis'
                  : 'Enable to record session for detailed feedback'}
              </div>
            </div>

            <div className="animate-enter" style={{ animationDelay: '0.4s' }}>
              <button
                className="btn-start-session"
                onClick={handleStartExercise}
              >
                <span style={{ fontSize: '1.2rem' }}>🎬</span> Start Exercise Session
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default ExerciseDetail