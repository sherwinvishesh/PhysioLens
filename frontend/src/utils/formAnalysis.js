/**
 * Form Analysis System
 * Supports both built-in and custom AI-generated exercises
 */

import { calculateAngle, calculate3DAngle, POSE_LANDMARKS } from './poseUtils'

/**
 * Generic Form Analyzer for Custom Exercises
 * Performs basic stability checks that work for most exercises
 */
export class GenericFormAnalyzer {
  constructor(config) {
    this.config = config
    this.positionHistory = []
    this.maxHistorySize = 10
    this.lastWarningTime = 0
    this.warningCooldown = 8000 // 8 seconds
  }

  analyze(landmarks) {
    const warnings = []
    const now = Date.now()

    if (now - this.lastWarningTime < this.warningCooldown) {
      return { warnings: [], shouldWarn: false }
    }

    // Check configured form checks
    if (this.config.formChecks) {
      for (const [checkName, checkConfig] of Object.entries(this.config.formChecks)) {
        if (checkConfig.enabled) {
          const warning = this.performCheck(checkName, checkConfig, landmarks)
          if (warning) warnings.push(warning)
        }
      }
    }

    // Perform generic checks
    const stabilityWarning = this.checkGeneralStability(landmarks)
    if (stabilityWarning) warnings.push(stabilityWarning)

    if (warnings.length > 0) {
      this.lastWarningTime = now
    }

    return {
      warnings,
      shouldWarn: warnings.length > 0
    }
  }

  performCheck(checkName, checkConfig, landmarks) {
    const checkType = checkConfig.type || 'stability'

    if (checkType === 'stability') {
      return this.checkStabilityMovement(checkConfig, landmarks)
    }

    return null
  }

  checkStabilityMovement(checkConfig, landmarks) {
    const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP]

    if (!shoulder || !hip) return null

    this.positionHistory.push({ x: shoulder.x - hip.x, y: shoulder.y - hip.y })
    if (this.positionHistory.length > this.maxHistorySize) {
      this.positionHistory.shift()
    }

    if (this.positionHistory.length < 5) return null

    const xPositions = this.positionHistory.map(p => p.x)
    const xRange = Math.max(...xPositions) - Math.min(...xPositions)

    const maxMovement = checkConfig.maxMovement || 0.15
    if (xRange > maxMovement) {
      return {
        type: 'stability',
        message: checkConfig.warning || 'Keep your body stable',
        severity: 'medium'
      }
    }

    return null
  }

  checkGeneralStability(landmarks) {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]

    if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null

    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * 180 / Math.PI

    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    ) * 180 / Math.PI

    const rotation = Math.abs(shoulderAngle - hipAngle)

    if (rotation > 30) {
      return {
        type: 'general_stability',
        message: 'Keep your body aligned - avoid twisting',
        severity: 'low'
      }
    }

    return null
  }

  reset() {
    this.positionHistory = []
    this.lastWarningTime = 0
  }
}

/**
 * Bicep Curl Form Analyzer (built-in - keeping for accuracy)
 */
export class BicepCurlFormAnalyzer {
  constructor(config) {
    this.config = config
    this.elbowPositionHistory = []
    this.maxHistorySize = 10
    this.lastWarningTime = 0
    this.warningCooldown = 8000
  }

  analyze(landmarks) {
    const warnings = []
    const now = Date.now()

    if (now - this.lastWarningTime < this.warningCooldown) {
      return { warnings: [], shouldWarn: false }
    }

    if (this.config.formChecks.elbowStability.enabled) {
      const elbowWarning = this.checkElbowStability(landmarks)
      if (elbowWarning) warnings.push(elbowWarning)
    }

    if (this.config.formChecks.shoulderStability.enabled) {
      const shoulderWarning = this.checkShoulderStability(landmarks)
      if (shoulderWarning) warnings.push(shoulderWarning)
    }

    const swingingWarning = this.checkSwinging(landmarks)
    if (swingingWarning) warnings.push(swingingWarning)

    if (warnings.length > 0) {
      this.lastWarningTime = now
    }

    return {
      warnings,
      shouldWarn: warnings.length > 0
    }
  }

  checkElbowStability(landmarks) {
    const elbow = landmarks[POSE_LANDMARKS.RIGHT_ELBOW]
    
    this.elbowPositionHistory.push({ x: elbow.x, y: elbow.y })
    if (this.elbowPositionHistory.length > this.maxHistorySize) {
      this.elbowPositionHistory.shift()
    }

    if (this.elbowPositionHistory.length < 5) return null

    const xPositions = this.elbowPositionHistory.map(p => p.x)
    const xRange = Math.max(...xPositions) - Math.min(...xPositions)

    if (xRange > 0.15) {
      return {
        type: 'elbow_stability',
        message: this.config.formChecks.elbowStability.warning,
        severity: 'low'
      }
    }

    return null
  }

  checkShoulderStability(landmarks) {
    const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
    const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
    const leftHip = landmarks[POSE_LANDMARKS.LEFT_HIP]
    const rightHip = landmarks[POSE_LANDMARKS.RIGHT_HIP]

    const shoulderAngle = Math.atan2(
      rightShoulder.y - leftShoulder.y,
      rightShoulder.x - leftShoulder.x
    ) * 180 / Math.PI

    const hipAngle = Math.atan2(
      rightHip.y - leftHip.y,
      rightHip.x - leftHip.x
    ) * 180 / Math.PI

    const rotation = Math.abs(shoulderAngle - hipAngle)

    if (rotation > 25) {
      return {
        type: 'shoulder_stability',
        message: this.config.formChecks.shoulderStability.warning,
        severity: 'low'
      }
    }

    return null
  }

  checkSwinging(landmarks) {
    const hip = landmarks[POSE_LANDMARKS.RIGHT_HIP]
    const shoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]

    const hipForwardness = shoulder.z - hip.z
    
    if (hipForwardness < -0.1) {
      return {
        type: 'swinging',
        message: 'Avoid using momentum - keep your body still',
        severity: 'high'
      }
    }

    return null
  }

  reset() {
    this.elbowPositionHistory = []
    this.lastWarningTime = 0
  }
}

/**
 * Factory function to create form analyzer
 * Now supports both built-in and custom exercises
 */
export function createFormAnalyzer(exerciseId, config) {
  if (!config) return null

  // Use built-in analyzer for bicep curls (more accurate)
  if (exerciseId === 3) {
    return new BicepCurlFormAnalyzer(config)
  }

  // Use generic analyzer for all other exercises (including custom)
  return new GenericFormAnalyzer(config)
}