// frontend/src/components/MeetingSchedulePopup.jsx

import { useEffect, useState } from 'react'

function MeetingSchedulePopup() {
  const [meeting, setMeeting] = useState(null)

  useEffect(() => {
    const handleMeeting = (event) => {
      setMeeting(event.detail)
    }

    window.addEventListener('meeting-detected', handleMeeting)
    return () => window.removeEventListener('meeting-detected', handleMeeting)
  }, [])

  if (!meeting) return null

  const handleConfirm = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/meetings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(meeting)
      })

      if (response.ok) {
        alert('Meeting scheduled successfully!')
        setMeeting(null)
      }
    } catch (error) {
      console.error('Error creating meeting:', error)
      alert('Failed to schedule meeting')
    }
  }

  const handleDismiss = () => {
    setMeeting(null)
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '20px',
        padding: '35px',
        maxWidth: '450px',
        textAlign: 'center',
        color: 'white',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>
          📅
        </div>
        <h2 style={{ fontSize: '1.8rem', marginBottom: '20px', fontWeight: '700' }}>
          Meeting Detected
        </h2>
        
        <div style={{
          background: 'rgba(255, 255, 255, 0.15)',
          padding: '20px',
          borderRadius: '12px',
          marginBottom: '25px',
          textAlign: 'left'
        }}>
          <p style={{ margin: '0 0 10px 0', fontSize: '0.9rem', opacity: 0.9 }}>
            Detected phrase:
          </p>
          <p style={{ 
            margin: '0 0 15px 0', 
            fontSize: '1rem', 
            fontStyle: 'italic',
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '10px',
            borderRadius: '6px'
          }}>
            "{meeting.extracted_phrase}"
          </p>
          
          <div style={{ display: 'grid', gap: '10px' }}>
            <div>
              <span style={{ opacity: 0.8 }}>📆 Date:</span>
              <strong style={{ marginLeft: '10px' }}>{meeting.date || 'TBD'}</strong>
            </div>
            <div>
              <span style={{ opacity: 0.8 }}>🕐 Time:</span>
              <strong style={{ marginLeft: '10px' }}>{meeting.time || 'TBD'}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleConfirm}
            style={{
              background: 'white',
              color: '#667eea',
              border: 'none',
              padding: '12px 25px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)'
            }}
          >
            ✓ Confirm
          </button>
          <button
            onClick={handleDismiss}
            style={{
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.5)',
              padding: '12px 25px',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

export default MeetingSchedulePopup