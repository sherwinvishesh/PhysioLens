import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

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
      <div className="page-container">
        <div className="loading">Loading your exercises...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>🏃‍♂️ Patient View</h1>
        <p>Your assigned exercises</p>
      </div>

      <div className="content-card">
        <button 
          className="btn btn-secondary back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        {assignedExercises.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h2>No Exercises Assigned Yet</h2>
            <p>Please wait for your doctor to assign exercises</p>
          </div>
        ) : (
          <>
            <h2 style={{ marginBottom: '20px', color: '#fff' }}>
              You have {assignedExercises.length} exercise{assignedExercises.length !== 1 ? 's' : ''} assigned
            </h2>
            <div className="assigned-exercises-list">
              {assignedExercises.map((exercise, index) => (
                <div key={exercise.id} className="assigned-exercise-card">
                  <div className="exercise-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <h3 style={{ margin: 0 }}>{index + 1}. {exercise.name}</h3>
                      {exercise.completed && (
                        <span style={{
                          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <p>{exercise.description}</p>
                    <p>
                      <strong>Target Reps:</strong> {exercise.target_reps} reps | 
                      <strong> Duration:</strong> {exercise.duration} | 
                      <strong> Difficulty:</strong> {exercise.difficulty}
                    </p>
                  </div>
                  <button 
                    className="btn btn-primary"
                    onClick={() => handleStartExercise(exercise.id)}
                  >
                    {exercise.completed ? 'Do Again →' : 'Start Exercise →'}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default PatientView