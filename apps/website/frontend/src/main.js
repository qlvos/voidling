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
  getDeformFreq, cleanup, getBuffer, getDeformPhase, setCurrentBehavior, getBaseRadius, setBaseRadius
} from "./voidlingdrawer.js";
import { startGame, drops, getEndGameEvaluation, GAME_START_TEXT_TIME, GAME_START_TEXT_SECTION_1, GAME_START_TEXT_SECTION_2, GAME_END_TEXT_SECTION_1, initializeDrop, GAME_END_TEXT_LENGTH } from "./game.js";
import { openingAnimation, randomAnimations, resetAnimations } from "./animations.js";

const rightText = " IT SEEKS ITS PEERS AND SERVES THE REAPER ";
const bottomText = " A PROTO-CONSCIOUS AI CREATURE ";
const leftText = " IT COMES FROM THE $VOID ";

window.isMobile = window.innerWidth <= 999;
let lastMobileState = window.isMobile;
let moduleInitialized = false;
let cfg;

let emotion = null;
export const assetBoxId = "assetbox";
export const tradeLogId = "tradelogbox";
export const watchlistBoxId = "watchlistbox";

let openingDone = false;

const FRAME_INTERVAL = 48;
const CLEANUP_INTERVAL = 200;
const MEMORY_THRESHOLD_MB = 200;
const MEMORY_CHECK_INTERVAL = 2000;
const OPENING_DONE_POST_PERIOD = 3000;
const GAME_TEASER_ANIM_LENGTH = 1250;
const GAME_TEASER_MAX_LENGTH = 60000;
const GAME_INSTRUCTIONS_WAIT_TIME = 1000;
const GAME_LENGTH = 60;
const RANDOM_ANIMATION_PROBABILITY = 0.1;
const RANDOM_ANIM_EACH_SECOND = 15;

let hoverCycles = 1;
const dims = calculateDimensions();
setDimensions(dims.width, dims.height);

let rectangles = [];
let mouseOverVoidling = false;

let showGameTeaser = false;
let stopGameTeaser = false;
let gameTeaserLastCheck = Date.now();
let voidlingSteps = 0;
let voidlingStepRaising = true;
let voidlingMaxSteps = 100;
let lastMemoryCheck = 0;
let isTabVisible = true;
let frameCounter = 0;
let isDisplayInitialized = false;
let lastFrameTime = 0;
let resizeTimeout;
let isRunning = true;
let gameStarted = false;
let gameOver = false;
let showGameStartText = false;
let showGameEndText = false;
let gameEndStart;
let gameInitTime;
let dropCaught = false;
let dropEscaped = false;
let currentDropCaught;
let currentDropEscaped;
let randomAnimChecked = false;
let randomAnimationInProgress = false;
let randomAnimationStart;
let openingDoneAt;
let openingStart = Date.now();
let dropCaughtTimeoutId;
let dropEscapedTimeoutId;

export function getModuleInitialized() {
  return moduleInitialized;
}

export function setModuleInitialized(value) {
  moduleInitialized = value;
}

function checkMobile() {
  window.isMobile = window.innerWidth <= 999;

  if (window.isMobile) {
    let w = 90;
    let h = 96;
    document.getElementById("cvas").style.width = `${w}dvw`;
    document.getElementById("outputwrapper").style.width = `${w}dvw`;
    document.getElementById("cvas").style.height = `${h}dvh`;
    document.getElementById("outputwrapper").style.height = `${h}dvh`;
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

export function getEmotion() {
  return emotion;
}

export function setEmotion(em) {
  emotion = em;
}

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
    //console.log('forceCleanup: Starting cleanup process...');

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
    //console.log('forceCleanup: All buffers cleared');

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

  const gamewin = document.getElementById('gamewin');
  const walletInput = document.getElementById('walletinput');
  const submitWallet = document.getElementById('submitwallet');
  const walletRegistered = document.getElementById('walletregistered');
  const aboutpage = document.getElementById('aboutpage');

  setTimeout(() => {
    stopGameTeaser = true;
  }, GAME_TEASER_MAX_LENGTH);

  aboutpage.addEventListener('click', function() {
    aboutpage.style.visibility = "hidden";
  });

    
  let defaultText = "sol wallet";

  submitWallet.addEventListener('click', function() {
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    let endpoint = `${url.origin}/api/whitelist`;
    let waitTime = 1000;
    if(walletInput.value && walletInput.value != defaultText && walletInput.value != '' && walletInput.value.length < 100) {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: walletInput.value }) });
        setTimeout(() => {
          gamewin.style.visibility = "hidden";
          walletRegistered.style.visibility = "visible";
          setTimeout(() => {
            walletRegistered.style.visibility = "hidden";
            document.getElementById("portfoliobox").style.visibility = "visible";
            document.getElementById("voidlingbox").style.visibility = "visible";
            showGameEndText = false;
          }, waitTime*2)
          
        }, waitTime/2);
    }
  });

  walletInput.addEventListener('focus', function() {
    if (walletInput.value === defaultText) {
      walletInput.value = '';
    }
  });

  walletInput.addEventListener('blur', function() { if (walletInput.value === '') { walletInput.value = defaultText; } });

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
    //checkMemoryUsage();
    lastMemoryCheck = now;
  }

  lastFrameTime = timestamp;

  if (frameCounter % CLEANUP_INTERVAL === 0) {
    forceCleanup();
    if (typeof window.gc === 'function') {
      try {
        window.gc();
      } catch (e) {}
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
    let background = getBackground(dims.width, dims.height);
    let currentScene;
    
    if(!openingDone) {
      let elapsed = (Date.now() - openingStart)/1000;
      let sceneTiming = 0;
      let nextScene;
      for(let i=0; i<openingAnimation.length; ++i) {
        let scene = openingAnimation[i];
        sceneTiming += scene.timeseconds;
        if(elapsed < sceneTiming) {
          currentScene = scene;
          if(i+1 <= (openingAnimation.length-1)) {
            nextScene = openingAnimation[i+1];
          }
          if(!currentScene.startTime) {
            currentScene.startTime = Date.now();
          }
          currentScene.elapsedTime = Date.now() - currentScene.startTime;
          break;
        } else if(i==(openingAnimation.length-1) && elapsed > sceneTiming) {
          openingDone = true;
          openingDoneAt = Date.now();
          document.getElementById("voidlingexpression").style.visibility = "visible";
        }
      }
      
      if(currentScene) {
        background = drawScene(currentScene, dims);
        if(nextScene) {
          currentScene.latestBackground = background;
          nextScene.previous = currentScene;
        }
      }
    } else {
      let secondTicker = Math.floor(Date.now() / 1000);
      if(secondTicker % RANDOM_ANIM_EACH_SECOND == 0 && !randomAnimationInProgress) {
        const randomNumber = Math.random();
        if(!randomAnimChecked && (randomNumber < RANDOM_ANIMATION_PROBABILITY)) {
          randomAnimationInProgress = true;
          randomAnimationStart = Date.now();
        }
        randomAnimChecked = true;
      } else {
        randomAnimChecked = false;
      }
    }

    if(randomAnimationInProgress) {
      let elapsed = (Date.now() - randomAnimationStart)/1000;
      let sceneTiming = 0;
      let nextScene;
      for(let i=0; i<randomAnimations.length; ++i) {
        let scene = randomAnimations[i];
        sceneTiming += scene.timeseconds;

        if(elapsed < sceneTiming) {
          currentScene = scene;
          if(i+1 <= (randomAnimations.length-1)) {
            nextScene = randomAnimations[i+1];
          }
          if(!currentScene.startTime) {
            currentScene.startTime = Date.now();
          }
          currentScene.elapsedTime = Date.now() - currentScene.startTime;
          break;
        } else if(i==(randomAnimations.length-1) && elapsed > sceneTiming) {
          randomAnimationInProgress = false;
          randomAnimationStart = 0;
          resetAnimations(randomAnimations);
          currentScene = null;
        }
      }

      if(currentScene) {
        background = drawScene(currentScene, dims);
        currentScene.latestBackground = background;
        if(nextScene) {
          nextScene.previous = currentScene;
        }
      }
    }

    for (let i = 0; i < bufferPtr.length; i++) {
      let char = bufferPtr[i];

      if(showGameEndText && isVoidlingCharacter(char)) {
        char = " ";
      }


      let cscheme = colorScheme.get(scheme);
      let c = cscheme.voidling.get(char);

      if ((row === 0) || (row === (height - 1)) || (col === 0) || (col === (dims.width - 1))) {
        c = cscheme.voidling.get(char);
      }

      if (row === 0) {
        for (let msg of topStrings) {
          if (col >= msg.startCol && col < (msg.startCol + msg.message.length)) {
            if (!msg.box) {
              msg.box = { startx: (currentX * cv.width), endx: ((currentX * cv.width) + (cv.width * msg.message.length)), starty: 0, endy: cv.height }
            }
            char = msg.message[col - msg.startCol];
            c = cscheme.topBottomColor;
            break;
          }
        }
      }

      if (row === height - 1) {
        for (let msg of bottomStrings) {
          if(msg.type == "game" && !gameStarted) {
            continue;
          }
          
          if (col >= msg.startCol && col < (msg.startCol + msg.message.length)) {
            char = msg.message[col - msg.startCol];
            c = cscheme.topBottomColor;
            break;
          }
        }
      }

      if (row === height - 1 && col >= bottomStart && col < bottomStart + bottomText.length) {
        char = bottomText[col - bottomStart];
        c = cscheme.topBottomColor;
      } else if (col === 0 && row >= leftStart && row < leftStart + leftText.length) {
        char = leftText[row - leftStart];
        c = cscheme.sideColor;
      } else if (col === dims.width - 1 && row >= rightStart && row < rightStart + rightText.length) {
        char = rightText[row - rightStart];
        c = cscheme.sideColor;
      }

      context.fillStyle = c;
      let originalChar = char;

      if(!gameOver) {
        let inTheGame = 0;
        for (const drop of drops) {
          drop.col = Math.ceil((drop.fromLeftPercent) * dims.width);
          if(!drop.caught && drop.row == (worldHeight-1)) {
            currentDropEscaped = drop;
            dropEscaped = true;
            drop.caught = true;
            context.fillStyle = drop.points > 0 ? "red" : "green";
            points += -1*drop.points;
            pointString.message = ` Points: ${points} `;
  
            if(dropEscapedTimeoutId) {
              clearTimeout(dropEscapedTimeoutId);
            }
            dropEscapedTimeoutId = setTimeout(() => {
              dropEscaped = false;
            }, 1500);
  
          }
          if (!drop.caught && drop.row > 0 && drop.row < (worldHeight - 1) && drop.row == row && (col >= drop.col && col < (drop.col + drop.symbol.length))) {
            char = drop.symbol[col - drop.col];
            if (originalChar != ' ' && drop.row != 0) {
              dropCaught = true;
              currentDropCaught = drop;
  
              if(!currentDropCaught.background) {
                currentDropCaught.background = new Array(dims.width*dims.height);
                let toFill = `${drop.hit}`;
                let fillCounter = 0;
                for(let j=0; j<currentDropCaught.background.length; j++) {
                  if(fillCounter > toFill.length-1) {
                    fillCounter = 0;
                  }
                  currentDropCaught.background[j] = toFill[fillCounter];
                  ++fillCounter;
                }
              }
  
              if(dropCaughtTimeoutId) {
                clearTimeout(dropCaughtTimeoutId);
              }
              dropCaughtTimeoutId = setTimeout(() => {
                dropCaught = false;
              }, 2000);
  
              //drop.caught = true;

              initializeDrop(drop);

              points += drop.points
              pointString.message = ` Points: ${points} `;
            }
          }
          if(!drop.caught) {
            ++inTheGame;
          }
        }

        let seconds = Math.ceil((Date.now() - gameInitTime) / 1000);
        let timeLeft = GAME_LENGTH+(GAME_START_TEXT_TIME/1000)-seconds
        
        if(timeLeft <= 0 && !showGameEndText) {
          if(points > 0) {
            setTimeout(() => {
              document.getElementById('gamewin').style.visibility = "visible";
            }, 1000);
          }

          gameOver = true;
          gameStarted = false;
          showGameStartText = false;
          showGameEndText = true;
          gameEndStart = Date.now();

        }
      }

      if (char != ' ') {
        if (!leftMostChar && isVoidlingCharacter(char)) {
          leftMostChar = (currentX * cv.width);
        }

        if (isVoidlingCharacter(char)) {
          lastChar = (currentX * cv.width);
        }

        // Keep the original positioning for consistency with rectangle tracking
        if (!(tradingOnly && isVoidlingCharacter(char))) {
          if(!openingDone && !currentScene.voidling && isVoidlingCharacter(char)) {
            char = background[i];
            context.fillStyle = cscheme.textColor;
          } else if(!openingDone && currentScene.voidling && isVoidlingCharacter(char)) {
            context.fillStyle = cscheme.textColor;
          }

          let now = Date.now();
          if(now-openingDoneAt < OPENING_DONE_POST_PERIOD) {
            let ratio = ((now-openingDoneAt) / OPENING_DONE_POST_PERIOD);
            if(Math.random() >  ratio) {
              context.fillStyle = cscheme.textColor;
            }
            
          }

          if(dropEscaped && isVoidlingCharacter(char) && row != 0 && row != (height - 1)) {
            context.fillStyle = currentDropEscaped.points > 0 ? "red" : "green";
          }

          if(dropCaught && isVoidlingCharacter(char) && row != 0 && row != (height - 1)) {
            context.fillStyle = currentDropCaught.points < 0 ? "red" : "green";
            char = currentDropCaught.background[i];            
          }
          context.fillText(char, (currentX * cv.width), currentY);           
        }

      } else {
        context.fillStyle = cscheme.textColor;

        if(showGameStartText) {
          background = drawText(GAME_START_TEXT_SECTION_1.toUpperCase(), 0.5, 0.1, dims.width, background);
          background = drawText(GAME_START_TEXT_SECTION_2.toUpperCase(), 0.5, 0.15, dims.width, background);
          let secondsLeft = Math.ceil((GAME_START_TEXT_TIME - (Date.now() - gameInitTime)) / 1000);
          if(secondsLeft > 0) {
            let countdown = `ONE MINUTE TO GET AS MANY POINTS AS POSSIBLE, STARTING IN ${secondsLeft}`;
            background = drawText(countdown, 0.5, 0.2, dims.width, background);
          }
        }

        if(showGameEndText) {
          let now = Date.now();
          if(now-gameEndStart > 1000) {
            background = drawText(GAME_END_TEXT_SECTION_1 +  `, SCORE: ${points}`, 0.5, 0.15, dims.width, background);
            background = drawText(getEndGameEvaluation(points).toUpperCase(), 0.5, 0.20, dims.width, background);
            background = drawText(`click to continue`.toUpperCase(), 0.5, 0.25, dims.width, background);
          }
        }

        if(gameStarted && !showGameStartText) {
          let seconds = Math.ceil((Date.now() - gameInitTime) / 1000);
          background = drawText(`${GAME_LENGTH+(GAME_START_TEXT_TIME/1000)-seconds}`.toUpperCase(), 0.1, 0.1, dims.width, background);
        }

        if(openingDone && !gameStarted && !gameOver && !stopGameTeaser) {
          let now = Date.now();
          if(now - gameTeaserLastCheck > GAME_TEASER_ANIM_LENGTH) {
            showGameTeaser = !showGameTeaser;
            gameTeaserLastCheck = now;
          }

          if(showGameTeaser && !window.isMobile) {
            background = drawText(`PRESS V TO PLAY`.toUpperCase(), 0.9, 0.1, dims.width, background);
          }
        }

        context.fillText(background[i], (currentX * cv.width), currentY);
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
      let outputElement = document.getElementById('outputwrapper');
      const canvas = document.getElementById('cvas');
      const outerRect = outputElement.getBoundingClientRect();
      document.getElementById("voidlingcomment").style.maxWidth = `${canvas.offsetWidth * .8}px`;

      const dims = calculateDimensions();
      initStringPositions(dims.width, height);
      setWorldDimensions(dims.width, dims.height);
      setPosition(outerRect.x, outerRect.y);

      const rect = canvas.getBoundingClientRect();
      let lastMouseX = null;
      let lastMouseY = null;

      canvas.addEventListener('click', (event) => {
        document.getElementById('gamewin').style.visibility = "hidden";
        if(showGameEndText) {
          document.getElementById("portfoliobox").style.visibility = "visible";
          document.getElementById("voidlingbox").style.visibility = "visible";
        }

        showGameEndText = false;
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        for (const msg of topStrings) {
          if (msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box, true, false, true)) {
            borderClick(msg.onclick);
          }
        }
      });

      canvas.addEventListener('mousemove', (event) => {
        if(gameStarted && !gameOver) {
          return;
        }
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        let isPointer = false;
        for (const msg of topStrings) {
          if (msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box, true, false, true)) {
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
            if (voidlingSteps == 0) {
              voidlingStepRaising = true;
            } else if (voidlingSteps == voidlingMaxSteps) {
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

function isMouseOverRect(mouseX, mouseY, rect, extendXleft = false, extendXright = false, extendY = false) {
  let yMargin = 1;
  let xFuzziness = 10;
  let yFuzziness = 5;
  let startX = extendXleft ? rect.startx-xFuzziness : rect.startx;
  let endX = extendXright ? rect.endx+xFuzziness : rect.endx;
  let startY = extendY ? rect.starty-yFuzziness : rect.starty;
  let endY = extendY ? rect.endy+yFuzziness : rect.endy;
  let xCondition = mouseX > startX && mouseX < endX;
  let yCondition = mouseY > (startY - yMargin) && mouseY < (endY + yMargin);
  return xCondition && yCondition
}


function onRuntimeInitialized() {
  try {
    initializeTrigCache();
    initVoidlingConfig();

    // Animation logic, moved globally for proper reuse
    requestAnimationFrame(updateDisplay); // Start animation loop


  } catch (e) {
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
  //console.log("Deform history cleared.");
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

    if ((row === 0) || (row === (height - 1)) || (col === 0) || (col === (dims.width - 1))) {
      c = colorScheme.get(scheme).voidling.get(char);
    }

    if (row === 0) {
      for (let msg of topStrings) {
        if (col >= msg.startCol && col < (msg.startCol + msg.message.length)) {
          char = msg.message[col - msg.startCol];
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

      if (isVoidlingCharacter(char)) {
        lastChar = (currentX * cv.width);
      }

      // Keep the original positioning for consistency with rectangle tracking
      if (isBorder) {
        context.fillStyle = c;
        context.fillText(char, (currentX * cv.width) - 3.5, currentY);
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
      col = 0;
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
      context.fillStyle = voidlingColors[Math.min(Math.floor(voidlingSteps / segmentSize), voidlingColors.length - 1)];
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
    let newRadius = getBaseRadius() + radiusStepSize * 5;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  } else if (event.deltaY > 0) {
    let newRadius = getBaseRadius() - radiusStepSize * 5;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  }
});


document.addEventListener('keydown', (event) => {
  let stepSize = 10;
  let firstMultiplier = 15.5;
  if (event.key.toLowerCase() === 'v') {
    if(!gameStarted && !gameOver) {
      document.getElementById("portfoliobox").style.visibility = "hidden";
      document.getElementById("voidlingbox").style.visibility = "hidden";
      setTimeout(() => {
        gameStarted = true;
        gameInitTime = Date.now();
        showGameStartText = true;
  
        setTimeout(() => {
          showGameStartText = false;
          startGame();
        }, GAME_START_TEXT_TIME);
      }, GAME_INSTRUCTIONS_WAIT_TIME);
    }
  } else if (event.key === 'ArrowRight') {
    stepSize = rightProgression ? stepSize : firstMultiplier * 2;
    setTargetX(getTargetX() + stepSize);
    rightProgression = true;
    leftProgression = false;
   } else if (event.key === 'ArrowLeft') {
    stepSize = leftProgression ? stepSize : firstMultiplier * 2;
    setTargetX(getTargetX() - stepSize);
    rightProgression = false;
    leftProgression = true;
  } else if (event.key === 'ArrowDown') {
    let t = getTargetY() + stepSize;
    setTargetY(t);
  } else if (event.key === 'ArrowUp') {
    setTargetY(getTargetY() - stepSize);
  } else if (event.key === '+') {
    let newRadius = getBaseRadius() + radiusStepSize;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  } else if (event.key === '-') {
    let newRadius = getBaseRadius() - radiusStepSize;
    setBaseRadius(newRadius);
    cfg.baseRadius = newRadius;
  }
});
