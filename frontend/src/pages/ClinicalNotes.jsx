// frontend/src/pages/ClinicalNotes.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

function ClinicalNotes() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('summaries')
  const [sessionSummaries, setSessionSummaries] = useState([])
  const [scheduledMeetings, setScheduledMeetings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load session summaries from localStorage
      const notes = JSON.parse(localStorage.getItem('clinicalNotes') || '[]')
      setSessionSummaries(notes.reverse()) // Most recent first

      // Load scheduled meetings from backend
      const response = await fetch('http://localhost:8000/api/meetings/upcoming')
      const data = await response.json()
      setScheduledMeetings(data.meetings || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (!confirm('Cancel this meeting?')) return

    try {
      await fetch(`http://localhost:8000/api/meetings/${meetingId}`, {
        method: 'DELETE'
      })
      loadData()
    } catch (error) {
      console.error('Error deleting meeting:', error)
    }
  }

  const handleDeleteSummary = (summaryId) => {
    if (!confirm('Delete this session summary?')) return

    const notes = JSON.parse(localStorage.getItem('clinicalNotes') || '[]')
    const filtered = notes.filter(n => n.id !== summaryId)
    localStorage.setItem('clinicalNotes', JSON.stringify(filtered))
    loadData()
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Loading clinical notes...</div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📋 Clinical Notes</h1>
        <p>AI-generated session summaries and scheduled appointments</p>
      </div>

      <div className="content-card">
        <button 
          className="btn btn-secondary back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        {/* TABS */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginTop: '25px',
          marginBottom: '30px',
          borderBottom: '2px solid rgba(255, 255, 255, 0.1)',
          paddingBottom: '0'
        }}>
          <button
            onClick={() => setActiveTab('summaries')}
            style={{
              padding: '15px 35px',
              background: activeTab === 'summaries' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              borderRadius: '12px 12px 0 0',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'summaries' ? '3px solid #667eea' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            📊 Session Summaries ({sessionSummaries.length})
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            style={{
              padding: '15px 35px',
              background: activeTab === 'meetings' 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'transparent',
              border: 'none',
              color: 'white',
              fontSize: '1.1rem',
              fontWeight: '700',
              cursor: 'pointer',
              borderRadius: '12px 12px 0 0',
              transition: 'all 0.3s ease',
              borderBottom: activeTab === 'meetings' ? '3px solid #667eea' : '3px solid transparent',
              marginBottom: '-2px'
            }}
          >
            📅 Scheduled Meetings ({scheduledMeetings.length})
          </button>
        </div>

        {/* TAB 1: SESSION SUMMARIES */}
        {activeTab === 'summaries' && (
          <div>
            {sessionSummaries.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h2>No Session Summaries Yet</h2>
                <p>Enable Meeting Mode during exercise sessions to generate AI clinical summaries</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                {sessionSummaries.map((note) => (
                  <div
                    key={note.id}
                    style={{
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      borderRadius: '20px',
                      padding: '35px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    {/* Header */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'start', 
                      marginBottom: '25px',
                      paddingBottom: '20px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div>
                        <h3 style={{ 
                          color: '#00FF88', 
                          fontSize: '1.8rem', 
                          marginBottom: '10px',
                          fontWeight: '700'
                        }}>
                          {note.exercise_name}
                        </h3>
                        <p style={{ 
                          color: 'rgba(255, 255, 255, 0.7)', 
                          fontSize: '0.95rem',
                          marginBottom: '15px'
                        }}>
                          📅 {formatDate(note.date)}
                        </p>
                        
                        {/* Stats Row */}
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                          <span style={{
                            background: 'rgba(16, 185, 129, 0.2)',
                            color: '#10b981',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            💪 {note.rep_count}/{note.target_reps} reps
                          </span>
                          <span style={{
                            background: 'rgba(59, 130, 246, 0.2)',
                            color: '#3b82f6',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            ⏱️ {formatDuration(note.duration)}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteSummary(note.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    {/* AI CLINICAL SUMMARY */}
                    {note.summary && (
                      <div style={{
                        background: 'rgba(0, 0, 0, 0.4)',
                        padding: '25px',
                        borderRadius: '15px',
                        border: '1px solid rgba(102, 126, 234, 0.2)'
                      }}>
                        <h4 style={{ 
                          color: '#667eea', 
                          marginBottom: '20px', 
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          🤖 AI Clinical Summary
                        </h4>
                        
                        {/* Chief Complaint */}
                        {note.summary.chief_complaint && (
                          <div style={{ marginBottom: '20px' }}>
                            <strong style={{ 
                              color: '#00FF88', 
                              fontSize: '1.05rem',
                              display: 'block',
                              marginBottom: '8px'
                            }}>
                              Chief Complaint:
                            </strong>
                            <p style={{ 
                              color: 'rgba(255, 255, 255, 0.95)', 
                              lineHeight: '1.6',
                              fontSize: '1rem',
                              margin: 0
                            }}>
                              {note.summary.chief_complaint}
                            </p>
                          </div>
                        )}

                        {/* Session Notes */}
                        {note.summary.session_notes && (
                          <div style={{ marginBottom: '20px' }}>
                            <strong style={{ 
                              color: '#00FF88', 
                              fontSize: '1.05rem',
                              display: 'block',
                              marginBottom: '8px'
                            }}>
                              Session Notes:
                            </strong>
                            <p style={{ 
                              color: 'rgba(255, 255, 255, 0.95)', 
                              lineHeight: '1.7',
                              fontSize: '1rem',
                              margin: 0,
                              whiteSpace: 'pre-line'
                            }}>
                              {note.summary.session_notes}
                            </p>
                          </div>
                        )}

                        {/* Recommendations */}
                        {note.summary.recommendations && note.summary.recommendations.length > 0 && (
                          <div style={{ marginBottom: '20px' }}>
                            <strong style={{ 
                              color: '#00FF88', 
                              fontSize: '1.05rem',
                              display: 'block',
                              marginBottom: '10px'
                            }}>
                              Recommendations:
                            </strong>
                            <ul style={{ 
                              color: 'rgba(255, 255, 255, 0.95)', 
                              paddingLeft: '25px',
                              margin: 0,
                              lineHeight: '1.8'
                            }}>
                              {note.summary.recommendations.map((rec, i) => (
                                <li key={i} style={{ marginBottom: '8px', fontSize: '1rem' }}>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Patient Mood & Compliance */}
                        <div style={{ 
                          display: 'flex', 
                          gap: '15px', 
                          marginBottom: '20px',
                          flexWrap: 'wrap'
                        }}>
                          {note.summary.patient_mood && (
                            <span style={{
                              background: note.summary.patient_mood === 'positive' 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : note.summary.patient_mood === 'concerned' 
                                ? 'rgba(239, 68, 68, 0.2)' 
                                : 'rgba(156, 163, 175, 0.2)',
                              color: note.summary.patient_mood === 'positive' 
                                ? '#10b981' 
                                : note.summary.patient_mood === 'concerned' 
                                ? '#ef4444' 
                                : '#9ca3af',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '0.9rem',
                              fontWeight: '700'
                            }}>
                              😊 Mood: {note.summary.patient_mood}
                            </span>
                          )}
                          {note.summary.compliance_level && (
                            <span style={{
                              background: note.summary.compliance_level === 'high' 
                                ? 'rgba(16, 185, 129, 0.2)' 
                                : note.summary.compliance_level === 'low' 
                                ? 'rgba(239, 68, 68, 0.2)' 
                                : 'rgba(245, 158, 11, 0.2)',
                              color: note.summary.compliance_level === 'high' 
                                ? '#10b981' 
                                : note.summary.compliance_level === 'low' 
                                ? '#ef4444' 
                                : '#f59e0b',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '0.9rem',
                              fontWeight: '700'
                            }}>
                              ✓ Compliance: {note.summary.compliance_level}
                            </span>
                          )}
                        </div>

                        {/* Follow-up Alert */}
                        {note.summary.follow_up_needed && (
                          <div style={{
                            background: 'rgba(239, 68, 68, 0.15)',
                            border: '2px solid rgba(239, 68, 68, 0.4)',
                            padding: '18px',
                            borderRadius: '12px'
                          }}>
                            <strong style={{ 
                              color: '#ef4444', 
                              fontSize: '1.05rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              marginBottom: '8px'
                            }}>
                              ⚠️ Follow-up Needed
                            </strong>
                            <p style={{ 
                              color: 'rgba(255, 255, 255, 0.95)', 
                              margin: 0,
                              fontSize: '1rem',
                              lineHeight: '1.6'
                            }}>
                              {note.summary.follow_up_reason}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SCHEDULED MEETINGS */}
        {activeTab === 'meetings' && (
          <div>
            {scheduledMeetings.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📅</div>
                <h2>No Scheduled Meetings</h2>
                <p>Meetings detected during sessions will appear here automatically</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {scheduledMeetings.map((meeting) => (
                  <div
                    key={meeting.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '2px solid rgba(102, 126, 234, 0.3)',
                      borderRadius: '20px',
                      padding: '30px',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ 
                          color: '#00FF88', 
                          fontSize: '1.6rem', 
                          marginBottom: '12px',
                          fontWeight: '700'
                        }}>
                          {meeting.title || 'Follow-up Appointment'}
                        </h3>
                        <p style={{ 
                          color: 'rgba(255, 255, 255, 0.9)', 
                          fontSize: '1.15rem', 
                          marginBottom: '18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          📆 {formatDate(meeting.scheduled_date || meeting.created_at)}
                        </p>
                        
                        {meeting.extracted_phrase && (
                          <div style={{
                            background: 'rgba(102, 126, 234, 0.15)',
                            padding: '15px',
                            borderRadius: '12px',
                            marginBottom: '15px',
                            border: '1px solid rgba(102, 126, 234, 0.3)'
                          }}>
                            <p style={{ 
                              color: 'rgba(255, 255, 255, 0.7)', 
                              fontSize: '0.85rem', 
                              margin: '0 0 8px 0',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              fontWeight: '600'
                            }}>
                              Detected from conversation:
                            </p>
                            <p style={{ 
                              color: 'white', 
                              fontStyle: 'italic', 
                              margin: 0,
                              fontSize: '1.05rem',
                              lineHeight: '1.5'
                            }}>
                              "{meeting.extracted_phrase}"
                            </p>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {meeting.patient_name && (
                            <span style={{
                              background: 'rgba(16, 185, 129, 0.2)',
                              color: '#10b981',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '0.9rem',
                              fontWeight: '700'
                            }}>
                              👤 {meeting.patient_name}
                            </span>
                          )}
                          {meeting.doctor_name && (
                            <span style={{
                              background: 'rgba(59, 130, 246, 0.2)',
                              color: '#3b82f6',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '0.9rem',
                              fontWeight: '700'
                            }}>
                              👨‍⚕️ {meeting.doctor_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          border: '1px solid rgba(239, 68, 68, 0.4)',
                          color: '#ef4444',
                          padding: '10px 20px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.3)'
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'rgba(239, 68, 68, 0.2)'
                        }}
                      >
                        ❌ Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ClinicalNotes