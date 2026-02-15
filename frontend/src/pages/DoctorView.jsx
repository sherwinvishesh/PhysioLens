// frontend/src/pages/DoctorView.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMeetingMode } from '../contexts/MeetingModeContext'

function DoctorView() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [selectedExercises, setSelectedExercises] = useState([])
  const [targetReps, setTargetReps] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  // Meeting Mode
const { 
  enabled: meetingModeEnabled, 
  isRecording
} = useMeetingMode()

  useEffect(() => {
    fetchExercises()
  }, [])

  const fetchExercises = async () => {
    try {
      const response = await fetch('http://localhost:8000/exercises')
      const data = await response.json()
      setExercises(data.exercises)
      setLoading(false)
    } catch (error) {
      console.error('Error fetching exercises:', error)
      setMessage({ type: 'error', text: 'Failed to load exercises' })
      setLoading(false)
    }
  }

  const handleToggleExercise = (exerciseId) => {
    setSelectedExercises(prev => {
      if (prev.includes(exerciseId)) {
        const newTargetReps = { ...targetReps }
        delete newTargetReps[exerciseId]
        setTargetReps(newTargetReps)
        return prev.filter(id => id !== exerciseId)
      } else {
        if (prev.length < 5) {
          setTargetReps(prev => ({ ...prev, [exerciseId]: 10 }))
          return [...prev, exerciseId]
        } else {
          setMessage({ type: 'error', text: 'Maximum 5 exercises can be selected' })
          return prev
        }
      }
    })
  }

  const handleTargetRepsChange = (exerciseId, value) => {
    const reps = parseInt(value) || 0
    setTargetReps(prev => ({ ...prev, [exerciseId]: reps }))
  }

  const handleAssignExercises = async () => {
    if (selectedExercises.length === 0) {
      setMessage({ type: 'error', text: 'Please select at least 1 exercise' })
      return
    }

    for (const exerciseId of selectedExercises) {
      if (!targetReps[exerciseId] || targetReps[exerciseId] <= 0) {
        setMessage({ type: 'error', text: 'Please set target reps greater than 0 for all selected exercises' })
        return
      }
    }

    try {
      const assignments = selectedExercises.map(exerciseId => ({
        exercise_id: exerciseId,
        target_reps: targetReps[exerciseId]
      }))

      const response = await fetch('http://localhost:8000/assign-exercises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignments })
      })

      const data = await response.json()

      if (response.ok) {
        setMessage({ 
          type: 'success', 
          text: `Successfully assigned ${data.assigned_count} exercise(s)!` 
        })
        setTimeout(() => {
          setSelectedExercises([])
          setTargetReps({})
        }, 2000)
      } else {
        setMessage({ type: 'error', text: data.detail })
      }
    } catch (error) {
      console.error('Error assigning exercises:', error)
      setMessage({ type: 'error', text: 'Failed to assign exercises' })
    }
  }

  const handleClearSelection = () => {
    setSelectedExercises([])
    setTargetReps({})
    setMessage(null)
  }

  const handleStopRecording = () => {
    stopRecording()
    const data = getSessionData()
    console.log('Pre-session transcript:', data.phaseTranscripts.preSession)
    
    // You can save this to localStorage or backend here
    if (data.phaseTranscripts.preSession.trim()) {
      localStorage.setItem('lastPreSessionTranscript', data.phaseTranscripts.preSession)
      alert('Pre-session notes saved!')
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading exercises...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>👨‍⚕️ Doctor View</h1>
        <p>Select exercises and set target reps for your patient (Maximum 5)</p>
      </div>

      <div className="content-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <button 
            className="btn btn-secondary back-button"
            onClick={() => navigate('/')}
          >
            ← Back to Home
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={() => navigate('/add-exercise')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              fontSize: '1rem'
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>➕</span>
            Add Custom Exercise
          </button>
        </div>

{/* Meeting Mode Indicator */}
{meetingModeEnabled && (
  <div style={{
    background: 'rgba(102, 126, 234, 0.1)',
    border: '2px solid rgba(102, 126, 234, 0.3)',
    borderRadius: '15px',
    padding: '20px',
    marginBottom: '30px',
    textAlign: 'center'
  }}>
    <h3 style={{ 
      color: '#667eea', 
      marginBottom: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px'
    }}>
      🎤 Meeting Mode Active
      {isRecording && (
        <span style={{
          fontSize: '0.75rem',
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '4px 10px',
          borderRadius: '12px',
          fontWeight: '700',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}>
          ● RECORDING
        </span>
      )}
    </h3>
    <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
      Voice recording is active - emergency and meeting detection enabled
    </p>
  </div>
)}

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        <div className="selection-info">
          <h3>Selected: {selectedExercises.length} / 5</h3>
          <p>Click on exercise cards to select them and set target reps</p>
        </div>

        <div className="exercise-grid">
          {exercises.map(exercise => (
            <div
              key={exercise.id}
              className={`exercise-card ${selectedExercises.includes(exercise.id) ? 'selected' : ''}`}
              onClick={() => handleToggleExercise(exercise.id)}
            >
              <div className="exercise-card-header">
                <div>
                  <h3>{exercise.name}</h3>
                  <span className={`difficulty-badge difficulty-${exercise.difficulty.toLowerCase()}`}>
                    {exercise.difficulty}
                  </span>
                  {exercise.config && (
                    <span style={{
                      display: 'inline-block',
                      marginLeft: '8px',
                      padding: '4px 10px',
                      background: 'linear-gradient(135deg, #8b5cf6 0%, #667eea 100%)',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      🤖 AI Created
                    </span>
                  )}
                </div>
                <input 
                  type="checkbox"
                  className="checkbox"
                  checked={selectedExercises.includes(exercise.id)}
                  onChange={() => {}}
                />
              </div>
              <p>{exercise.description}</p>
              <p className="duration">⏱️ {exercise.duration}</p>
              
              {selectedExercises.includes(exercise.id) && (
                <div 
                  className="target-reps-input"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    marginTop: '15px',
                    padding: '15px',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '8px',
                    border: '1px solid rgba(102, 126, 234, 0.3)'
                  }}
                >
                  <label 
                    htmlFor={`reps-${exercise.id}`}
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#00FF88',
                      fontSize: '0.9rem'
                    }}
                  >
                    Target Reps:
                  </label>
                  <input
                    id={`reps-${exercise.id}`}
                    type="number"
                    min="1"
                    value={targetReps[exercise.id] || ''}
                    onChange={(e) => handleTargetRepsChange(exercise.id, e.target.value)}
                    placeholder="Enter target reps"
                    style={{
                      width: '100%',
                      padding: '10px',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      border: '2px solid rgba(102, 126, 234, 0.4)',
                      borderRadius: '6px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      color: '#333',
                      textAlign: 'center'
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="action-buttons">
          <button 
            className="btn btn-secondary"
            onClick={handleClearSelection}
            disabled={selectedExercises.length === 0}
          >
            Clear Selection
          </button>
          <button 
            className="btn btn-success"
            onClick={handleAssignExercises}
            disabled={selectedExercises.length === 0}
          >
            Assign {selectedExercises.length} Exercise{selectedExercises.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}

export default DoctorView