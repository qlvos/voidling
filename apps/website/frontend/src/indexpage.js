import { IndexChart } from './indexchart.js';
import { getCharacterDimensions, calculateDimensions, manageBorderMouseClick, manageMouseMove, currentState, STATE_INDEX_PAGE } from './canvashelper.js';

let indexChart;
window.isMobile = window.innerWidth <= 999;

async function drawChart() {
  const dims = calculateDimensions();
  const cvs = document.getElementById(INDEX_CANVAS);
  const context = cvs.getContext('2d');

  // Set actual canvas size w.r.t. device pixel ratio
  const dpr = window.devicePixelRatio || 1;
  let cvd = getCanvasDimensions(INDEX_CANVAS)
  cvs.width = cvd.width;
  cvs.height = cvd.height;

  context.scale(dpr, dpr);
  context.clearRect(0, 0, cvs.offsetWidth, cvs.offsetHeight);

  context.font = getFont();
  context.textAlign = getCanvasTextAlign();

  indexChart.drawChart();
  const bufferData = indexChart.getBuffer();
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
}

function handleCanvasClick(event) {
  if (!indexChart) return;

  const dims = calculateDimensions();
  const cvs = document.getElementById(INDEX_CANVAS);
  const rect = cvs.getBoundingClientRect();

  // Calculate click position relative to canvas
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const charX = Math.floor(mouseX / dims.charWidth);
  const charY = Math.floor(mouseY / dims.charHeight);

  let actions = manageBorderMouseClick(mouseX, mouseY, [...indexStrings.top, ...indexStrings.bottom], [...indexStrings.left, ...indexStrings.right]);
  if (actions) {
    indexChart.showUnderlying = actions.activateTable
  }

  if (indexChart.showUnderlying) {
    // Check for column header clicks first
    if (indexChart.handleColumnClick(charX, charY)) {
      drawChart();
      return;
    }

    // Then check for table navigation
    if (indexChart.handleTableClick(charX, charY)) {
      drawChart();
      return;
    }
  }

  indexChart.handleHelpClick(charX, charY);
  drawChart();
  
}

export function toggleIndexHelp() {
  indexChart.toggleHelp();
}

export async function initIndexPage() {
  const dims = calculateDimensions();
  indexChart = new IndexChart(dims.width, dims.height);

  try {
    await indexChart.updateAllPrices();
    await drawChart();
  } catch (error) {
    console.error('Failed to initialize chart:', error);
  }
}

function onResize() {
  const dims = calculateDimensions();
  if (indexChart) {
    indexChart = new IndexChart(dims.width, dims.height);
    indexChart.updateAllPrices().then(drawChart);
  }
}

window.addEventListener('resize', onResize);

let canvas = document.getElementById(INDEX_CANVAS);
canvas.addEventListener('click', handleCanvasClick);

window.onfocus = function () {
  if (currentState == STATE_INDEX_PAGE) {
    drawChart();
  }
};

canvas.addEventListener('mousemove', (event) => {
  if (manageMouseMove(event, canvas.getBoundingClientRect(), [...indexStrings.top, ...indexStrings.bottom], [...indexStrings.left, ...indexStrings.right], canvas)) {
    return;
  }

  const dims = calculateDimensions();
  const cvs = document.getElementById(INDEX_CANVAS);
  const rect = cvs.getBoundingClientRect();

  // Calculate click position relative to canvas
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  const charX = Math.floor(mouseX / dims.charWidth);
  const charY = Math.floor(mouseY / dims.charHeight);
  let hover = indexChart.isHoveringColumn(charX, charY) || indexChart.isHoveringHelpLink(charX, charY);
  canvas.style.cursor = hover ? 'pointer' : 'default';

  

});