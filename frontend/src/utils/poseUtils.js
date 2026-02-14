/**
 * Pose Analysis Utilities
 * Functions for calculating angles, distances, and visibility of body parts
 */

/**
 * Calculate angle between three points (in degrees)
 * @param {Object} a - First point {x, y, z}
 * @param {Object} b - Middle point (vertex) {x, y, z}
 * @param {Object} c - Third point {x, y, z}
 * @returns {number} Angle in degrees (0-180)
 */
export function calculateAngle(a, b, c) {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x)
  let angle = Math.abs((radians * 180.0) / Math.PI)
  
  if (angle > 180.0) {
    angle = 360 - angle
  }
  
  return angle
}

/**
 * Calculate 3D angle between three points
 * @param {Object} a - First point {x, y, z}
 * @param {Object} b - Middle point (vertex) {x, y, z}
 * @param {Object} c - Third point {x, y, z}
 * @returns {number} Angle in degrees
 */
export function calculate3DAngle(a, b, c) {
  // Vector from b to a
  const ba = { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z }
  // Vector from b to c
  const bc = { x: c.x - b.x, y: c.y - b.y, z: c.z - b.z }
  
  // Dot product
  const dotProduct = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z
  
  // Magnitudes
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2)
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2)
  
  // Angle in radians
  const angleRad = Math.acos(dotProduct / (magBA * magBC))
  
  // Convert to degrees
  return (angleRad * 180.0) / Math.PI
}

/**
 * Calculate distance between two points
 * @param {Object} a - First point {x, y}
 * @param {Object} b - Second point {x, y}
 * @returns {number} Euclidean distance
 */
export function calculateDistance(a, b) {
  return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
}

/**
 * Check if a landmark is visible and has good confidence
 * @param {Object} landmark - Landmark object with visibility
 * @param {number} threshold - Minimum visibility threshold (0-1)
 * @returns {boolean}
 */
export function isLandmarkVisible(landmark, threshold = 0.5) {
  return landmark && landmark.visibility > threshold
}

/**
 * Check if required body parts are visible for camera positioning
 * @param {Array} landmarks - Array of pose landmarks
 * @param {Array} requiredParts - Array of landmark indices that must be visible
 * @param {number} threshold - Visibility threshold
 * @returns {Object} { allVisible: boolean, missingParts: Array }
 */
export function checkRequiredVisibility(landmarks, requiredParts, threshold = 0.5) {
  const missingParts = []
  
  for (const part of requiredParts) {
    if (!isLandmarkVisible(landmarks[part], threshold)) {
      missingParts.push(getLandmarkName(part))
    }
  }
  
  return {
    allVisible: missingParts.length === 0,
    missingParts
  }
}

/**
 * Get human-readable name for landmark index
 * @param {number} index - Landmark index
 * @returns {string} Landmark name
 */
export function getLandmarkName(index) {
  const names = {
    0: 'Nose', 11: 'Left Shoulder', 12: 'Right Shoulder',
    13: 'Left Elbow', 14: 'Right Elbow', 15: 'Left Wrist', 16: 'Right Wrist',
    23: 'Left Hip', 24: 'Right Hip', 25: 'Left Knee', 26: 'Right Knee',
    27: 'Left Ankle', 28: 'Right Ankle', 29: 'Left Heel', 30: 'Right Heel',
    31: 'Left Foot Index', 32: 'Right Foot Index'
  }
  return names[index] || `Point ${index}`
}

/**
 * MediaPipe Pose Landmark Indices Reference
 */
export const POSE_LANDMARKS = {
  NOSE: 0,
  LEFT_EYE_INNER: 1,
  LEFT_EYE: 2,
  LEFT_EYE_OUTER: 3,
  RIGHT_EYE_INNER: 4,
  RIGHT_EYE: 5,
  RIGHT_EYE_OUTER: 6,
  LEFT_EAR: 7,
  RIGHT_EAR: 8,
  MOUTH_LEFT: 9,
  MOUTH_RIGHT: 10,
  LEFT_SHOULDER: 11,
  RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,
  RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,
  RIGHT_WRIST: 16,
  LEFT_PINKY: 17,
  RIGHT_PINKY: 18,
  LEFT_INDEX: 19,
  RIGHT_INDEX: 20,
  LEFT_THUMB: 21,
  RIGHT_THUMB: 22,
  LEFT_HIP: 23,
  RIGHT_HIP: 24,
  LEFT_KNEE: 25,
  RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,
  RIGHT_ANKLE: 28,
  LEFT_HEEL: 29,
  RIGHT_HEEL: 30,
  LEFT_FOOT_INDEX: 31,
  RIGHT_FOOT_INDEX: 32
}

/**
 * Check if upper body is properly framed in camera
 * @param {Array} landmarks - Pose landmarks
 * @returns {Object} { properlyFramed: boolean, message: string }
 */
export function checkUpperBodyFraming(landmarks) {
  const shoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const wrist = landmarks[POSE_LANDMARKS.LEFT_WRIST]
  const hip = landmarks[POSE_LANDMARKS.LEFT_HIP]
  
  // Check if key upper body parts are visible
  const requiredParts = [
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_ELBOW,
    POSE_LANDMARKS.RIGHT_ELBOW,
    POSE_LANDMARKS.LEFT_WRIST,
    POSE_LANDMARKS.RIGHT_WRIST,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP
  ]
  
  const visibility = checkRequiredVisibility(landmarks, requiredParts, 0.5)
  
  if (!visibility.allVisible) {
    return {
      properlyFramed: false,
      message: `Please adjust camera: ${visibility.missingParts.join(', ')} not visible`
    }
  }
  
  // Check if too close (shoulders take up more than 70% of frame width)
  const leftShoulder = landmarks[POSE_LANDMARKS.LEFT_SHOULDER]
  const rightShoulder = landmarks[POSE_LANDMARKS.RIGHT_SHOULDER]
  const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
  
  if (shoulderWidth > 0.7) {
    return {
      properlyFramed: false,
      message: 'Move back - you are too close to the camera'
    }
  }
  
  // Check if too far (shoulders less than 20% of frame width)
  if (shoulderWidth < 0.2) {
    return {
      properlyFramed: false,
      message: 'Move closer - you are too far from the camera'
    }
  }
  
  return {
    properlyFramed: true,
    message: 'Camera position is good'
  }
}

/**
 * Check if full body is properly framed in camera
 * @param {Array} landmarks - Pose landmarks
 * @returns {Object} { properlyFramed: boolean, message: string }
 */
export function checkFullBodyFraming(landmarks) {
  const requiredParts = [
    POSE_LANDMARKS.NOSE,
    POSE_LANDMARKS.LEFT_SHOULDER,
    POSE_LANDMARKS.RIGHT_SHOULDER,
    POSE_LANDMARKS.LEFT_HIP,
    POSE_LANDMARKS.RIGHT_HIP,
    POSE_LANDMARKS.LEFT_KNEE,
    POSE_LANDMARKS.RIGHT_KNEE,
    POSE_LANDMARKS.LEFT_ANKLE,
    POSE_LANDMARKS.RIGHT_ANKLE
  ]
  
  const visibility = checkRequiredVisibility(landmarks, requiredParts, 0.5)
  
  if (!visibility.allVisible) {
    return {
      properlyFramed: false,
      message: `Please adjust camera: ${visibility.missingParts.join(', ')} not visible`
    }
  }
  
  // Check vertical framing - head to feet should be well-framed
  const nose = landmarks[POSE_LANDMARKS.NOSE]
  const leftAnkle = landmarks[POSE_LANDMARKS.LEFT_ANKLE]
  const bodyHeight = Math.abs(leftAnkle.y - nose.y)
  
  if (bodyHeight < 0.6) {
    return {
      properlyFramed: false,
      message: 'Move back - full body needs to be visible'
    }
  }
  
  if (bodyHeight > 0.95) {
    return {
      properlyFramed: false,
      message: 'Move closer - you are too far'
    }
  }
  
  return {
    properlyFramed: true,
    message: 'Camera position is good'
  }
}

/**
 * Smooth angle values using exponential moving average
 */
export class AngleSmoothing {
  constructor(alpha = 0.3) {
    this.alpha = alpha
    this.smoothedValue = null
  }
  
  update(newValue) {
    if (this.smoothedValue === null) {
      this.smoothedValue = newValue
    } else {
      this.smoothedValue = this.alpha * newValue + (1 - this.alpha) * this.smoothedValue
    }
    return this.smoothedValue
  }
  
  reset() {
    this.smoothedValue = null
  }
}