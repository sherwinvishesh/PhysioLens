// frontend/src/pages/AddExercise.jsx

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AddExercise.css'
import References from '../components/References'

function AddExercise() {
  const navigate = useNavigate()

  // Form state
  const [exerciseName, setExerciseName] = useState('')
  const [exerciseDescription, setExerciseDescription] = useState('')
  const [selectedImage, setSelectedImage] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)

  // Loading state
  const [isCreating, setIsCreating] = useState(false)
  const [creationProgress, setCreationProgress] = useState(0)
  const progressIntervalRef = useRef(null)

  // Success state
  const [createdExercise, setCreatedExercise] = useState(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Error state
  const [error, setError] = useState(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const handleImageSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size must be less than 5MB')
        return
      }

      setSelectedImage(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!exerciseName.trim()) {
      setError('Please enter an exercise name')
      return
    }

    if (!exerciseDescription.trim()) {
      setError('Please enter an exercise description')
      return
    }

    // Start loading animation
    setIsCreating(true)
    setCreationProgress(0)

    // Random duration between 30 seconds and 5 minutes (30000ms - 300000ms)
    const randomDuration = Math.random() * (300000 - 30000) + 30000
    const startTime = Date.now()

    // Update progress every 100ms
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / randomDuration) * 100, 99)
      setCreationProgress(progress)
    }, 100)

    try {
      // Convert image to base64 if present
      let imageBase64 = null
      if (selectedImage) {
        const reader = new FileReader()
        imageBase64 = await new Promise((resolve, reject) => {
          reader.onload = () => {
            // Remove data:image/...;base64, prefix
            const base64 = reader.result.split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(selectedImage)
        })
      }

      // Call backend API
      const response = await fetch('http://localhost:8000/api/create-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: exerciseName,
          description: exerciseDescription,
          image_base64: imageBase64
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to create exercise')
      }

      const data = await response.json()

      // Wait for animation to complete if needed
      const remainingTime = randomDuration - (Date.now() - startTime)
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }

      // Complete the progress
      clearInterval(progressIntervalRef.current)
      setCreationProgress(100)

      // Wait a moment at 100%
      await new Promise(resolve => setTimeout(resolve, 500))

      // Show success
      setCreatedExercise(data.exercise)
      setShowSuccess(true)
      setIsCreating(false)

    } catch (err) {
      console.error('Error creating exercise:', err)
      clearInterval(progressIntervalRef.current)
      setError(err.message || 'Failed to create exercise. Please try again.')
      setIsCreating(false)
      setCreationProgress(0)
    }
  }

  const handleBackToDashboard = () => {
    navigate('/doctor')
  }

  const handleCreateAnother = () => {
    setShowSuccess(false)
    setCreatedExercise(null)
    setExerciseName('')
    setExerciseDescription('')
    setSelectedImage(null)
    setImagePreview(null)
    setError(null)
  }

  // --- Success View ---
  if (showSuccess && createdExercise) {
    return (
      <div className="doctor-page">
        <div className="doctor-bg" />
        <div className="doctor-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <div className="success-container animate-enter">
            <h1 className="doctor-title" style={{ fontSize: '2rem', marginBottom: '1rem' }}>
              Exercise Created Successfully!
            </h1>

            <div style={{ textAlign: 'left', marginBottom: '2rem' }}>
              <h2 className="form-section-title" style={{ color: 'white', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
                {createdExercise.name}
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '1.5rem' }}>
                {createdExercise.description}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Difficulty</div>
                  <div style={{ fontWeight: 600 }}>{createdExercise.difficulty}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Duration</div>
                  <div style={{ fontWeight: 600 }}>{createdExercise.duration}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Type</div>
                  <div style={{ fontWeight: 600 }}>{createdExercise.config?.cameraType?.replace('_', ' ')}</div>
                </div>
              </div>

              {createdExercise.references && createdExercise.references.length > 0 && (
                <References
                  references={createdExercise.references}
                  title=" Based on Clinical Research"
                />
              )}
            </div>

            <div className="form-actions" style={{ justifyContent: 'center' }}>
              <button className="btn btn-secondary" onClick={handleCreateAnother}>
                ➕ Create Another
              </button>
              <button className="btn btn-primary" onClick={handleBackToDashboard}>
                ✓ Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // --- Main Form View ---
  return (
    <div className="doctor-page">
      <div className="doctor-bg" />

      {/* Back Button */}
      <div className="back-nav">
        <button
          className="btn-back"
          onClick={() => navigate('/doctor')}
          disabled={isCreating}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </button>
      </div>

      <div className="doctor-container">
        {/* Header content depends on loading state */}
        {!isCreating && (
          <div className="doctor-header">
            <h1 className="doctor-title">Add New Exercise</h1>
            <p className="doctor-subtitle">
              Create a custom exercise with AI-powered configuration
            </p>
          </div>
        )}

        {error && (
          <div className="form-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
              {error}
            </div>
          </div>
        )}

        {isCreating ? (
          <div className="form-card loading-container">
            <div className="loading-circle">
              <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="8" />
                <circle
                  cx="100"
                  cy="100"
                  r="90"
                  fill="none"
                  stroke="white" /* Changed from purple to white */
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 90}`}
                  strokeDashoffset={`${2 * Math.PI * 90 * (1 - creationProgress / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                <div style={{ fontSize: '3rem', fontWeight: 700, color: 'white' }}>{Math.round(creationProgress)}%</div>
                <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>Analyzing</div>
              </div>
            </div>

            <h2 className="loading-text">AI is Analyzing Your Exercise</h2>
            <div className="loading-steps">
              <div className="loading-step-item"><span>✓</span> Processing exercise description</div>
              <div className="loading-step-item"><span>⚙️</span> Identifying key body landmarks</div>
              <div className="loading-step-item"><span>📐</span> Calculating angle thresholds</div>
              <div className="loading-step-item"><span>📝</span> Generating instructions</div>
              <div className="loading-step-item"><span>🎯</span> Configuring form checks</div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="form-card">
              <h2 className="form-section-title">Exercise Details</h2>

              <div className="form-group">
                <label htmlFor="exerciseName" className="form-label">Exercise Name *</label>
                <input
                  id="exerciseName"
                  type="text"
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="e.g., Tricep Extensions, Squats, etc."
                  className="form-input"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="exerciseDescription" className="form-label">Exercise Description *</label>
                <textarea
                  id="exerciseDescription"
                  value={exerciseDescription}
                  onChange={(e) => setExerciseDescription(e.target.value)}
                  placeholder="Describe the exercise, its benefits, and key movement patterns. The more detail you provide, the better the AI can configure it."
                  className="form-textarea"
                  rows={6}
                  maxLength={500}
                />
                <div className="char-count">
                  {exerciseDescription.length} / 500 characters
                </div>
              </div>
            </div>

            <div className="form-card">
              <h2 className="form-section-title">Exercise Image (Optional)</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
                Upload an image to help the AI better understand the exercise movement
              </p>

              {!imagePreview ? (
                <div className="upload-area">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="imageUpload" style={{ display: 'block', cursor: 'pointer' }}>
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">Click to upload reference image</div>
                    <div className="upload-hint">PNG, JPG up to 5MB</div>
                  </label>
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Preview" className="image-preview" />
                  <button type="button" onClick={handleRemoveImage} className="remove-image-btn">
                    ✕ Remove
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => navigate('/doctor')}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={!exerciseName.trim() || !exerciseDescription.trim()}>
                Create Exercise with AI
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default AddExercise