
These are the variables exposed by the wasm, which can be used to modify the voidlings behavior:
```
var _initVoidlingWithConfig
var _initialize_trig_cache
var _set_dimensions
var _getBufferSize
var _set_base_radius
var _set_aspect_ratio
var _set_move_speed
var _set_move_change_frequency
var _set_min_rotation_speed = Module["_set_min_rotation_speed"] = a0 => (_set_min_rotation_speed = Module["_set_min_rotation_speed"] = wasmExports["set_min_rotation_speed"])(a0);
var _set_max_rotation_speed = Module["_set_max_rotation_speed"] = a0 => (_set_max_rotation_speed = Module["_set_max_rotation_speed"] = wasmExports["set_max_rotation_speed"])(a0);
var _set_rotation_smoothness = Module["_set_rotation_smoothness"] = a0 => (_set_rotation_smoothness = Module["_set_rotation_smoothness"] = wasmExports["set_rotation_smoothness"])(a0);
var _set_max_rotation_angle = Module["_set_max_rotation_angle"] = a0 => (_set_max_rotation_angle = Module["_set_max_rotation_angle"] = wasmExports["set_max_rotation_angle"])(a0);
var _set_base_deform_strength = Module["_set_base_deform_strength"] = a0 => (_set_base_deform_strength = Module["_set_base_deform_strength"] = wasmExports["set_base_deform_strength"])(a0);
var _set_extra_deform_strength = Module["_set_extra_deform_strength"] = a0 => (_set_extra_deform_strength = Module["_set_extra_deform_strength"] = wasmExports["set_extra_deform_strength"])(a0);
var _set_deform_frequency = Module["_set_deform_frequency"] = a0 => (_set_deform_frequency = Module["_set_deform_frequency"] = wasmExports["set_deform_frequency"])(a0);
var _set_drippiness = Module["_set_drippiness"] = a0 => (_set_drippiness = Module["_set_drippiness"] = wasmExports["set_drippiness"])(a0);
var _set_deform_complexity = Module["_set_deform_complexity"] = a0 => (_set_deform_complexity = Module["_set_deform_complexity"] = wasmExports["set_deform_complexity"])(a0);
var _set_time_speed = Module["_set_time_speed"] = a0 => (_set_time_speed = Module["_set_time_speed"] = wasmExports["set_time_speed"])(a0);
var _set_perspective_distance = Module["_set_perspective_distance"] = a0 => (_set_perspective_distance = Module["_set_perspective_distance"] = wasmExports["set_perspective_distance"])(a0);
var _set_perspective_strength = Module["_set_perspective_strength"] = a0 => (_set_perspective_strength = Module["_set_perspective_strength"] = wasmExports["set_perspective_strength"])(a0);
var _set_step_size = Module["_set_step_size"] = a0 => (_set_step_size = Module["_set_step_size"] = wasmExports["set_step_size"])(a0);
var _set_fill_density = Module["_set_fill_density"] = a0 => (_set_fill_density = Module["_set_fill_density"] = wasmExports["set_fill_density"])(a0);
var _set_max_move_distance = Module["_set_max_move_distance"] = a0 => (_set_max_move_distance = Module["_set_max_move_distance"] = wasmExports["set_max_move_distance"])(a0);
var _set_border_squish_factor = Module["_set_border_squish_factor"] = a0 => (_set_border_squish_factor = Module["_set_border_squish_factor"] = wasmExports["set_border_squish_factor"])(a0);
var _set_min_skewness = Module["_set_min_skewness"] = a0 => (_set_min_skewness = Module["_set_min_skewness"] = wasmExports["set_min_skewness"])(a0);
var _set_min_move_distance = Module["_set_min_move_distance"] = a0 => (_set_min_move_distance = Module["_set_min_move_distance"] = wasmExports["set_min_move_distance"])(a0);
var _set_behavior_change_time = Module["_set_behavior_change_time"] = a0 => (_set_behavior_change_time = Module["_set_behavior_change_time"] = wasmExports["set_behavior_change_time"])(a0);
var _set_behavior_weight = Module["_set_behavior_weight"] = a0 => (_set_behavior_weight = Module["_set_behavior_weight"] = wasmExports["set_behavior_weight"])(a0);
var _set_deform_smoothness = Module["_set_deform_smoothness"] = a0 => (_set_deform_smoothness = Module["_set_deform_smoothness"] = wasmExports["set_deform_smoothness"])(a0);
var _set_x_bias = Module["_set_x_bias"] = a0 => (_set_x_bias = Module["_set_x_bias"] = wasmExports["set_x_bias"])(a0);
var _set_y_bias = Module["_set_y_bias"] = a0 => (_set_y_bias = Module["_set_y_bias"] = wasmExports["set_y_bias"])(a0);
var _set_max_horizontal_persistence = Module["_set_max_horizontal_persistence"] = a0 => (_set_max_horizontal_persistence = Module["_set_max_horizontal_persistence"] = wasmExports["set_max_horizontal_persistence"])(a0);
var _cleanup = Module["_cleanup"] = () => (_cleanup = Module["_cleanup"] = wasmExports["cleanup"])();
var _get_deform_complexity = Module["_get_deform_complexity"] = () => (_get_deform_complexity = Module["_get_deform_complexity"] = wasmExports["get_deform_complexity"])();
var _get_deform_phase = Module["_get_deform_phase"] = a0 => (_get_deform_phase = Module["_get_deform_phase"] = wasmExports["get_deform_phase"])(a0);
var _set_deform_phase = Module["_set_deform_phase"] = (a0, a1) => (_set_deform_phase = Module["_set_deform_phase"] = wasmExports["set_deform_phase"])(a0, a1);
var _get_deform_freq = Module["_get_deform_freq"] = a0 => (_get_deform_freq = Module["_get_deform_freq"] = wasmExports["get_deform_freq"])(a0);
var _set_deform_freq = Module["_set_deform_freq"] = (a0, a1) => (_set_deform_freq = Module["_set_deform_freq"] = wasmExports["set_deform_freq"])(a0, a1);
var _get_last_target_x = Module["_get_last_target_x"] = () => (_get_last_target_x = Module["_get_last_target_x"] = wasmExports["get_last_target_x"])();
var _get_last_target_y = Module["_get_last_target_y"] = () => (_get_last_target_y = Module["_get_last_target_y"] = wasmExports["get_last_target_y"])();
var _get_target_rot_x = Module["_get_target_rot_x"] = () => (_get_target_rot_x = Module["_get_target_rot_x"] = wasmExports["get_target_rot_x"])();
var _get_target_rot_y = Module["_get_target_rot_y"] = () => (_get_target_rot_y = Module["_get_target_rot_y"] = wasmExports["get_target_rot_y"])();
var _get_target_rot_z = Module["_get_target_rot_z"] = () => (_get_target_rot_z = Module["_get_target_rot_z"] = wasmExports["get_target_rot_z"])();
var _get_rotation_speed = Module["_get_rotation_speed"] = () => (_get_rotation_speed = Module["_get_rotation_speed"] = wasmExports["get_rotation_speed"])();
var _get_behavior_timer = Module["_get_behavior_timer"] = () => (_get_behavior_timer = Module["_get_behavior_timer"] = wasmExports["get_behavior_timer"])();
var _get_stuck_counter = Module["_get_stuck_counter"] = () => (_get_stuck_counter = Module["_get_stuck_counter"] = wasmExports["get_stuck_counter"])();
var _get_horizontal_persistence_timer = Module["_get_horizontal_persistence_timer"] = () => (_get_horizontal_persistence_timer = Module["_get_horizontal_persistence_timer"] = wasmExports["get_horizontal_persistence_timer"])();
var _get_movement_x = Module["_get_movement_x"] = () => (_get_movement_x = Module["_get_movement_x"] = wasmExports["get_movement_x"])();
var _get_movement_y = Module["_get_movement_y"] = () => (_get_movement_y = Module["_get_movement_y"] = wasmExports["get_movement_y"])();
var _get_target_x = Module["_get_target_x"] = () => (_get_target_x = Module["_get_target_x"] = wasmExports["get_target_x"])();
var _get_target_y = Module["_get_target_y"] = () => (_get_target_y = Module["_get_target_y"] = wasmExports["get_target_y"])();
var _get_rot_x = Module["_get_rot_x"] = () => (_get_rot_x = Module["_get_rot_x"] = wasmExports["get_rot_x"])();
var _get_rot_y = Module["_get_rot_y"] = () => (_get_rot_y = Module["_get_rot_y"] = wasmExports["get_rot_y"])();
var _get_rot_z = Module["_get_rot_z"] = () => (_get_rot_z = Module["_get_rot_z"] = wasmExports["get_rot_z"])();
var _get_current_behavior = Module["_get_current_behavior"] = () => (_get_current_behavior = Module["_get_current_behavior"] = wasmExports["get_current_behavior"])();
var _get_current_time = Module["_get_current_time"] = () => (_get_current_time = Module["_get_current_time"] = wasmExports["get_current_time"])();
var _set_movement_x = Module["_set_movement_x"] = a0 => (_set_movement_x = Module["_set_movement_x"] = wasmExports["set_movement_x"])(a0);
var _set_movement_y = Module["_set_movement_y"] = a0 => (_set_movement_y = Module["_set_movement_y"] = wasmExports["set_movement_y"])(a0);
var _set_target_x = Module["_set_target_x"] = a0 => (_set_target_x = Module["_set_target_x"] = wasmExports["set_target_x"])(a0);
var _set_target_y = Module["_set_target_y"] = a0 => (_set_target_y = Module["_set_target_y"] = wasmExports["set_target_y"])(a0);
var _set_rot_x = Module["_set_rot_x"] = a0 => (_set_rot_x = Module["_set_rot_x"] = wasmExports["set_rot_x"])(a0);
var _set_rot_y = Module["_set_rot_y"] = a0 => (_set_rot_y = Module["_set_rot_y"] = wasmExports["set_rot_y"])(a0);
var _set_rot_z = Module["_set_rot_z"] = a0 => (_set_rot_z = Module["_set_rot_z"] = wasmExports["set_rot_z"])(a0);
var _set_current_behavior = Module["_set_current_behavior"] = a0 => (_set_current_behavior = Module["_set_current_behavior"] = wasmExports["set_current_behavior"])(a0);
var _set_current_time = Module["_set_current_time"] = a0 => (_set_current_time = Module["_set_current_time"] = wasmExports["set_current_time"])(a0);
var _animationFrame = Module["_animationFrame"] = () => (_animationFrame = Module["_animationFrame"] = wasmExports["animationFrame"])();
var _getBuffer = Module["_getBuffer"] = () => (_getBuffer = Module["_getBuffer"] = wasmExports["getBuffer"])();
var ___original_main = Module["___original_main"] = () => (___original_main = Module["___original_main"] = wasmExports["__original_main"])();
var _main = Module["_main"] = (a0, a1) => (_main = Module["_main"] = wasmExports["main"])(a0, a1);
var __emscripten_stack_restore = a0 => (__emscripten_stack_restore = wasmExports["_emscripten_stack_restore"])(a0);
var __emscripten_stack_alloc = a0 => (__emscripten_stack_alloc = wasmExports["_emscripten_stack_alloc"])(a0);
var _emscripten_stack_get_current = () => (_emscripten_stack_get_current = wasmExports["emscripten_stack_get_current"])();
var dynCall_jiji = Module["dynCall_jiji"] = (a0, a1, a2, a3, a4) => (dynCall_jiji = Module["dynCall_jiji"] = wasmExports["dynCall_jiji"])(a0, a1, a2, a3, a4);
```