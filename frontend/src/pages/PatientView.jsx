import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/PatientView.css'

function PatientView() {
  const navigate = useNavigate()
  const [assignedExercises, setAssignedExercises] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch assigned exercises when component loads
  useEffect(() => {
    fetchAssignedExercises()
  }, [])

  const fetchAssignedExercises = async () => {
    try {
      const response = await fetch('http://localhost:8000/assigned-exercises')
      const data = await response.json()
      setAssignedExercises(data.exercises)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching assigned exercises:', error)
      setLoading(false)
    }
  }

  const handleStartExercise = (exerciseId) => {
    navigate(`/exercise/${exerciseId}`)
  }

  if (loading) {
    return (
      <div className="patient-page">
        <div className="patient-bg" />
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner-minimal" />
        </div>
      </div>
    )
  }

  return (
    <div className="patient-page">
      <div className="patient-bg" />

      {/* Back Button */}
      <div className="back-nav">
        <button
          className="btn-back"
          onClick={() => navigate('/')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Home
        </button>
      </div>

      <div className="patient-container">
        {/* Header Section */}
        <div className="patient-header animate-enter">
          <h1 className="patient-title">
            Patient Dashboard
          </h1>
          <p className="patient-subtitle">
            Complete your assigned exercises to track your progress.
            AI feedback is enabled for better form correction.
          </p>

          <div className="patient-stats">
            <div className="patient-stat-item">
              <svg className="patient-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span>{assignedExercises.filter(e => e.completed).length} Completed</span>
            </div>
            <div className="patient-stat-item">
              <svg className="patient-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span>{assignedExercises.length} Assigned Tasks</span>
            </div>
          </div>
        </div>

        {/* Grid Section */}
        <div className="patient-grid delay-200 animate-enter">
          {assignedExercises.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: 'rgba(255,255,255,0.5)' }}>
              <h2>No Exercises Assigned Yet</h2>
              <p>Please wait for your doctor to assign exercises based on your plan.</p>
            </div>
          ) : (
            assignedExercises.map((exercise, index) => (
              <div
                key={exercise.id}
                className="patient-card"
              >
                <div className="patient-card-content">
                  <div className="patient-card-top">
                    <div className="patient-badge-group">
                      <span className="patient-badge">
                        {exercise.difficulty}
                      </span>
                      {exercise.completed && (
                        <span className="patient-badge" style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                          ✓ Completed
                        </span>
                      )}
                    </div>
                  </div>

                  <h3 className="patient-card-title">{index + 1}. {exercise.name}</h3>
                  <p className="patient-card-desc">{exercise.description}</p>

                  <div style={{ marginTop: 'auto' }}>
                    <div className="patient-meta-row">
                      <span>Target: {exercise.target_reps} Reps</span>
                      <span style={{ margin: '0 8px', opacity: 0.3 }}>|</span>
                      <span>{exercise.duration}</span>
                    </div>

                    <button
                      className="patient-btn-primary"
                      onClick={() => handleStartExercise(exercise.id)}
                    >
                      {exercise.completed ? 'Do Again' : 'Start Exercise'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default PatientView