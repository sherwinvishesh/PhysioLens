import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { SessionAnalyzer, getPerformanceScore } from '../utils/advancedAnalysis'
import { getExerciseConfig } from '../utils/exerciseConfigs'
import References from '../components/References'
import ClinicalResources from '../components/ClinicalResources'
import '../styles/SessionHistory.css'

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
    <div className="session-history-container">
      <div className="session-header">
        <h1>Session History</h1>
        <p>Review your recorded exercise sessions</p>
      </div>

      <div>
        <button
          className="back-button"
          onClick={() => navigate('/')}
        >
          ← Back to Home
        </button>

        {sessions.length === 0 ? (
          <div className="sh-empty-state">
            <div className="sh-empty-icon">📹</div>
            <h2>No Recorded Sessions</h2>
            <p>Enable "Video Guided Session" when starting exercises</p>
          </div>
        ) : (
          <div className={`sh-grid-layout ${selectedSession ? 'has-selection' : ''}`}>
            {/* Sessions List */}
            <div>
              <h2 className="sh-sessions-title">
                Sessions ({sessions.length})
              </h2>
              <div className="sh-session-list">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => handleSessionClick(session)}
                    className={`sh-session-card ${selectedSession?.id === session.id ? 'selected' : ''}`}
                  >
                    <div style={{ position: 'absolute', top: '15px', right: '15px' }}>
                      <button
                        className="sh-menu-btn"
                        onClick={(e) => toggleMenu(session.id, e)}
                      >
                        ⋮
                      </button>

                      {openMenuId === session.id && (
                        <div className="sh-menu-dropdown">
                          <button
                            className="sh-delete-btn"
                            onClick={(e) => handleDeleteSession(session.id, e)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      )}
                    </div>

                    <h3 className="sh-session-name">
                      {session.exercise_name}
                    </h3>
                    <p className="sh-session-date">
                      {formatDate(session.completed_at)}
                    </p>
                    <div className="sh-tags">
                      <span className="sh-tag">
                        {session.rep_count}/{session.target_reps} reps
                      </span>
                      <span className="sh-tag">
                        {formatTime(session.duration)}
                      </span>
                      {session.poseData && session.poseData.length > 0 && (
                        <span className={`sh-tag ${session.storedClaudeAnalysis ? 'analyzed' : ''}`}>
                          {session.storedClaudeAnalysis ? '✓ Analyzed' : 'AI Analysis'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Session Details */}
            {selectedSession && (
              <div className="sh-details-container">
                <h2 className="sh-section-title">
                  Session Details
                </h2>

                {/* Video Player */}
                {selectedSession.videoUrl && (
                  <div className="sh-video-wrapper">
                    <video
                      ref={videoRef}
                      src={selectedSession.videoUrl}
                      controls
                      className="video-player"
                      style={{ width: '100%', display: 'block' }}
                      onTimeUpdate={(e) => setCurrentTime(e.target.currentTime)}
                    />
                  </div>
                )}

                {/* Session Stats */}
                <div className="sh-stats-box">
                  <h3 className="sh-stats-header">📊 Session Stats</h3>
                  <div className="sh-stats-grid">
                    <div className="stat-item">
                      <div className="sh-stat-label">
                        REPS
                      </div>
                      <div className="sh-stat-value">
                        {selectedSession.rep_count}/{selectedSession.target_reps}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="sh-stat-label">
                        DURATION
                      </div>
                      <div className="sh-stat-value">
                        {formatTime(selectedSession.duration)}
                      </div>
                    </div>
                    <div className="stat-item">
                      <div className="sh-stat-label">
                        WARNINGS
                      </div>
                      <div className="sh-stat-value">
                        {selectedSession.warnings?.length || 0}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loading Animation */}
                {isLoadingAnalysis && (
                  <div className="sh-loading-box">
                    <div className="sh-loading-progress">
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
                          stroke="#ffffff"
                          strokeWidth="10"
                          strokeDasharray={`${2 * Math.PI * 65}`}
                          strokeDashoffset={`${2 * Math.PI * 65 * (1 - analysisProgress / 100)}`}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
                        />
                      </svg>
                      {/* Percentage text */}
                      <div className="sh-progress-text">
                        {Math.round(analysisProgress)}%
                      </div>
                    </div>
                    <h3 className="sh-loading-title">
                      Analyzing Performance...
                    </h3>
                    <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      AI is processing your session data and generating insights
                    </p>
                  </div>
                )}

                {/* SECTION 1: Real-Time Warnings */}
                {!isLoadingAnalysis && selectedSession.warnings && selectedSession.warnings.length > 0 && (
                  <div className="sh-warnings-box">
                    <h3 style={{ color: '#fff', marginBottom: '15px' }}>
                      ⚠️ Real-Time Warnings
                    </h3>
                    <div className="sh-warnings-list hide-scrollbar">
                      {selectedSession.warnings.map((warning, index) => (
                        <div
                          key={index}
                          onClick={() => jumpToTimestamp(warning.timestamp)}
                          className="sh-warning-item"
                        >
                          <div className="sh-warning-time">
                            {formatTime(warning.timestamp)}
                          </div>
                          <div className="sh-warning-msg">
                            {warning.message}
                          </div>
                          <div style={{ color: '#fff', fontSize: '1.2rem' }}>▶</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 2: AI Performance Score */}
                {!isLoadingAnalysis && claudeAnalysis && (
                  <div className="sh-ai-box">
                    <h3 className="sh-section-title">
                      AI Performance Score
                    </h3>

                    {/* Big Score Display */}
                    <div className="sh-score-display">
                      <div
                        className="sh-score-circle"
                        style={{
                          background: `conic-gradient(${getScoreColor(claudeAnalysis.overallScore)} ${claudeAnalysis.overallScore * 3.6}deg, rgba(255, 255, 255, 0.1) 0deg)`
                        }}
                      >
                        <div className="sh-score-inner">
                          <div className="sh-score-val" style={{ color: getScoreColor(claudeAnalysis.overallScore) }}>
                            {claudeAnalysis.overallScore}
                          </div>
                          <div className="sh-score-max">
                            / 100
                          </div>
                        </div>
                      </div>

                      <div className="sh-score-info">
                        <div style={{
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: getScoreColor(claudeAnalysis.overallScore),
                          marginBottom: '8px'
                        }}>
                          {getScoreLabel(claudeAnalysis.overallScore)} Performance
                        </div>
                        <div className="sh-score-summary">
                          {claudeAnalysis.summary}
                        </div>
                        <div className="sh-form-quality">
                          Form Quality: <span style={{ color: getScoreColor(claudeAnalysis.overallScore) }}>{claudeAnalysis.formQuality}</span>
                        </div>
                      </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="sh-sw-grid">
                      <div className="sh-sw-card">
                        <h4 className="sh-sw-title" style={{ color: '#10b981' }}>
                          ✅ Strengths
                        </h4>
                        <ul className="sh-sw-list">
                          {claudeAnalysis.strengths.slice(0, 3).map((s, i) => (
                            <li key={i} style={{ color: '#ddd' }}>
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="sh-sw-card">
                        <h4 className="sh-sw-title" style={{ color: '#ef4444' }}>
                          ⚠️ To Improve
                        </h4>
                        <ul className="sh-sw-list">
                          {claudeAnalysis.weaknesses.slice(0, 3).map((w, i) => (
                            <li key={i} style={{ color: '#ddd' }}>
                              {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="sh-rec-box">
                      <h4 className="sh-rec-title" style={{ color: '#3b82f6' }}>
                        💡 Recommendations
                      </h4>
                      <ul className="sh-sw-list">
                        {claudeAnalysis.recommendations.slice(0, 3).map((r, i) => (
                          <li key={i} style={{ color: '#ddd' }}>
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* References */}
                    {sessionReferences && sessionReferences.length > 0 && (
                      <References
                        references={sessionReferences}
                        title="Clinical Research References"
                      />
                    )}

                    {/* Clinical Resources */}
                    {!isLoadingAnalysis && selectedSession && (
                      <ClinicalResources
                        key={selectedSession.id}
                        exerciseName={selectedSession.exercise_name}
                      />
                    )}

                  </div>
                )}

                {/* SECTION 3: AI Detected Issues */}
                {!isLoadingAnalysis && analysisResults && analysisResults.totalIssues > 0 && (
                  <div className="sh-issues-box">
                    <div className="sh-issues-header">
                      <h3 className="sh-section-title" style={{ margin: 0, fontSize: '1.2rem' }}>
                        AI Detected Issues ({analysisResults.totalIssues})
                      </h3>
                      <button
                        onClick={() => setShowDetailedIssues(!showDetailedIssues)}
                        className="sh-toggle-btn"
                      >
                        {showDetailedIssues ? 'Hide' : 'Show'}
                      </button>
                    </div>

                    {/* Severity Boxes */}
                    <div className="sh-severity-filters">
                      {['high', 'medium', 'low'].map(sev => (
                        <div
                          key={sev}
                          onClick={() => setFilterSeverity(filterSeverity === sev ? 'all' : sev)}
                          className={`sh-sev-filter ${filterSeverity === sev || filterSeverity === 'all' ? 'active' : ''}`}
                          style={{
                            borderColor: filterSeverity === sev || filterSeverity === 'all' ? getSeverityColor(sev) : 'rgba(255,255,255,0.1)'
                          }}
                        >
                          <div className="sh-sev-count" style={{ color: getSeverityColor(sev) }}>
                            {analysisResults.summary.bySeverity[sev]}
                          </div>
                          <div className="sh-sev-label" style={{ color: getSeverityColor(sev) }}>
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
                          <div className="sh-warnings-list hide-scrollbar" style={{ maxHeight: '350px' }}>
                            {filteredIssues.map((issue, index) => (
                              <div
                                key={index}
                                onClick={() => jumpToTimestamp(issue.timestamp)}
                                className="sh-warning-item"
                                style={{
                                  borderLeft: `3px solid ${getSeverityColor(issue.severity)}`
                                }}
                              >
                                <div style={{ fontSize: '1.3rem' }}>
                                  {getIssueIcon(issue.type)}
                                </div>
                                <div className="sh-warning-time">
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
                                <div style={{ color: '#fff', fontSize: '1.1rem' }}>▶</div>
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
                  <div className="sh-issues-box" style={{ textAlign: 'center', padding: '40px' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>ℹ️</div>
                    <h3 style={{ color: '#fff', marginBottom: '8px' }}>
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
        /* Hide scrollbar */
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  )
}

export default SessionHistory