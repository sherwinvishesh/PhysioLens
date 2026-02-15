/**
 * Advanced Session Analysis System
 * Performs comprehensive biomechanical analysis on recorded pose data
 */

import { calculateAngle, calculate3DAngle, calculateDistance, POSE_LANDMARKS } from './poseUtils'

/**
 * Comprehensive Session Analyzer
 * Detects ALL issues from recorded pose landmark data
 */
export class SessionAnalyzer {
  constructor(exerciseConfig) {
    this.config = exerciseConfig
    this.detectedIssues = []
  }

  /**
   * Main analysis function - processes all recorded pose data
   * @param {Array} poseDataSequence - Array of {timestamp, landmarks} objects
   * @returns {Object} Analysis results with all detected issues
   */
  async analyzeSession(poseDataSequence) {
    console.log('🔍 Starting comprehensive session analysis...')
    console.log(`📊 Analyzing ${poseDataSequence.length} frames of data`)
    
    this.detectedIssues = []

    // Run all detectors
    const tremorIssues = this.detectTremor(poseDataSequence)
    const supportIssues = this.detectOppositeHandSupport(poseDataSequence)
    const compensationIssues = this.detectCompensationPatterns(poseDataSequence)
    const speedIssues = this.detectSpeedVariations(poseDataSequence)
    const romIssues = this.detectRangeOfMotionIssues(poseDataSequence)
    const balanceIssues = this.detectBalanceProblems(poseDataSequence)
    const formIssues = this.detectFormDeviations(poseDataSequence)
    const asymmetryIssues = this.detectAsymmetry(poseDataSequence)
    const fatigueIssues = this.detectFatigueSigns(poseDataSequence)

    // Combine all issues
    this.detectedIssues = [
      ...tremorIssues,
      ...supportIssues,
      ...compensationIssues,
      ...speedIssues,
      ...romIssues,
      ...balanceIssues,
      ...formIssues,
      ...asymmetryIssues,
      ...fatigueIssues
    ]

    // Sort by timestamp
    this.detectedIssues.sort((a, b) => a.timestamp - b.timestamp)

    console.log(`✅ Analysis complete. Found ${this.detectedIssues.length} issues`)

    return {
      totalIssues: this.detectedIssues.length,
      issues: this.detectedIssues,
      summary: this.generateSummary()
    }
  }

  /**
   * Detect tremor/shaking in joints
   */
  detectTremor(sequence) {
    const issues = []
    const windowSize = 30 // 1 second at 30fps - longer window
    
    // Only check elbow - most important
    const jointsToCheck = [
      { index: POSE_LANDMARKS.RIGHT_ELBOW, name: 'Right Elbow' }
    ]

    for (const joint of jointsToCheck) {
      for (let i = windowSize; i < sequence.length; i += windowSize) { // Jump by window size
        const window = sequence.slice(i - windowSize, i)
        const positions = window.map(frame => {
          const landmark = frame.landmarks[joint.index]
          return landmark ? { x: landmark.x, y: landmark.y, z: landmark.z } : null
        }).filter(p => p !== null)

        if (positions.length < windowSize * 0.8) continue

        const xVariance = this.calculateVariance(positions.map(p => p.x))
        const yVariance = this.calculateVariance(positions.map(p => p.y))
        const zVariance = this.calculateVariance(positions.map(p => p.z))
        
        const totalVariance = xVariance + yVariance + zVariance

        // MUCH higher threshold - only catch severe tremor
        if (totalVariance > 0.008) { // Increased from 0.0015
          issues.push({
            type: 'tremor',
            severity: 'medium',
            timestamp: sequence[i].timestamp,
            location: joint.name,
            message: `Significant tremor detected - consider reducing weight`,
            details: `Instability detected`
          })
        }
      }
    }

    return this.deduplicateNearbyIssues(issues, 8.0) // Increased - dedupe within 8 seconds
  }

  /**
   * Detect if opposite hand is supporting the working arm
   */
  detectOppositeHandSupport(sequence) {
    const issues = []

    for (let i = 0; i < sequence.length; i += 15) { // Sample every 15 frames
      const landmarks = sequence[i].landmarks
      if (!landmarks) continue

      const rightWrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      const rightElbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
      const leftWrist = landmarks[POSE_LANDMARKS.LEFT_WRIST]

      if (!rightWrist || !rightElbow || !leftWrist) continue

      const leftHandToRightElbow = this.distance3D(leftWrist, rightElbow)
      const leftHandToRightWrist = this.distance3D(leftWrist, rightWrist)

      // MUCH closer threshold - only if clearly touching
      if (leftHandToRightElbow < 0.08 || leftHandToRightWrist < 0.08) {
        issues.push({
          type: 'opposite_support',
          severity: 'high',
          timestamp: sequence[i].timestamp,
          location: 'Hand positioning',
          message: 'Using left hand for support - work arm independently',
          details: `Support detected`
        })
      }
    }

    return this.deduplicateNearbyIssues(issues, 3.0)
  }

  /**
   * Detect body compensation patterns (leaning, twisting, etc.)
   */
  detectCompensationPatterns(sequence) {
    const issues = []

    for (let i = 0; i < sequence.length; i += 30) { // Sample every 30 frames
      const landmarks = sequence[i].landmarks
      if (!landmarks) continue

      const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
      const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
      const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
      const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]

      if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) continue

      // Check for lateral lean - VERY high threshold
      const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2
      const hipMidX = (leftHip.x + rightHip.x) / 2
      const lateralLean = Math.abs(shoulderMidX - hipMidX)

      if (lateralLean > 0.20) { // Increased from 0.15 - only MAJOR leans
        issues.push({
          type: 'lateral_lean',
          severity: 'medium',
          timestamp: sequence[i].timestamp,
          location: 'Posture',
          message: 'Leaning to the side - keep torso upright',
          details: `Significant lean detected`
        })
      }

      // Check for forward/backward lean - VERY high threshold
      const shoulderMidZ = (leftShoulder.z + rightShoulder.z) / 2
      const hipMidZ = (leftHip.z + rightHip.z) / 2
      const sagittalLean = Math.abs(shoulderMidZ - hipMidZ)

      if (sagittalLean > 0.25) { // Increased from 0.20 - only MAJOR leans
        issues.push({
          type: 'posture_lean',
          severity: 'medium',
          timestamp: sequence[i].timestamp,
          location: 'Posture',
          message: shoulderMidZ > hipMidZ ? 'Leaning forward - engage core' : 'Leaning backward - maintain posture',
          details: `Posture issue detected`
        })
      }

      // Check for shoulder rotation - FIXED calculation and VERY high threshold
      const shoulderAngle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * 180 / Math.PI
      const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x) * 180 / Math.PI
      
      // Calculate rotation with proper angle wrapping
      let rotation = Math.abs(shoulderAngle - hipAngle)
      if (rotation > 180) {
        rotation = 360 - rotation
      }

      if (rotation > 35 && rotation < 180) { // Increased from 25 - only MAJOR twisting
        issues.push({
          type: 'torso_rotation',
          severity: 'medium',
          timestamp: sequence[i].timestamp,
          location: 'Torso',
          message: 'Excessive twisting detected - keep shoulders square',
          details: `${rotation.toFixed(0)}° rotation`
        })
      }
    }

    return this.deduplicateNearbyIssues(issues, 6.0) // Increased from 4.0
  }

  /**
   * Detect speed variations (too fast or too slow)
   */
  detectSpeedVariations(sequence) {
    const issues = []
    const windowSize = 25 // Larger window

    for (let i = windowSize; i < sequence.length; i += windowSize) { // Jump by window
      const landmarks = sequence[i].landmarks
      const prevLandmarks = sequence[i - windowSize].landmarks
      
      if (!landmarks || !prevLandmarks) continue

      const wrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      const prevWrist = prevLandmarks[POSE_LANDMARKS.RIGHT_WRIST]

      if (!wrist || !prevWrist) continue

      const distance = this.distance3D(wrist, prevWrist)
      const timeDiff = sequence[i].timestamp - sequence[i - windowSize].timestamp
      
      // Prevent division by zero
      if (timeDiff <= 0 || !isFinite(timeDiff)) continue
      
      const speed = distance / timeDiff

      // Ignore unrealistic speeds
      if (!isFinite(speed) || speed > 10) continue

      // Only flag VERY fast movements
      if (speed > 0.8) { // Increased from 0.6 - only very jerky
        issues.push({
          type: 'movement_too_fast',
          severity: 'medium',
          timestamp: sequence[i].timestamp,
          location: 'Movement speed',
          message: 'Movement too fast - slow down for better control',
          details: `Fast movement detected`
        })
      }
    }

    return this.deduplicateNearbyIssues(issues, 8.0) // Increased from 5.0
  }

  /**
   * Detect range of motion issues - VERY lenient now
   */
  detectRangeOfMotionIssues(sequence) {
    const issues = []
    
    if (!this.config || !this.config.repCounting) return issues

    const { landmarks: landmarkIndices, thresholds } = this.config.repCounting

    for (let i = 0; i < sequence.length; i += 45) { // Sample every 45 frames (1.5 sec)
      const landmarks = sequence[i].landmarks
      if (!landmarks) continue

      let angle
      if (this.config.repCounting.type === 'angle_based') {
        const pointA = landmarks[Object.values(landmarkIndices)[0]]
        const pointB = landmarks[Object.values(landmarkIndices)[1]]
        const pointC = landmarks[Object.values(landmarkIndices)[2]]

        if (!pointA || !pointB || !pointC) continue

        angle = calculate3DAngle(pointA, pointB, pointC)
      }

      if (!angle || isNaN(angle)) continue

      // Only flag if SIGNIFICANTLY short (20+ degrees off)
      const expectedMin = thresholds.endAngle
      const expectedMax = thresholds.startAngle

      if (angle > expectedMin + 20 && angle < expectedMin + 35) {
        issues.push({
          type: 'limited_range_bottom',
          severity: 'low',
          timestamp: sequence[i].timestamp,
          location: 'Range of motion',
          message: 'Not reaching full bottom position - go deeper',
          details: `${Math.round(angle)}° (target: ${expectedMin}°)`
        })
      }

      if (angle < expectedMax - 20 && angle > expectedMax - 35) {
        issues.push({
          type: 'limited_range_top',
          severity: 'low',
          timestamp: sequence[i].timestamp,
          location: 'Range of motion',
          message: 'Not reaching full top position - extend fully',
          details: `${Math.round(angle)}° (target: ${expectedMax}°)`
        })
      }
    }

    return this.deduplicateNearbyIssues(issues, 8.0) // Larger window
  }

  /**
   * Detect balance problems - SIMPLIFIED
   */
  detectBalanceProblems(sequence) {
    // Removed - too many false positives
    return []
  }

  /**
   * Detect specific form deviations per exercise
   */
  detectFormDeviations(sequence) {
    const issues = []

    for (let i = 0; i < sequence.length; i += 35) { // Sample less frequently
      const landmarks = sequence[i].landmarks
      if (!landmarks) continue

      // Exercise-specific checks
      if (this.config?.name === 'Bicep Curls') {
        issues.push(...this.checkBicepCurlForm(landmarks, sequence[i].timestamp))
      } else if (this.config?.name === 'Shoulder Press') {
        issues.push(...this.checkShoulderPressForm(landmarks, sequence[i].timestamp))
      }
    }

    return this.deduplicateNearbyIssues(issues, 7.0) // Increased from 4.0
  }

  /**
   * Bicep curl specific form checks - VERY lenient
   */
  checkBicepCurlForm(landmarks, timestamp) {
    const issues = []

    const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const elbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
    const wrist = landmarks[POSE_LANDMARKS.RIGHT_WRIST]
    const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP]

    if (!shoulder || !elbow || !wrist || !hip) return issues

    // Check elbow drift - VERY high threshold
    const elbowShoulderZDiff = Math.abs(elbow.z - shoulder.z)
    if (elbowShoulderZDiff > 0.25) { // Increased from 0.15 - only flag MAJOR drift
      issues.push({
        type: 'elbow_drift',
        severity: 'medium',
        timestamp,
        location: 'Elbow position',
        message: 'Elbow moving too far from body - keep it stable',
        details: `Drift detected`
      })
    }

    // Check for swinging (momentum use) - VERY high threshold
    const shoulderHipZDiff = shoulder.z - hip.z
    if (shoulderHipZDiff < -0.20) { // Increased from -0.15 - only flag MAJOR swinging
      issues.push({
        type: 'using_momentum',
        severity: 'high',
        timestamp,
        location: 'Body positioning',
        message: 'Using momentum - slow down and control the weight',
        details: `Body rocking detected`
      })
    }

    return issues
  }

  /**
   * Shoulder press specific form checks
   */
  checkShoulderPressForm(landmarks, timestamp) {
    const issues = []

    const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP]

    if (!shoulder || !hip) return issues

    // Check for back arching - MUCH higher threshold
    const shoulderHipZDiff = shoulder.z - hip.z
    if (shoulderHipZDiff < -0.18) { // Increased from -0.1
      issues.push({
        type: 'back_arching',
        severity: 'high',
        timestamp,
        location: 'Back position',
        message: 'Excessive back arching - engage core',
        details: `Posture issue detected`
      })
    }

    return issues
  }

  /**
   * Detect left-right asymmetry - SIMPLIFIED
   */
  detectAsymmetry(sequence) {
    // Removed - too many false positives for camera angles
    return []
  }

  /**
   * Detect signs of fatigue - REMOVED (too many false positives)
   */
  detectFatigueSigns(sequence) {
    return []
  }

  /**
   * Helper: Calculate variance
   */
  calculateVariance(values) {
    if (values.length === 0) return 0
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const squareDiffs = values.map(value => Math.pow(value - mean, 2))
    return squareDiffs.reduce((a, b) => a + b, 0) / values.length
  }

  /**
   * Helper: Calculate 3D distance
   */
  distance3D(p1, p2) {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) +
      Math.pow(p2.y - p1.y, 2) +
      Math.pow(p2.z - p1.z, 2)
    )
  }

  /**
   * Helper: Calculate movement variance for fatigue detection
   */
  calculateMovementVariance(sequence) {
    const wristPositions = sequence.map(frame => {
      const wrist = frame.landmarks[POSE_LANDMARKS.RIGHT_WRIST]
      return wrist ? { x: wrist.x, y: wrist.y, z: wrist.z } : null
    }).filter(p => p !== null)

    if (wristPositions.length < 10) return 0

    const xVar = this.calculateVariance(wristPositions.map(p => p.x))
    const yVar = this.calculateVariance(wristPositions.map(p => p.y))
    const zVar = this.calculateVariance(wristPositions.map(p => p.z))

    return xVar + yVar + zVar
  }

  /**
   * Helper: Deduplicate issues that occur within a time window
   * Now properly deduplicates by TYPE across entire session
   */
  deduplicateNearbyIssues(issues, windowSeconds) {
    if (issues.length === 0) return issues

    // Group by type
    const byType = {}
    for (const issue of issues) {
      if (!byType[issue.type]) {
        byType[issue.type] = []
      }
      byType[issue.type].push(issue)
    }

    // Deduplicate each type separately
    const deduplicated = []
    for (const type in byType) {
      const typeIssues = byType[type].sort((a, b) => a.timestamp - b.timestamp)
      
      let lastTimestamp = -Infinity
      for (const issue of typeIssues) {
        if (issue.timestamp - lastTimestamp >= windowSeconds) {
          deduplicated.push(issue)
          lastTimestamp = issue.timestamp
        }
      }
    }

    // Sort by timestamp
    return deduplicated.sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Generate summary statistics
   */
  generateSummary() {
    const summary = {
      totalIssues: this.detectedIssues.length,
      byType: {},
      bySeverity: {
        high: 0,
        medium: 0,
        low: 0
      }
    }

    for (const issue of this.detectedIssues) {
      // Count by type
      summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1
      
      // Count by severity
      summary.bySeverity[issue.severity]++
    }

    return summary
  }
}

export async function getPerformanceScore(sessionData, analysisResults) {
  console.log('🤖 Starting Claude API call through backend proxy...')
  
  try {
    console.log('📤 Sending request to backend...')

    const response = await fetch('http://localhost:8000/api/claude-analysis', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session_data: {
          exercise_name: sessionData.exercise_name,
          duration: sessionData.duration,
          rep_count: sessionData.rep_count,
          target_reps: sessionData.target_reps
        },
        analysis_results: {
          totalIssues: analysisResults.totalIssues,
          summary: analysisResults.summary,
          issues: analysisResults.issues
        }
      })
    })

    console.log('📥 Response status:', response.status)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Backend error:', errorData)
      alert(`Analysis Error: ${errorData.detail}`)
      return null
    }

    const data = await response.json()
    console.log('✅ Backend response received')
    
    const cleanedText = data.analysis
    const analysis = JSON.parse(cleanedText)
    
    console.log('✅ Claude analysis parsed successfully:', analysis)
    console.log('📚 References:', data.references)
    
    return {
      analysis: analysis,
      references: data.references
    }

  } catch (error) {
    console.error('❌ Error calling backend:', error)
    alert(`Analysis Error: ${error.message}\nCheck if backend is running on port 8000`)
    return null
  }
}