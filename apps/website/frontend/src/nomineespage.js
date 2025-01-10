import { TokenVotingTable } from './tokenvoting.js';
import { getCharacterDimensions, calculateDimensions, manageBorderMouseClick, manageMouseMove } from './canvashelper.js';

window.isMobile = window.innerWidth <= 999;
let tokenTable;
let lastFrameTime = 0;
const FRAME_INTERVAL = 48;

function drawCanvas(timestamp) {
  if (timestamp - lastFrameTime < FRAME_INTERVAL) {
    requestAnimationFrame(drawCanvas);
    return;
  }

  lastFrameTime = timestamp;

  const dims = calculateDimensions();
  const cvs = document.getElementById(NOMINEES_CANVAS);
  const context = cvs.getContext('2d');

  // Set actual canvas size w.r.t. device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  let cvd = getCanvasDimensions(NOMINEES_CANVAS)
  cvs.width = cvd.width;
  cvs.height = cvd.height;

  context.scale(dpr, dpr);
  context.clearRect(0, 0, cvs.offsetWidth, cvs.offsetHeight);

  context.font = getFont();
  context.textAlign = getCanvasTextAlign();

  tokenTable.drawTable();
  const bufferData = tokenTable.getBuffer();
  let cd = getCharacterDimensions();

  let currentY = cd.height;
  let currentX = 1;

  for (let i = 0; i < bufferData.chars.length; i++) {
    const char = bufferData.chars[i];
    if (char !== ' ') {
      context.fillStyle = bufferData.colors[i] || '#875fff';
      context.fillText(
        char,
        currentX * cd.width,
        currentY
      );
    }

    currentX++;
    if ((i + 1) % dims.width === 0) {
      currentY += cd.height;
      currentX = 1;
    }
  }

  requestAnimationFrame(drawCanvas);
}

function handleCanvasClick(event) {
  if (!tokenTable) return;
  const cvs = document.getElementById(NOMINEES_CANVAS);
  const rect = cvs.getBoundingClientRect();
  // Calculate click position relative to canvas
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;
  manageBorderMouseClick(mouseX, mouseY, [...nomineeStrings.top, ...nomineeStrings.bottom], [...nomineeStrings.left, ...nomineeStrings.right]);
}

export async function initNomineesPage() {
  const dims = calculateDimensions();
  tokenTable = new TokenVotingTable(dims.width, dims.height);

  try {
    await tokenTable.updateMarketData();
    requestAnimationFrame(drawCanvas);
  } catch (error) {
    console.error('Failed to initialize table:', error);
  }
}

function onResize() {
  const dims = calculateDimensions();
  if (tokenTable) {
    tokenTable = new TokenVotingTable(dims.width, dims.height);
    tokenTable.updateMarketData();
  }
}

function checkMobile() {
  window.isMobile = window.innerWidth <= 999;

  if (window.isMobile) {
    let w = 90;
    let h = 96;
    document.getElementById(NOMINEES_CANVAS).style.width = `${w}dvw`;
    document.getElementById(OUTPUT_WRAPPER).style.width = `${w}dvw`;
    document.getElementById(NOMINEES_CANVAS).style.height = `${h}dvh`;
    document.getElementById(OUTPUT_WRAPPER).style.height = `${h}dvh`;
  }
}

window.addEventListener('resize', () => {
  checkMobile();
  onResize();
});

let canvas = document.getElementById(NOMINEES_CANVAS);
canvas.addEventListener('click', handleCanvasClick);
canvas.addEventListener('mousemove', (event) => {
  manageMouseMove(event, canvas.getBoundingClientRect(), [...nomineeStrings.top, ...nomineeStrings.bottom], [...nomineeStrings.left, ...nomineeStrings.right], canvas);
});