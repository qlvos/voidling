// voidling-config.js
window.addEventListener('DOMContentLoaded', function() {
    // Wait for WASM module to initialize
    const checkModule = setInterval(() => {
        if (Module && Module._set_base_radius) {
            clearInterval(checkModule);
            
// === BASIC SHAPE AND SIZE ===
Module._set_base_radius(5.0);          // Base size of creature - higher = bigger
Module._set_aspect_ratio(0.9);         // Width/height ratio - higher = wider, lower = taller
Module._set_fill_density(0.8);         // How solid the creature appears - higher = more solid/opaque
Module._set_step_size(0.06);          // Rendering detail - lower = more detailed but slower

// === MOVEMENT BEHAVIOR ===
Module._set_move_speed(0.015);          // Movement velocity - higher = faster, jerkier; lower = smoother
Module._set_move_change_frequency(6);   // How often direction changes - higher = more erratic
Module._set_max_move_distance(90.0);   // Maximum travel distance - affects roaming range
Module._set_min_move_distance(20.0);    // Minimum travel distance - affects local exploration
Module._set_x_bias(4.0);               // Horizontal movement preference - high values can break spiral patterns
Module._set_y_bias(1.0);               // Vertical movement preference - balance with x_bias for smooth spirals
Module._set_max_horizontal_persistence(1000); // How long it maintains horizontal direction - higher = more side-to-side

// === ROTATION AND ORIENTATION ===
Module._set_min_rotation_speed(1.4);    // Slowest rotation speed - affects smoothness of movement
Module._set_max_rotation_speed(3.2);    // Fastest rotation speed - high values can make it jerky
Module._set_rotation_smoothness(0.01);  // Rotation transition smoothness - lower = smoother
Module._set_max_rotation_angle(3.14);   // Maximum rotation (6.28 = 2π) - full rotation range

// === DEFORMATION AND ANIMATION ===
Module._set_base_deform_strength(4.5);  // Primary deformation amount - higher = more blob-like
Module._set_extra_deform_strength(1.7); // Secondary deformation - adds complexity to movement
Module._set_deform_frequency(1.5);      // How often shape changes - higher = more rapid morphing
Module._set_deform_complexity(15);       // Number of deformation waves - higher = more organic looking
Module._set_deform_smoothness(0.11);    // Smoothness of shape changes - lower = smoother transitions
Module._set_drippiness(4.0);           // Flowing/dripping effect - higher = more liquid-like
Module._set_time_speed(0.08);          // Overall animation speed - affects all time-based animations

// === VISUAL EFFECTS ===
Module._set_perspective_distance(25.0); // 3D depth effect - higher = more flattened
Module._set_perspective_strength(6.0);  // Intensity of 3D effect - higher = more pronounced depth
Module._set_border_squish_factor(0.25); // How much it deforms near borders - higher = more squishing
Module._set_min_skewness(0.35);        // Minimum shape distortion - affects overall form stability

// === BEHAVIOR CONTROL ===
Module._set_behavior_change_time(80);  // Frames before behavior change - higher = more persistent behaviors
Module._set_behavior_weight(1.2);       // Strength of behavior influence - higher = more pronounced behaviors
        }
    }, 100);
});