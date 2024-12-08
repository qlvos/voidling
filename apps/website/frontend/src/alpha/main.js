import { connectWebSocket } from "./chaindata.js"; 
import { voidlingConfigSerene } from "./voidling-config-serene.js";
import { voidlingConfigAgitated } from "./voidling-config-agitated.js";
import { voidlingConfigCautious } from "./voidling-config-cautious.js";
import { voidlingConfigCurious } from "./voidling-config-curious.js";
import { voidlingConfigExcited } from "./voidling-config-excited.js";
import { voidlingConfigVanilla } from "./voidling-config-mob.js";
import { prophecies1, prophecies2, prophecies3, prophecies4, prophecies5, prophecies6, prophecies7, prophecies8, prophecies9, prophecies10, prophecies11 } from "../prophecies.js";
import OptimizedBufferPool from './optimizedbufferpool.js';
import { initializeTrigCache, animationFrame, initVoidlingWithConfig, setDeformFreq, setDeformPhase, setCurrentTime, setTargetX, setTargetY, setMovementX, setMovementY, setRotX, setRotY, setRotZ, getHorizontalPersistenceTimer, getStuckCounter, getBehaviorTimer, getCurrentBehavior, getCurrentTime, getLastTargetX, 
  getLastTargetY, getRotationSpeed, getTargetRotX, getTargetRotY, getTargetRotZ, getRotX, getRotY, 
  getRotZ, getTargetX, getTargetY, getMovementX, getMovementY, setDimensions, getDeformComplexity, 
  getDeformFreq, cleanup, getBuffer, getBufferSize, getDeformPhase, 
  setCurrentBehavior} from "./voidlingdrawer.js";

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

  get length() {
    return this.size; // Use the `size` property for the length
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
        this.buffer[this.tail].fill(0); // Zero out
        bufferPool.return(this.buffer[this.tail]); // Return to pool
      }
      this.buffer[this.tail] = null; // Remove reference
      this.tail = (this.tail + 1) % this.maxSize;
      this.size--;
    }
    this.buffer.fill(null); // Clear all
    this.head = 0;
    this.tail = 0;
    console.log("FrameBuffer cleared.");
  }
}

// Global variables
let lastMemoryCheck = 0;
let isTabVisible = true;
let frameCounter = 0;
let started = false;
let lastFrameTime = 0;
let outputElement;
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
    let char = buffer[i];
    if(char == 0 || char =='0') {
      let i = 1;
      //console.log("zero !")

    }
    const height = Math.floor(buffer.length / width);
    let isBorder = row === 0 || row === (height - 1) || col === 0 || col === width - 1;
    const colorClass = colorMap[char];

   // if(!colorClass) {
   //   console.log(buffer)
   //   console.log("undefined! " + char)
   // }

    if(!isBorder) {
      html += colorClass ?
      `<span onmouseover="mouseOverCharacter(${i})" id="${i}" class="${colorClass}">${char}</span>` : char;
    } else {
      //console.log("no border:[" + char + "]")
      html += 
      `<span style="visibility:hidden" onmouseover="mouseOverCharacter(${i})" id="${i}" class="${colorClass}">${char}</span>`;      
    }

    if ((i + 1) % width === 0) html += '\n';
  }

  if(html[0] == 0) {
    console.log("html 0 !")
  }

  return html;
}

function buffersEqual(a, b) {
  if (!a || !b || a.length !== b.length) {
    console.log("not equal 1!")
    return false
  };
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) { 
      console.log("not equal 2!")
      return false
    };
  }
  console.log("equal!")
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

function resetDimensions() {
  const dims = calculateDimensions();
  setDimensions(dims.width, dims.height);
  console.log("Dimensions reset to:", dims);
}


function preserveVoidlingState() {
  // Function body unchanged
  const complexity = getDeformComplexity()
  const deformPhases = [];
  const deformFreqs = [];

  for (let i = 0; i < complexity; i++) {
    deformPhases.push(getDeformPhase(i));
    deformFreqs.push(getDeformFreq(i));
  }

  return {
    position: {
      movementX: getMovementX(),
      movementY: getMovementY(),
      targetX: getTargetX(),
      targetY: getTargetY(),
      lastTargetX: getLastTargetX(),
      lastTargetY: getLastTargetY()
    },
    rotation: {
      rotX: getRotX(),
      rotY: getRotY(),
      rotZ: getRotZ(),
      targetRotX: getTargetRotX(),
      targetRotY: getTargetRotY(),
      targetRotZ: getTargetRotZ(),
      rotationSpeed: getRotationSpeed()
    },
    behavior: {
      current: getCurrentBehavior(),
      timer: getBehaviorTimer(),
      stuckCounter: getStuckCounter(),
      horizontalPersistenceTimer: getHorizontalPersistenceTimer()
    },
    deformation: {
      complexity: complexity,
      phases: deformPhases,
      frequencies: deformFreqs
    },
    time: getCurrentTime()
  };
}

function restoreVoidlingState(state) {
  // Function body unchanged
  setMovementX(state.position.movementX);
  setMovementY(state.position.movementY);
  setTargetX(state.position.targetX);
  setTargetY(state.position.targetY);

  setRotX(state.rotation.rotX);
  setRotY(state.rotation.rotY);
  setRotZ(state.rotation.rotZ);

  setCurrentBehavior(state.behavior.current)
  setCurrentTime(state.time);


  if (state.deformation) {
    for (let i = 0; i < state.deformation.complexity; i++) {
      if (i < state.deformation.phases.length) {
        setDeformPhase(i, state.deformation.phases[i]);
      }
      if (i < state.deformation.frequencies.length) {
        setDeformFreq(i, state.deformation.frequencies[i]);
      }
    }
  }
}

function checkMemoryUsage() {
  return;
  if (performance.memory) {
    const jsHeapSize = performance.memory.usedJSHeapSize / (1024 * 1024);
    const totalHeapSize = performance.memory.totalJSHeapSize / (1024 * 1024);
    console.log(`Memory usage: JS Heap ${jsHeapSize.toFixed(2)}MB / Total Heap ${totalHeapSize.toFixed(2)}MB`);

    if (jsHeapSize > MEMORY_THRESHOLD_MB) {
      console.warn(`High memory usage: ${jsHeapSize.toFixed(2)}MB`);
      //forceCleanup();
    }
  }


    
    const bufferSize = getBufferSize();
    console.log(`Buffer size: ${(bufferSize / (1024 * 1024)).toFixed(2)}MB`);

    if (bufferSize > MEMORY_THRESHOLD_MB * 1024 * 1024) {
      console.warn(`Excessive memory usage: ${bufferSize} bytes`);
      //forceCleanup();
    }
  

  console.log("Memory check complete.");
}


export function forceCleanup() {
  try {
    console.log('forceCleanup: Starting cleanup process...');

    // Clear frame buffer and reset state
    frameBuffer.clear();

      const state = preserveVoidlingState(); // Save the current voidling state
      cleanup();

      if (moduleInitialized) {
        clearDeformHistory(); // Reset deform history
        resetDimensions();    // Recalculate and apply dimensions
      }

      initVoidlingConfig();       // Reinitialize configuration
      restoreVoidlingState(state); // Restore the saved voidling state
    

    // Clean up buffer pools
    bufferPool.cleanup();

    // Clear output element content if it exists
    if (outputElement) {
      outputElement.innerHTML = '';
    }

    // Reset other global variables
    frameCounter = 0;
    lastFrameTime = 0;

    console.log('forceCleanup: All buffers cleared, WebAssembly state reset.');

    // Restart the animation loop
    startAnimation();
  } catch (e) {
    console.error('forceCleanup: An error occurred during cleanup:', e);
  }
}

function onResize() {
  location.reload();
  const dims = calculateDimensions();
  console.log(dims)
  setDimensions(dims.width, dims.height);
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
      setDimensions(dims.width, dims.height);
      
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
  onRuntimeInitialized();
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

  initVoidlingWithConfig(
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


  function onRuntimeInitialized () {
    try {
      outputElement = document.getElementById('output');
      if (!outputElement) throw new Error('Output element not found');

      initializeTrigCache();

      const initializeVoidling = async () => {
        initVoidlingConfig();
      
        const dims = calculateDimensions();
        console.log(dims);
        setDimensions(dims.width, dims.height);
      
        // Animation logic, moved globally for proper reuse
        window.updateDisplay = function (timestamp) {
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
            console.log("forceCleanup!")
            forceCleanup();
            if (typeof window.gc === 'function') {
              try {
                console.log("window.gc!")
                window.gc();
              } catch (e) {
                //console.log('Manual GC not available');
              }
            }
          }
      
          try {
            animationFrame();
            const bufferPtr = getBuffer();
            const bufferSize = getBufferSize();
      
            
      /*
            const newBuffer = bufferPool.get(bufferSize);
            newBuffer.set(Module.HEAPU8.subarray(bufferPtr, bufferPtr + bufferSize));
            */
      
            const lastFrame = frameBuffer.get(0);
            //console.log("xxx")
            //console.log(frameBuffer);
           // if (!lastFrame || !buffersEqual(newBuffer, lastFrame)) {
              frameBuffer.push(bufferPtr);
      
              setWorldDimensions(dims.width, Math.floor(bufferPtr.length / dims.width));

              if(bufferPtr[0] == 0) {
                //console.log("ffs!")
              }
              const html = bufferToHTML(bufferPtr, dims.width);

              if (outputElement.innerHTML !== html) {
                if(html[0] == 0) {
                  console.log("zero !")
                }
                outputElement.innerHTML = html;
      
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
      
                if (!started) {
                  setPosition(outerRect.x, outerRect.y);
                  started = true;
                }
      
                let watchBrain = true;
                if (watchBrain) {
                  displayInnerThoughts();
                }
              }
           // } else {
           //   bufferPool.return(newBuffer);
           // }
      
            frameCounter++;
            if (frameCounter % BUFFER_POOL_CLEANUP_INTERVAL === 0) {
              console.log("XEAYIII")
              bufferPool.cleanup();
            }
          } catch (e) {
            console.error('Frame update failed:', e);
          }
      
          requestAnimationFrame(updateDisplay);
        };
      
        requestAnimationFrame(updateDisplay); // Start animation loop
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
    moduleInitialized = true;

  }


function clearDeformHistory() {
  const complexity = getDeformComplexity();

  if (complexity <= 0) return;

  for (let i = 0; i < complexity; i++) {
    const currentPhase = getDeformPhase(i);
    
    const currentFreq = getDeformFreq(i);

    if (Math.abs(currentPhase) > 0.001) {
      setDeformPhase(i, 0.0);
    }
    if (Math.abs(currentFreq - 1.0) > 0.001) {
      setDeformFreq(i, 1.0);
    }
  }
  console.log("Deform history cleared.");
}


export function startAnimation() {
  console.log("start!")
  function updateDisplay(timestamp) {
    if (!isRunning) return;
  
    if (!isTabVisible || timestamp - lastFrameTime < FRAME_INTERVAL) {
      // should this not rather NOT call requestAnimationFrame here !?
      console.log("HEyyy")
      return;
    }
  
    const now = Date.now();
    if (now - lastMemoryCheck > MEMORY_CHECK_INTERVAL) {
      checkMemoryUsage(); // Check and log memory usage
      lastMemoryCheck = now;
    }
  
    lastFrameTime = timestamp;
  
    try {

      animationFrame();
      const bufferPtr = getBuffer();

      if(bufferPtr[0] == 0) {
        console.log("ffs z0")
      }

      const bufferSize = getBufferSize();
  
      if (!bufferPtr || bufferSize <= 0) {
        console.error("Buffer pointer or size is invalid.");
        return;
      }
    
//      const newBuffer = bufferPool.get(bufferSize);
//      newBuffer.splice(0, bufferSize, ...bufferPtr);
  
      const lastFrame = frameBuffer.length > 0 ? frameBuffer.get(0) : null;
  
     // if (!lastFrame || !buffersEqual(newBuffer, lastFrame)) {
//        frameBuffer.push(newBuffer);
  
        const dims = calculateDimensions();
        const worldHeight = Math.floor(bufferPtr.length / dims.width);
        setWorldDimensions(dims.width, worldHeight);
  
        if (outputElement) {
          if(bufferPtr[0] == 0) {
            console.log("wtf?")
          }

          const html = bufferToHTML(bufferPtr, dims.width);
          //console.log(html)
          if (outputElement.innerHTML !== html) {
            if(html[0] == 0) {
              console.log("zero !")
            }
            outputElement.innerHTML = html;
          }
        }
     // } else {
     //   bufferPool.return(newBuffer);
     // }
  
      frameCounter++;
      if (frameCounter % BUFFER_POOL_CLEANUP_INTERVAL === 0) {
        bufferPool.cleanup();
      }
    } catch (e) {
      console.error('Frame update failed:', e);
    }
    requestAnimationFrame(updateDisplay);
  }
  requestAnimationFrame(updateDisplay);
}



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

  cleanup();
  
  frameBuffer.clear();
  bufferPool.cleanup();
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

function displayInnerThoughts() {
  let lastProphecyIndex = -1;
  let elements = [];
  for (const id of uniqueElementIds) {
    elements.push(...document.querySelectorAll("." + id));
  }

  elements.forEach((element, index) => {
    if (!element.hasAttribute('data-has-listeners')) {
      element.setAttribute('data-has-listeners', 'true');

      ++eventhandlercount;
      element.addEventListener('mouseover', () => {
        if (element.innerHTML === '$') {
          return;
        }

        isRunning = false;
        let prophecyIndex = 0;

        const validElements = elements
          .map(el => {
            const rect = el.getBoundingClientRect();
            return {
              element: el,
              top: rect.top,
              left: rect.left,
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

        const prophecyTexts = [
          prophecies1, prophecies2, prophecies3, prophecies4, prophecies5,
          prophecies6, prophecies7, prophecies8, prophecies9, prophecies10, prophecies11
        ];
        let randomIndex;
        do {
          randomIndex = Math.floor(Math.random() * prophecyTexts.length);
        } while (randomIndex === lastProphecyIndex && prophecyTexts.length > 1);
        lastProphecyIndex = randomIndex;
        let prophecies = prophecyTexts[randomIndex];

        validElements.forEach(item => {
          const el = item.element;
          el.style.color = "#c7bbe0";
          el.style.cursor = "pointer";
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
      });
    }
  });
}
