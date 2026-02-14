/**
 * Form Feedback Warning Component
 * Displays real-time warnings and tips for exercise form
 */

import { useState, useEffect } from 'react'
import '../styles/FormFeedback.css'

//function FormFeedback({ warnings, aiTip, onDismiss }) {
function FormFeedback({ warnings, onDismiss }) {
  const [visible, setVisible] = useState(false)
  const [currentWarning, setCurrentWarning] = useState(null)

  useEffect(() => {
    if (warnings && warnings.length > 0) {
      setCurrentWarning(warnings[0])
      setVisible(true)
      
      // Auto-dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleDismiss()
      }, 4000)

      return () => clearTimeout(timer)
    } else {
      setVisible(false)
    }
  }, [warnings])

  // Show AI tip separately
//   useEffect(() => {
//     if (aiTip && !currentWarning) {
//       setCurrentWarning({
//         type: 'ai_tip',
//         message: aiTip,
//         severity: 'info'
//       })
//       setVisible(true)

//       const timer = setTimeout(() => {
//         handleDismiss()
//       }, 5000)

//       return () => clearTimeout(timer)
//     }
//   }, [aiTip])

  const handleDismiss = () => {
    setVisible(false)
    setTimeout(() => {
      setCurrentWarning(null)
      if (onDismiss) onDismiss()
    }, 300)
  }

  if (!currentWarning) return null

  const getSeverityClass = () => {
    switch (currentWarning.severity) {
      case 'high':
        return 'severity-high'
      case 'medium':
        return 'severity-medium'
      case 'info':
        return 'severity-info'
      default:
        return 'severity-low'
    }
  }

  const getIcon = () => {
    switch (currentWarning.severity) {
      case 'high':
        return '⚠️'
      case 'medium':
        return '⚡'
      case 'info':
        return '💡'
      default:
        return 'ℹ️'
    }
  }

  return (
    <div className={`form-feedback-overlay ${visible ? 'visible' : ''}`}>
      <div className={`form-feedback-popup ${getSeverityClass()}`}>
        <div className="feedback-icon">{getIcon()}</div>
        <div className="feedback-content">
          <p className="feedback-message">{currentWarning.message}</p>
        </div>
        <button className="feedback-dismiss" onClick={handleDismiss}>
          ×
        </button>
      </div>
    </div>
  )
}

export default FormFeedback