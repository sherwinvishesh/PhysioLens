// frontend/src/pages/DoctorView.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMeetingMode } from '../contexts/MeetingModeContext'
import '../styles/DoctorView.css'

function DoctorView() {
  const navigate = useNavigate()
  const [exercises, setExercises] = useState([])
  const [selectedExercises, setSelectedExercises] = useState([])
  const [targetReps, setTargetReps] = useState({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)

  // Meeting Mode
  const { enabled: meetingModeEnabled, isRecording } = useMeetingMode()

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
          // Subtle shake or toast could go here
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
    if (selectedExercises.length === 0) return

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
        // Success feedback
        setSelectedExercises([])
        setTargetReps({})
      }
    } catch (error) {
      console.error('Error assigning exercises:', error)
    }
  }

  const handleClearSelection = () => {
    setSelectedExercises([])
    setTargetReps({})
  }

  if (loading) {
    return (
      <div className="doctor-page">
        <div className="doctor-bg" />
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
          <div className="spinner-minimal" />
        </div>
      </div>
    )
  }

  return (
    <div className="doctor-page">
      <div className="doctor-bg" />

      <div className="doctor-container">
        {/* Header Section */}
        <div className="doctor-header animate-enter">
          {meetingModeEnabled && (
            <div className="meeting-pill">
              <span className="recording-dot" />
              SESSION RECORDING ACTIVE
            </div>
          )}

          <h1 className="doctor-title">
            Select Exercises for you Patient
          </h1>
          <p className="doctor-subtitle">
            Select up to 5 exercises to build a custom rehabilitation program.
            AI-driven recommendations are highlighted based on patient history.
          </p>

          <div className="doctor-stats">
            <div className="doctor-stat-item">
              <svg className="doctor-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
              <span>Active Patient: John Doe</span>
            </div>
            <div className="doctor-stat-item">
              <svg className="doctor-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
              <span>Program Duration: 4 Weeks</span>
            </div>
            <div className="doctor-stat-item">
              <svg className="doctor-stat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>
              <span>Status: In Progress</span>
            </div>
          </div>

          <div className="doctor-controls delay-100 animate-enter">
            <div className="doctor-filters">
              <button className="doctor-filter-btn active">All Exercises</button>
              <button className="doctor-filter-btn">Strength</button>
              <button className="doctor-filter-btn">Mobility</button>
              <button className="doctor-filter-btn">Balance</button>
            </div>

            <button className="doctor-action-secondary" onClick={() => navigate('/add-exercise')}>
              <span>+ Add Custom Exercise</span>
            </button>
          </div>
        </div>

        {/* Grid Section */}
        <div className="doctor-grid delay-200 animate-enter">
          {exercises.map(exercise => {
            const isSelected = selectedExercises.includes(exercise.id)
            return (
              <div
                key={exercise.id}
                className={`doctor-card ${isSelected ? 'selected' : ''}`}
                onClick={() => handleToggleExercise(exercise.id)}
              >
                <div className="doctor-card-content">
                  <div className="doctor-card-top">
                    <div className="doctor-badge-group">
                      <span className="doctor-badge">
                        {exercise.difficulty}
                      </span>
                      {exercise.config && (
                        <span className="doctor-badge">
                          AI Generated
                        </span>
                      )}
                    </div>

                    <div className="doctor-checkbox-wrapper">
                      <input
                        type="checkbox"
                        className="doctor-checkbox"
                        checked={isSelected}
                        readOnly
                      />
                    </div>
                  </div>

                  <h3 className="doctor-card-title">{exercise.name}</h3>
                  <p className="doctor-card-desc">{exercise.description}</p>

                  <div style={{ marginTop: 'auto' }}>
                    {isSelected ? (
                      <input
                        type="number"
                        className="doctor-reps-input"
                        placeholder="Target Reps"
                        value={targetReps[exercise.id] || ''}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleTargetRepsChange(exercise.id, e.target.value)}
                        autoFocus
                      />
                    ) : (
                      <div className="doctor-meta-row">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                        <span>{exercise.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating Selection Bar */}
      {selectedExercises.length > 0 && (
        <div className="doctor-selection-bar">
          <div className="doctor-selection-info">
            <span className="doctor-selection-text">{selectedExercises.length} Selected</span>
            <span className="doctor-selection-count"> / 5</span>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="doctor-clear-btn" onClick={handleClearSelection}>
              Clear
            </button>
            <button className="doctor-assign-btn" onClick={handleAssignExercises}>
              Assign Program
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorView