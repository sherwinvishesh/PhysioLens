/**
 * Exercise Rep Counters
 * Supports both built-in and custom AI-generated exercises
 */

import { calculateAngle, calculate3DAngle, calculateDistance, POSE_LANDMARKS } from './poseUtils'

/**
 * Generic Rep Counter - works with any angle-based configuration
 * Used for custom exercises created by AI
 */
export class GenericAngleCounter {
  constructor(config) {
    this.config = config
    this.repCount = 0
    this.currentPhase = 'down'
    this.lastAngle = null
    this.angleHistory = []
    this.maxHistorySize = 5
  }

  update(landmarks) {
    const { landmarks: landmarkIndices, thresholds } = this.config.repCounting
    const { startAngle, endAngle, hysteresis } = thresholds

    // Get the landmark points (handle different keys)
    const keys = Object.keys(landmarkIndices)
    if (keys.length < 3) {
      console.warn('Not enough landmarks for angle calculation')
      return this.getDefaultResult()
    }

    const point1 = landmarks[landmarkIndices[keys[0]]]
    const point2 = landmarks[landmarkIndices[keys[1]]]
    const point3 = landmarks[landmarkIndices[keys[2]]]

    if (!point1 || !point2 || !point3) {
      return this.getDefaultResult()
    }

    const angle = calculate3DAngle(point1, point2, point3)

    if (isNaN(angle) || !isFinite(angle)) {
      return this.getDefaultResult()
    }

    // Smooth angle
    this.angleHistory.push(angle)
    if (this.angleHistory.length > this.maxHistorySize) {
      this.angleHistory.shift()
    }
    const smoothedAngle = this.angleHistory.reduce((a, b) => a + b) / this.angleHistory.length

    let repCompleted = false

    // Determine if we're moving toward endAngle or startAngle
    const movingToEnd = endAngle < startAngle

    if (movingToEnd) {
      // Movement: startAngle -> endAngle -> startAngle (like bicep curls)
      if (this.currentPhase === 'down') {
        if (smoothedAngle < endAngle + hysteresis) {
          this.currentPhase = 'up'
        }
      } else if (this.currentPhase === 'up') {
        if (smoothedAngle > startAngle - hysteresis) {
          this.currentPhase = 'down'
          this.repCount++
          repCompleted = true
        }
      }
    } else {
      // Movement: startAngle -> endAngle -> startAngle (like shoulder press)
      if (this.currentPhase === 'down') {
        if (smoothedAngle > endAngle - hysteresis) {
          this.currentPhase = 'up'
        }
      } else if (this.currentPhase === 'up') {
        if (smoothedAngle < startAngle + hysteresis) {
          this.currentPhase = 'down'
          this.repCount++
          repCompleted = true
        }
      }
    }

    this.lastAngle = smoothedAngle

    return {
      repCount: this.repCount,
      phase: this.currentPhase,
      angle: Math.round(smoothedAngle),
      repCompleted,
      progress: this.getProgress(smoothedAngle)
    }
  }

  getProgress(angle) {
    const { startAngle, endAngle } = this.config.repCounting.thresholds
    const range = Math.abs(endAngle - startAngle)
    const current = Math.abs(angle - startAngle)
    return Math.max(0, Math.min(100, (current / range) * 100))
  }

  getDefaultResult() {
    return {
      repCount: this.repCount,
      phase: this.currentPhase,
      angle: 0,
      repCompleted: false,
      progress: 0
    }
  }

  reset() {
    this.repCount = 0
    this.currentPhase = 'down'
    this.lastAngle = null
    this.angleHistory = []
  }
}

/**
 * Bicep Curl Rep Counter (built-in)
 */
export class BicepCurlCounter {
  constructor(config) {
    this.config = config
    this.repCount = 0
    this.currentPhase = 'down'
    this.lastAngle = null
    this.angleHistory = []
    this.maxHistorySize = 5
  }

  update(landmarks) {
    const { shoulder, elbow, wrist } = this.config.repCounting.landmarks
    const { startAngle, endAngle, hysteresis } = this.config.repCounting.thresholds

    if (!landmarks[shoulder] || !landmarks[elbow] || !landmarks[wrist]) {
      return {
        repCount: this.repCount,
        phase: this.currentPhase,
        angle: 0,
        repCompleted: false,
        progress: 0
      }
    }

    const angle = calculate3DAngle(
      landmarks[shoulder],
      landmarks[elbow],
      landmarks[wrist]
    )

    if (isNaN(angle) || !isFinite(angle)) {
      return {
        repCount: this.repCount,
        phase: this.currentPhase,
        angle: 0,
        repCompleted: false,
        progress: 0
      }
    }

    this.angleHistory.push(angle)
    if (this.angleHistory.length > this.maxHistorySize) {
      this.angleHistory.shift()
    }
    const smoothedAngle = this.angleHistory.reduce((a, b) => a + b) / this.angleHistory.length

    let repCompleted = false

    if (this.currentPhase === 'down') {
      if (smoothedAngle < endAngle + hysteresis) {
        this.currentPhase = 'up'
      }
    } else if (this.currentPhase === 'up') {
      if (smoothedAngle > startAngle - hysteresis) {
        this.currentPhase = 'down'
        this.repCount++
        repCompleted = true
      }
    }

    this.lastAngle = smoothedAngle

    return {
      repCount: this.repCount,
      phase: this.currentPhase,
      angle: Math.round(smoothedAngle),
      repCompleted,
      progress: this.getProgress(smoothedAngle)
    }
  }

  getProgress(angle) {
    const { startAngle, endAngle } = this.config.repCounting.thresholds
    const range = startAngle - endAngle
    const current = angle - endAngle
    return Math.max(0, Math.min(100, (current / range) * 100))
  }

  reset() {
    this.repCount = 0
    this.currentPhase = 'down'
    this.lastAngle = null
    this.angleHistory = []
  }
}

// Include other built-in counters (Shoulder Press, Lateral Raises, etc.)
// ... (keeping them for backward compatibility)

/**
 * Factory function to create appropriate counter for exercise
 * Now supports both built-in and custom exercises
 */
export function createRepCounter(exerciseId, config) {
  if (!config) {
    console.warn('No config provided for rep counter')
    return null
  }

  // Use built-in counters for specific exercises
  if (exerciseId === 3) {
    return new BicepCurlCounter(config)
  }

  // For all other exercises (including custom), use generic counter
  if (config.repCounting && config.repCounting.type === 'angle_based') {
    return new GenericAngleCounter(config)
  }

  console.warn(`No rep counter available for exercise ID: ${exerciseId}`)
  return null
}