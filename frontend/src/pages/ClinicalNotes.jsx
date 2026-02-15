// frontend/src/pages/ClinicalNotes.jsx

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/ClinicalNotes.css'

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
      <div className="clinical-notes-container">
        <div className="cn-loading">Loading clinical notes...</div>
      </div>
    )
  }

  return (
    <div className="clinical-notes-container">
      <div className="cn-content-wrapper">
        {/* Header */}
        <div className="cn-header">
          <h1> Clinical Notes</h1>
          <p>AI-generated session summaries and scheduled appointments</p>
        </div>

        <button
          className="cn-back-btn"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        {/* TABS */}
        <div className="cn-tabs">
          <button
            onClick={() => setActiveTab('summaries')}
            className={`cn-tab-btn ${activeTab === 'summaries' ? 'active' : ''}`}
          >
            Session Summaries ({sessionSummaries.length})
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`cn-tab-btn ${activeTab === 'meetings' ? 'active' : ''}`}
          >
            Scheduled Meetings ({scheduledMeetings.length})
          </button>
        </div>

        {/* TAB 1: SESSION SUMMARIES */}
        {activeTab === 'summaries' && (
          <div>
            {sessionSummaries.length === 0 ? (
              <div className="cn-empty-state">
                <div className="cn-empty-icon">📊</div>
                <h2>No Session Summaries Yet</h2>
                <p>Enable Meeting Mode during exercise sessions to generate AI clinical summaries</p>
              </div>
            ) : (
              <div>
                {sessionSummaries.map((note) => (
                  <div key={note.id} className="cn-card">
                    {/* Summary Header */}
                    <div className="cn-summary-header">
                      <div className="cn-title-group">
                        <h3>{note.exercise_name}</h3>
                        <div className="cn-date">
                          📅 {formatDate(note.date)}
                        </div>

                        {/* Stats Row */}
                        <div className="cn-stats-row">
                          <span className="cn-stat-badge">
                            💪 {note.rep_count}/{note.target_reps} reps
                          </span>
                          <span className="cn-stat-badge">
                            ⏱ {formatDuration(note.duration)}
                          </span>
                        </div>
                      </div>

                      <button
                        className="cn-delete-btn"
                        onClick={() => handleDeleteSummary(note.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>

                    {/* AI CLINICAL SUMMARY */}
                    {note.summary && (
                      <div className="cn-ai-section">
                        <h4 className="cn-ai-title">
                          AI Clinical Summary
                        </h4>

                        {/* Chief Complaint */}
                        {note.summary.chief_complaint && (
                          <div className="cn-subsection">
                            <strong>Chief Complaint:</strong>
                            <p>{note.summary.chief_complaint}</p>
                          </div>
                        )}

                        {/* Session Notes */}
                        {note.summary.session_notes && (
                          <div className="cn-subsection">
                            <strong>Session Notes:</strong>
                            <p style={{ whiteSpace: 'pre-line' }}>{note.summary.session_notes}</p>
                          </div>
                        )}

                        {/* Recommendations */}
                        {note.summary.recommendations && note.summary.recommendations.length > 0 && (
                          <div className="cn-subsection">
                            <strong>Recommendations:</strong>
                            <ul className="cn-list">
                              {note.summary.recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Mood & Compliance Badges */}
                        <div className="cn-badges-row">
                          {note.summary.patient_mood && (
                            <span className="cn-badge-pill">
                              😊 Mood: {note.summary.patient_mood}
                            </span>
                          )}
                          {note.summary.compliance_level && (
                            <span className="cn-badge-pill">
                              ✓ Compliance: {note.summary.compliance_level}
                            </span>
                          )}
                        </div>

                        {/* Follow-up Alert */}
                        {note.summary.follow_up_needed && (
                          <div style={{ marginTop: '20px', padding: '15px', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', background: 'rgba(255,255,255,0.05)' }}>
                            <strong style={{ color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              Follow-up Needed
                            </strong>
                            <p style={{ marginTop: '5px', color: 'rgba(255,255,255,0.8)' }}>
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
              <div className="cn-empty-state">
                <div className="cn-empty-icon">📅</div>
                <h2>No Scheduled Meetings</h2>
                <p>Meetings detected during sessions will appear here automatically</p>
              </div>
            ) : (
              <div>
                {scheduledMeetings.map((meeting) => (
                  <div key={meeting.id} className="cn-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '1.5rem', color: '#fff' }}>
                          {meeting.title || 'Follow-up Appointment'}
                        </h3>
                        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          📆 {formatDate(meeting.scheduled_date || meeting.created_at)}
                        </p>

                        {meeting.extracted_phrase && (
                          <div className="cn-meeting-phrase">
                            <p className="cn-meeting-label">Detected from conversation:</p>
                            <p className="cn-meeting-text">"{meeting.extracted_phrase}"</p>
                          </div>
                        )}

                        <div className="cn-badges-row">
                          {meeting.patient_name && (
                            <span className="cn-badge-pill">
                              👤 {meeting.patient_name}
                            </span>
                          )}
                          {meeting.doctor_name && (
                            <span className="cn-badge-pill">
                              👨‍⚕️ {meeting.doctor_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        className="cn-cancel-btn"
                        onClick={() => handleDeleteMeeting(meeting.id)}
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