/**
 * Exercise-Specific Configurations
 * Supports both built-in and custom exercises created via AI
 */

import { POSE_LANDMARKS } from './poseUtils'

// Built-in exercise configurations
const BUILTIN_CONFIGS = {
  // Bicep Curls (ID: 3)
  3: {
    name: 'Bicep Curls',
    cameraType: 'upper_body',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP
    ],
    repCounting: {
      type: 'angle_based',
      arm: 'right',
      landmarks: {
        shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
        elbow: POSE_LANDMARKS.RIGHT_ELBOW,
        wrist: POSE_LANDMARKS.RIGHT_WRIST
      },
      thresholds: {
        startAngle: 140,
        endAngle: 90,
        hysteresis: 15
      },
      phases: ['down', 'up']
    },
    formChecks: {
      elbowStability: {
        enabled: true,
        maxMovement: 0.15,
        warning: 'Keep your elbow stable - avoid swinging'
      },
      shoulderStability: {
        enabled: true,
        maxRotation: 25,
        warning: 'Keep your shoulders steady'
      },
      controlledMovement: {
        enabled: false,
        maxSpeed: 200,
        warning: 'Move more slowly and with control'
      }
    }
  },

  // Shoulder Press (ID: 4)
  4: {
    name: 'Shoulder Press',
    cameraType: 'upper_body',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP
    ],
    repCounting: {
      type: 'angle_based',
      arm: 'right',
      landmarks: {
        shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
        elbow: POSE_LANDMARKS.RIGHT_ELBOW,
        wrist: POSE_LANDMARKS.RIGHT_WRIST
      },
      thresholds: {
        startAngle: 90,
        endAngle: 160,
        hysteresis: 15
      },
      phases: ['down', 'up']
    },
    formChecks: {
      backStability: {
        enabled: true,
        maxMovement: 0.12,
        warning: 'Keep your back straight - avoid arching'
      },
      controlledPress: {
        enabled: true,
        maxRotation: 20,
        warning: 'Press straight up - avoid leaning'
      }
    }
  },

  // Lateral Raises (ID: 5)
  5: {
    name: 'Lateral Raises',
    cameraType: 'upper_body',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP
    ],
    repCounting: {
      type: 'angle_based',
      arm: 'right',
      landmarks: {
        hip: POSE_LANDMARKS.RIGHT_HIP,
        shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
        elbow: POSE_LANDMARKS.RIGHT_ELBOW
      },
      thresholds: {
        startAngle: 20,
        endAngle: 90,
        hysteresis: 12
      },
      phases: ['down', 'up']
    },
    formChecks: {
      armStraight: {
        enabled: true,
        maxBend: 30,
        warning: 'Keep arms mostly straight'
      },
      noSwinging: {
        enabled: true,
        maxMovement: 0.15,
        warning: 'Avoid using momentum - lift with control'
      }
    }
  },

  // Front Raises (ID: 6)
  6: {
    name: 'Front Raises',
    cameraType: 'upper_body',
    requiredLandmarks: [
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_ELBOW,
      POSE_LANDMARKS.RIGHT_ELBOW,
      POSE_LANDMARKS.LEFT_WRIST,
      POSE_LANDMARKS.RIGHT_WRIST,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP
    ],
    repCounting: {
      type: 'angle_based',
      arm: 'right',
      landmarks: {
        hip: POSE_LANDMARKS.RIGHT_HIP,
        shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
        wrist: POSE_LANDMARKS.RIGHT_WRIST
      },
      thresholds: {
        startAngle: 20,
        endAngle: 90,
        hysteresis: 12
      },
      phases: ['down', 'up']
    },
    formChecks: {
      noLeanBack: {
        enabled: true,
        maxLean: 15,
        warning: 'Keep your core tight - avoid leaning back'
      },
      controlledRaise: {
        enabled: true,
        maxMovement: 0.15,
        warning: 'Raise with control - no swinging'
      }
    }
  },

  // Standing Leg Raises (ID: 8)
  8: {
    name: 'Standing Leg Raises',
    cameraType: 'full_body',
    requiredLandmarks: [
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE
    ],
    repCounting: {
      type: 'angle_based',
      arm: 'right',
      landmarks: {
        shoulder: POSE_LANDMARKS.RIGHT_SHOULDER,
        hip: POSE_LANDMARKS.RIGHT_HIP,
        knee: POSE_LANDMARKS.RIGHT_KNEE
      },
      thresholds: {
        startAngle: 175,
        endAngle: 90,
        hysteresis: 15
      },
      phases: ['down', 'up']
    },
    formChecks: {
      legStraight: {
        enabled: true,
        maxBend: 25,
        warning: 'Keep your leg straight while raising'
      },
      balanceStability: {
        enabled: true,
        maxMovement: 0.15,
        warning: 'Stand tall and stable - engage your core'
      }
    }
  }
}

// Cache for custom exercise configurations
let customConfigCache = {}

/**
 * Convert landmark name string to POSE_LANDMARKS constant
 */
function getLandmarkIndex(landmarkName) {
  return POSE_LANDMARKS[landmarkName] || null
}

/**
 * Parse custom exercise configuration from backend
 */
function parseCustomConfig(backendConfig) {
  const config = {
    name: backendConfig.name || 'Custom Exercise',
    cameraType: backendConfig.cameraType || 'upper_body',
    requiredLandmarks: [],
    repCounting: {
      type: backendConfig.repCounting?.type || 'angle_based',
      arm: 'right',
      landmarks: {},
      thresholds: backendConfig.repCounting?.thresholds || {
        startAngle: 140,
        endAngle: 90,
        hysteresis: 15
      },
      phases: backendConfig.repCounting?.phases || ['down', 'up']
    },
    formChecks: backendConfig.formChecks || {}
  }

  // Parse landmarks
  if (backendConfig.repCounting?.landmarks) {
    for (const [key, landmarkName] of Object.entries(backendConfig.repCounting.landmarks)) {
      const index = getLandmarkIndex(landmarkName)
      if (index !== null) {
        config.repCounting.landmarks[key] = index
        config.requiredLandmarks.push(index)
      }
    }
  }

  // Add common required landmarks based on camera type
  if (config.cameraType === 'upper_body') {
    config.requiredLandmarks.push(
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP
    )
  } else if (config.cameraType === 'full_body') {
    config.requiredLandmarks.push(
      POSE_LANDMARKS.NOSE,
      POSE_LANDMARKS.LEFT_SHOULDER,
      POSE_LANDMARKS.RIGHT_SHOULDER,
      POSE_LANDMARKS.LEFT_HIP,
      POSE_LANDMARKS.RIGHT_HIP,
      POSE_LANDMARKS.LEFT_KNEE,
      POSE_LANDMARKS.RIGHT_KNEE,
      POSE_LANDMARKS.LEFT_ANKLE,
      POSE_LANDMARKS.RIGHT_ANKLE
    )
  }

  // Remove duplicates
  config.requiredLandmarks = [...new Set(config.requiredLandmarks)]

  return config
}

/**
 * Get configuration for an exercise (built-in or custom)
 */
export async function getExerciseConfig(exerciseId) {
  // Check if it's a built-in exercise
  if (BUILTIN_CONFIGS[exerciseId]) {
    return BUILTIN_CONFIGS[exerciseId]
  }

  // Check cache for custom exercise
  if (customConfigCache[exerciseId]) {
    return customConfigCache[exerciseId]
  }

  // Fetch from backend
  try {
    const response = await fetch(`http://localhost:8000/exercise-config/${exerciseId}`)
    if (response.ok) {
      const data = await response.json()
      const parsedConfig = parseCustomConfig(data.config)
      customConfigCache[exerciseId] = parsedConfig
      return parsedConfig
    }
  } catch (error) {
    console.error('Error fetching custom exercise config:', error)
  }

  return null
}

/**
 * Get camera type needed for an exercise
 */
export function getCameraType(exerciseId) {
  const builtInConfig = BUILTIN_CONFIGS[exerciseId]
  if (builtInConfig) {
    return builtInConfig.cameraType
  }

  const customConfig = customConfigCache[exerciseId]
  if (customConfig) {
    return customConfig.cameraType
  }

  return 'upper_body'
}

/**
 * Clear custom config cache (useful when exercises are updated)
 */
export function clearCustomConfigCache() {
  customConfigCache = {}
}