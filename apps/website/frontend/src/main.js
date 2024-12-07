import { connectWebSocket } from "./chaindata.js"; 
import { voidlingConfigSerene } from "./voidling-config-serene.js";
import { voidlingConfigAgitated } from "./voidling-config-agitated.js";
import { voidlingConfigCautious } from "./voidling-config-cautious.js";
import { voidlingConfigCurious } from "./voidling-config-curious.js";
import { voidlingConfigExcited } from "./voidling-config-excited.js";
import { voidlingConfigVanilla } from "./voidling-config-mob.js";

let eventhandlercount = 0;

window.isMobile = window.innerWidth <= 999;
let lastMobileState = window.isMobile;

let moduleInitialized = false;

export function getModuleInitialized() {
  return moduleInitialized;
}

export function setModuleInitialized(value) {
  moduleInitialized = value;
}

function checkMobile() {
  window.isMobile = window.innerWidth <= 999;
  if (lastMobileState !== window.isMobile) {
    lastMobileState = window.isMobile;
    return true;
  }
  return false;
}

checkMobile();

function updateVoidlingSize() {
  document.documentElement.style.setProperty('--voidling-font-size',
    window.isMobile ? '24px' : '12px'
  );

  document.documentElement.style.setProperty('--voidling-header-font-size',
    window.isMobile ? '32px' : '12px'
  );

}

updateVoidlingSize();

checkMobile();
//console.log('Initial mobile state:', window.isMobile);

let emotion = null;
export const assetBoxId = "assetbox";
export const tradeLogId = "tradelogbox";
export const watchlistBoxId = "watchlistbox";

// portfolio box offset compared to the voidling square
const PORTFOLIO_OFFSET_TOP = 1.4;
const PORTFOLIO_OFFSET_LEFT = 1.35;

const PORTFOLIO_OFFSET_TOP_MOBILE = 1.6;
const PORTFOLIO_OFFSET_LEFT_MOBILE = 1.5;

// Configuration constants
const FRAME_INTERVAL = 48;
const FRAME_HISTORY_SIZE = 48;
const CLEANUP_INTERVAL = 200;
const MEMORY_THRESHOLD_MB = 200;
const MAX_POOL_SIZE = 6;
const MEMORY_CHECK_INTERVAL = 1000;
const BUFFER_POOL_CLEANUP_INTERVAL = 100;  // Clean pool every N frames

// Color mapping
const colorMap = {
  '.': 'c57', ',': 'c57', '-': 'c99',
  '~': 'c99', ':': 'c99', ';': 'c105',
  '=': 'c105', '!': 'c105', '*': 'c105',
  '#': 'c166', '@': 'c208', '$': 'c141'
};

let assetBoxHover = false;

export function getEmotion() {
  return emotion;
}

export function setEmotion(em) {
  emotion = em;
}

function manageMouseOver(box) {
  const rect = box.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  if (x > rect.left && x < (rect.left + rect.width) && y > rect.top && y < (rect.top + rect.height)) {
    let pbox = document.getElementById("portfoliobox");
    assetBoxHover = true;
    pbox.style.zIndex = '10';
    return true;
  } else {
    if (assetBoxHover) {
      let pbox = document.getElementById("portfoliobox");
      pbox.style.zIndex = '0';
      assetBoxHover = false;
    }
  }
}

++eventhandlercount;

document.addEventListener('mousemove', (event) => {
    manageMouseOver(document.getElementById(assetBoxId)) ||
    manageMouseOver(document.getElementById(watchlistBoxId)) ||
    manageMouseOver(document.getElementById(tradeLogId))
});


// Circular buffer for frame management
class CircularFrameBuffer {
  constructor(maxSize) {
    this.maxSize = maxSize;
    this.buffer = new Array(maxSize);
    this.head = 0;
    this.tail = 0;
    this.size = 0;
  }

  push(frame) {
    if (this.size === this.maxSize) {
      if (this.buffer[this.tail]) {
        bufferPool.return(this.buffer[this.tail]); // Return old buffer to the pool
      }
      this.tail = (this.tail + 1) % this.maxSize;
      this.size--;
    }

    this.buffer[this.head] = frame;
    this.head = (this.head + 1) % this.maxSize;
    this.size++;
  }

  get(index) {
    if (index >= this.size) return null;
    return this.buffer[(this.tail + index) % this.maxSize];
  }

  clear() {
    while (this.size > 0) {
      if (this.buffer[this.tail]) {
        // Explicitly zero out the buffer before returning it
        this.buffer[this.tail].fill(0);
        bufferPool.return(this.buffer[this.tail]);
        this.buffer[this.tail] = null;  // Clear the reference
      }
      this.tail = (this.tail + 1) % this.maxSize;
      this.size--;
    }
    this.head = 0;
    this.tail = 0;
  }
}

class OptimizedBufferPool {
  constructor(maxPoolSize) {
    this.pools = new Map();
    this.maxPoolSize = maxPoolSize;
    this.totalBuffers = 0;
  }

  get(size) {
    if (!this.pools.has(size)) {
      this.pools.set(size, []);
      //console.log('Created new pool for size:', size);
    }

    const pool = this.pools.get(size);
    if (pool.length > 0) {
      this.totalBuffers--;
      return pool.pop();
    }

    return new Uint8Array(size);
  }

  return(buffer) {
    const size = buffer.length;
    if (!this.pools.has(size)) {
      this.pools.set(size, []);
    }

    const pool = this.pools.get(size);
    // Zero out the buffer before returning it to pool
    buffer.fill(0);

    if (pool.length < this.maxPoolSize && this.totalBuffers < this.maxPoolSize * 2) {
      pool.push(buffer);
      this.totalBuffers++;
    }
  }

  cleanup() {
    for (const [size, pool] of this.pools) {
      while (pool.length > Math.max(2, this.maxPoolSize / 4)) {  // More aggressive cleanup
        const buffer = pool.pop();
        if (buffer) {
          buffer.fill(0);  // Zero out before discarding
        }
        this.totalBuffers--;
      }
    }
  }
}

// Global variables
let lastMemoryCheck = 0;
let isTabVisible = true;
let frameCounter = 0;
let started = false;
let lastFrameTime = 0;
let outputElement;
let bufferArray = new Uint8Array(0);
let resizeTimeout;
let isRunning = true; // Flag to control animation frames

const frameBuffer = new CircularFrameBuffer(FRAME_HISTORY_SIZE);
const bufferPool = new OptimizedBufferPool(MAX_POOL_SIZE);

const stylesheet = document.styleSheets[0];
const styleSheetClasses = new Map();
let originalColors = new Map();
const elementIds = Object.values(colorMap);
let uniqueElementIds = new Set(elementIds);
console.log(uniqueElementIds)

for(const rule of stylesheet.rules) {
  styleSheetClasses.set(rule.selectorText, rule);
  if(uniqueElementIds.has(rule.selectorText.substring(1))) {
    originalColors.set(rule.selectorText, rule)
  }
}

function bufferToHTML(buffer, width) {
  let html = '';

  for (let i = 0; i < buffer.length; i++) {
    const row = Math.floor(i / width);
    const col = i % width;
    let char = String.fromCharCode(buffer[i]);

    const height = Math.floor(buffer.length / width);


    let isBorder = row === 0 || row === (height - 1) || col === 0 || col === width - 1;
    const colorClass = colorMap[char];

    if(!isBorder) {
      html += colorClass ?
      `<span onmouseover="mouseOverCharacter(${i})" id="${i}" class="${colorClass}">${char}</span>` : char;
    } else {
      html += 
      `<span style="visibility:hidden" onmouseover="mouseOverCharacter(${i})" id="${i}" class="${colorClass}">${char}</span>`;      
    }

    if ((i + 1) % width === 0) html += '\n';
  }
  return html;
}

function buffersEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function calculateDimensions() {
  try {
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const charWidth = window.isMobile ? 14 : 7;
    const charHeight = window.isMobile ? 24 : 12;
    const paddingPercent = 0.1;

    const paddingMultiplier = window.isMobile ? 0.4 : 1.15;

    const maxWidth = Math.floor((vw * (1 - paddingPercent * 1.15)) / charWidth);
    const maxHeight = Math.floor((vh * (1 - paddingPercent * paddingMultiplier)) / charHeight);

    return {
      width: Math.max(50, Math.min(maxWidth, window.isMobile ? 200 : 400)),
      height: Math.max(10, Math.min(maxHeight, window.isMobile ? 100 : 200))
    };

  } catch (e) {
    //console.error('Dimension calculation failed:', e);
    return { width: 190, height: 61 };
  }
}

function preserveVoidlingState() {
  // Function body unchanged
  const complexity = Module._get_deform_complexity();
  const deformPhases = [];
  const deformFreqs = [];

  for (let i = 0; i < complexity; i++) {
    deformPhases.push(Module.ccall('get_deform_phase', 'number', ['number'], [i]));
    deformFreqs.push(Module.ccall('get_deform_freq', 'number', ['number'], [i]));
  }

  return {
    position: {
      movementX: Module.ccall('get_movement_x', 'number', [], []),
      movementY: Module.ccall('get_movement_y', 'number', [], []),
      targetX: Module.ccall('get_target_x', 'number', [], []),
      targetY: Module.ccall('get_target_y', 'number', [], []),
      lastTargetX: Module.ccall('get_last_target_x', 'number', [], []),
      lastTargetY: Module.ccall('get_last_target_y', 'number', [], [])
    },
    rotation: {
      rotX: Module.ccall('get_rot_x', 'number', [], []),
      rotY: Module.ccall('get_rot_y', 'number', [], []),
      rotZ: Module.ccall('get_rot_z', 'number', [], []),
      targetRotX: Module.ccall('get_target_rot_x', 'number', [], []),
      targetRotY: Module.ccall('get_target_rot_y', 'number', [], []),
      targetRotZ: Module.ccall('get_target_rot_z', 'number', [], []),
      rotationSpeed: Module.ccall('get_rotation_speed', 'number', [], [])
    },
    behavior: {
      current: Module.ccall('get_current_behavior', 'number', [], []),
      timer: Module.ccall('get_behavior_timer', 'number', [], []),
      stuckCounter: Module.ccall('get_stuck_counter', 'number', [], []),
      horizontalPersistenceTimer: Module.ccall('get_horizontal_persistence_timer', 'number', [], [])
    },
    deformation: {
      complexity: complexity,
      phases: deformPhases,
      frequencies: deformFreqs
    },
    time: Module.ccall('get_current_time', 'number', [], [])
  };
}

function restoreVoidlingState(state) {
  // Function body unchanged
  Module.ccall('set_movement_x', null, ['number'], [state.position.movementX]);
  Module.ccall('set_movement_y', null, ['number'], [state.position.movementY]);
  Module.ccall('set_target_x', null, ['number'], [state.position.targetX]);
  Module.ccall('set_target_y', null, ['number'], [state.position.targetY]);

  Module.ccall('set_rot_x', null, ['number'], [state.rotation.rotX]);
  Module.ccall('set_rot_y', null, ['number'], [state.rotation.rotY]);
  Module.ccall('set_rot_z', null, ['number'], [state.rotation.rotZ]);

  Module.ccall('set_current_behavior', null, ['number'], [state.behavior.current]);
  Module.ccall('set_current_time', null, ['number'], [state.time]);

  if (state.deformation) {
    for (let i = 0; i < state.deformation.complexity; i++) {
      if (i < state.deformation.phases.length) {
        Module.ccall('set_deform_phase', null, ['number', 'number'], [i, state.deformation.phases[i]]);
      }
      if (i < state.deformation.frequencies.length) {
        Module.ccall('set_deform_freq', null, ['number', 'number'], [i, state.deformation.frequencies[i]]);
      }
    }
  }
}

function checkMemoryUsage() {
  if (performance.memory) {
    const memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024);
    if (memoryUsage > MEMORY_THRESHOLD_MB) {
      //console.warn(`High memory usage: ${memoryUsage.toFixed(2)}MB`);
      forceCleanup();
    }
  }
}

export function forceCleanup() {
  frameBuffer.clear();

  // Clear the current buffer array
  if (bufferArray && bufferArray.length > 0) {
    bufferArray.fill(0);
    bufferArray = new Uint8Array(0);
  }

  if (Module && Module._cleanup) {
    const state = preserveVoidlingState();
    Module._cleanup();

    initVoidlingConfig()

    const dims = calculateDimensions();
    Module._set_dimensions(dims.width, dims.height);
    restoreVoidlingState(state);

  }

  bufferPool.cleanup();

  if (outputElement) {
    outputElement.innerHTML = '';
  }

  bufferArray = new Uint8Array(0);
  frameCounter = 0;
  lastFrameTime = 0;

  //console.log('forceCleanup: All buffers cleared, WebAssembly state reset.');
}

function onResize() {
  location.reload();
  const dims = calculateDimensions();
  console.log(dims)
  Module._set_dimensions(dims.width, dims.height);
  started = false;
  if (resizeTimeout) {
    cancelAnimationFrame(resizeTimeout);
  }

  resizeTimeout = requestAnimationFrame(() => {
    try {
      const wasMobile = window.isMobile;
      checkMobile();
      console.log('Resize detected, window width:', window.innerWidth);

      if (wasMobile !== window.isMobile) {
        console.log('Mobile state changed:', window.isMobile);
        updateVoidlingSize();
        forceCleanup();
      }
      const dims = calculateDimensions();
      if (Module && Module._set_dimensions) {
        Module._set_dimensions(dims.width, dims.height);
      }
    } catch (e) {
      console.error('Resize handling failed:', e);
    }
  });
}

++eventhandlercount;
window.addEventListener('resize', onResize);

++eventhandlercount;
document.addEventListener('DOMContentLoaded', function () {
  checkMobile();
  updateVoidlingSize();
  connectWebSocket();
});

function initVoidlingConfig() {
  let cfg = voidlingConfigSerene;
  if (emotion) {
    if (emotion == "EXCITED") {
      cfg = voidlingConfigExcited;
    } else if (emotion == "CURIOUS") {
      cfg = voidlingConfigCurious;
    } else if (emotion == "CAUTIOUS") {
      cfg = voidlingConfigCautious;
    } else if (emotion == "AGITATED") {
      cfg = voidlingConfigAgitated;
    }
  }

  if (window.isMobile) {
    cfg = voidlingConfigVanilla;
  }

  Module._initVoidlingWithConfig(
    cfg.baseRadius,
    cfg.aspectRatio,
    cfg.moveSpeed,
    cfg.moveChangeFrequency,
    cfg.minRotationSpeed,
    cfg.maxRotationSpeed,
    cfg.rotationSmoothness,
    cfg.maxRotationAngle,
    cfg.baseDeformStrength,
    cfg.extraDeformStrength,
    cfg.deformFrequency,
    cfg.drippiness,
    cfg.deformComplexity,
    cfg.timeSpeed,
    cfg.perspectiveDistance,
    cfg.perspectiveStrength,
    cfg.stepSize,
    cfg.fillDensity,
    cfg.maxMoveDistance,
    cfg.borderSquishFactor,
    cfg.minSkewness,
    cfg.minMoveDistance,
    cfg.behaviorChangeTime,
    cfg.behaviorWeight,
    cfg.deformSmoothness,
    cfg.xBias,
    cfg.yBias,
    cfg.maxHorizontalPersistence
  );

}

export var Module = {
  onRuntimeInitialized: function () {
    try {
      outputElement = document.getElementById('output');
      if (!outputElement) throw new Error('Output element not found');

      Module._initialize_trig_cache();

      const initializeVoidling = async () => {

        initVoidlingConfig();

        const dims = calculateDimensions();
        console.log(dims)
        Module._set_dimensions(dims.width, dims.height);

        function displayInnerThoughts() {
          let lastProphecyIndex = -1;
          let elements = [];
          for (const id of uniqueElementIds) {
            elements.push(...document.querySelectorAll("." + id))
          }

          elements.forEach((element, index) => {
            // not sure this check is needed
            if (!element.hasAttribute('data-has-listeners')) {
              element.setAttribute('data-has-listeners', 'true');
/*
              ++eventhandlercount;
              element.addEventListener('mouseover', () => {
                if (element.innerHTML === '$') {
                  return;
                }

                isRunning = false;
                let prophecyIndex = 0;

                // Create an array of valid elements with their positions
                const validElements = elements
                  .map(el => {
                    const rect = el.getBoundingClientRect();
                    return {
                      element: el,
                      top: rect.top,
                      left: rect.left
                    };
                  })
                  .filter(item => {
                    const el = item.element;
                    return el.innerHTML !== '$' &&
                      !el.hasAttribute('data-static') &&
                      !el.parentElement.classList.contains('voidling-world') &&
                      !el.parentElement.classList.contains('voidling-world2');
                  })
                  .sort((a, b) => {
                    if (a.top === b.top) {
                      return a.left - b.left;
                    }
                    return a.top - b.top;
                  });

                // Select random prophecy text
                const prophecyTexts = [prophecies1, prophecies2, prophecies3, prophecies4, prophecies5, prophecies6, prophecies7, prophecies8, prophecies9, prophecies10, prophecies11];
                let randomIndex;
                do {
                  randomIndex = Math.floor(Math.random() * prophecyTexts.length);
                } while (randomIndex === lastProphecyIndex && prophecyTexts.length > 1);
                lastProphecyIndex = randomIndex;
                let prophecies = prophecyTexts[randomIndex];

                // Replace characters in reading order, loop back to start if needed
                validElements.forEach(item => {
                  const el = item.element;
                  el.style.color = "#c7bbe0";
                  el.style.cursor = "pointer";
                  // Loop back to start of prophecy text if we run out of characters
                  el.innerHTML = prophecies.charAt(prophecyIndex % prophecies.length);
                  prophecyIndex++;
                  el.classList.add('hovered');
                });
              });
              ++eventhandlercount;
              element.addEventListener('mouseout', () => {
                if (element.innerHTML !== '$') {
                  isRunning = true;
                  requestAnimationFrame(updateDisplay);
                }

                elements.forEach(el => {
                  el.classList.remove('hovered');
                });
              });*/
            }
          });
        }

        function updateDisplay(timestamp) {

          if (!isRunning) return;
          if (!isTabVisible || timestamp - lastFrameTime < FRAME_INTERVAL) {
            requestAnimationFrame(updateDisplay);
            return;
          }

          const now = Date.now();
          if (now - lastMemoryCheck > MEMORY_CHECK_INTERVAL) {
            checkMemoryUsage();
            lastMemoryCheck = now;
          }

          lastFrameTime = timestamp;

          if (frameCounter % CLEANUP_INTERVAL === 0) {
            forceCleanup();
            if (typeof window.gc === 'function') {
              
              try {
                window.gc();
              } catch (e) {
                //console.log('Manual GC not available');
              }
            }
          }

          try {
            Module._animationFrame();

            const bufferPtr = Module._getBuffer();
            const bufferSize = Module._getBufferSize();

            if (bufferArray.length !== bufferSize) {
              bufferArray = new Uint8Array(Module.HEAPU8.buffer, bufferPtr, bufferSize);
            } else {
              bufferArray.set(Module.HEAPU8.subarray(bufferPtr, bufferPtr + bufferSize));
            }

            const newBuffer = bufferPool.get(bufferSize); // Get a reusable buffer
            newBuffer.set(Module.HEAPU8.subarray(bufferPtr, bufferPtr + bufferSize));

            const lastFrame = frameBuffer.get(0);
            if (!lastFrame || !buffersEqual(newBuffer, lastFrame)) {
              frameBuffer.push(newBuffer); // Push the new frame

              setWorldDimensions(dims.width, Math.floor(newBuffer.length / dims.width));

              const html = bufferToHTML(newBuffer, dims.width);
              if (outputElement.innerHTML !== html) {
                outputElement.innerHTML = html; // Update DOM only if necessary

                let offsetTop = window.isMobile ? PORTFOLIO_OFFSET_TOP_MOBILE : PORTFOLIO_OFFSET_TOP;
                let offsetLeft = window.isMobile ? PORTFOLIO_OFFSET_LEFT_MOBILE : PORTFOLIO_OFFSET_LEFT;
                
                document.getElementById('portfoliobox').style.top = `${outputElement.offsetTop * offsetTop * 1.4}px`;
                document.getElementById('portfoliobox').style.left = `${outputElement.offsetLeft * offsetLeft}px`;
      
                document.getElementById('voidlingbox').style.bottom = `${outputElement.offsetTop * offsetTop * 1.2}px`;
                document.getElementById('voidlingbox').style.width = `${outputElement.offsetWidth * 0.95}px`;
                const outerRect = outputElement.getBoundingClientRect();
                document.getElementById('voidlingbox').style.left = `${outerRect.left}px`;

                document.getElementById('aboutpage').style.top = `${outputElement.offsetTop}px`;
                document.getElementById('aboutpage').style.left = `${outputElement.offsetLeft * offsetLeft}px`;
                document.getElementById('aboutpage').style.maxWidth = `${outputElement.offsetWidth}px`;

                if(!started) {
                  setPosition(outerRect.x,  outerRect.y);
                  started = true;
                }

                let watchBrain = true;

                if (watchBrain) {
                  displayInnerThoughts();
                }
              }
            } else {
              bufferPool.return(newBuffer); // Return unused buffer to pool
            }

            frameCounter++;
            if (frameCounter % BUFFER_POOL_CLEANUP_INTERVAL === 0) {
              bufferPool.cleanup();
            }
          } catch (e) {
            //console.error('Frame update failed:', e);
          }

          requestAnimationFrame(updateDisplay);
        }
        requestAnimationFrame(updateDisplay);
      };

      let a = initializeVoidling().catch(e => {
        //console.error('Initialization failed:', e);
        outputElement.innerHTML = 'Failed to initialize voidling. Please refresh the page.';
        console.log(e);
      }).then(() => {
        //console.log("yooo")
        //console.log(worldHeight)
        //console.log(worldWidth)
      });

    } catch (e) {
      console.log(e)
      console.error('Setup failed:', e);
      outputElement.innerHTML = 'Failed to initialize voidling. Please refresh the page.';
    }

    Module._cleanup = Module.cwrap('cleanup', null, []);
    Module._initVoidlingWithConfig = Module.cwrap('initVoidlingWithConfig', null, [
      'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number',
      'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number',
      'number', 'number', 'number', 'number', 'number', 'number', 'number', 'number',
      'number', 'number', 'number'
    ]);
    Module._set_dimensions = Module.cwrap('set_dimensions', null, ['number', 'number']);
    Module._animationFrame = Module.cwrap('animationFrame', null, []);
    Module._getBuffer = Module.cwrap('getBuffer', 'number', []);
    Module._getBufferSize = Module.cwrap('getBufferSize', 'number', []);
    Module._initialize_trig_cache = Module.cwrap('initialize_trig_cache', null, []);
    Module._get_deform_complexity = Module.cwrap('get_deform_complexity', 'number', []);

    moduleInitialized = true;

  }
};

// Event listener functions
function onVisibilityChange() {
  isTabVisible = !document.hidden;
  if (document.hidden) {
    forceCleanup();
    if (resizeTimeout) {
      cancelAnimationFrame(resizeTimeout);
      resizeTimeout = null;
    }
  }
}
++eventhandlercount;
document.addEventListener('visibilitychange', onVisibilityChange);

function onError(e) {
  if (e.message.includes('wasm')) {
    //console.error('WASM loading failed:', e);
    if (outputElement) {
      outputElement.innerHTML = 'Failed to initialize voidling. Please refresh the page.';
    }
  }
}
++eventhandlercount;
window.addEventListener('pagehide', function () {
  isRunning = false;

  if (Module) {
    if (Module._cleanup) {
      Module._cleanup();
    }
    Module = null;
  }
  frameBuffer.clear();
  bufferPool.cleanup();
  bufferArray = null;
  outputElement = null;

  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('error', onError);

  //console.log('Page unloaded: all resources released.');
});
++eventhandlercount;
window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    //console.log('Page was restored from bfcache');
    window.location.reload();
  }
});


function loadVoidlingScript() {
  console.log("load voidling script!!!")
  const voidlingScript = document.createElement('script');
  voidlingScript.src = window.isMobile ? 'voidling-mob.js' : 'voidling.js';
  voidlingScript.type="module";
  document.body.appendChild(voidlingScript);
}

loadVoidlingScript();
