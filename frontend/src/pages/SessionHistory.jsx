import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SessionAnalyzer, getPerformanceScore } from '../utils/advancedAnalysis'
import { getExerciseConfig } from '../utils/exerciseConfigs'
import References from '../components/References'
import ClinicalResources from '../components/ClinicalResources'

function SessionHistory() {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [openMenuId, setOpenMenuId] = useState(null)
  const videoRef = useRef(null)

  // Analysis state
  const [analysisResults, setAnalysisResults] = useState(null)
  const [claudeAnalysis, setClaudeAnalysis] = useState(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showDetailedIssues, setShowDetailedIssues] = useState(false)
  const [filterSeverity, setFilterSeverity] = useState('all')
  const [sessionReferences, setSessionReferences] = useState(null)

  // NEW: Loading animation state
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false)
  const progressIntervalRef = useRef(null)

  useEffect(() => {
    loadSessions()
  }, [])

  // NEW: Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
    }
  }, [])

  const loadSessions = () => {
    const stored = localStorage.getItem('recordedSessions')
    if (stored) {
      const sessions = JSON.parse(stored)
      setSessions(sessions.reverse())
    }
  }

  const handleSessionClick = async (session) => {
    setSelectedSession(session)
    setCurrentTime(0)
    setOpenMenuId(null)
    setAnalysisResults(null)
    setClaudeAnalysis(null)
    setSessionReferences(null)
    setShowDetailedIssues(false)
    setAnalysisProgress(0)
    setIsLoadingAnalysis(false)

    // NEW: Check if analysis is already stored for this session
    if (session.storedAnalysis && session.storedClaudeAnalysis) {
      // Analysis already exists, load it
      setAnalysisResults(session.storedAnalysis)
      setClaudeAnalysis(session.storedClaudeAnalysis)
      setSessionReferences(session.storedReferences || null)
    } else if (session.poseData && session.poseData.length > 0) {
      // Analysis doesn't exist, start loading animation
      await startAnalysisWithProgress(session)
    }
  }

  // NEW: Start analysis with animated progress
  const startAnalysisWithProgress = async (session) => {
    setIsLoadingAnalysis(true)
    setAnalysisProgress(0)

    // Random time between 30 seconds and 2 minutes (30000ms - 120000ms)
    const randomDuration = Math.random() * (120000 - 30000) + 30000
    const startTime = Date.now()

    // Update progress every 100ms
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime
      const progress = Math.min((elapsed / randomDuration) * 100, 99)
      setAnalysisProgress(progress)
    }, 100)

    // Perform actual analysis in background
    try {
      const config = getExerciseConfig(session.exercise_id)

      if (!config) {
        console.error('No config for exercise:', session.exercise_id)
        clearInterval(progressIntervalRef.current)
        setIsLoadingAnalysis(false)
        return
      }

      const analyzer = new SessionAnalyzer(config)
      const results = await analyzer.analyzeSession(session.poseData)

      const aiAnalysis = await getPerformanceScore(session, results)

      // Wait for animation to complete
      const remainingTime = randomDuration - (Date.now() - startTime)
      if (remainingTime > 0) {
        await new Promise(resolve => setTimeout(resolve, remainingTime))
      }

      // Complete the progress
      clearInterval(progressIntervalRef.current)
      setAnalysisProgress(100)

      // Wait a moment at 100% before showing results
      await new Promise(resolve => setTimeout(resolve, 500))

      // Store analysis in the session
      storeAnalysisForSession(session.id, results, aiAnalysis.analysis, aiAnalysis.references)

      // Set state
      setAnalysisResults(results)
      setClaudeAnalysis(aiAnalysis.analysis)
      setSessionReferences(aiAnalysis.references || null)
      setIsLoadingAnalysis(false)

    } catch (error) {
      console.error('Analysis error:', error)
      clearInterval(progressIntervalRef.current)
      setIsLoadingAnalysis(false)
      alert('Analysis error: ' + error.message)
    }
  }

  // NEW: Store analysis results with the session in localStorage
  const storeAnalysisForSession = (sessionId, analysisResults, claudeAnalysis, references) => {
    const stored = localStorage.getItem('recordedSessions')
    if (stored) {
      let allSessions = JSON.parse(stored)
      const sessionIndex = allSessions.findIndex(s => s.id === sessionId)

      if (sessionIndex !== -1) {
        allSessions[sessionIndex].storedAnalysis = analysisResults
        allSessions[sessionIndex].storedClaudeAnalysis = claudeAnalysis
        allSessions[sessionIndex].storedReferences = references
        allSessions[sessionIndex].analyzedAt = new Date().toISOString()

        localStorage.setItem('recordedSessions', JSON.stringify(allSessions))
        setSessions(allSessions.reverse())
      }
    }
  }

  const handleDeleteSession = (sessionId, event) => {
    event.stopPropagation()

    if (confirm('Delete this recording?')) {
      const stored = localStorage.getItem('recordedSessions')
      if (stored) {
        let sessions = JSON.parse(stored)
        sessions = sessions.filter(s => s.id !== sessionId)
        localStorage.setItem('recordedSessions', JSON.stringify(sessions))

        loadSessions()

        if (selectedSession?.id === sessionId) {
          setSelectedSession(null)
          setAnalysisResults(null)
          setClaudeAnalysis(null)
        }

        setOpenMenuId(null)
      }
    }
  }

  const toggleMenu = (sessionId, event) => {
    event.stopPropagation()
    setOpenMenuId(openMenuId === sessionId ? null : sessionId)
  }

  const jumpToTimestamp = (timestamp) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp
      videoRef.current.play()
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (isoString) => {
    const date = new Date(isoString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#ef4444'
      case 'medium': return '#f59e0b'
      case 'low': return '#10b981'
      default: return '#3b82f6'
    }
  }

  const getIssueIcon = (type) => {
    const icons = {
      tremor: '🌀',
      opposite_support: '🤝',
      lateral_lean: '⚖️',
      posture_lean: '↕️',
      torso_rotation: '🔄',
      movement_too_fast: '⚡',
      limited_range_bottom: '⬇️',
      limited_range_top: '⬆️',
      elbow_drift: '↔️',
      using_momentum: '💨',
      back_arching: '🏹'
    }
    return icons[type] || '⚠️'
  }

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981'
    if (score >= 75) return '#3b82f6'
    if (score >= 60) return '#f59e0b'
    return '#ef4444'
  }

  const getScoreLabel = (score) => {
    if (score >= 90) return 'Excellent'
    if (score >= 75) return 'Good'
    if (score >= 60) return 'Fair'
    return 'Needs Improvement'
  }

  const filteredIssues = analysisResults?.issues.filter(issue => {
    if (filterSeverity === 'all') return true
    return issue.severity === filterSeverity
  }) || []

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>📹 Session History</h1>
        <p>Review your recorded exercise sessions</p>
      </div>

      <div className="content-card">
        <button
          className="btn btn-secondary back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📹</div>
            <h2>No Recorded Sessions</h2>
            <p>Enable "Video Guided Session" when starting exercises</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selectedSession ? '1fr 2fr' : '1fr', gap: '20px' }}>
            {/* Sessions List */}
            <div>
              <h2 style={{ marginBottom: '20px', color: '#fff' }}>
                Sessions ({sessions.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    style={{
                      background: selectedSession?.id === session.id
                        ? 'rgba(102, 126, 234, 0.2)'
                        : 'rgba(255, 255, 255, 0.05)',
                      border: selectedSession?.id === session.id
                        ? '2px solid #667eea'
                        : '2px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '12px',
                      padding: '20px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedSession?.id !== session.id) {
                        e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedSession?.id !== session.id) {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                      }
                    }}
                  >
                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                      <button
                        onClick={(e) => toggleMenu(session.id, e)}
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '8px',
                          padding: '8px 12px',
                          cursor: 'pointer',
                          color: 'white'
                        }}
                      >
                        ⋮
                      </button>

                      {openMenuId === session.id && (
                        <div style={{
                          position: 'absolute',
                          top: '45px',
                          right: '0',
                          background: 'rgba(30, 30, 50, 0.98)',
                          border: '2px solid rgba(255, 255, 255, 0.2)',
                          borderRadius: '10px',
                          padding: '8px',
                          minWidth: '150px',
                          zIndex: 1000
                        }}>
                          <button
                            onClick={(e) => handleDeleteSession(session.id, e)}
                            style={{
                              width: '100%',
                              background: 'transparent',
                              border: 'none',
                              color: '#ef4444',
                              padding: '12px',
                              textAlign: 'left',
                              cursor: 'pointer',
                              borderRadius: '6px'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 style={{ color: '#fff', marginBottom: '8px', paddingRight: '40px' }}>
                      {session.exercise_name}
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem', marginBottom: '10px' }}>
                      {formatDate(session.completed_at)}
                    </p>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}>
                        {session.rep_count}/{session.target_reps} reps
                      </span>
                      <span style={{
                        background: 'rgba(102, 126, 234, 0.2)',
                        color: '#667eea',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        fontSize: '0.85rem'
                      }}>
                        {formatTime(session.duration)}
                      </span>
                      {session.poseData && session.poseData.length > 0 && (
                        <span style={{
                          background: session.storedClaudeAnalysis
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(139, 92, 246, 0.2)',
                          color: session.storedClaudeAnalysis ? '#10b981' : '#8b5cf6',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.85rem'
                        }}>
                          {session.storedClaudeAnalysis ? '✓ Analyzed' : '🔬 AI Analysis'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Details */}
            {selectedSession && (
              <div>
                <h2 style={{ marginBottom: '20px', color: '#fff', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  Session Details
                </h2>

                {/* Video Player */}
                {selectedSession.videoUrl && (
                  <div style={{
                    background: 'rgba(0, 0, 0, 0.4)',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    marginBottom: '20px',
                    border: '2px solid rgba(102, 126, 234, 0.3)'
                  }}>
                    <video
                      ref={videoRef}
                      src={selectedSession.videoUrl}
                      controls
                      style={{ width: '100%', display: 'block' }}
                      onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                    />
                  </div>
                )}

                {/* Session Stats */}
                <div style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ color: '#00FF88', marginBottom: '15px' }}>📊 Session Stats</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                        REPS
                      </div>
                      <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700' }}>
                        {selectedSession.rep_count}/{selectedSession.target_reps}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                        DURATION
                      </div>
                      <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700' }}>
                        {formatTime(selectedSession.duration)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.85rem' }}>
                        WARNINGS
                      </div>
                      <div style={{ color: '#fff', fontSize: '1.8rem', fontWeight: '700' }}>
                        {selectedSession.warnings?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* NEW: Loading Animation */}
                {isLoadingAnalysis && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(102, 126, 234, 0.2) 100%)',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '15px',
                    padding: '40px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ position: 'relative', width: '150px', height: '150px', margin: '0 auto 25px' }}>
                      {/* Background circle */}
                      <svg width="150" height="150" style={{ transform: 'rotate(-90deg)' }}>
                        <circle
                          cx="75"
                          cy="75"
                          r="65"
                          fill="none"
                          stroke="rgba(255, 255, 255, 0.1)"
                          strokeWidth="10"
                        />
                        {/* Progress circle */}
                        <circle
                          cx="75"
                          cy="75"
                          r="65"
                          fill="none"
                          stroke="url(#gradient)"
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 65}`}
                          strokeDashoffset={`${2 * Math.PI * 65 * (1 - analysisProgress / 100)}`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                        />
                        <defs>
                          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#667eea" />
                          </linearGradient>
                        </defs>
                      </svg>
                      {/* Percentage text */}
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        fontSize: '2rem',
                        fontWeight: '800',
                        color: '#8b5cf6'
                      }}>
                        {Math.round(analysisProgress)}%
                      </div>
                    </div>
                    <h3 style={{ color: '#8b5cf6', fontSize: '1.3rem', marginBottom: '10px' }}>
                      🤖 Analyzing Performance...
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.95rem' }}>
                      AI is processing your session data and generating insights
                    </p>
                  </div>
                )}

                {/* SECTION 1: Real-Time Warnings */}
                {!isLoadingAnalysis && selectedSession.warnings && selectedSession.warnings.length > 0 && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '2px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{ color: '#f59e0b', marginBottom: '15px' }}>
                      ⚠️ Real-Time Warnings
                    </h3>
                    <div className="hide-scrollbar" style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      maxHeight: '250px',
                      overflowY: 'auto'
                    }}>
                      {selectedSession.warnings.map((warning, index) => (
                        <div
                          key={index}
                          onClick={() => jumpToTimestamp(warning.timestamp)}
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '8px',
                            padding: '12px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                        >
                          <div style={{
                            background: '#f59e0b',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '6px',
                            fontWeight: '700',
                            fontSize: '0.9rem',
                            minWidth: '60px',
                            textAlign: 'center'
                          }}>
                            {formatTime(warning.timestamp)}
                          </div>
                          <div style={{ flex: 1, color: '#fff', fontSize: '0.95rem' }}>
                            {warning.message}
                          </div>
                          <div style={{ color: '#667eea', fontSize: '1.2rem' }}>▶</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: AI Performance Score */}
                {!isLoadingAnalysis && claudeAnalysis && (
                  <div style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(102, 126, 234, 0.2) 100%)',
                    border: '2px solid rgba(139, 92, 246, 0.4)',
                    borderRadius: '15px',
                    padding: '25px',
                    marginBottom: '20px'
                  }}>
                    <h3 style={{
                      color: '#8b5cf6',
                      fontSize: '1.2rem',
                      marginBottom: '20px'
                    }}>
                      🤖 AI Performance Score
                    </h3>

                    {/* Big Score Display */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '25px', marginBottom: '20px' }}>
                      <div style={{
                        width: '130px',
                        height: '130px',
                        borderRadius: '50%',
                        background: `conic-gradient(${getScoreColor(claudeAnalysis.overallScore)} ${claudeAnalysis.overallScore * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        <div style={{
                          width: '110px',
                          height: '110px',
                          borderRadius: '50%',
                          background: 'rgba(15, 12, 41, 0.95)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <div style={{
                            fontSize: '2.8rem',
                            fontWeight: '800',
                            color: getScoreColor(claudeAnalysis.overallScore),
                            lineHeight: 1
                          }}>
                            {claudeAnalysis.overallScore}
                          </div>
                          <div style={{
                            fontSize: '0.7rem',
                            color: 'rgba(255, 255, 255, 0.6)',
                            textTransform: 'uppercase',
                            marginTop: '5px'
                          }}>
                            / 100
                          </div>
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: getScoreColor(claudeAnalysis.overallScore),
                          marginBottom: '8px'
                        }}>
                          {getScoreLabel(claudeAnalysis.overallScore)} Performance
                        </div>
                        <div style={{
                          fontSize: '0.95rem',
                          color: 'rgba(255, 255, 255, 0.85)',
                          lineHeight: '1.5',
                          marginBottom: '10px'
                        }}>
                          {claudeAnalysis.summary}
                        </div>
                        <div style={{
                          fontSize: '0.85rem',
                          color: 'rgba(255, 255, 255, 0.6)'
                        }}>
                          Form Quality: <span style={{
                            color: '#8b5cf6',
                            fontWeight: '600',
                            textTransform: 'capitalize'
                          }}>{claudeAnalysis.formQuality}</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: '10px',
                        padding: '12px'
                      }}>
                        <h4 style={{ color: '#10b981', fontSize: '0.9rem', marginBottom: '8px' }}>
                          ✅ Strengths
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {claudeAnalysis.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', paddingLeft: '12px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#10b981' }}>•</span>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '10px',
                        padding: '12px'
                      }}>
                        <h4 style={{ color: '#ef4444', fontSize: '0.9rem', marginBottom: '8px' }}>
                          ⚠️ To Improve
                        </h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {claudeAnalysis.weaknesses.slice(0, 3).map((w, i) => (
                            <li key={i} style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', paddingLeft: '12px', position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#ef4444' }}>•</span>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div style={{
                      background: 'rgba(59, 130, 246, 0.1)',
                      border: '1px solid rgba(59, 130, 246, 0.3)',
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '15px'
                    }}>
                      <h4 style={{ color: '#3b82f6', fontSize: '0.9rem', marginBottom: '8px' }}>
                        💡 Recommendations
                      </h4>
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {claudeAnalysis.recommendations.slice(0, 3).map((r, i) => (
                          <li key={i} style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.85rem', paddingLeft: '12px', position: 'relative' }}>
                            <span style={{ position: 'absolute', left: 0, color: '#3b82f6' }}>•</span>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* References */}
                    {sessionReferences && sessionReferences.length > 0 && (
                      <References
                        references={sessionReferences}
                        title="📚 Clinical Research References"
                      />
                    )}

                    {/* Clinical Resources */}
                    {!isLoadingAnalysis && selectedSession && (
                      <ClinicalResources exerciseName={selectedSession.exercise_name} />
                    )}

                  </div>
                )}

                {/* SECTION 3: AI Detected Issues */}
                {!isLoadingAnalysis && analysisResults && analysisResults.totalIssues > 0 && (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <h3 style={{ color: '#667eea', margin: 0 }}>
                        🔬 AI Detected Issues ({analysisResults.totalIssues})
                      </h3>
                      <button
                        onClick={() => setShowDetailedIssues(!showDetailedIssues)}
                        style={{
                          background: showDetailedIssues ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: 'white',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        {showDetailedIssues ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {/* Severity Boxes */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '12px' }}>
                      {['high', 'medium', 'low'].map(sev => (
                        <div
                          key={sev}
                          onClick={() => setFilterSeverity(filterSeverity === sev ? 'all' : sev)}
                          style={{
                            background: `rgba(${sev === 'high' ? '239, 68, 68' : sev === 'medium' ? '245, 158, 11' : '16, 185, 129'}, 0.1)`,
                            border: `2px solid rgba(${sev === 'high' ? '239, 68, 68' : sev === 'medium' ? '245, 158, 11' : '16, 185, 129'}, 0.3)`,
                            borderRadius: '8px',
                            padding: '10px',
                            textAlign: 'center',
                            cursor: 'pointer',
                            opacity: filterSeverity === sev || filterSeverity === 'all' ? 1 : 0.5
                          }}
                        >
                          <div style={{
                            fontSize: '1.4rem',
                            fontWeight: '800',
                            color: getSeverityColor(sev)
                          }}>
                            {analysisResults.summary.bySeverity[sev]}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: getSeverityColor(sev), fontWeight: '600', textTransform: 'uppercase' }}>
                            {sev}
                          </div>
                        </div>
                      ))}
                    </div>



                    {/* Issue List */}
                    {showDetailedIssues && (
                      <div>
                        <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.8rem', marginBottom: '10px', textAlign: 'center' }}>
                          Click to jump to video
                        </div>

                        {filteredIssues.length === 0 ? (
                          <p style={{ color: 'rgba(255, 255, 255, 0.7)', textAlign: 'center', padding: '15px' }}>
                            No {filterSeverity !== 'all' ? filterSeverity : ''} issues
                          </p>
                        ) : (
                          <div className="hide-scrollbar" style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            maxHeight: '350px',
                            overflowY: 'auto'
                          }}>
                            {filteredIssues.map((issue, index) => (
                              <div
                                key={index}
                                onClick={() => jumpToTimestamp(issue.timestamp)}
                                style={{
                                  background: 'rgba(0, 0, 0, 0.3)',
                                  border: `2px solid ${getSeverityColor(issue.severity)}`,
                                  borderRadius: '8px',
                                  padding: '10px',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                              >
                                <div style={{ fontSize: '1.3rem' }}>
                                  {getIssueIcon(issue.type)}
                                </div>
                                <div style={{
                                  background: getSeverityColor(issue.severity),
                                  color: 'white',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontWeight: '700',
                                  fontSize: '0.85rem',
                                  minWidth: '55px',
                                  textAlign: 'center'
                                }}>
                                  {formatTime(issue.timestamp)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: '#fff', fontWeight: '600', fontSize: '0.9rem', marginBottom: '3px' }}>
                                    {issue.message}
                                  </div>
                                  {issue.details && (
                                    <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.75rem' }}>
                                      {issue.details}
                                    </div>
                                  )}
                                </div>
                                <div style={{ color: '#667eea', fontSize: '1.1rem' }}>▶</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* No AI Analysis Available */}
                {!isLoadingAnalysis && !selectedSession.poseData && (
                  <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>ℹ️</div>
                    <h3 style={{ color: '#f59e0b', marginBottom: '8px' }}>
                      No AI Analysis
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                      Enable "Video Guided Session" for AI analysis
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        /* Hide scrollbar for Chrome, Safari and Opera */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbar for IE, Edge and Firefox */
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>
    </div >
  )
}

export default SessionHistory