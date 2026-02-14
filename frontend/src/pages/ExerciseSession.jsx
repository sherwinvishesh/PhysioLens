import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Pose } from '@mediapipe/pose'
import { Camera } from '@mediapipe/camera_utils'
import { drawConnectors, drawLandmarks } from '@mediapipe/drawing_utils'
import { POSE_CONNECTIONS } from '@mediapipe/pose'
import FormFeedback from '../components/FormFeedback'
import CameraPositioning from '../components/CameraPositioning'
import { getExerciseConfig, getCameraType } from '../utils/exerciseConfigs'
import { createRepCounter } from '../utils/repCounters'
import { createFormAnalyzer } from '../utils/formAnalysis'
import { checkUpperBodyFraming, checkFullBodyFraming } from '../utils/poseUtils'

function ExerciseSession() {
  const { exerciseId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  
  // Video refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const streamRef = useRef(null)
  
  // MediaPipe refs
  const poseRef = useRef(null)
  const cameraRef = useRef(null)
  
  // Exercise analysis refs
  const repCounterRef = useRef(null)
  const formAnalyzerRef = useRef(null)
  
  // Recording refs
  const mediaRecorderRef = useRef(null)
  const recordedChunksRef = useRef([])
  const warningLogRef = useRef([])
  const poseDataLogRef = useRef([])

  const isLiveRef = useRef(false);
  const isRecordingRef = useRef(false);
  
  // Track cleanup state to prevent double-cleanup
  const isCleanedUpRef = useRef(false)

  const [exercise, setExercise] = useState(null)
  const [exerciseConfig, setExerciseConfig] = useState(null)
  const [loading, setLoading] = useState(true)
  const [configLoading, setConfigLoading] = useState(true)
  const [isLive, setIsLive] = useState(false)
  const [timer, setTimer] = useState(0)
  const [poseDetected, setPoseDetected] = useState(false)
  const timerRef = useRef(null)
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [recordedChunks, setRecordedChunks] = useState([])
  const [warningLog, setWarningLog] = useState([])
  const isCountingDownRef = useRef(false)

  // Add these refs after the existing refs
  const timerValueRef = useRef(0)
  const repCountValueRef = useRef(0)
  
  // Add these new state variables after your existing useState declarations
    const [isCountingDown, setIsCountingDown] = useState(false)
    const [countdownSeconds, setCountdownSeconds] = useState(10)
    const countdownIntervalRef = useRef(null)

  // New state for features
  const [repCount, setRepCount] = useState(0)
  const [currentPhase, setCurrentPhase] = useState('')
  const [currentAngle, setCurrentAngle] = useState(0)
  const [formWarnings, setFormWarnings] = useState([])
  const [cameraPositioning, setCameraPositioning] = useState({
    isCorrect: false,
    message: 'Position yourself in the camera frame'
  })
  const [showPositioningGuide, setShowPositioningGuide] = useState(true)
  const [formWarningsEnabled, setFormWarningsEnabled] = useState(true)
  
  // NEW: State for completion popup
  const [showCompletionPopup, setShowCompletionPopup] = useState(false)
  const [targetReps, setTargetReps] = useState(0)

  // Initialize recording mode from route state
  useEffect(() => {
    if (location.state?.recordingEnabled) {
      setIsRecording(true);
      isRecordingRef.current = true;
    }
  }, [location.state]);

  // Fetch exercise and initialize - FIXED TO HANDLE ASYNC CONFIG
  useEffect(() => {
    fetchExerciseDetails()
    
    return () => {
      cleanup()
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (isLive) {
      timerRef.current = setInterval(() => {
        setTimer(prev => {
          const newValue = prev + 1
          timerValueRef.current = newValue
          return newValue
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isLive])

  useEffect(() => {
    repCountValueRef.current = repCount
  }, [repCount])

  // NEW: Check if target reps reached
  useEffect(() => {
    if (targetReps > 0 && repCount >= targetReps && !showCompletionPopup && isLive) {
      handleTargetReached()
    }
  }, [repCount, targetReps])

  // Countdown timer effect - add this after your existing useEffects
        useEffect(() => {
        if (isCountingDown && countdownSeconds > 0) {
            countdownIntervalRef.current = setInterval(() => {
            setCountdownSeconds(prev => {
                if (prev <= 1) {
                // Countdown finished
                clearInterval(countdownIntervalRef.current)
                setIsCountingDown(false)
                isCountingDownRef.current = false  // UPDATE REF TOO
                
                // **CRITICAL: Reset rep counter internal state**
                if (repCounterRef.current && repCounterRef.current.reset) {
                    repCounterRef.current.reset()
                    console.log('🔄 Rep counter reset after countdown')
                }
                
                // **CRITICAL: Reset React rep count state to 0**
                setRepCount(0)
                repCountValueRef.current = 0
                setCurrentPhase('')
                setCurrentAngle(0)
                
                console.log('🎯 Countdown complete! Starting fresh at 0 reps.')
                return 0
                }
                return prev - 1
            })
            }, 1000)
        }
        
        return () => {
            if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            }
        }
        }, [isCountingDown])

  const fetchExerciseDetails = async () => {
    try {
      const response = await fetch('http://localhost:8000/assigned-exercises')
      const data = await response.json()
      const foundExercise = data.exercises.find(ex => ex.id === parseInt(exerciseId))
      
      if (foundExercise) {
        console.log('Exercise loaded:', foundExercise)
        setExercise(foundExercise)
        setTargetReps(foundExercise.target_reps)
        
        // FIXED: Properly await the async config
        setConfigLoading(true)
        const config = await getExerciseConfig(parseInt(exerciseId))
        console.log('Exercise config loaded:', config)
        setExerciseConfig(config)
        
        if (config) {
          const counter = createRepCounter(parseInt(exerciseId), config)
          console.log('Rep counter created:', counter ? 'SUCCESS' : 'FAILED')
          repCounterRef.current = counter
          
          formAnalyzerRef.current = createFormAnalyzer(parseInt(exerciseId), config)
          console.log('Form analyzer created:', formAnalyzerRef.current ? 'SUCCESS' : 'FAILED')
        } else {
          console.error('Failed to load exercise config')
        }
        
        setConfigLoading(false)
      } else {
        console.error('Exercise not found:', exerciseId)
        navigate('/patient')
      }
    } catch (error) {
      console.error('Error fetching exercise:', error)
      setConfigLoading(false)
    } finally {
      setLoading(false)
    }
  }

  const initializePose = () => {
    const pose = new Pose({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
      }
    })

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })

    pose.onResults(onPoseResults)
    poseRef.current = pose

    return pose
  }

const onPoseResults = (results) => {
  if (!canvasRef.current) return

  const canvasCtx = canvasRef.current.getContext('2d')
  const canvas = canvasRef.current
  
  canvas.width = videoRef.current.videoWidth
  canvas.height = videoRef.current.videoHeight

  canvasCtx.save()
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height)

  // Process pose landmarks
  if (results.poseLandmarks) {
    setPoseDetected(true)
    
    // **CRITICAL FIX: Use REF instead of state to avoid stale closures**
    if (isCountingDownRef.current) {
      // Still draw the skeleton so user can see themselves
      drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
        color: '#00FF88',
        lineWidth: 4
      })
      
      drawLandmarks(canvasCtx, results.poseLandmarks, {
        color: '#FF0000',
        fillColor: '#00FF88',
        lineWidth: 2,
        radius: 6
      })
      
      canvasCtx.restore()
      console.log('⏳ Countdown active - skipping all processing')
      return // Exit early - no recording, no rep counting, no form analysis
    }
    
    // NEW: Record pose data if recording is enabled
    if (isRecordingRef.current && isLiveRef.current) {
      poseDataLogRef.current.push({
        timestamp: timerValueRef.current,
        landmarks: results.poseLandmarks
      })
    }
    
    // 1. Check Camera Positioning
    checkCameraPositioning(results.poseLandmarks)
    
    // 2. Update Rep Counter
    updateRepCount(results.poseLandmarks)
    
    // 3. Analyze Form
    analyzeForm(results.poseLandmarks)
    
    // Draw pose skeleton
    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
      color: '#00FF88',
      lineWidth: 4
    })
    
    drawLandmarks(canvasCtx, results.poseLandmarks, {
      color: '#FF0000',
      fillColor: '#00FF88',
      lineWidth: 2,
      radius: 6
    })
    
    // Draw angle on canvas if applicable
    if (exerciseConfig && exerciseConfig.repCounting && exerciseConfig.repCounting.type === 'angle_based' && currentAngle > 0) {
      const landmarks = exerciseConfig.repCounting.landmarks
      const landmarkKeys = Object.keys(landmarks)
      if (landmarkKeys.length >= 2) {
        const middleKey = landmarkKeys[1] // Usually elbow or knee
        const middleLandmark = results.poseLandmarks[landmarks[middleKey]]
        
        if (middleLandmark) {
          canvasCtx.font = 'bold 40px Arial'
          canvasCtx.fillStyle = '#00FF88'
          canvasCtx.strokeStyle = '#000000'
          canvasCtx.lineWidth = 3
          
          const x = middleLandmark.x * canvas.width
          const y = middleLandmark.y * canvas.height - 50
          
          const text = `${currentAngle}°`
          canvasCtx.strokeText(text, x - 30, y)
          canvasCtx.fillText(text, x - 30, y)
        }
      }
    }
  } else {
    setPoseDetected(false)
  }

  canvasCtx.restore()
}

  const checkCameraPositioning = (landmarks) => {
    if (!exerciseConfig) return

    const cameraType = exerciseConfig.cameraType || 'upper_body'
    let positionCheck

    if (cameraType === 'upper_body') {
      positionCheck = checkUpperBodyFraming(landmarks)
    } else if (cameraType === 'full_body') {
      positionCheck = checkFullBodyFraming(landmarks)
    } else {
      positionCheck = checkUpperBodyFraming(landmarks)
    }

    setCameraPositioning({
      isCorrect: positionCheck.properlyFramed,
      message: positionCheck.message
    })

    if (positionCheck.properlyFramed && showPositioningGuide) {
      setTimeout(() => {
        setShowPositioningGuide(false)
      }, 3000)
    } else if (!positionCheck.properlyFramed) {
      setShowPositioningGuide(true)
    }
  }

const updateRepCount = (landmarks) => {
  if (!repCounterRef.current) {
    console.warn('Rep counter not initialized')
    return
  }

  // Use REF instead of state
  if (isCountingDownRef.current) {
    console.log('⏳ Countdown active - skipping rep count')
    return
  }

  try {
    const result = repCounterRef.current.update(landmarks)
    
    if (result && result.angle !== undefined) {
      console.log('Rep Update:', {
        angle: result.angle,
        phase: result.phase,
        repCount: result.repCount,
        progress: result.progress
      })
    }
    
    if (result) {
      setRepCount(result.repCount)
      setCurrentPhase(result.phase || '')
      if (result.angle !== undefined) {
        setCurrentAngle(result.angle)
      }

      if (result.repCompleted) {
        console.log('🎉 REP COMPLETED! Total:', result.repCount)
        playRepCompletionSound()
      }
    }
  } catch (error) {
    console.error('Error updating rep count:', error)
    console.error('Landmarks:', landmarks)
  }
}

  const analyzeForm = (landmarks) => {
    if (!formAnalyzerRef.current || !formWarningsEnabled) return;

    try {
      const analysis = formAnalyzerRef.current.analyze(landmarks);
      
      if (analysis && analysis.shouldWarn && analysis.warnings.length > 0) {
        setFormWarnings(analysis.warnings);
        
        if (isRecordingRef.current && isLiveRef.current) {
          analysis.warnings.forEach(warning => {
            const warningEvent = {
              timestamp: timerValueRef.current,
              message: warning.message,
              severity: warning.severity
            };
            warningLogRef.current.push(warningEvent);
            console.log(`⚠️ Warning logged:`, warning.message);
          });
        }
        
        if (analysis.warnings.some(w => w.severity === 'high')) {
          playWarningSound()
        }
      }
    } catch (error) {
      console.error('Error analyzing form:', error)
    }
  }

  const playRepCompletionSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.1)
  }

  const playWarningSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 400
    oscillator.type = 'square'
    
    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.15)
  }

  const playCelebrationSound = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    const frequencies = [523.25, 659.25, 783.99]
    
    frequencies.forEach((freq, index) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = freq
      oscillator.type = 'sine'
      
      const startTime = audioContext.currentTime + (index * 0.15)
      gainNode.gain.setValueAtTime(0.3, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.2)
    })
  }

  const startRecording = (stream) => {
    try {
      const options = { mimeType: 'video/webm; codecs=vp9' }
      const recorder = new MediaRecorder(stream, options)
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data)
          setRecordedChunks(prev => [...prev, event.data])
        }
      }
      
      recorder.onstop = () => {
        console.log('🎥 Recording stopped. Chunks:', recordedChunksRef.current.length)
        saveRecordingSession()
      }
      
      recorder.start(1000)
      mediaRecorderRef.current = recorder
      setMediaRecorder(recorder)
      
      console.log('🎥 Recording started')
    } catch (error) {
      console.error('Recording error:', error)
      alert('Could not start recording: ' + error.message)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      console.log('🎥 Stopping recording...')
    }
  }

  const saveRecordingSession = async () => {
    try {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
      const videoUrl = URL.createObjectURL(blob)
      
      console.log('📹 Video blob created:', blob.size, 'bytes')
      console.log('📝 Total warnings logged:', warningLogRef.current.length)
      console.log('🦴 Total pose frames recorded:', poseDataLogRef.current.length)
      console.log('⏱️ Timer value:', timerValueRef.current)
      console.log('💪 Rep count:', repCountValueRef.current)
      
      const sessionData = {
        id: Date.now(),
        exercise_id: parseInt(exerciseId),
        exercise_name: exercise.name,
        completed_at: new Date().toISOString(),
        duration: timerValueRef.current,
        rep_count: repCountValueRef.current,
        target_reps: targetReps,
        warnings: warningLogRef.current,
        poseData: poseDataLogRef.current,
        videoUrl: videoUrl,
        videoBlobSize: blob.size
      }
      
      const existingSessions = JSON.parse(localStorage.getItem('recordedSessions') || '[]')
      existingSessions.push(sessionData)
      localStorage.setItem('recordedSessions', JSON.stringify(existingSessions))
      
      const response = await fetch('http://localhost:8000/save-recording-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercise_id: parseInt(exerciseId),
          exercise_name: exercise.name,
          completed_at: new Date().toISOString(),
          duration: timerValueRef.current,
          rep_count: repCountValueRef.current,
          target_reps: targetReps,
          warnings: warningLogRef.current
        })
      })
      
      if (response.ok) {
        console.log('✅ Session saved to backend')
      }
      
      console.log('🎉 Session recorded and saved successfully!')
    } catch (error) {
      console.error('Error saving recording:', error)
    }
  }

const startStream = async () => {
  try {
    isCleanedUpRef.current = false
    
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: 1280, 
        height: 720,
        facingMode: 'user'
      },
      audio: false
    })
    
    if (!videoRef.current) {
      throw new Error('Video element not found')
    }
    
    videoRef.current.srcObject = stream
    streamRef.current = stream

    await new Promise((resolve) => {
      videoRef.current.onloadedmetadata = () => {
        videoRef.current.play()
        resolve()
      }
    })

    setIsLive(true);
    isLiveRef.current = true;

    // START COUNTDOWN instead of recording immediately
    setIsCountingDown(true)
    isCountingDownRef.current = true  
    setCountdownSeconds(10)

    if (isRecording) {
      startRecording(stream)
    }

    const pose = initializePose()

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (poseRef.current && videoRef.current) {
          await poseRef.current.send({ image: videoRef.current })
        }
      },
      width: 1280,
      height: 720
    })
    
    cameraRef.current = camera
    camera.start()
    
  } catch (e) {
    alert('Camera Error: ' + e.message)
    console.error('Camera error:', e)
  }
}

  const stopStream = () => {
    if (isCleanedUpRef.current) {
      console.log('Already cleaned up, skipping...')
      return
    }

    console.log('Stopping stream and cleaning up...')

    if (isRecording) {
      stopRecording()
    }

    if (cameraRef.current) {
      try {
        cameraRef.current.stop()
        cameraRef.current = null
      } catch (e) {
        console.warn('Error stopping camera:', e)
      }
    }

    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(t => t.stop())
        streamRef.current = null
      } catch (e) {
        console.warn('Error stopping stream tracks:', e)
      }
    }

    if (poseRef.current) {
      try {
        poseRef.current.close()
        poseRef.current = null
      } catch (e) {
        console.warn('Error closing pose:', e)
      }
    }

    setIsLive(false);
    isLiveRef.current = false;
    setTimer(0);
    setPoseDetected(false);
    
    isCleanedUpRef.current = true;
  }

  const cleanup = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    stopStream()
  }

  const handleExit = () => {
    cleanup()
    navigate('/patient')
  }

  const handleTargetReached = async () => {
    console.log('🎉 TARGET REPS REACHED!')
    
    stopStream()
    playCelebrationSound()
    setShowCompletionPopup(true)
    
    try {
      await fetch(`http://localhost:8000/complete-exercise/${exerciseId}`, {
        method: 'POST'
      })
    } catch (error) {
      console.error('Error marking exercise as completed:', error)
    }
  }

  const handleCompletionAcknowledge = () => {
    navigate('/patient')
  }

  const handleComplete = () => {
    stopStream()
    alert(`🎉 Great work! You completed ${repCount} reps!`)
    navigate('/patient')
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // FIXED: Show loading while config is being fetched
  if (loading || configLoading) {
    return (
      <div className="dark-session-container">
        <div className="loading-dark">
          <div className="loading-spinner"></div>
          <p>{configLoading ? 'Loading exercise configuration...' : 'Loading session...'}</p>
        </div>
      </div>
    )
  }

  if (!exercise) {
    return (
      <div className="dark-session-container">
        <div className="loading-dark">Exercise not found</div>
      </div>
    )
  }

  // FIXED: Check if config loaded successfully
  if (!exerciseConfig) {
    return (
      <div className="dark-session-container">
        <div className="loading-dark">
          <p>Failed to load exercise configuration</p>
          <button className="dark-btn dark-btn-secondary" onClick={() => navigate('/patient')}>
            ← Back to Exercises
          </button>
        </div>
      </div>
    )
  }

return (
  <div className="dark-session-container">
    {/* COMPLETION POPUP */}
    {showCompletionPopup && (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        animation: 'fadeIn 0.3s ease'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '30px',
          padding: '60px 80px',
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          animation: 'slideUp 0.5s ease'
        }}>
          <div style={{
            fontSize: '6rem',
            marginBottom: '30px',
            animation: 'bounce 1s ease infinite'
          }}>
            🎉
          </div>
          <h1 style={{
            fontSize: '3rem',
            color: 'white',
            marginBottom: '20px',
            fontWeight: '800',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)'
          }}>
            Congratulations!
          </h1>
          <p style={{
            fontSize: '1.5rem',
            color: 'rgba(255, 255, 255, 0.95)',
            marginBottom: '15px',
            fontWeight: '600'
          }}>
            You completed your target!
          </p>
          <div style={{
            fontSize: '4rem',
            fontWeight: '800',
            color: '#00FF88',
            margin: '30px 0',
            textShadow: '3px 3px 6px rgba(0, 0, 0, 0.4)'
          }}>
            {repCount} / {targetReps} reps
          </div>
          <p style={{
            fontSize: '1.2rem',
            color: 'rgba(255, 255, 255, 0.9)',
            marginBottom: '40px'
          }}>
            Excellent work! Keep up the great progress! 💪
          </p>
          <button
            onClick={handleCompletionAcknowledge}
            style={{
              padding: '20px 60px',
              fontSize: '1.3rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)'
              e.target.style.boxShadow = '0 12px 35px rgba(16, 185, 129, 0.6)'
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 8px 25px rgba(16, 185, 129, 0.4)'
            }}
          >
            ✓ Done - Back to Exercises
          </button>
        </div>
      </div>
    )}

    {/* ========== COUNTDOWN TIMER OVERLAY - ADD THIS HERE ========== */}
    {isCountingDown && isLive && (
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
        zIndex: 9998,
        backdropFilter: 'blur(8px)'
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Circular countdown */}
          <div style={{ position: 'relative', width: '250px', height: '250px', margin: '0 auto 30px' }}>
            <svg width="250" height="250" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background circle */}
              <circle
                cx="125"
                cy="125"
                r="110"
                fill="none"
                stroke="rgba(255, 255, 255, 0.1)"
                strokeWidth="15"
              />
              {/* Progress circle */}
              <circle
                cx="125"
                cy="125"
                r="110"
                fill="none"
                stroke="url(#countdownGradient)"
                strokeWidth="15"
                strokeDasharray={`${2 * Math.PI * 110}`}
                strokeDashoffset={`${2 * Math.PI * 110 * (1 - countdownSeconds / 10)}`}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
              <defs>
                <linearGradient id="countdownGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#667eea" />
                  <stop offset="100%" stopColor="#764ba2" />
                </linearGradient>
              </defs>
            </svg>
            {/* Countdown number */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '5rem',
              fontWeight: '900',
              color: '#667eea',
              textShadow: '0 0 30px rgba(102, 126, 234, 0.5)',
              animation: 'pulse 1s ease-in-out infinite'
            }}>
              {countdownSeconds}
            </div>
          </div>
          
          <h2 style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: '700',
            marginBottom: '15px',
            textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
          }}>
            Get Ready!
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '1.2rem',
            maxWidth: '400px',
            margin: '0 auto'
          }}>
            Position yourself in the camera frame
          </p>
          <p style={{
            color: '#667eea',
            fontSize: '1rem',
            marginTop: '20px',
            fontWeight: '600'
          }}>
            Rep counting will start in {countdownSeconds} second{countdownSeconds !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    )}
    {/* ========== END COUNTDOWN TIMER OVERLAY ========== */}

    <style>{`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      @keyframes pulse {
        0%, 100% { 
          opacity: 1;
          transform: translate(-50%, -50%) scale(1);
        }
        50% { 
          opacity: 0.8;
          transform: translate(-50%, -50%) scale(1.05);
        }
      }
      
      @keyframes slideUp {
        from {
          transform: translateY(50px);
          opacity: 0;
        }
        to {
          transform: translateY(0);
          opacity: 1;
        }
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-20px); }
      }
    `}</style>

    <FormFeedback 
      warnings={formWarnings} 
      onDismiss={() => {
        setFormWarnings([])
      }}
    />

    <div className="dark-header">
      <div className="header-left">
        <button className="dark-btn dark-btn-ghost" onClick={handleExit}>
          ← Exit
        </button>
        <div className="exercise-title-bar">
          <h2>{exercise.name}</h2>
          <span className={`badge-dark badge-${exercise.difficulty.toLowerCase()}`}>
            {exercise.difficulty}
          </span>
        </div>
      </div>
      <div className="header-right">
        {isRecording && isLive && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '8px 16px',
            borderRadius: '12px'
          }}>
            <span style={{
              width: '12px',
              height: '12px',
              background: '#ef4444',
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite'
            }}></span>
            <span style={{
              color: '#ef4444',
              fontWeight: '700',
              fontSize: '0.85rem',
              letterSpacing: '0.5px'
            }}>
              RECORDING
            </span>
          </div>
        )}
        {isLive && poseDetected && (
          <div className="pose-status-badge">
            <span className="status-dot-green"></span>
            POSE DETECTED
          </div>
        )}
        {isLive && (
          <div className="timer-display">
            <span className="timer-icon">⏱️</span>
            <span className="timer-text">{formatTime(timer)}</span>
          </div>
        )}
      </div>
    </div>

    <div className="session-main-dual">
      <div className="dual-video-container">
        <div className="video-feed-main" style={{ display: isLive ? 'block' : 'none' }}>
          <div className="feed-label">Raw Feed</div>
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            muted 
            className="video-element"
          />
          <div className="video-overlay-minimal">
            <div className="overlay-corner top-left"></div>
            <div className="overlay-corner top-right"></div>
            <div className="overlay-corner bottom-left"></div>
            <div className="overlay-corner bottom-right"></div>
          </div>
          
          {isLive && exerciseConfig && (
            <CameraPositioning
              cameraType={exerciseConfig.cameraType || 'upper_body'}
              isCorrect={cameraPositioning.isCorrect}
              message={cameraPositioning.message}
              onDismiss={() => setShowPositioningGuide(false)}
            />
          )}
        </div>

        <div className="video-feed-skeleton" style={{ display: isLive ? 'block' : 'none' }}>
          <div className="feed-label-skeleton">
            <span className="skeleton-icon">🦴</span>
            Pose Detection
          </div>
          <canvas 
            ref={canvasRef}
            className="canvas-element"
          />
          <div className="skeleton-status">
            {poseDetected ? (
              <span className="status-good">✓ Tracking Active</span>
            ) : (
              <span className="status-searching">⚠ Searching for pose...</span>
            )}
          </div>
        </div>
        
        {!isLive && (
          <div className="video-placeholder-overlay">
            <div className="camera-placeholder-dark">
              <div className="camera-icon-large">📹</div>
              <h3>Ready to Start?</h3>
              <p>Dual camera view with AI pose detection will activate</p>
              {exerciseConfig && (
                <p style={{ marginTop: '10px', fontSize: '0.9rem', opacity: 0.8 }}>
                  Camera setup: {(exerciseConfig.cameraType || 'upper_body').replace('_', ' ')}
                </p>
              )}
              {isRecording && (
                <p style={{ 
                  marginTop: '15px', 
                  fontSize: '1.1rem', 
                  color: '#ef4444',
                  fontWeight: '700',
                  background: 'rgba(239, 68, 68, 0.1)',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}>
                  🎥 Recording Mode Active
                </p>
              )}
              <button className="dark-btn dark-btn-primary btn-xl" onClick={startStream}>
                <span className="btn-icon">🎬</span>
                Start Session
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="side-panel-dark">
        <div className="panel-section">
          <h3 className="panel-title">📋 Instructions</h3>
          <div className="instructions-compact">
            {exercise.instructions.map((instruction, index) => (
              <div key={index} className="instruction-item">
                <span className="instruction-number">{index + 1}</span>
                <span className="instruction-text">{instruction}</span>
              </div>
            ))}
          </div>
        </div>

        {isLive && (
          <>
            <div className="panel-section">
              <h3 className="panel-title">📊 Stats</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-label">Duration</div>
                  <div className="stat-value">{formatTime(timer)}</div>
                </div>
                <div className="stat-item">
                  <div className="stat-label">Target</div>
                  <div className="stat-value">{exercise.duration}</div>
                </div>
                <div className="stat-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="stat-label">Reps Progress</div>
                  <div className="stat-value" style={{ 
                    color: repCount >= targetReps ? '#10b981' : '#667eea', 
                    fontSize: '2.5rem' 
                  }}>
                    {repCount} / {targetReps}
                  </div>
                  {repCount >= targetReps && (
                    <div style={{ 
                      marginTop: '5px', 
                      color: '#10b981', 
                      fontSize: '0.9rem',
                      fontWeight: '700'
                    }}>
                      ✓ Target Reached!
                    </div>
                  )}
                </div>
                <div className="stat-item">
                  <div className="stat-label">Phase</div>
                  <div className="stat-value" style={{ fontSize: '1rem', textTransform: 'uppercase' }}>
                    {currentPhase || 'starting'}
                  </div>
                </div>
              </div>
              
              {exerciseConfig && exerciseConfig.repCounting && exerciseConfig.repCounting.type === 'angle_based' && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '15px', 
                  background: 'rgba(0, 0, 0, 0.3)', 
                  borderRadius: '10px',
                  textAlign: 'center'
                }}>
                  <div className="stat-label" style={{ marginBottom: '5px' }}>Current Angle</div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    fontWeight: 'bold', 
                    color: currentAngle > 0 ? '#00FF88' : '#999'
                  }}>
                    {currentAngle > 0 ? `${currentAngle}°` : 'N/A'}
                  </div>
                  <div style={{ 
                    fontSize: '0.8rem', 
                    color: 'rgba(255, 255, 255, 0.6)',
                    marginTop: '5px'
                  }}>
                    Target: {exerciseConfig.repCounting.thresholds.endAngle}° - {exerciseConfig.repCounting.thresholds.startAngle}°
                  </div>
                </div>
              )}

              {isRecording && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '12px', 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  borderRadius: '10px',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    color: '#ef4444', 
                    fontSize: '0.9rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: '#ef4444',
                      borderRadius: '50%',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></span>
                    Session Recording
                  </div>
                  <div style={{ 
                    color: 'rgba(255, 255, 255, 0.7)', 
                    fontSize: '0.75rem',
                    marginTop: '5px'
                  }}>
                    {warningLogRef.current.length} warnings logged
                  </div>
                </div>
              )}
            </div>

            <div className="panel-section controls-section">
              <button 
                className="dark-btn dark-btn-success btn-full"
                onClick={handleComplete}
              >
                ✅ Complete Session
              </button>
              <button className="dark-btn dark-btn-danger btn-full" onClick={stopStream}>
                ⏸️ Pause
              </button>
              <button 
                className={`dark-btn ${formWarningsEnabled ? 'dark-btn-secondary' : 'dark-btn-ghost'} btn-full`}
                onClick={() => setFormWarningsEnabled(!formWarningsEnabled)}
                style={{ marginTop: '10px' }}
              >
                {formWarningsEnabled ? '🔕 Disable Warnings' : '🔔 Enable Warnings'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
)
}

export default ExerciseSession