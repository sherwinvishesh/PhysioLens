/**
 * Camera Positioning Guide Component
 * Helps users position themselves correctly for the exercise
 */

import { useState, useEffect } from 'react'
import '../styles/CameraPositioning.css'

function CameraPositioning({ cameraType, isCorrect, message, onDismiss }) {
  const [showGuide, setShowGuide] = useState(true)
  const [autoHideTimer, setAutoHideTimer] = useState(null)

  useEffect(() => {
    // If positioning is correct, auto-hide after 2 seconds
    if (isCorrect) {
      const timer = setTimeout(() => {
        setShowGuide(false)
        if (onDismiss) onDismiss()
      }, 2000)
      setAutoHideTimer(timer)
    } else {
      // Clear auto-hide timer if positioning becomes incorrect
      if (autoHideTimer) {
        clearTimeout(autoHideTimer)
        setAutoHideTimer(null)
      }
      setShowGuide(true)
    }

    return () => {
      if (autoHideTimer) clearTimeout(autoHideTimer)
    }
  }, [isCorrect])

  const getGuideOverlay = () => {
    if (cameraType === 'upper_body') {
      return (
        <div className="guide-frame guide-upper-body">
          <div className="guide-label">Upper Body Zone</div>
          <div className="guide-zone">
            <div className="zone-marker top-marker">Head</div>
            <div className="zone-marker middle-marker">Shoulders & Arms</div>
            <div className="zone-marker bottom-marker">Hips</div>
          </div>
        </div>
      )
    } else if (cameraType === 'full_body') {
      return (
        <div className="guide-frame guide-full-body">
          <div className="guide-label">Full Body Zone</div>
          <div className="guide-zone">
            <div className="zone-marker top-marker">Head</div>
            <div className="zone-marker middle-marker">Body</div>
            <div className="zone-marker bottom-marker">Feet</div>
          </div>
        </div>
      )
    } else if (cameraType === 'lower_body') {
      return (
        <div className="guide-frame guide-lower-body">
          <div className="guide-label">Lower Body Zone</div>
          <div className="guide-zone">
            <div className="zone-marker top-marker">Hips</div>
            <div className="zone-marker middle-marker">Knees & Legs</div>
            <div className="zone-marker bottom-marker">Feet</div>
          </div>
        </div>
      )
    }
  }

  if (!showGuide) return null

  return (
    <>
      {/* Positioning Status Bar */}
      <div className={`positioning-status ${isCorrect ? 'status-correct' : 'status-incorrect'}`}>
        <div className="status-indicator">
          {isCorrect ? (
            <>
              <span className="status-icon">✓</span>
              <span className="status-text">Perfect Position</span>
            </>
          ) : (
            <>
              <span className="status-icon">⚠</span>
              <span className="status-text">{message}</span>
            </>
          )}
        </div>
      </div>

      {/* Guide Overlay (only show when incorrect) */}
      {!isCorrect && (
        <div className="camera-positioning-overlay">
          {getGuideOverlay()}
          <div className="positioning-instructions">
            <h3>Position Yourself</h3>
            <p>{message}</p>
          </div>
        </div>
      )}
    </>
  )
}

export default CameraPositioning