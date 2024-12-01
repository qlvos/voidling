// voidling-config.js
window.VoidlingConfig = {
    // === BASIC SHAPE AND SIZE ===
    baseRadius: 3.0,
    aspectRatio: 0.9,
    fillDensity: 0.7,
    stepSize: 0.08,

    // === MOVEMENT BEHAVIOR ===
    moveSpeed: 0.015,
    moveChangeFrequency: 3,
    maxMoveDistance: 50.0,
    minMoveDistance: 30.0,
    xBias: 1.0,
    yBias: 6.0,
    maxHorizontalPersistence: 500,

    // === ROTATION AND ORIENTATION ===
    minRotationSpeed: 0.4,
    maxRotationSpeed: 0.8,
    rotationSmoothness: 0.05,
    maxRotationAngle: 3.14,

    // === DEFORMATION AND ANIMATION ===
    baseDeformStrength: 1.2,
    extraDeformStrength: 0.7,
    deformFrequency: 0.5,
    deformComplexity: 4,
    deformSmoothness: 0.08,
    drippiness: 2.5,
    timeSpeed: 0.08,

    // === VISUAL EFFECTS ===
    perspectiveDistance: 40.0,
    perspectiveStrength: 3.5,
    borderSquishFactor: 0.3,
    minSkewness: 0.3,

    // === BEHAVIOR CONTROL ===
    behaviorChangeTime: 150,
    behaviorWeight: 0.9
};

// Optionally, you can log to verify the config is loaded
//console.log('Voidling configuration loaded:', window.VoidlingConfig);