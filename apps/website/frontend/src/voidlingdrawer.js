
let g_width = 190;
let g_height = 61;
const PI = 3.14159265;
let g_min_x_move = window.isMobile ? 10 : 50;
let g_max_x_move = window.isMobile ? 80 : 150;
let g_min_y_move = window.isMobile ? 37 : 27;
let g_max_y_move = window.isMobile ? 71 : 41;
const MIN_BASE_RADIUS = 5;
const MAX_BASE_RADIUS = 20;

class VoidlingConfig {
  constructor() {
    this.baseRadius = 0.0;
    this.aspectRatio = 0.0;
    this.moveSpeed = 0.0;
    this.moveChangeFrequency = 0;
    this.minRotationSpeed = 0.0;
    this.maxRotationSpeed = 0.0;
    this.rotationSmoothness = 0.0;
    this.maxRotationAngle = 0.0;
    this.baseDeformStrength = 0.0;
    this.extraDeformStrength = 0.0;
    this.deformFrequency = 0.0;
    this.drippiness = 0.0;
    this.deformComplexity = 0;
    this.timeSpeed = 0.0;
    this.perspectiveDistance = 0.0;
    this.perspectiveStrength = 0.0;
    this.stepSize = 0.0;
    this.fillDensity = 0.0;
    this.maxMoveDistance = 0.0;
    this.borderSquishFactor = 0.0;
    this.minSkewness = 0.0;
    this.minMoveDistance = 0.0;
    this.behaviorChangeTime = 0;
    this.behaviorWeight = 0.0;
    this.deformSmoothness = 0.0;
    this.xBias = 0.0;
    this.yBias = 0.0;
    this.maxHorizontalPersistence = 0;
  }
}

let buffer = null;
let zBuffer = null;
let deformPhases = null;
let targetDeformPhases = null;
let deformFreqs = null;
let targetDeformFreqs = null;
let currentTime = 0;
let config = new VoidlingConfig();
let rotX = 0, rotY = 0, rotZ = 0;
let targetRotX = 0, targetRotY = 0, targetRotZ = 0;
let rotationSpeed = 0;
let movementX;
let movementY;
let targetX;
let targetY;
let lastTargetX;
let lastTargetY;
let currentBehavior;
let behaviorTimer = 0;
let stuckCounter;
let horizontalPersistenceTimer;
let isInitialized = 0;
const MAX_HISTORY_LENGTH = 12;
let deformHistory = new Array(MAX_HISTORY_LENGTH).fill(null);
let currentHistoryIndex = 0;
let frameCounter = 0;
const CACHE_SIZE = 628;
let cachedSin = new Array(CACHE_SIZE);
let cachedCos = new Array(CACHE_SIZE);
let borderProximityCounter = 0;
const BORDER_PROXIMITY_THRESHOLD = window.isMobile ? 0.5 : 1.0;
const MAX_BORDER_FRAMES = window.isMobile ? 120 : 200;
let squishCounter = 0;

// Linear interpolation
function lerp(a, b, t) {
  return a + t * (b - a);
}

// Calculate distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

// Calculate border squish factor
function calculateBorderSquish(pos, border, radius) {
  const distance = Math.abs(pos - border);
  const squishRange = radius * 7;
  if (distance < squishRange) {
    const factor = distance / squishRange;
    const factorIndex = (Math.floor((factor * Math.PI / 2) * CACHE_SIZE / (2.0 * Math.PI)) + CACHE_SIZE) % CACHE_SIZE;
    return 0.1 + (0.95 * cachedSin[factorIndex]);
  }
  return 1.0;
}

// Calculate volume-preserving squish
function calculateVolumePreservingSquish(currentSquish, targetSquish, volumeRatio) {
  const maxSquishRate = 0.15;
  const squishDelta = targetSquish - currentSquish;
  const adjustedDelta = squishDelta * Math.min(maxSquishRate, 1.0 / volumeRatio);
  return currentSquish + adjustedDelta;
}

function calculateEffectiveRadius(baseRadius, volumeCompensation, deformStrength) {
  const rawSquishX = calculateBorderSquish(movementX, 0, baseRadius) * 
                     calculateBorderSquish(movementX, g_width, baseRadius) * 
                     config.aspectRatio;
  const rawSquishY = calculateBorderSquish(movementY, 0, baseRadius) * 
                     calculateBorderSquish(movementY, g_height, baseRadius) * 
                     config.aspectRatio;
  
  const maxElongation = Math.max(1.0 / rawSquishX, 1.0 / rawSquishY);
  const effectiveCompensation = Math.max(volumeCompensation, maxElongation);
  
  return baseRadius * (1.0 + deformStrength) * effectiveCompensation;
}

function getDistanceToBorder(x, y, radius, width, height) {
  const distLeft = x;
  const distRight = width - x;
  const distTop = y;
  const distBottom = height - y;
  return Math.min(Math.min(distLeft, distRight), Math.min(distTop, distBottom)) / radius;
}

function enforceObjectBounds(x, y, radius, width, height) {
  const margin = radius * 1.2;
  const prevX = x;
  const prevY = y;
  
  // Calculate current volume ratio before enforcing bounds
  let currentSquishX = calculateBorderSquish(x, 0, radius) * 
                       calculateBorderSquish(x, width, radius);
  let currentSquishY = calculateBorderSquish(y, 0, radius) * 
                       calculateBorderSquish(y, height, radius);
  const currentVolume = 1.0 / (currentSquishX * currentSquishY);
  
  // Enforce boundaries more strictly for the center point
  x = Math.max(margin, Math.min(width - margin, x));
  y = Math.max(margin, Math.min(height - margin, y));
  
  // If we had to move the center point, adjust the squishing
  if (x !== prevX || y !== prevY) {
    // Calculate target squish values at new position
    const targetSquishX = calculateBorderSquish(x, 0, radius) * 
                          calculateBorderSquish(x, width, radius);
    const targetSquishY = calculateBorderSquish(y, 0, radius) * 
                          calculateBorderSquish(y, height, radius);
    
    // Gradually adjust squishing to preserve volume
    currentSquishX = calculateVolumePreservingSquish(currentSquishX, targetSquishX, currentVolume);
    currentSquishY = calculateVolumePreservingSquish(currentSquishY, targetSquishY, currentVolume);
    
    // Update movement behavior if we're very close to the border
    const borderDistance = getDistanceToBorder(x, y, radius, width, height);
    if (borderDistance < 1.5) {
      const centerX = width / 2;
      const centerY = height / 2;
      let pushAngle = Math.atan2(centerY - y, centerX - x);
      
      // Add a small random variation to prevent getting stuck
      pushAngle += ((Math.random() * 100) - 50) / 100.0;
      
      targetX = x + Math.cos(pushAngle) * (radius * 2);
      targetY = y + Math.sin(pushAngle) * (radius * 2);
    }
  }
}

function cleanupDeformHistory() {
  if (deformHistory) {
    for (let i = 0; i < MAX_HISTORY_LENGTH; i++) {
      if (deformHistory[i]) {
        deformHistory[i] = null;
      }
    }
    deformHistory = null;
  }
  currentHistoryIndex = 0;
}

function cleanupBuffers() {
  if (buffer) {
    buffer = null;
  }
  if (zBuffer) {
    zBuffer = null;
  }
  if (deformPhases) {
    deformPhases = null;
  }
  if (targetDeformPhases) {
    targetDeformPhases = null;
  }
  if (deformFreqs) {
    deformFreqs = null;
  }
  if (targetDeformFreqs) {
    targetDeformFreqs = null;
  }

  // Just call cleanupDeformHistory() - remove the redundant loop
  cleanupDeformHistory();
}

function allocateBuffers() {
  cleanupBuffers(); // This now properly cleans everything and nulls all pointers

  buffer = new Array(g_width * g_height);
  zBuffer = new Array(g_width * g_height);

  // Only allocate deformHistory if we have a valid complexity
  if (config.deformComplexity > 0) {
    deformHistory = new Array(MAX_HISTORY_LENGTH).fill(null);
    for (let i = 0; i < MAX_HISTORY_LENGTH; i++) {
      deformHistory[i] = new Float32Array(config.deformComplexity);
      if (!deformHistory[i]) {
        console.error(`Failed to allocate memory for deformHistory[${i}]`);
        cleanupBuffers();
        return;
      }
    }

    // Allocate other deform-related buffers
    deformPhases = new Float32Array(config.deformComplexity);
    targetDeformPhases = new Float32Array(config.deformComplexity);
    deformFreqs = new Float32Array(config.deformComplexity);
    targetDeformFreqs = new Float32Array(config.deformComplexity);

    // Initialize the deform buffers
    for (let i = 0; i < config.deformComplexity; i++) {
      deformPhases[i] = (Math.random() * 628) / 100.0;
      targetDeformPhases[i] = deformPhases[i];
      deformFreqs[i] = 1.0 + Math.random() * 5;
      targetDeformFreqs[i] = deformFreqs[i];
    }
  }
}

function periodicCleanupDeformBuffers() {
  for (let i = 0; i < config.deformComplexity; i++) {
    if (Math.abs(deformPhases[i]) < 0.001) {
      deformPhases[i] = 0.0;
    }
    if (Math.abs(targetDeformPhases[i]) < 0.001) {
      targetDeformPhases[i] = 0.0;
    }
    if (Math.abs(deformFreqs[i]) < 0.001) {
      deformFreqs[i] = 1.0;
    }
    if (Math.abs(targetDeformFreqs[i]) < 0.001) {
      targetDeformFreqs[i] = 1.0;
    }
  }
}

export function initVoidlingWithConfig(
  baseRadius,
  aspectRatio,
  moveSpeed,
  moveChangeFrequency,
  minRotationSpeed,
  maxRotationSpeed,
  rotationSmoothness,
  maxRotationAngle,
  baseDeformStrength,
  extraDeformStrength,
  deformFrequency,
  drippiness,
  deformComplexity,
  timeSpeed,
  perspectiveDistance,
  perspectiveStrength,
  stepSize,
  fillDensity,
  maxMoveDistance,
  borderSquishFactor,
  minSkewness,
  minMoveDistance,
  behaviorChangeTime,
  behaviorWeight,
  deformSmoothness,
  xBias,
  yBias,
  maxHorizontalPersistence
) {

  if (isInitialized) {
    cleanupBuffers();
  }

  // Initialize random seed
  //Math.seedrandom();

  config.baseRadius = baseRadius;
  config.aspectRatio = aspectRatio;
  config.moveSpeed = moveSpeed;
  config.moveChangeFrequency = moveChangeFrequency;
  config.minRotationSpeed = minRotationSpeed;
  config.maxRotationSpeed = maxRotationSpeed;
  config.rotationSmoothness = rotationSmoothness;
  config.maxRotationAngle = maxRotationAngle;
  config.baseDeformStrength = baseDeformStrength;
  config.extraDeformStrength = extraDeformStrength;
  config.deformFrequency = deformFrequency;
  config.drippiness = drippiness;
  config.deformComplexity = deformComplexity;
  config.timeSpeed = timeSpeed;
  config.perspectiveDistance = perspectiveDistance;
  config.perspectiveStrength = perspectiveStrength;
  config.stepSize = stepSize;
  config.fillDensity = fillDensity;
  config.maxMoveDistance = maxMoveDistance;
  config.borderSquishFactor = borderSquishFactor;
  config.minSkewness = minSkewness;
  config.minMoveDistance = minMoveDistance;
  config.behaviorChangeTime = behaviorChangeTime;
  config.behaviorWeight = behaviorWeight;
  config.deformSmoothness = deformSmoothness;
  config.xBias = xBias;
  config.yBias = yBias;
  config.maxHorizontalPersistence = maxHorizontalPersistence;

  allocateBuffers();

  if (!buffer || !zBuffer || !deformPhases || !targetDeformPhases || !deformFreqs || !targetDeformFreqs) {
    console.error("Failed to allocate memory");
    cleanupBuffers();
    isInitialized = 0;
    return;
  }

  initializeTrigCache();

  movementX = g_width / 2;
  movementY = g_height / 2;
  targetX = g_width / 2;
  targetY = g_height / 2;
  lastTargetX = g_width / 2;
  lastTargetY = g_height / 2;

  currentBehavior = "BEHAVIOR_EXPLORE";
  behaviorTimer = 0;
  stuckCounter = 0;
  horizontalPersistenceTimer = 0;
  isInitialized = 1;

  console.log('Voidling initialized successfully with config values');
}

export function initializeTrigCache() {
  for (let i = 0; i < CACHE_SIZE; i++) {
    const angle = i * (2.0 * Math.PI) / CACHE_SIZE;
    cachedSin[i] = Math.sin(angle);
    cachedCos[i] = Math.cos(angle);
  }
}

function bounceFromBorder() {
  const centerX = g_width / 2;
  const centerY = g_height / 2;
  const towardsCenterX = centerX - movementX;
  const towardsCenterY = centerY - movementY;

  const randomAngle = (Math.random() * 628) / 100.0;
  targetX = movementX + (Math.cos(randomAngle) * config.baseRadius * 2.0);
  targetY = movementY + (Math.sin(randomAngle) * config.baseRadius * 2.0);

  borderProximityCounter = 0;
  stuckCounter = 0;
}

function forceBorderRecovery() {
  const centerX = g_width / 2;
  const centerY = g_height / 2;

  const inCorner = (movementX <= config.baseRadius * 2 || movementX >= g_width - config.baseRadius * 2) &&
                   (movementY <= config.baseRadius * 2 || movementY >= g_height - config.baseRadius * 2);

  if (inCorner) {
    targetX = centerX + (Math.random() * 20 - 10);
    targetY = centerY + (Math.random() * 20 - 10);
  } else {
    if (movementX <= config.baseRadius || movementX >= g_width - config.baseRadius) {
      targetX = centerX;
      targetY = movementY + (Math.random() * 20 - 10);
    }
    if (movementY <= config.baseRadius || movementY >= g_height - config.baseRadius) {
      targetY = centerY;
      targetX = movementX + (Math.random() * 20 - 10);
    }
  }

  movementX = lerp(movementX, targetX, 0.1);
  movementY = lerp(movementY, targetY, 0.1);

  stuckCounter = 0;
  borderProximityCounter = 0;
}

export function setDimensions(width, height) {
  // Don't clone the entire history, just keep references we need
  const oldComplexity = config.deformComplexity;
  const oldHistoryData = [];
  
  if (deformHistory) {
    for (let i = 0; i < MAX_HISTORY_LENGTH; i++) {
      if (deformHistory[i]) {
        oldHistoryData[i] = new Float32Array(deformHistory[i]);
      }
    }
  }
  
  cleanupBuffers();
  
  g_width = width;
  g_height = height;
  g_max_x_move = g_width - 40;
  g_min_y_move = g_height / 2 - (window.isMobile ? 20 : 7);
  g_max_y_move = g_height / 2 + (window.isMobile ? 20 : 7);

  buffer = new Array(g_width * g_height);
  zBuffer = new Array(g_width * g_height);
  
  if (oldComplexity > 0) {
    deformHistory = new Array(MAX_HISTORY_LENGTH).fill(null);
    for (let i = 0; i < MAX_HISTORY_LENGTH; i++) {
      if (oldHistoryData[i]) {
        deformHistory[i] = new Float32Array(oldComplexity);
        deformHistory[i].set(oldHistoryData[i]);
      }
    }
  }

  movementX = g_width / 2;
  movementY = g_height / 2;
  targetX = g_width / 2;
  targetY = g_height / 2;
  lastTargetX = g_width / 2;
  lastTargetY = g_height / 2;

  if (!buffer || !zBuffer) {
    console.error("Failed to reallocate buffers for new dimensions");
    cleanupBuffers();
    return;
  }
}

export function getBufferSize() {
  return g_width * g_height;
}

export function setBaseRadius(value) {
  if(value < MIN_BASE_RADIUS || value > MAX_BASE_RADIUS) {
    return;
  }
  config.baseRadius = value;
}

export function getBaseRadius() {
  return config.baseRadius;
}

function setAspectRatio(value) {
  config.aspectRatio = value;
}

export function setMoveSpeed(value) {
  config.moveSpeed = value;
}

export function getMoveSpeed() {
  return config.moveSpeed;
}

function setMoveChangeFrequency(value) {
  config.moveChangeFrequency = value;
}

function setMinRotationSpeed(value) {
  config.minRotationSpeed = value;
}

function setMaxRotationSpeed(value) {
  config.maxRotationSpeed = value;
}

function setRotationSmoothness(value) {
  config.rotationSmoothness = value;
}

function setMaxRotationAngle(value) {
  config.maxRotationAngle = value;
}

function setBaseDeformStrength(value) {
  config.baseDeformStrength = value;
}

function setExtraDeformStrength(value) {
  config.extraDeformStrength = value;
}

function setDeformFrequency(value) {
  config.deformFrequency = value;
}

function setDrippiness(value) {
  config.drippiness = value;
}

function setDeformComplexity(value) {
  if (value < 0) value = 0;
  if (value !== config.deformComplexity) {
    const oldComplexity = config.deformComplexity;

    // Signal state preservation to JavaScript before cleanup
    if (typeof window.preserveVoidlingState === 'function') {
      window._tempVoidlingState = window.preserveVoidlingState();
    }

    config.deformComplexity = value;
    cleanupBuffers(); // Ensure complete cleanup
    allocateBuffers();

    // Verify allocation success and handle failures
    if (!buffer || !zBuffer || (value > 0 && (!deformPhases || !targetDeformPhases || !deformFreqs || !targetDeformFreqs))) {
      console.error("Failed to reallocate buffers for new complexity");
      config.deformComplexity = oldComplexity;
      cleanupBuffers();
      allocateBuffers();

      // Signal allocation failure
      console.error('Failed to allocate memory for new deform complexity');
      return;
    }

    // Restore state after successful reallocation
    if (window._tempVoidlingState && typeof window.restoreVoidlingState === 'function') {
      window.restoreVoidlingState(window._tempVoidlingState);
      window._tempVoidlingState = null;
    }
  }
}

function setTimeSpeed(value) {
  config.timeSpeed = value;
}

function setPerspectiveDistance(value) {
  config.perspectiveDistance = value;
}

function setPerspectiveStrength(value) {
  config.perspectiveStrength = value;
}

function setStepSize(value) {
  config.stepSize = value;
}

function setFillDensity(value) {
  config.fillDensity = value;
}

function setMaxMoveDistance(value) {
  config.maxMoveDistance = value;
}

function setBorderSquishFactor(value) {
  config.borderSquishFactor = value;
}

function setMinSkewness(value) {
  config.minSkewness = value;
}

function setMinMoveDistance(value) {
  config.minMoveDistance = value;
}

function setBehaviorChangeTime(value) {
  config.behaviorChangeTime = value;
}

function setBehaviorWeight(value) {
  config.behaviorWeight = value;
}

function setDeformSmoothness(value) {
  config.deformSmoothness = value;
}

function setXBias(value) {
  config.xBias = value;
}

function setYBias(value) {
  config.yBias = value;
}

function setMaxHorizontalPersistence(value) {
  config.maxHorizontalPersistence = value;
}

export function cleanup() {
  cleanupBuffers();
  isInitialized = 0;
}

export function getDeformComplexity() {
  return config.deformComplexity;
}

export function getDeformPhase(index) {
  if (index >= 0 && index < config.deformComplexity && deformPhases !== null) {
    return deformPhases[index];
  }
  return 0.0;
}

export function setDeformPhase(index, value) {
  if (index >= 0 && index < config.deformComplexity && deformPhases !== null) {
    deformPhases[index] = value;
  }
}

export function getDeformFreq(index) {
  if (index >= 0 && index < config.deformComplexity && deformFreqs !== null) {
    return deformFreqs[index];
  }
  return 0.0;
}

export function setDeformFreq(index, value) {
  if (index >= 0 && index < config.deformComplexity && deformFreqs !== null) {
    deformFreqs[index] = value;
  }
}

export function getLastTargetX() {
  return lastTargetX;
}

export function getLastTargetY() {
  return lastTargetY;
}

export function getTargetRotX() {
  return targetRotX;
}

export function getTargetRotY() {
  return targetRotY;
}

export function getTargetRotZ() {
  return targetRotZ;
}

export function getRotationSpeed() {
  return rotationSpeed;
}

export function getBehaviorTimer() {
  return behaviorTimer;
}

export function getStuckCounter() {
  return stuckCounter;
}

export function getHorizontalPersistenceTimer() {
  return horizontalPersistenceTimer;
}

export function getMovementX() {
  return movementX;
}

export function getMovementY() {
  return movementY;
}

export function getTargetX() {
  return targetX;
}

export function getTargetY() {
  return targetY;
}

export function getRotX() {
  return rotX;
}

export function getRotY() {
  return rotY;
}

export function getRotZ() {
  return rotZ;
}

export function getCurrentBehavior() {
  return currentBehavior;
}

export function getCurrentTime() {
  return currentTime;
}

export function setMovementX(value) {
  movementX = value;
}

export function setMovementY(value) {
  movementY = value;
}

export function setTargetX(value) {
  targetX = value;
}

export function setTargetY(value) {
  targetY = value;
}

export function setRotX(value) {
  rotX = value;
}

export function setRotY(value) {
  rotY = value;
}

export function setRotZ(value) {
  rotZ = value;
}

export function setCurrentBehavior(value) {
  currentBehavior = value;
}

export function setCurrentTime(value) {
  currentTime = value;
}

function updateMovementTargets() {
  switch (currentBehavior) {
    case "BEHAVIOR_EXPLORE":
      if (distance(movementX, movementY, targetX, targetY) < 2.0) {
        lastTargetX = targetX;
        lastTargetY = targetY;
        targetX = g_min_x_move + Math.random() * (g_max_x_move - g_min_x_move);
        targetY = g_min_y_move + Math.random() * (g_max_y_move - g_min_y_move);
      }
      break;

    case "BEHAVIOR_TRAVERSE":
      if(window.isMobile) {
        if (distance(movementX, movementY, targetX, targetY) < 1.0) {
          targetX = Math.random() * g_width;
          // Force more dramatic vertical movement
          const currentThird = (movementY / g_height) * 3;  // Determine which third we're in
          if (currentThird < 1) {  // If in top third
            targetY = g_height * (0.6 + (Math.random() * 40 / 80.0));  // Move to bottom half
          } else if (currentThird > 2) {  // If in bottom third
            targetY = g_height * (Math.random() * 40 / 80.0);  // Move to top half
          } else {  // If in middle
            targetY = (Math.random() < 0.5) ? 
                      g_height * (Math.random() * 30 / 80.0) :  // Top portion
                      g_height * (0.7 + (Math.random() * 30 / 80.0));  // Bottom portion
          }
        }
      } else {
        if (distance(movementX, movementY, targetX, targetY) < 2.0) {
          targetX = Math.random() * g_width;
          targetY = Math.random() * g_height;
        }
      }

      break;

    case "BEHAVIOR_SPIRAL":
      if (distance(movementX, movementY, targetX, targetY) < (window.isMobile ? 1.5 : 2.5)) {
        const angleIndex = Math.floor(Math.random() * CACHE_SIZE);
        const radius = 20.0 + Math.random() * 20;
        targetX = g_width / 2 + cachedCos[angleIndex] * radius;
        targetY = g_height / 2 + cachedSin[angleIndex] * radius;
      }
      break;

    case "BEHAVIOR_BOUNCE":
      if (distance(movementX, movementY, targetX, targetY) < 1.5) {
        targetX = lastTargetX;
        targetY = lastTargetY;
        lastTargetX = movementX;
        lastTargetY = movementY;
      }
      break;
  }
}

function updateRotationTargets() {
  let d = distance(movementX, movementY, targetX, targetY);
  if (d < 2.0) {
    targetRotX = (Math.random() * 2.0 * Math.PI) - Math.PI;
    targetRotY = (Math.random() * 2.0 * Math.PI) - Math.PI;
    targetRotZ = (Math.random() * 2.0 * Math.PI) - Math.PI;
    rotationSpeed = config.minRotationSpeed + Math.random() * (config.maxRotationSpeed - config.minRotationSpeed);
  }

  if (frameCounter % 20 === 0 && Math.random() < 0.30) {
    targetRotX = (Math.random() * 2.0 * Math.PI) - Math.PI;
    targetRotY = (Math.random() * 2.0 * Math.PI) - Math.PI;
    targetRotZ = (Math.random() * 2.0 * Math.PI) - Math.PI;
    rotationSpeed = config.minRotationSpeed + Math.random() * (config.maxRotationSpeed - config.minRotationSpeed);
  }
}

export function animationFrame() {
  if (!isInitialized || !buffer || !zBuffer) {
    console.error('Voidling not properly initialized');
    return;
  }

  let radius = config.baseRadius;
  let tx = targetX;
  let ty = targetY;

  frameCounter++;
  currentTime += config.timeSpeed;

  if (frameCounter % 72 === 0) {
    for (let i = 0; i < config.deformComplexity; i++) {
      if (Math.random() < 0.2) {
        targetDeformPhases[i] = Math.random() * 6.28;
        targetDeformFreqs[i] = 1.0 + Math.random() * 5;
      }
    }
  }

  buffer.fill('\u0020');
  zBuffer.fill(-1000.0);

  for (let x = 0; x < g_width; x++) {
    buffer[x] = '$';
    buffer[x + (g_height - 1) * g_width] = '$';
  }
  
  for (let y = 0; y < g_height; y++) {
    buffer[y * g_width] = '$';
    buffer[g_width - 1 + y * g_width] = '$';
  }
  
  behaviorTimer++;
  if (behaviorTimer >= config.behaviorChangeTime) {
    behaviorTimer = 0;
    const r = Math.floor(Math.random() * 10);

    if(window.isMobile) {
      if (r < 6) {           
        currentBehavior = "BEHAVIOR_TRAVERSE";
      } else if (r < 7) {   
          currentBehavior = "BEHAVIOR_BOUNCE";
      } else if (r < 9) {   
          currentBehavior = "BEHAVIOR_EXPLORE";   
      } else {               
          currentBehavior = "BEHAVIOR_SPIRAL";
      }
    } else {
      if (r < 3) {
        currentBehavior = "BEHAVIOR_TRAVERSE";
      } else if (r < 6) {
        currentBehavior = "BEHAVIOR_BOUNCE";
      } else if (r < 8) {
        currentBehavior = "BEHAVIOR_EXPLORE";
      } else {
        currentBehavior = "BEHAVIOR_SPIRAL";
      }
    }


    stuckCounter = 0;
    updateMovementTargets();
    updateRotationTargets();
  }

  if (distance(movementX, movementY, tx, ty) < 2.0) {
    stuckCounter++;
  } else {
    stuckCounter = 0;
  }
  
  updateMovementTargets();
  updateRotationTargets();
  
  movementX = lerp(movementX, tx, config.moveSpeed * config.xBias * (window.isMobile ? 0.7 : 0.3));
  movementY = lerp(movementY, ty, config.moveSpeed * config.yBias);
  enforceObjectBounds(movementX, movementY, radius, g_width, g_height);

  tx = targetX;
  ty = targetY;
  
  if (movementX <= radius * 1.5 || 
      movementX >= g_width - radius * 1.5 || 
      movementY <= radius * 1.5 || 
      movementY >= g_height - radius * 1.5) {
    
    const squishX = calculateBorderSquish(movementX, 0, radius) * 
                    calculateBorderSquish(movementX, g_width, radius);
    const squishY = calculateBorderSquish(movementY, 0, radius) * 
                    calculateBorderSquish(movementY, g_height, radius);
    
    if (squishX < 0.5 || squishY < 0.5) {
      squishCounter++;
      if (squishCounter > 60 && stuckCounter > 100) { 
        forceBorderRecovery();
        squishCounter = 0; 
      }
    } else {
      squishCounter = 0;
    }
  } else {
    squishCounter = 0;
  }
  
  rotX = lerp(rotX, targetRotX, config.rotationSmoothness * rotationSpeed);
  rotY = lerp(rotY, targetRotY, config.rotationSmoothness * rotationSpeed);
  rotZ = lerp(rotZ, targetRotZ, config.rotationSmoothness * rotationSpeed);
  
  for (let i = 0; i < config.deformComplexity; i++) {
    deformPhases[i] = lerp(deformPhases[i], targetDeformPhases[i], config.deformSmoothness);
    deformFreqs[i] = lerp(deformFreqs[i], targetDeformFreqs[i], config.deformSmoothness);
  }
  
  for (let i = 0; i < config.deformComplexity; i++) {
    deformHistory[currentHistoryIndex][i] = deformPhases[i];
  }
  currentHistoryIndex = (currentHistoryIndex + 1) % MAX_HISTORY_LENGTH;
  
  const squishX = calculateBorderSquish(movementX, 0, radius) * 
                  calculateBorderSquish(movementX, g_width, radius) * 
                  config.aspectRatio;
  const squishY = calculateBorderSquish(movementY, 0, radius) * 
                  calculateBorderSquish(movementY, g_height, radius) * 
                  config.aspectRatio;
  
  let volumeCompensation = 1.0 / (squishX * squishY);
  volumeCompensation = Math.max(1.0, Math.min(1.5, volumeCompensation));
  
  const effectiveRadius = calculateEffectiveRadius(radius, volumeCompensation, config.baseDeformStrength);
  const borderDistance = getDistanceToBorder(movementX, movementY, effectiveRadius, g_width, g_height);
  
  if (borderDistance < BORDER_PROXIMITY_THRESHOLD && stuckCounter > 200) {
    borderProximityCounter++;
    if (borderProximityCounter > MAX_BORDER_FRAMES) {
      bounceFromBorder();
    }
  } else {
    borderProximityCounter = 0;
  }
  
  if (stuckCounter > 100) {
    const stuck_r = Math.floor(Math.random() * 10);
    if(window.isMobile) {
      if (stuck_r < 5) {
        currentBehavior = "BEHAVIOR_TRAVERSE";
      } else if (stuck_r < 7) {
          currentBehavior = "BEHAVIOR_SPIRAL";
      } else if (stuck_r < 9) {
          currentBehavior = "BEHAVIOR_BOUNCE";
      } else {
          currentBehavior = "BEHAVIOR_EXPLORE";
      }
    } else {
      if (stuck_r < 3) {
        currentBehavior = "BEHAVIOR_TRAVERSE";
      } else if (stuck_r < 6) {
        currentBehavior = "BEHAVIOR_SPIRAL";
      } else if (stuck_r < 7) {
        currentBehavior = "BEHAVIOR_BOUNCE";
      } else {
        currentBehavior = "BEHAVIOR_EXPLORE";
      }
    }

    stuckCounter = 0;
  }

  for (let phi = 0; phi < 2 * Math.PI; phi += config.stepSize) {
    for (let theta = 0; theta < Math.PI; theta += config.stepSize) {
      const phiIndex = Math.floor((phi * CACHE_SIZE) / (2.0 * Math.PI)) % CACHE_SIZE;
      const thetaIndex = Math.floor((theta * CACHE_SIZE) / (2.0 * Math.PI)) % CACHE_SIZE;
  
      let deformation = 0;
      let borderDeform = 0;
      const borderProximityX = Math.min(movementX, g_width - movementX);
      const borderProximityY = Math.min(movementY, g_height - movementY);
      borderDeform = (1.0 - (Math.min(borderProximityX, borderProximityY) / (radius * 7))) * config.baseDeformStrength;
      borderDeform = Math.max(borderDeform, 0.0);
  
      if (borderProximityX < radius) {
        borderDeform += (1.0 - (borderProximityX / radius)) * config.baseDeformStrength;
      }
      if (borderProximityY < radius) {
        borderDeform += (1.0 - (borderProximityY / radius)) * config.baseDeformStrength;
      }
  
      for (let i = 0; i < config.deformComplexity; i++) {
        const deformIndex = (Math.floor((phi * deformFreqs[i] + currentTime * config.deformFrequency + deformPhases[i]) * 
             CACHE_SIZE / (2.0 * Math.PI)) + CACHE_SIZE) % CACHE_SIZE;
        deformation += cachedSin[deformIndex] * (config.baseDeformStrength / (i + 1));
      }
  
      const dripEffect = config.drippiness * (1 - cachedCos[thetaIndex]) * cachedSin[phiIndex];
      deformation += dripEffect * config.extraDeformStrength;
      deformation += borderDeform * config.baseDeformStrength * 3.5;
  
      const r = radius + deformation;
      
      for (let dr = 0; dr <= r; dr += 0.3) {
        const relativeDepth = dr / r; 
        let x = dr * cachedSin[thetaIndex] * cachedCos[phiIndex] * squishX;
        let y = dr * cachedSin[thetaIndex] * cachedSin[phiIndex] * config.aspectRatio * 1.8 * squishY;
        let z = dr * cachedCos[thetaIndex] * (1.0 + (volumeCompensation - 1.0) * 0.7);
  
        let tempY = y, tempZ = z;
        const rotXIndex = (Math.floor((rotX * CACHE_SIZE) / (2.0 * Math.PI)) + CACHE_SIZE) % CACHE_SIZE;
        y = tempY * cachedCos[rotXIndex] - tempZ * cachedSin[rotXIndex];
        z = tempY * cachedSin[rotXIndex] + tempZ * cachedCos[rotXIndex];
  
        let tempX = x;
        tempZ = z;
        const rotYIndex = (Math.floor((rotY * CACHE_SIZE) / (2.0 * Math.PI)) + CACHE_SIZE) % CACHE_SIZE;
        x = tempX * cachedCos[rotYIndex] + tempZ * cachedSin[rotYIndex];
        z = -tempX * cachedSin[rotYIndex] + tempZ * cachedCos[rotYIndex];
  
        tempX = x;
        tempY = y;
        const rotZIndex = (Math.floor((rotZ * CACHE_SIZE) / (2.0 * Math.PI)) + CACHE_SIZE) % CACHE_SIZE;
        x = tempX * cachedCos[rotZIndex] - tempY * cachedSin[rotZIndex];
        y = tempX * cachedSin[rotZIndex] + tempY * cachedCos[rotZIndex];
  
        const perspective = config.perspectiveDistance / (config.perspectiveDistance + z);
        const px = Math.floor(movementX + x * perspective * config.perspectiveStrength);
        const py = Math.floor(movementY + y * perspective);

 
        if (px >= 1 && px < g_width - 1 && py >= 1 && py < g_height - 1) {
          const normal_x = cachedSin[thetaIndex] * cachedCos[phiIndex];
          const normal_y = cachedSin[thetaIndex] * cachedSin[phiIndex] * config.aspectRatio;
          const normal_z = cachedCos[thetaIndex];
  
          const timeFactor = currentTime * 0.05;
          const behaviorFactor = behaviorTimer / config.behaviorChangeTime;
          let light_x = Math.cos(timeFactor) * (1.0 + 0.3 * Math.sin(rotX));
          let light_y = Math.sin(timeFactor) * (1.0 + 0.3 * Math.sin(rotZ)); 
          let light_z = -0.5 + 0.3 * Math.sin(behaviorFactor * Math.PI) + 0.2 * Math.sin(rotY);
  
          const light_length = Math.sqrt(light_x * light_x + light_y * light_y + light_z * light_z);
          light_x /= light_length;
          light_y /= light_length;
          light_z /= light_length;
  
          let illumination = (normal_x * light_x + normal_y * light_y + normal_z * light_z);
          illumination = (illumination + 1) * 0.5;
  
          const depthFactor = (z + radius) / (2 * radius);
          illumination = illumination * 0.6 + 0.5;
  
          const interiorBrightness = 1.0 - relativeDepth * 0.2;
          illumination *= interiorBrightness;
          illumination *= depthFactor;
  
          if (z > zBuffer[px + py * g_width]) {
            zBuffer[px + py * g_width] = z;
            const chars = ".,-~:;=!*#@$";
            let charIndex = Math.floor(illumination * 11);
            charIndex = charIndex < 0 ? 0 : (charIndex > 10 ? 10 : charIndex);
            buffer[px + py * g_width] = chars[charIndex];
          }
        }
      }
    }
  }
  
  if (frameCounter % 1000 === 0) {
    periodicCleanupDeformBuffers();
    
    // More efficient deform history cleanup
    if (deformHistory) {
      const existingData = deformHistory.map(arr => arr ? new Float32Array(arr) : null);
      cleanupDeformHistory();
      deformHistory = new Array(MAX_HISTORY_LENGTH).fill(null);
      for (let i = 0; i < MAX_HISTORY_LENGTH; i++) {
        if (existingData[i]) {
          deformHistory[i] = existingData[i];
        }
      }
    }
  }
  
  currentTime += config.timeSpeed;

}

export function getBuffer() {
    return buffer.slice();
}