// frontend/src/components/MeetingModeIndicator.jsx

import { useMeetingMode } from '../contexts/MeetingModeContext'
import { useState, useEffect } from 'react'

function MeetingModeIndicator() {
  const { isRecording, stopAndSummarize } = useMeetingMode()
  const [duration, setDuration] = useState(0)
  const [isSummarizing, setIsSummarizing] = useState(false)

  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now()
      const interval = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
      return () => clearInterval(interval)
    } else {
      setDuration(0)
    }
  }, [isRecording])

  if (!isRecording && !isSummarizing) return null

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleStop = async () => {
    if (!confirm('Stop recording and generate summary?')) return
    
    setIsSummarizing(true)
    await stopAndSummarize()
    setIsSummarizing(false)
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      background: isSummarizing 
        ? 'rgba(102, 126, 234, 0.95)' 
        : 'rgba(239, 68, 68, 0.95)',
      color: 'white',
      padding: '12px 20px',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease'
    }}>
      <span style={{
        width: '10px',
        height: '10px',
        background: 'white',
        borderRadius: '50%',
        animation: 'pulse 1.5s ease-in-out infinite'
      }}></span>
      <div>
        <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>
          {isSummarizing ? '🤖 Generating Summary...' : '🎤 Recording'}
        </div>
        <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>
          {isSummarizing ? 'Please wait...' : formatTime(duration)}
        </div>
      </div>
      {!isSummarizing && (
        <button
          onClick={handleStop}
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.3)'
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(255, 255, 255, 0.2)'
          }}
        >
          Stop & Summarize
        </button>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

export default MeetingModeIndicator

