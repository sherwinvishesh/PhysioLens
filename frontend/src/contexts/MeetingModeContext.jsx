// frontend/src/contexts/MeetingModeContext.jsx

import { createContext, useContext, useState, useRef, useEffect } from 'react'

const MeetingModeContext = createContext()

export function MeetingModeProvider({ children }) {
  const [enabled, setEnabled] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  
  const recognitionRef = useRef(null)
  const fullTranscriptRef = useRef('')
  const sessionStartTimeRef = useRef(null)
  const detectedMeetingsRef = useRef([])
  const detectedEmergenciesRef = useRef([])

  // AUTO-START recording when enabled toggles ON
  useEffect(() => {
    if (enabled && !isRecording) {
      console.log('🎤 Meeting Mode enabled - starting voice recording')
      startVoiceRecording()
    } else if (!enabled && isRecording) {
      console.log('🛑 Meeting Mode disabled - stopping voice recording')
      stopVoiceRecording()
    }
  }, [enabled])

  const startVoiceRecording = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice recognition not supported in this browser. Please use Chrome or Edge.')
      setEnabled(false)
      return false
    }

    try {
      const recognition = new webkitSpeechRecognition()
      recognition.continuous = true
      recognition.interimResults = true
      recognition.lang = 'en-US'

      recognition.onstart = () => {
        console.log('✅ Voice recording STARTED')
        setIsRecording(true)
        sessionStartTimeRef.current = Date.now()
        fullTranscriptRef.current = ''
        detectedMeetingsRef.current = []
        detectedEmergenciesRef.current = []
      }

      recognition.onresult = (event) => {
        const result = event.results[event.results.length - 1]
        const transcript = result[0].transcript
        
        // Only process final results (not interim)
        if (result.isFinal) {
          console.log('📝 Transcript:', transcript)
          fullTranscriptRef.current += ' ' + transcript
          setCurrentTranscript(fullTranscriptRef.current)
          
          // Analyze for emergency/meeting
          analyzeTranscriptChunk(transcript)
        }
      }

      recognition.onerror = (event) => {
        console.error('❌ Recognition error:', event.error)
        if (event.error === 'no-speech') {
          // Ignore no-speech errors, just keep listening
          console.log('⏸️ No speech detected, continuing...')
        }
      }

      recognition.onend = () => {
        console.log('🔄 Recognition ended, restarting...')
        // Auto-restart if still enabled
        if (enabled && recognitionRef.current) {
          try {
            setTimeout(() => {
              if (recognitionRef.current) {
                recognitionRef.current.start()
              }
            }, 100)
          } catch (e) {
            console.log('Could not restart recognition')
          }
        } else {
          setIsRecording(false)
        }
      }

      recognitionRef.current = recognition
      recognition.start()
      return true
      
    } catch (error) {
      console.error('Error starting voice recognition:', error)
      alert('Could not start voice recognition: ' + error.message)
      setEnabled(false)
      return false
    }
  }

  const stopVoiceRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current = null
      } catch (e) {
        console.warn('Error stopping recognition:', e)
      }
    }
    setIsRecording(false)
  }

  // Analyze transcript chunk for keywords (instant detection)
  const analyzeTranscriptChunk = async (text) => {
    const lowerText = text.toLowerCase()

    // Emergency keywords - INSTANT detection
    const emergencyKeywords = [
      'pain', 'hurt', 'emergency', 'help', 'cant move', 'can\'t move',
      'dizzy', 'chest pain', 'bad pain', 'severe pain', 'really hurts'
    ]
    const hasEmergency = emergencyKeywords.some(kw => lowerText.includes(kw))

    // Meeting keywords - INSTANT detection
    const meetingKeywords = [
      'meet', 'appointment', 'schedule', 'next week', 'tomorrow',
      'saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday',
      'see you', 'come back'
    ]
    const hasMeeting = meetingKeywords.some(kw => lowerText.includes(kw))

    // Only call API if keywords detected (saves costs)
    if (hasEmergency || hasMeeting) {
      try {
        const response = await fetch('http://localhost:8000/api/meeting-mode/analyze-chunk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        })

        if (response.ok) {
          const analysis = await response.json()
          
          // EMERGENCY - instant popup
          if (analysis.emergency && analysis.urgency_score >= 7) {
            detectedEmergenciesRef.current.push({
              ...analysis,
              timestamp: Date.now()
            })
            window.dispatchEvent(new CustomEvent('emergency-detected', { detail: analysis }))
          }

          // MEETING - instant popup
          if (analysis.meeting_detected && analysis.meeting_details) {
            detectedMeetingsRef.current.push({
              ...analysis.meeting_details,
              timestamp: Date.now()
            })
            window.dispatchEvent(new CustomEvent('meeting-detected', { 
              detail: analysis.meeting_details 
            }))
          }
        }
      } catch (error) {
        console.error('Error analyzing transcript chunk:', error)
      }
    }
  }

  // Generate full clinical summary (called when session ends)
  const generateClinicalSummary = async (sessionContext = {}) => {
    const fullTranscript = fullTranscriptRef.current.trim()
    
    if (!fullTranscript || fullTranscript.length < 50) {
      console.warn('Transcript too short for summary generation')
      return null
    }

    const duration = sessionStartTimeRef.current 
      ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
      : 0

    try {
      console.log('🔄 Generating clinical summary with Claude...')
      
      const response = await fetch('http://localhost:8000/api/meeting-mode/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: fullTranscript,
          duration: duration,
          detectedMeetings: detectedMeetingsRef.current,
          detectedEmergencies: detectedEmergenciesRef.current,
          sessionContext: sessionContext // exercise name, reps, etc.
        })
      })

      if (response.ok) {
        const summary = await response.json()
        console.log('✅ Clinical summary generated:', summary)
        return summary
      } else {
        console.error('Failed to generate summary:', response.statusText)
        return null
      }
    } catch (error) {
      console.error('Error generating clinical summary:', error)
      return null
    }
  }

  const getSessionData = () => {
    return {
      transcript: fullTranscriptRef.current.trim(),
      duration: sessionStartTimeRef.current 
        ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
        : 0,
      detectedMeetings: detectedMeetingsRef.current,
      detectedEmergencies: detectedEmergenciesRef.current
    }
  }

  const resetSession = () => {
    fullTranscriptRef.current = ''
    sessionStartTimeRef.current = null
    detectedMeetingsRef.current = []
    detectedEmergenciesRef.current = []
    setCurrentTranscript('')
  }
// NEW: Stop recording and generate summary
const stopAndSummarize = async () => {
  const fullTranscript = fullTranscriptRef.current.trim()
  
  if (fullTranscript.length < 50) {
    alert('Recording too short to generate summary (need at least 50 characters)')
    setEnabled(false)
    return null
  }

  const duration = sessionStartTimeRef.current 
    ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
    : 0

  console.log('🔄 Generating clinical summary...')
  
  try {
    const response = await fetch('http://localhost:8000/api/meeting-mode/generate-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transcript: fullTranscript,
        duration: duration,
        detectedMeetings: detectedMeetingsRef.current,
        detectedEmergencies: detectedEmergenciesRef.current,
        sessionContext: {
          source: 'manual_recording',
          timestamp: new Date().toISOString()
        }
      })
    })

    if (response.ok) {
      const summary = await response.json()
      console.log('✅ Summary generated:', summary)
      
      // Save to clinical notes
      const clinicalNotes = JSON.parse(localStorage.getItem('clinicalNotes') || '[]')
      clinicalNotes.push({
        id: Date.now(),
        exercise_name: 'Voice Recording Session',
        date: new Date().toISOString(),
        summary: summary,
        rep_count: 0,
        target_reps: 0,
        duration: duration,
        sessionData: {
          transcript: fullTranscript,
          duration: duration,
          detectedMeetings: detectedMeetingsRef.current,
          detectedEmergencies: detectedEmergenciesRef.current
        }
      })
      localStorage.setItem('clinicalNotes', JSON.stringify(clinicalNotes))
      
      alert('✅ Clinical summary generated and saved!')
      
      // Stop recording after summary is saved
      setEnabled(false)
      resetSession()
      
      return summary
    } else {
      console.error('Failed to generate summary')
      alert('⚠️ Failed to generate summary')
      setEnabled(false)
      return null
    }
  } catch (error) {
    console.error('Error generating summary:', error)
    alert('⚠️ Error generating summary: ' + error.message)
    setEnabled(false)
    return null
  }
}

const value = {
  enabled,
  setEnabled,
  isRecording,
  currentTranscript,
  generateClinicalSummary,
  getSessionData,
  resetSession,
  stopAndSummarize  // ADD THIS
}

  return (
    <MeetingModeContext.Provider value={value}>
      {children}
    </MeetingModeContext.Provider>
  )
}

export function useMeetingMode() {
  const context = useContext(MeetingModeContext)
  if (!context) {
    throw new Error('useMeetingMode must be used within MeetingModeProvider')
  }
  return context
}