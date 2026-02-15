// frontend/src/components/EmergencyAlert.jsx

import { useEffect, useState } from 'react'

function EmergencyAlert() {
  const [emergency, setEmergency] = useState(null)

  useEffect(() => {
    const handleEmergency = (event) => {
      setEmergency(event.detail)
    }

    window.addEventListener('emergency-detected', handleEmergency)
    return () => window.removeEventListener('emergency-detected', handleEmergency)
  }, [])

  if (!emergency) return null

  const handleDismiss = () => {
    setEmergency(null)
  }

  const handleCall911 = () => {
    window.open('tel:911')
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.85)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '500px',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '20px', animation: 'bounce 1s ease infinite' }}>
          🚨
        </div>
        <h2 style={{ fontSize: '2rem', marginBottom: '15px', fontWeight: '800' }}>
          EMERGENCY DETECTED
        </h2>
        <p style={{ fontSize: '1.1rem', marginBottom: '10px', opacity: 0.95 }}>
          {emergency.emergency_reason}
        </p>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '15px',
          borderRadius: '10px',
          marginBottom: '25px'
        }}>
          <p style={{ margin: 0, fontSize: '0.9rem' }}>
            Urgency Score: <strong>{emergency.urgency_score}/10</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleCall911}
            style={{
              background: 'white',
              color: '#ef4444',
              border: 'none',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            📞 Call 911
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              padding: '15px 30px',
              borderRadius: '10px',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Dismiss
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  )
}

export default EmergencyAlert