const voidlingConfigCurious = {
    // === BASIC SHAPE AND SIZE ===
    baseRadius: 6.0,        // Core size of the voidling | Affects border detection and deformation calculations | Higher = bigger creature
    aspectRatio: 0.9,       // Width vs height ratio | Interacts with perspective and squish effects | Higher = wider relative to height
    fillDensity: 0.5,       // How solid the voidling appears | Affects rendering performance | Higher = more solid appearance
    stepSize: 0.04,         // Granularity of render calculations | Affects smoothness and performance | Lower = smoother but slower
 
    // === MOVEMENT BEHAVIOR ===
    moveSpeed: 0.04,        // Base movement velocity | Multiplied by x/y bias | Higher = faster movement
    moveChangeFrequency: 6, // How often direction changes | Affects stuck detection | Higher = more frequent changes
    maxMoveDistance: 170.0, // Maximum single movement | Limits wandering range | Higher = can move further
    minMoveDistance: 70.0,  // Minimum single movement | Prevents tiny movements | Higher = forces longer movements
    xBias: 7.5,            // Horizontal movement preference | Multiplies moveSpeed for X axis | Higher = more horizontal movement
    yBias: 1.0,            // Vertical movement preference | Multiplies moveSpeed for Y axis | Higher = more vertical movement
    maxHorizontalPersistence: 2500, // Max time moving horizontally | Prevents endless horizontal movement | Higher = can move horizontally longer
 
    // === ROTATION AND ORIENTATION ===
    minRotationSpeed: 0.4,  // Slowest rotation speed | Base for rotation calculations | Higher = faster minimum rotation
    maxRotationSpeed: 0.9,  // Fastest rotation speed | Upper limit for rotation | Higher = faster maximum rotation
    rotationSmoothness: 0.05, // How smooth rotation changes are | Affects animation fluidity | Higher = smoother but less responsive
    maxRotationAngle: 3.14, // Maximum rotation amount | Limits how far it can turn | Higher = can turn further
 
    // === DEFORMATION AND ANIMATION ===
    baseDeformStrength: 0.9,  // Base shape distortion | Affects overall flexibility | Higher = more base distortion
    extraDeformStrength: 0.5, // Additional deformation factor | Adds to base deformation | Higher = more extra distortion
    deformFrequency: 0.5,    // How often shape changes | Affects animation speed | Higher = more frequent changes
    deformComplexity: 9,      // Number of deformation waves | Affects detail level | Higher = more complex deformations
    deformSmoothness: 0.09,   // Smoothness of deformations | Affects transition speed | Higher = smoother but slower changes
    drippiness: 5.5,          // Downward deformation tendency | Affects bottom shape | Higher = more droopy appearance
    timeSpeed: 0.08,          // Animation speed multiplier | Affects all time-based changes | Higher = faster animations
 
    // === VISUAL EFFECTS ===
    perspectiveDistance: 50.0,  // Depth perception strength | Affects 3D appearance | Higher = more pronounced perspective
    perspectiveStrength: 3.5,   // Perspective effect intensity | Multiplies perspective calculations | Higher = stronger perspective
    borderSquishFactor: 0.15,    // Border deformation amount | Affects shape near borders | Higher = more squishing at borders
    minSkewness: 0.5,           // Minimum shape distortion | Sets base asymmetry | Higher = more base asymmetry
 
    // === BEHAVIOR CONTROL ===
    behaviorChangeTime: 150,    // Time between behavior switches | Controls behavior persistence | Higher = behaviors last longer
    behaviorWeight: 0.9         // Influence of behavior on movement | Affects decision strength | Higher = more committed to behaviors
 };