import { connectWebSocket } from "./chaindata.js";
import { voidlingConfigSerene } from "./voidling-config-serene.js";
import { voidlingConfigAgitated } from "./voidling-config-agitated.js";
import { voidlingConfigCautious } from "./voidling-config-cautious.js";
import { voidlingConfigCurious } from "./voidling-config-curious.js";
import { voidlingConfigExcited } from "./voidling-config-excited.js";
import { voidlingConfigVanilla } from "./voidling-config-mob.js";
import { specialProphecies1, prophecies1, prophecies2, prophecies3, prophecies4, prophecies5, prophecies6, prophecies7, prophecies8, prophecies9, prophecies10, prophecies11 } from "./prophecies.js";
import {
  initializeTrigCache, animationFrame, initVoidlingWithConfig, setDeformFreq, setDeformPhase, setCurrentTime, setTargetX, setTargetY, setMovementX, setMovementY, setRotX, setRotY, setRotZ, getHorizontalPersistenceTimer, getStuckCounter, getBehaviorTimer, getCurrentBehavior, getCurrentTime, getLastTargetX,
  getLastTargetY, getRotationSpeed, getTargetRotX, getTargetRotY, getTargetRotZ, getRotX, getRotY,
  getRotZ, getTargetX, getTargetY, getMovementX, getMovementY, setDimensions, getDeformComplexity,
  getDeformFreq, cleanup, getBuffer, getDeformPhase, setCurrentBehavior, getBaseRadius, setBaseRadius,
  getMoveSpeed, setMoveSpeed
} from "./voidlingdrawer.js";

let drops = [
  {
    symbol: "saylor",
    row: -1,
    fromLeftPercent: 0.1,
    speed: 2,
    caught: false,
    points: 100
  },
  {
    symbol: "sbf",
    row: -1,
    fromLeftPercent: 0.5,
    speed: 3,
    caught: false,
    points: -100

  },
  {
    symbol: "ftx",
    row: -1,
    speed: 4,
    fromLeftPercent: 0.7,
    caught: false,
    points: -50
  },
  {
    symbol: "elon",
    row: -1,
    fromLeftPercent: 0.8,
    speed: 4,
    caught: false,
    points: 50
  },
  {
    symbol: "pepe",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 50
  },
  {
    symbol: "bitconnect",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -500
  },
  {
    symbol: "sol",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 100
  }
]

for(const drop of drops) {
  drop.fromLeftPercent = Math.random();
  drop.speed = Math.floor(Math.random() * 5) + 1;

  let min = -15;
  let max = -1;
  drop.row = Math.floor(Math.random() * (max - min + 1)) + min;
  
  

  setInterval(() => {
    if(drop.row >= worldHeight) {
      drop.fromLeftPercent = Math.random();
    }
    ++drop.row;
  }, drop.speed*100)
}

const rightText = " IT SEEKS ITS PEERS AND SERVES THE REAPER ";
const bottomText = " A PROTO-CONSCIOUS AI CREATURE ";
const leftText = " IT COMES FROM THE $VOID ";

window.isMobile = window.innerWidth <= 999;
let lastMobileState = window.isMobile;
let moduleInitialized = false;
let cfg;

export function getModuleInitialized() {
  return moduleInitialized;
}

export function setModuleInitialized(value) {
  moduleInitialized = value;
}

function checkMobile() {
  window.isMobile = window.innerWidth <= 999;

  if(window.isMobile) {
    let fill = 90;
    document.getElementById("cvas").style.width=`${fill}dvw`;
    document.getElementById("outputwrapper").style.width=`${fill}dvw`;
    document.getElementById("cvas").style.height=`${fill}dvh`;
    document.getElementById("outputwrapper").style.height=`${fill}dvh`;
  }

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
    window.isMobile ? '24px' : '12px'
  );
}

updateVoidlingSize();
checkMobile();

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
const CLEANUP_INTERVAL = 200;
const MEMORY_THRESHOLD_MB = 200;
const MEMORY_CHECK_INTERVAL = 2000;

let hoverCycles = 1;
const dims = calculateDimensions();
setDimensions(dims.width, dims.height);

let rectangles = [];
let mouseOverVoidling = false;

let voidlingSteps = 0;
let voidlingStepRaising = true;
let voidlingMaxSteps = 100;

export function getEmotion() {
  return emotion;
}

export function setEmotion(em) {
  emotion = em;
}

// Global variables
let lastMemoryCheck = 0;
let isTabVisible = true;
let frameCounter = 0;
let isDisplayInitialized = false;
let lastFrameTime = 0;
let resizeTimeout;
let isRunning = true; // Flag to control animation frames

function calculateDimensions() {
  try {
    let wrapper = document.getElementById('outputwrapper');
    let wh = wrapper.offsetHeight;
    let ww = wrapper.offsetWidth;
    let cv = getCharacterDimensions();
    
    // Calculate exact dimensions
    const exactWidth = ww / (cv.width);
    const exactHeight = wh / (cv.height);
    
    // Round down to ensure full characters
    const width = Math.floor(exactWidth);
    const height = Math.floor(exactHeight);
    
    return {
      width: width,
      height: height,
      charWidth: cv.width,
      charHeight: cv.height
    }
  } catch (e) {
    console.error('Error calculating dimensions:', e);
    return { width: 190, height: 61 };
  }
}

function resetDimensions() {
  const dims = calculateDimensions();
  setDimensions(dims.width, dims.height);
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
  if (performance.memory) {
    const jsHeapSize = performance.memory.usedJSHeapSize / (1024 * 1024);
    const totalHeapSize = performance.memory.totalJSHeapSize / (1024 * 1024);
    // Count all DOM elements
    let allElements = document.getElementsByTagName('*');
    let count = allElements.length;

    console.log(`Memory usage: JS Heap ${jsHeapSize.toFixed(2)}MB / Total Heap ${totalHeapSize.toFixed(2)}MB, DOM count: ${count}`);

    if (jsHeapSize > MEMORY_THRESHOLD_MB) {
      console.warn(`High memory usage: ${jsHeapSize.toFixed(2)}MB`);
      forceCleanup();
    }
  }
}


export function forceCleanup() {
  try {
    console.log('forceCleanup: Starting cleanup process...');

    const state = preserveVoidlingState(); // Save the current voidling state
    cleanup();

    if (moduleInitialized) {
      clearDeformHistory(); // Reset deform history
      resetDimensions();    // Recalculate and apply dimensions
    }

    initVoidlingConfig();       // Reinitialize configuration
    restoreVoidlingState(state); // Restore the saved voidling state
    // Clear output element content if it exists
    // Reset other global variables
    frameCounter = 0;
    lastFrameTime = 0;
    console.log('forceCleanup: All buffers cleared');

  } catch (e) {
    console.error('forceCleanup: An error occurred during cleanup:', e);
  }
}

function onResize() {
  location.reload();
}

window.addEventListener('resize', onResize);

// Initial setup
document.addEventListener('DOMContentLoaded', () => {
  const dims = calculateDimensions();
  setDimensions(dims.width, dims.height);
  setWorldDimensions(dims.width, dims.height);
});

window.addEventListener('resize', onResize);

document.addEventListener('DOMContentLoaded', function () {
  checkMobile();
  updateVoidlingSize();
  connectWebSocket();
  onRuntimeInitialized();
});

function initVoidlingConfig() {
  cfg = voidlingConfigSerene;
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

let points = 0;

function updateDisplay(timestamp) {
  if (!isRunning) return;
  if (!isTabVisible || timestamp - lastFrameTime < FRAME_INTERVAL || mouseOverVoidling) {
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
    animationFrame();
    const bufferPtr = getBuffer();
    let dims = calculateDimensions();

    let cvs = document.getElementById('cvas');
    let context = cvs.getContext('2d');

    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas dimensions accounting for device pixel ratio
    cvs.width = 10 + cvs.offsetWidth * dpr;
    cvs.height = cvs.offsetHeight * dpr;

    // Scale context based on device pixel ratio
    context.scale(dpr, dpr);
    context.clearRect(0, 0, cvs.offsetWidth, cvs.offsetHeight);

    // Set the font
    context.font = window.isMobile ? `24px ${font}` : `12px ${font}`;
    context.textAlign = 'center'
    let cv = getCharacterDimensions();

    let lineHeight = cv.height;
    let currentY = lineHeight;
    let currentX = 1;
    rectangles = [];

    let leftMostChar;
    let lastChar;

    // Calculate center positions
    const bottomStart = Math.floor((dims.width - bottomText.length) / 2);
    const height = Math.floor(bufferPtr.length / dims.width);
    const leftStart = Math.floor((height - leftText.length) / 2);
    const rightStart = Math.floor((height - rightText.length) / 2);

    let col = 0;
    let row = 0;
    for (let i = 0; i < bufferPtr.length; i++) {
      let char = bufferPtr[i];
      let c = colorScheme.get(scheme).voidling.get(char);

      if((row === 0) || (row === (height - 1)) || (col === 0) || (col === (dims.width - 1))) {
        c = "#af87ff";
      }

      if(row === 0) {
        for(let msg of topStrings) {
          if(col >= msg.startCol && col < (msg.startCol+msg.message.length)) {
            if(!msg.box) {
              msg.box = { startx: (currentX * cv.width), endx: ((currentX * cv.width) + (cv.width*msg.message.length)), starty: 0, endy: cv.height }
            }
            char = msg.message[col-msg.startCol];
            c = colorScheme.get(scheme).topBottomColor;
            break;
          }
        }
      }

      if(row === height - 1) {
        for(let msg of bottomStrings) {
          if(col >= msg.startCol && col < (msg.startCol+msg.message.length)) {
            char = msg.message[col-msg.startCol];
            c = colorScheme.get(scheme).topBottomColor;
            break;
          }
        }
      }

      if (row === height - 1 && col >= bottomStart && col < bottomStart + bottomText.length) {
        char = bottomText[col - bottomStart];
        c = colorScheme.get(scheme).topBottomColor;
      } else if (col === 0 && row >= leftStart && row < leftStart + leftText.length) {
        char = leftText[row - leftStart];
        c = colorScheme.get(scheme).sideColor;
      } else if (col === dims.width - 1 && row >= rightStart && row < rightStart + rightText.length) {
        char = rightText[row - rightStart];
        c = colorScheme.get(scheme).sideColor;
      }

      context.fillStyle = c;

      let originalChar = char;

      for(const drop of drops) {
        drop.col = Math.ceil((drop.fromLeftPercent) * dims.width);
        if(!drop.caught && drop.row > 0 && drop.row < (worldHeight-1) && drop.row == row && (col>=drop.col && col < (drop.col+drop.symbol.length))) {
          char = drop.symbol[col-drop.col];
          if(originalChar != ' ') {
            drop.caught = true;
            points += drop.points
            pointString.message = ` Points: ${points} `;
            console.log(points)
            console.log("collision!")
          }
        }
      }


      if (char != ' ') {
        if (!leftMostChar && isVoidlingCharacter(char)) {
          leftMostChar = (currentX * cv.width);
        }

        if(isVoidlingCharacter(char)) {
          lastChar = (currentX * cv.width);
        }

        // Keep the original positioning for consistency with rectangle tracking
        if(!(tradingOnly && isVoidlingCharacter(char))) {
          context.fillText(char, (currentX * cv.width), currentY);
        }
        
      }
      currentX++;
      ++col;

      if ((i + 1) % dims.width === 0) {
        if (leftMostChar) {
          rectangles.push({ startx: leftMostChar, endx: lastChar, starty: currentY, endy: currentY + lineHeight })
          leftMostChar = null;
          lastChar = null;
        }

        currentY += lineHeight;
        currentX = 1;
        col = 0;
        ++row;
      }
    }

    function setWorldDimensions(width, height) {
      worldWidth = width;
      worldHeight = height;
    }

    if (!isDisplayInitialized) {
      let offsetTop = window.isMobile ? PORTFOLIO_OFFSET_TOP_MOBILE : PORTFOLIO_OFFSET_TOP;
      let offsetLeft = window.isMobile ? PORTFOLIO_OFFSET_LEFT_MOBILE : PORTFOLIO_OFFSET_LEFT;

      let outputElement = document.getElementById('outputwrapper');
      const canvas = document.getElementById('cvas');

      const outerRect = outputElement.getBoundingClientRect();
      document.getElementById('aboutpage').style.top = `${outputElement.offsetTop}px`;
      document.getElementById('aboutpage').style.left = `${outputElement.offsetLeft}px`;
      document.getElementById('aboutpage').style.maxWidth = `${outputElement.offsetWidth}px`;

      document.getElementById('aboutpage').style.maxWidth = `${outputElement.offsetWidth}px`;
      document.getElementById("voidlingcomment").style.maxWidth = `${canvas.offsetWidth*.8}px`;
      
      console.log(canvas.offsetWidth)
    //  document.getElementById("voidlingcomment").style.maxWidth = `674px`;

      const dims = calculateDimensions();
      initStringPositions(dims.width, height);
      setWorldDimensions(dims.width, dims.height);
      setPosition(outerRect.x, outerRect.y);

      const rect = canvas.getBoundingClientRect();
      let lastMouseX = null;
      let lastMouseY = null;

      canvas.addEventListener('click', (event) => {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        for(const msg of topStrings) {
          if(msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box)) {
            borderClick(msg.onclick);
            isPointer = true;
          }
        }
      });
      
      canvas.addEventListener('mousemove', (event) => {
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        let isPointer = false;
        for(const msg of topStrings) {
          if(msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box)) {
            isPointer = true;
          }
        }
        canvas.style.cursor = isPointer ? 'pointer' : 'default';

        let mOver = false;
        for (const rectangle of rectangles) {
          if (isMouseOverRect(mouseX, mouseY, rectangle)) {
            mOver = true;
            break;
          }
        }
        
        if (mOver) {
          // If this is initial hover or any mouse movement
          if (!mouseOverVoidling || 
              lastMouseX === null || lastMouseY === null ||  // Initial hover
              mouseX !== lastMouseX || mouseY !== lastMouseY) { // Any movement
            if(voidlingSteps==0) {
              voidlingStepRaising = true;
            } else if(voidlingSteps == voidlingMaxSteps) {
              ++hoverCycles;
              voidlingStepRaising = false;
            }

            voidlingStepRaising ? ++voidlingSteps : --voidlingSteps;

            displayInnerThoughtsv2();
          }
          mouseOverVoidling = true;
          lastMouseX = mouseX;
          lastMouseY = mouseY;
        } else {
          if (mouseOverVoidling) { // Only if we were previously over the voidling
            mouseOverVoidling = false;
            lastMouseX = null;
            lastMouseY = null;
            isRunning = true;  // Ensure animation is running
            requestAnimationFrame(updateDisplay); // Restart normal animation
          }
        }
      });

      isDisplayInitialized = true;
    }

    frameCounter++;

  } catch (e) {
    console.error('Frame update failed:', e);
  }

  requestAnimationFrame(updateDisplay);
};

function isVoidlingCharacter(char) {
  return colorScheme.get(scheme).voidling.has(char) && char != '$';
}

function isMouseOverRect(mouseX, mouseY, rect) {
  let yMargin = 1;
  let xCondition = mouseX > rect.startx && mouseX < rect.endx;
  let yCondition = mouseY > (rect.starty - yMargin) && mouseY < (rect.endy + yMargin);
  return xCondition && yCondition
}


function onRuntimeInitialized() {
  try {
    initializeTrigCache();
    initVoidlingConfig();

    // Animation logic, moved globally for proper reuse
    requestAnimationFrame(updateDisplay); // Start animation loop


  } catch (e) {
    console.log(e)
    console.error('Setup failed:', e);
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

document.addEventListener('visibilitychange', onVisibilityChange);

function onError(e) { }

window.addEventListener('pagehide', function () {
  isRunning = false;

  cleanup();

  document.removeEventListener('visibilitychange', onVisibilityChange);
  window.removeEventListener('resize', onResize);
  window.removeEventListener('error', onError);

  //console.log('Page unloaded: all resources released.');
});

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
    //console.log('Page was restored from bfcache');
    window.location.reload();
  }
});

let lastProphecyIndex = -1;

function displayInnerThoughtsv2() {
  // Run one frame of animation when called
  animationFrame();
  const bufferPtr = getBuffer();

  const prophecyTexts = [
    prophecies1, prophecies2, prophecies3, prophecies4, prophecies5,
    prophecies6, prophecies7, prophecies8, prophecies9, prophecies10, prophecies11
  ];
  
  let randomIndex = Math.floor(Math.random() * prophecyTexts.length);
  lastProphecyIndex = randomIndex;

  let prophecies = (hoverCycles % 2 == 0) ? specialProphecies1 : prophecyTexts[randomIndex];

  let cvs = document.getElementById('cvas');
  let context = cvs.getContext('2d');

  // Get device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  
  cvs.width = 10 + cvs.offsetWidth * dpr;
  cvs.height = cvs.offsetHeight * dpr;

  context.scale(dpr, dpr);
  let cv = getCharacterDimensions();

  context.clearRect(0, 0, cvs.offsetWidth, cvs.offsetHeight);
  context.font = window.isMobile ? `24px ${font}` : `12px ${font}`;
  context.textAlign = 'left';

  // Reset rectangles array since animation has updated
  rectangles = [];
  let currentY = cv.height;
  let currentX = 1;
  let leftMostChar;
  let lastChar;
  let dims = calculateDimensions();

  // Calculate center positions
  const bottomStart = Math.floor((dims.width - bottomText.length) / 2);
  const height = Math.floor(bufferPtr.length / dims.width);
  const leftStart = Math.floor((height - leftText.length) / 2);
  const rightStart = Math.floor((height - rightText.length) / 2);

  let col = 0;
  let row = 0;

  // First pass: calculate new rectangles from updated animation frame, and draw borders
  for (let i = 0; i < bufferPtr.length; i++) {
    let isBorder = (row === 0) || (row === (height - 1)) || (col === 0) || (col === (dims.width - 1));
    let char = bufferPtr[i];
    let c = colorScheme.get(scheme).voidling.get(char);

    if((row === 0) || (row === (height - 1)) || (col === 0) || (col === (dims.width - 1))) {
      c = "#af87ff";
    }

    if(row === 0) {
      for(let msg of topStrings) {
        if(col >= msg.startCol && col < (msg.startCol+msg.message.length)) {
          char = msg.message[col-msg.startCol];
          console.log(colorScheme.get(scheme).topBottomColor)
          c = colorScheme.get(scheme).topBottomColor;
          break;
        }
      }
    }
    
    if (row === height - 1 && col >= bottomStart && col < bottomStart + bottomText.length) {
      char = bottomText[col - bottomStart];
      c = colorScheme.get(scheme).topBottomColor;
    } else if (col === 0 && row >= leftStart && row < leftStart + leftText.length) {
      char = leftText[row - leftStart];
      c = colorScheme.get(scheme).sideColor;
    } else if (col === dims.width - 1 && row >= rightStart && row < rightStart + rightText.length) {
      char = rightText[row - rightStart];
      c = colorScheme.get(scheme).sideColor;
    }
    
    if (char != ' ') {
      if (!leftMostChar && isVoidlingCharacter(char)) {
        leftMostChar = (currentX * cv.width);
      }

      if(isVoidlingCharacter(char)) {
        lastChar = (currentX * cv.width);
      }       

      // Keep the original positioning for consistency with rectangle tracking
      if(isBorder) {
        context.fillStyle = c;
        context.fillText(char, (currentX * cv.width)-3.5, currentY);
      }

    }

    currentX++;
    col++;

    if ((i + 1) % dims.width === 0) {
      if (leftMostChar) {
        rectangles.push({ startx: leftMostChar, endx: lastChar, starty: currentY, endy: currentY + cv.height })
        leftMostChar = null;
        lastChar = null;
      }
      currentY += cv.height;
      currentX = 1;
      col=0;
      ++row;
    }
    
  } 

  // Second pass: draw prophecies over the new rectangles
  let prophecyIndex = 0;
  let voidlingColors = colorScheme.get(scheme).hoverColors;
  for (const rectangle of rectangles) {
    let w = rectangle.endx - rectangle.startx;
    let numchars = Math.ceil(w / cv.width);
    for (let i = 0; i < numchars; i++) {
      if (prophecyIndex >= prophecies.length - 1) {
        prophecyIndex = 0;
      }
      let x = rectangle.startx + (i * cv.width);

      const segmentSize = voidlingMaxSteps / voidlingColors.length;
      let index = Math.min(Math.floor(voidlingSteps / segmentSize), voidlingColors.length - 1);
      context.fillStyle = voidlingColors[index];

      context.fillText(prophecies[prophecyIndex], x, rectangle.starty + (cv.height / 2));
      ++prophecyIndex;
    }
  }
}

let rightProgression = false;
let leftProgression = false;
let radiusStepSize = 0.2;

document.addEventListener('wheel', (event) => {
  if (event.deltaY < 0) {
    let newRadius = getBaseRadius()+radiusStepSize*5;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  } else if (event.deltaY > 0) {
    let newRadius = getBaseRadius()-radiusStepSize*5;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  }
});


document.addEventListener('keydown', (event) => {
  let stepSize = 10;
  let firstMultiplier = 15.5;
  if (event.key === 'ArrowRight') {
    stepSize = rightProgression ? stepSize : firstMultiplier * 2;
    setTargetX(getTargetX()+stepSize);
    rightProgression = true;
    leftProgression = false;
  } else if (event.key === 'ArrowLeft') {
    stepSize = leftProgression ? stepSize : firstMultiplier * 2;
    setTargetX(getTargetX()-stepSize);   
    rightProgression = false;
    leftProgression = true;
  } else if (event.key === 'ArrowDown') {
    let t = getTargetY()+stepSize;
    setTargetY(t);
  } else if (event.key === 'ArrowUp') {
    setTargetY(getTargetY()-stepSize);
  } else if (event.key === '+') {
    let newRadius = getBaseRadius()+radiusStepSize;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  } else if (event.key === '-') {
    let newRadius = getBaseRadius()-radiusStepSize;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  }
});
