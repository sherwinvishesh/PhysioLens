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

if (showSuccess && createdExercise) {
  return (
    <div className="page-container">
      <div className="success-overlay">
        <div className="success-card">
          <div className="success-icon">✅</div>
          <h1>Exercise Created Successfully!</h1>
          <div className="created-exercise-summary">
            <h2>{createdExercise.name}</h2>
            <p className="exercise-desc">{createdExercise.description}</p>
            <div className="exercise-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Difficulty</span>
                <span className="meta-value">{createdExercise.difficulty}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duration</span>
                <span className="meta-value">{createdExercise.duration}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Camera Type</span>
                <span className="meta-value">{createdExercise.config?.cameraType?.replace('_', ' ')}</span>
              </div>
            </div>
            <div className="instructions-preview">
              <h3>Instructions Generated:</h3>
              <ol>
                {createdExercise.instructions?.map((instruction, index) => (
                  <li key={index}>{instruction}</li>
                ))}
              </ol>
            </div>
            
            {/* Add References */}
            {createdExercise.references && createdExercise.references.length > 0 && (
              <References 
                references={createdExercise.references}
                title="📚 Based on Clinical Research"
              />
            )}
          </div>
          <div className="success-actions">
            <button className="btn btn-secondary" onClick={handleCreateAnother}>
              ➕ Create Another Exercise
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>➕ Add New Exercise</h1>
        <p>Create a custom exercise with AI-powered configuration</p>
      </div>

      <div className="content-card">
        <button 
          className="btn btn-secondary back-button"
          onClick={() => navigate('/doctor')}
          disabled={isCreating}
        >
          ← Back to Dashboard
        </button>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {isCreating ? (
          <div className="creation-loading">
            <div className="loading-animation">
              {/* Circular Progress */}
              <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 40px' }}>
                <svg width="200" height="200" style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth="12"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="100"
                    cy="100"
                    r="90"
                    fill="none"
                    stroke="url(#exerciseGradient)"
                    strokeWidth="12"
                    strokeDasharray={`${2 * Math.PI * 90}`}
                    strokeDashoffset={`${2 * Math.PI * 90 * (1 - creationProgress / 100)}`}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                  />
                  <defs>
                    <linearGradient id="exerciseGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="100%" stopColor="#764ba2" />
                    </linearGradient>
                  </defs>
                </svg>
                {/* Percentage text */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '3rem',
                    fontWeight: '800',
                    color: '#667eea',
                    lineHeight: '1'
                  }}>
                    {Math.round(creationProgress)}%
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: 'rgba(255, 255, 255, 0.7)',
                    marginTop: '8px'
                  }}>
                    Creating...
                  </div>
                </div>
              </div>

              <h2 style={{ color: '#667eea', textAlign: 'center', marginBottom: '15px' }}>
                🤖 AI is Analyzing Your Exercise
              </h2>
              <div className="loading-steps">
                <div className="loading-step">
                  <div className="step-icon">✓</div>
                  <span>Processing exercise description</span>
                </div>
                <div className="loading-step">
                  <div className="step-icon">⚙️</div>
                  <span>Identifying key body landmarks</span>
                </div>
                <div className="loading-step">
                  <div className="step-icon">📐</div>
                  <span>Calculating angle thresholds</span>
                </div>
                <div className="loading-step">
                  <div className="step-icon">📝</div>
                  <span>Generating instructions</span>
                </div>
                <div className="loading-step">
                  <div className="step-icon">🎯</div>
                  <span>Configuring form checks</span>
                </div>
              </div>
              <p style={{ 
                textAlign: 'center', 
                color: 'rgba(255, 255, 255, 0.6)', 
                fontSize: '0.9rem',
                marginTop: '30px'
              }}>
                This may take 30 seconds to 5 minutes...
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="add-exercise-form">
            <div className="form-section">
              <h2>Exercise Details</h2>
              
              <div className="form-group">
                <label htmlFor="exerciseName">Exercise Name *</label>
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
                <label htmlFor="exerciseDescription">Exercise Description *</label>
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

            <div className="form-section">
              <h2>Exercise Image (Optional)</h2>
              <p className="section-description">
                Upload an image to help the AI better understand the exercise movement
              </p>
              
              {!imagePreview ? (
                <div className="image-upload-area">
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleImageSelect}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="imageUpload" className="upload-label">
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">Click to upload image</div>
                    <div className="upload-hint">PNG, JPG up to 5MB</div>
                  </label>
                </div>
              ) : (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="Exercise preview" className="image-preview" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="remove-image-btn"
                  >
                    ✕ Remove Image
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary btn-large"
                onClick={() => navigate('/doctor')}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-success btn-large"
                disabled={!exerciseName.trim() || !exerciseDescription.trim()}
              >
                🤖 Create Exercise with AI
              </button>
            </div>
          </form>
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .success-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.3s ease;
        }

        .loading-step {
          opacity: 0;
          animation: fadeIn 0.5s ease forwards;
        }

        .loading-step:nth-child(1) { animation-delay: 0.1s; }
        .loading-step:nth-child(2) { animation-delay: 0.3s; }
        .loading-step:nth-child(3) { animation-delay: 0.5s; }
        .loading-step:nth-child(4) { animation-delay: 0.7s; }
        .loading-step:nth-child(5) { animation-delay: 0.9s; }
      `}</style>
    </div>
  )
}

export default AddExercise