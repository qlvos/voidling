const voidlingConfigVanilla = {
    // === BASIC SHAPE AND SIZE ===
    baseRadius: 3.5,         // Core size of the voidling | Affects border detection and deformation calculations | Higher = bigger creature
    aspectRatio: 0.9,        // Width vs height ratio | Interacts with perspective and squish effects | Higher = wider relative to height
    fillDensity: 0.5,        // How solid the voidling appears | Affects rendering performance | Higher = more solid appearance
    stepSize: 0.07,          // Granularity of render calculations | Affects smoothness and performance | Lower = smoother but slower
 
    // === MOVEMENT BEHAVIOR ===
    moveSpeed: 0.025,         // Base movement velocity | Multiplied by x/y bias | Higher = faster movement
    moveChangeFrequency: 3,  // How often direction changes | Affects stuck detection | Higher = more frequent changes
    maxMoveDistance: 90.0,   // Maximum single movement | Limits wandering range | Higher = can move further
    minMoveDistance: 30.0,   // Minimum single movement | Prevents tiny movements | Higher = forces longer movements
    xBias: 0.1,             // Horizontal movement preference | Multiplies moveSpeed for X axis | Higher = more horizontal movement
    yBias: 6.0,            // Vertical movement preference | Multiplies moveSpeed for Y axis | Higher = more vertical movement
    maxHorizontalPersistence: 50, // Max time moving horizontally | Prevents endless horizontal movement | Higher = can move horizontally longer
 
    // === ROTATION AND ORIENTATION ===
    minRotationSpeed: 0.4,   // Slowest rotation speed | Base for rotation calculations | Higher = faster minimum rotation
    maxRotationSpeed: 0.8,   // Fastest rotation speed | Upper limit for rotation | Higher = faster maximum rotation
    rotationSmoothness: 0.03, // How smooth rotation changes are | Affects animation fluidity | Higher = smoother but less responsive
    maxRotationAngle: 3.14,  // Maximum rotation amount | Limits how far it can turn | Higher = can turn further
 
    // === DEFORMATION AND ANIMATION ===
    baseDeformStrength: 1.2,   // Base shape distortion | Affects overall flexibility | Higher = more base distortion
    extraDeformStrength: 0.7,  // Additional deformation factor | Adds to base deformation | Higher = more extra distortion
    deformFrequency: 0.5,     // How often shape changes | Affects animation speed | Higher = more frequent changes
    deformComplexity: 4,       // Number of deformation waves | Affects detail level | Higher = more complex deformations
    deformSmoothness: 0.08,    // Smoothness of deformations | Affects transition speed | Higher = smoother but slower changes
    drippiness: 4.5,           // Downward deformation tendency | Affects bottom shape | Higher = more droopy appearance
    timeSpeed: 0.06,           // Animation speed multiplier | Affects all time-based changes | Higher = faster animations
 
    // === VISUAL EFFECTS ===
    perspectiveDistance: 30.0,  // Depth perception strength | Affects 3D appearance | Higher = more pronounced perspective
    perspectiveStrength: 2.5,   // Perspective effect intensity | Multiplies perspective calculations | Higher = stronger perspective
    borderSquishFactor: 0.3,    // Border deformation amount | Affects shape near borders | Higher = more squishing at borders
    minSkewness: 0.3,           // Minimum shape distortion | Sets base asymmetry | Higher = more base asymmetry
 
    // === BEHAVIOR CONTROL ===
    behaviorChangeTime: 50,    // Time between behavior switches | Controls behavior persistence | Higher = behaviors last longer
    behaviorWeight: 1.2         // Influence of behavior on movement | Affects decision strength | Higher = more committed to behaviors
 };