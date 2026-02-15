// frontend/src/pages/UpcomingMeetings.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function UpcomingMeetings() {
  const navigate = useNavigate()
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/meetings/upcoming')
      const data = await response.json()
      setMeetings(data.meetings || [])
    } catch (error) {
      console.error('Error fetching meetings:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'TBD'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async (meetingId) => {
    if (!confirm('Delete this meeting?')) return

    try {
      await fetch(`http://localhost:8000/api/meetings/${meetingId}`, {
        method: 'DELETE'
      })
      fetchMeetings()
    } catch (error) {
      console.error('Error deleting meeting:', error)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading meetings...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📅 Upcoming Meetings</h1>
        <p>Scheduled follow-ups and appointments</p>
      </div>

      <div className="content-card">
        <button 
          className="btn btn-secondary back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        {meetings.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📅</div>
            <h2>No Upcoming Meetings</h2>
            <p>Meetings detected during sessions will appear here</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            {meetings.map((meeting) => (
              <div
                key={meeting.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '2px solid rgba(102, 126, 234, 0.3)',
                  borderRadius: '15px',
                  padding: '25px',
                  transition: 'all 0.3s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#00FF88', fontSize: '1.4rem', marginBottom: '10px' }}>
                      {meeting.title || 'Follow-up Appointment'}
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1.1rem', marginBottom: '15px' }}>
                      📆 {formatDate(meeting.scheduled_date)}
                    </p>
                    
                    {meeting.extracted_phrase && (
                      <div style={{
                        background: 'rgba(102, 126, 234, 0.1)',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '10px'
                      }}>
                        <p style={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          fontSize: '0.85rem',
                          margin: '0 0 5px 0'
                        }}>
                          Detected from conversation:
                        </p>
                        <p style={{ 
                          color: 'white', 
                          fontStyle: 'italic',
                          margin: 0
                        }}>
                          "{meeting.extracted_phrase}"
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {meeting.patient_name && (
                        <span style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#10b981',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem'
                        }}>
                          👤 {meeting.patient_name}
                        </span>
                      )}
                      {meeting.doctor_name && (
                        <span style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#3b82f6',
                          padding: '6px 12px',
                          borderRadius: '8px',
                          fontSize: '0.85rem'
                        }}>
                          👨‍⚕️ {meeting.doctor_name}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(meeting.id)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.4)',
                      color: '#ef4444',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UpcomingMeetings