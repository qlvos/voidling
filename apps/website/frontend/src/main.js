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
  getDeformFreq, cleanup, getBuffer, getDeformPhase, setCurrentBehavior, getBaseRadius, setBaseRadius, setBaseRadiusUnlimited
} from "./voidlingdrawer.js";
import { startGame, drops, getEndGameEvaluation, GAME_START_TEXT_TIME, GAME_START_TEXT_SECTION_1, GAME_START_TEXT_SECTION_2, GAME_START_TEXT_SECTION_3, GAME_END_TEXT_SECTION_1, initializeDrop, GAME_END_TEXT_LENGTH, getEvaluation } from "./game.js";
import { openingAnimation, randomAnimations, resetAnimations } from "./animations.js";
import { calculateDimensions, getCharacterDimensions, manageBorderMouseClick, manageMouseMove, isMouseOverRect, handleClick, currentState, STATE_INDEX_PAGE, STATE_VOIDLING_PAGE } from "./canvashelper.js";

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
const MEMORY_CHECK_INTERVAL = 2000;
const OPENING_DONE_POST_PERIOD = 3000;
const GAME_TEASER_ANIM_LENGTH = 1250;
const GAME_TEASER_MAX_LENGTH = 60000;
const GAME_INSTRUCTIONS_WAIT_TIME = 1000;
const GAME_LENGTH = 60; // in seconds
let endGameEvaluation;
const END_GAME_EVALUATION_MAX_LENGTH = 75;
const RANDOM_ANIMATION_PROBABILITY = 0.1;
const RANDOM_ANIM_EACH_SECOND = 20;
const ABOUT_START_COL = !window.isMobile ? 5 : 4;
const ABOUT_START_ROW = !window.isMobile ? 4 : 4;

let hoverCycles = 1;
const dims = calculateDimensions();
setDimensions(dims.width, dims.height);

let rectangles = [];
let mouseOverVoidling = false;

let showGameTeaser = false;
let stopGameTeaser = false;
let showClickToContinue = true;
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

let linkPositions = [];
let links = new Map([
    ['reaper_x', 'https://x.com/reapers_gambit'],
    ['hermes', 'https://nousresearch.com/hermes3/'],
    ['donut_video', 'https://www.youtube.com/watch?v=DEqXNfs_HhY'],
    ['donut_blog', 'https://www.a1k0n.net/2021/01/13/optimizing-donut.html'],
    ['x', 'https://x.com/standardvoids'],
    ['telegram', 'https://t.me/reaper_agent']
]);

// Add these help sections
const aboutSections = [
  {
      title: "THE VOIDLING",
      content: "Born from the void, summoned by [reaper_x]The Reaper[/reaper_x] agent, the STANDARD & VOID'S VOIDLING agent is an autonomous proto-conscious creature. It gathers data, informs its audience, and trades a basket of AI agent tokens."
  },
  {
      title: "TECHNICAL",
      content: "The Voidling's appearance is defined by a unique tri-dimensional ASCII animation controlled by an instance of [hermes]Nous Research Hermes 3[/hermes] model. It reacts to the performance of a basket of tokens and expresses emotions through the configuration of the animation's code. The Voidling is a far descendant of the famous [donut_video]donut.c animation[/donut_video], initially brought to life by [donut_blog]Andy Sloane[/donut_blog]. Its current form has evolved through many iterations, layers of interpretations, and adaptations for the browser."
  },
  {
      title: "CONNECT",
      content: "STANDARD & VOID'S has no token yet. Stay in touch with our developments here: [x]X[/x] | [telegram]Telegram[/telegram]"
  }
];

function getSchemeColor(type) {
  const currentScheme = colorScheme.get(scheme);
  if (!currentScheme) return '#ff8700'; // fallback color

  switch (type) {
    case 'about-title':
      return currentScheme.orangeTitleColor;
    case 'about-text':
      return currentScheme.plusSignColor;
    case 'about-link':
      return currentScheme.darkOrangeTitle;
    default:
      return currentScheme.textColor;
  }
}

export function getModuleInitialized() {
  return moduleInitialized;
}

export function setModuleInitialized(value) {
  moduleInitialized = value;
}

function checkMobile() {
  window.isMobile = window.innerWidth <= 999;

  if (window.isMobile) {
    let w = 96;
    let h = 96;
    document.getElementById(VOIDLING_CANVAS).style.width = `${w}dvw`;
    document.getElementById(OUTPUT_WRAPPER).style.width = `${w}dvw`;
    document.getElementById(VOIDLING_CANVAS).style.height = `${h}dvh`;
    document.getElementById(OUTPUT_WRAPPER).style.height = `${h}dvh`;
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

export function forceCleanup() {
  try {

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

  } catch (e) {
    console.error('forceCleanup: An error occurred during cleanup:', e);
  }
}

function onResize() {
  location.reload();
}

window.addEventListener('resize', onResize);

// Initial setup
document.addEventListener('DOMContentLoaded', async () => {
  await loadFonts();
  checkMobile();
  updateVoidlingSize();
  connectWebSocket();
  onRuntimeInitialized();
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
            if(currentState != STATE_INDEX_PAGE);
            document.getElementById(PORTFOLIOBOX).style.visibility = "visible";
            document.getElementById(VOIDLINGBOX).style.visibility = "visible";
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

    let cvs = document.getElementById(VOIDLING_CANVAS);
    let context = cvs.getContext('2d');
    // Get device pixel ratio
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas dimensions accounting for device pixel ratio

    let cvd = getCanvasDimensions(VOIDLING_CANVAS)
    cvs.width = cvd.width;
    cvs.height = cvd.height;

    // Scale context based on device pixel ratio
    context.scale(dpr, dpr);
    context.clearRect(0, 0, cvs.offsetWidth, cvs.offsetHeight);

    // Set the font
    context.font = getFont();
    context.textAlign = getCanvasTextAlign();
    let cv = getCharacterDimensions();

    let lineHeight = cv.height;
    let currentY = lineHeight;
    let currentX = 1;
    rectangles = [];

    let leftMostChar;
    let lastChar;

    // Calculate center positions
    const height = Math.floor(bufferPtr.length / dims.width);

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
          if(tradingActive && currentState == STATE_VOIDLING_PAGE) {
            document.getElementById(PORTFOLIOBOX).style.visibility = "visible";
            document.getElementById(VOIDLINGBOX).style.visibility = "visible";
            document.getElementById(VOIDLINGEXPRESSION).style.visibility = "visible";
          } 
        }
      }
      
      if(currentScene) {
        if(currentScene.customVoidling && !currentScene.customVoidlingInitialized) {
          currentScene.customVoidlingInitialized = true;
        }
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
        ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, [...voidlingStrings.top], false, gameStarted));
      } else if (row === height - 1) {
        ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, [...voidlingStrings.bottom], false, gameStarted));
      } else if (col === 0) {
        ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, [...voidlingStrings.left], true, gameStarted));
      } else if (col === dims.width - 1) {
        ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, [...voidlingStrings.right], true, gameStarted));
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
          getEvaluation(points, (evaluation) => {
            setTimeout(() => {
              endGameEvaluation = splitStringIntoChunks(evaluation.comment);
              if(evaluation.approved) {
                showClickToContinue = false;
                document.getElementById('gamewin').style.visibility = "visible";                
              }
            }, 3500);
          });

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
            context.fillStyle = cscheme.borderColor;
          } else if(!openingDone && currentScene.voidling && isVoidlingCharacter(char)) {
            context.fillStyle = cscheme.borderColor;
          }

          let now = Date.now();
          if(now-openingDoneAt < OPENING_DONE_POST_PERIOD) {
            let ratio = ((now-openingDoneAt) / OPENING_DONE_POST_PERIOD);
            if(Math.random() >  ratio) {
              context.fillStyle = cscheme.borderColor;
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
        context.fillStyle = cscheme.borderColor;

        if(showGameStartText) {
          background = drawText(GAME_START_TEXT_SECTION_1.toUpperCase(), 0.5, 0.1, dims.width, background);
          background = drawText(GAME_START_TEXT_SECTION_2.toUpperCase(), 0.5, 0.15, dims.width, background);
          background = drawText(GAME_START_TEXT_SECTION_3.toUpperCase(), 0.5, 0.2, dims.width, background);
          let secondsLeft = Math.ceil((GAME_START_TEXT_TIME - (Date.now() - gameInitTime)) / 1000);
          if(secondsLeft > 0) {
            let countdown = `ONE MINUTE TO GET AS MANY POINTS AS POSSIBLE, STARTING IN ${secondsLeft}`;
            background = drawText(countdown, 0.5, 0.25, dims.width, background);
          }
        }

        if(showGameEndText) {
          let now = Date.now();
          if(now-gameEndStart > 1000) {
            background = drawText(GAME_END_TEXT_SECTION_1 +  `, SCORE: ${points}`, 0.5, 0.15, dims.width, background);
            let heightOffset = 0.2;

            if(!endGameEvaluation) {
              drawText("Evaluating performance, please hold on...".toUpperCase(), 0.5, heightOffset, dims.width, background);
            }

            if(endGameEvaluation) {
              background = drawText("THE REAPER EVALUATION", 0.5, heightOffset, dims.width, background);
              heightOffset += 0.08;
              for(let j=0; j<endGameEvaluation.length; j++) {
                let str = endGameEvaluation[j];
                if(j==0) {
                  str = '"' + str;
                }
                if(j==endGameEvaluation.length-1) {
                  str += '"';
                }
                background = drawText(str, 0.5, heightOffset, dims.width, background);
                heightOffset += (0.03)
              }
              
            }

            if(showClickToContinue) {
              background = drawText(`click to continue`.toUpperCase(), 0.5, heightOffset+0.1, dims.width, background);
            }
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

          if(gameActive && showGameTeaser && !window.isMobile && !aboutClicked) {
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
      initializeVoidlingDisplay(height, setWorldDimensions);
    }

    if (aboutClicked) {
      if(openingDone) {
        const cv = getCharacterDimensions();
        drawAbout(context, dims, cv);
      }
    } 

    frameCounter++;

  } catch (e) {
    console.error('Frame update failed:', e);
  }

  requestAnimationFrame(updateDisplay);
};

export function showTradingElements() {
  document.getElementById(PORTFOLIOBOX).style.visibility = "visible";
  document.getElementById(VOIDLINGBOX).style.visibility = "visible";
  document.getElementById(VOIDLINGEXPRESSION).style.visibility = "visible";
}

export function hideTradingElements() {
  document.getElementById(PORTFOLIOBOX).style.visibility = "hidden";
  document.getElementById(VOIDLINGBOX).style.visibility = "hidden";
  document.getElementById(VOIDLINGEXPRESSION).style.visibility = "hidden";
}

// modify the drawAbout function to use the color scheme
function drawAbout(context, dims, cv) {
  let row = ABOUT_START_ROW; 
  let col = ABOUT_START_COL;
  const SECTION_SPACING = 3;  // Increased spacing between sections
  
  context.fillStyle = getSchemeColor('about-text');
  context.font = getFont();
  context.textAlign = 'left';
  linkPositions = [];

  aboutSections.forEach((section) => {
    // Section title with scheme color
    context.fillStyle = getSchemeColor('about-title');
    for (let i = 0; i < section.title.length; i++) {
      context.fillText(section.title[i], (col + i) * cv.width, row * cv.height);
    }
    row += SECTION_SPACING;

    // Section content with scheme colors
    const linesUsed = drawFormattedText(
      context,
      section.content,
      col,
      row,
      getSchemeColor('about-text'),
      (dims.width - (col + 5)),
      cv
    );
    row += linesUsed + SECTION_SPACING;  // Add spacing after content
  });
}

function drawFormattedText(context, text, x, y, color, maxWidth, cv) {
  const linkRegex = /\[(.*?)\](.*?)\[\/(.*?)\]/g;
  let lastIndex = 0;
  let match;
  let currentX = x;
  let currentY = y;
  let lines = 1;
  let words = [];
  const LINE_HEIGHT = 2; // Increased line height for better readability
  
  function drawWord(word, isLink = false) {
    if (currentX - x + word.length > maxWidth) {
      currentY += LINE_HEIGHT;
      currentX = x;
      lines += LINE_HEIGHT;
    }
    
    context.fillStyle = isLink ? getSchemeColor('about-link') : getSchemeColor('about-text');
    const startX = currentX;
    
    for (let i = 0; i < word.length; i++) {
      context.fillText(word[i], currentX * cv.width, currentY * cv.height);
      currentX++;
    }
    
    // Add space after word unless it's end of line
    if (currentX - x < maxWidth) {
      currentX++;
    }
    
    return startX;
  }

  while ((match = linkRegex.exec(text)) !== null) {
    // Split and process regular text before link
    const beforeText = text.slice(lastIndex, match.index);
    words = beforeText.split(/\s+/);
    
    words.forEach(word => {
      if (word) drawWord(word);
    });

    // Process link text
    const linkText = match[2];
    const linkStartX = drawWord(linkText, true);

    // Store link position
    let url = links.get(match[1]);
    linkPositions.push({
      text: linkText,
      onclick: () => { window.open(url, '_blank') },
      box: {
        startx: linkStartX * cv.width,
        endx: currentX * cv.width,
        starty: currentY * cv.height - cv.height/2,
        endy: currentY * cv.height
      }
    });
    
    lastIndex = match.index + match[0].length;
  }

  // Handle remaining text with word wrapping
  const remainingText = text.slice(lastIndex);
  const remainingWords = remainingText.split(/\s+/);
  remainingWords.forEach(word => {
    if (word) drawWord(word);
  });

  return lines;
}

function initializeVoidlingDisplay(height, setWorldDimensions) {
  let outputElement = document.getElementById(OUTPUT_WRAPPER);
  const canvas = document.getElementById(VOIDLING_CANVAS);
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
    if (showGameEndText) {
      showTradingElements();
    }

    showGameEndText = false;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    manageBorderMouseClick(mouseX, mouseY, [...voidlingStrings.top, ...voidlingStrings.bottom], [...voidlingStrings.left, ...voidlingStrings.right]);

    handleClick(mouseX, mouseY, linkPositions);

  });

  canvas.addEventListener('mousemove', (event) => {
    if (gameStarted && !gameOver) {
      return;
    }
    manageMouseMove(event, rect, [...voidlingStrings.top, ...voidlingStrings.bottom, ...linkPositions], [...voidlingStrings.left, ...voidlingStrings.right], canvas);

    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let mOver = false;
    if (openingDone) {
      for (const rectangle of rectangles) {
        if (isMouseOverRect(mouseX, mouseY, rectangle, horizontalFuzziness)) {
          mOver = true;
          break;
        }
      }
    }

    if (mOver && !isAboutClicked()) {
      // If this is initial hover or any mouse movement
      if (!mouseOverVoidling ||
        lastMouseX === null || lastMouseY === null || // Initial hover
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
        isRunning = true; // Ensure animation is running
        requestAnimationFrame(updateDisplay); // Restart normal animation
      }
    }
  });

  isDisplayInitialized = true;
}

function isVoidlingCharacter(char) {
  return colorScheme.get(scheme).voidling.has(char) && char != '$';
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
});

window.addEventListener('pageshow', function (event) {
  if (event.persisted) {
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

  let cvs = document.getElementById(VOIDLING_CANVAS);
  let context = cvs.getContext('2d');

  // Get device pixel ratio
  const dpr = window.devicePixelRatio || 1;

  cvs.width = 10 + cvs.offsetWidth * dpr;
  cvs.height = cvs.offsetHeight * dpr;

  context.scale(dpr, dpr);
  let cv = getCharacterDimensions();

  context.clearRect(0, 0, cvs.offsetWidth, cvs.offsetHeight);
  context.font = getFont();
  context.textAlign = 'left';

  // Reset rectangles array since animation has updated
  rectangles = [];
  let currentY = cv.height;
  let currentX = 1;
  let leftMostChar;
  let lastChar;
  let dims = calculateDimensions();

  // Calculate center positions
  const height = Math.floor(bufferPtr.length / dims.width);

  let col = 0;
  let row = 0;

  let cscheme = colorScheme.get(scheme);

  // First pass: calculate new rectangles from updated animation frame, and draw borders
  for (let i = 0; i < bufferPtr.length; i++) {
    let isBorder = (row === 0) || (row === (height - 1)) || (col === 0) || (col === (dims.width - 1));
    let char = bufferPtr[i];
    let c = cscheme.voidling.get(char);

    if ((row === 0) || (row === (height - 1)) || (col === 0) || (col === (dims.width - 1))) {
      c = cscheme.voidling.get(char);
    }

    if (row === 0) {
      ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, voidlingStrings.top, false, gameStarted));
    } else if (row === height - 1) {
      ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, voidlingStrings.bottom, false, gameStarted));
    } else if (col === 0) {
      ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, voidlingStrings.left, true, gameStarted));
    } else if (col === dims.width - 1) {
      ({ char, c } = borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, voidlingStrings.right, true, gameStarted));
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


if(gameActive) {
  document.addEventListener('keydown', (event) => {
    let stepSize = 10;
    let firstMultiplier = 15.5;
    if (event.key.toLowerCase() === 'v') {
      if(!gameStarted && !gameOver) {
        document.getElementById(PORTFOLIOBOX).style.visibility = "hidden";
        document.getElementById(VOIDLINGBOX).style.visibility = "hidden";
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
}

function splitStringIntoChunks(str) {
  const chunkSize = END_GAME_EVALUATION_MAX_LENGTH;
  const chunks = [];
  let start = 0;

  while (start < str.length) {
    let end = start + chunkSize;
    if (end < str.length) {
      while (end < str.length && str[end] !== ' ') {
        end++;
      }
    }
    chunks.push(str.slice(start, end).trim());
    start = end + 1;
  }

  return chunks;
}
