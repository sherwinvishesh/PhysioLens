import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

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
      <div className="page-container">
        <div className="loading">Loading exercise...</div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="page-container">
        <div className="loading">Exercise not found</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Exercise Details</h1>
        <p>Review the instructions before starting</p>
      </div>

      <div className="content-card">
        <button 
          className="btn btn-secondary back-button"
          onClick={() => navigate('/patient')}
        >
          ← Back to Exercises
        </button>

        <div className="exercise-detail-hero">
          <h2>{exercise.name}</h2>
          <div className="exercise-meta">
            <span className={`difficulty-badge difficulty-${exercise.difficulty.toLowerCase()}`}>
              {exercise.difficulty}
            </span>
            <span className="duration-badge">
              ⏱️ {exercise.duration}
            </span>
            <span className="duration-badge" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              🎯 Target: {exercise.target_reps} reps
            </span>
          </div>
          <p className="exercise-description">{exercise.description}</p>
        </div>

        <div className="instructions-section">
          <h3>📝 How to Perform This Exercise</h3>
          <ol className="instructions-list">
            {exercise.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </div>

        <div className="ready-section">
          <div className="ready-card">
            <h3>✅ Ready to Begin?</h3>
            <p>Make sure you have enough space and your camera is accessible</p>
            <p style={{ fontSize: '1.3rem', fontWeight: '700', marginTop: '10px' }}>
              🎯 Complete {exercise.target_reps} reps to finish
            </p>
            
            {/* Recording Toggle */}
            <div style={{
              margin: '30px 0',
              padding: '20px',
              background: 'rgba(102, 126, 234, 0.1)',
              border: '2px solid rgba(102, 126, 234, 0.3)',
              borderRadius: '15px'
            }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
                cursor: 'pointer',
                fontSize: '1.1rem',
                fontWeight: '600'
              }}>
                <span style={{ fontSize: '1.5rem' }}>🎥</span>
                <span>Video Guided Session</span>
                <div style={{
                  position: 'relative',
                  width: '60px',
                  height: '34px',
                  background: recordingEnabled ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '34px',
                  transition: 'all 0.3s ease',
                  border: '2px solid ' + (recordingEnabled ? '#10b981' : 'rgba(255, 255, 255, 0.3)')
                }}>
                  <input
                    type="checkbox"
                    checked={recordingEnabled}
                    onChange={(e) => setRecordingEnabled(e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: recordingEnabled ? '28px' : '3px',
                    width: '24px',
                    height: '24px',
                    background: 'white',
                    borderRadius: '50%',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
                  }}></div>
                </div>
              </label>
              <p style={{
                marginTop: '10px',
                fontSize: '0.9rem',
                color: 'rgba(255, 255, 255, 0.8)',
                textAlign: 'center'
              }}>
                {recordingEnabled 
                  ? '✓ Session will be recorded and analyzed for feedback'
                  : 'Enable to record your session for detailed analysis'}
              </p>
            </div>

            <button 
              className="btn btn-success btn-large"
              onClick={handleStartExercise}
            >
              🎬 Start Exercise Session
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExerciseDetail