import { initIndexPage, toggleIndexHelp } from './indexpage.js';
import { initNomineesPage } from './nomineespage.js';
import { initInfoPage } from './infopage.js';
import { showTradingElements, hideTradingElements } from './main.js'

export function calculateDimensions() {
  try {
    let wrapper = document.getElementById(OUTPUT_WRAPPER);
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


export function getCharacterDimensions() {
  const testChars = '$$$$';
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  context.font = getFont();
  const metrics = context.measureText(testChars);
  const width = Math.ceil(metrics.width / testChars.length);
  const height = Math.ceil(metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent) + 1;
  return { width, height };
}

export const STATE_VOIDLING_PAGE = "v";
export const STATE_INDEX_PAGE = "i";
export const STATE_NOMINEES_PAGE = "n";
export const STATE_INFO_PAGE = "info";

let showInfoPage = false;

export let currentState = STATE_VOIDLING_PAGE; // the default choice

export function borderClick(msg) {
  if (msg.onclick == ABOUT_CLICK) {
    aboutClicked = !aboutClicked;
    !aboutClicked ? showTradingElements() : hideTradingElements();

  } else if (msg.onclick == INDEX_ABOUT_CLICK) {
    toggleIndexHelp();
  } else if (msg.onclick == VOIDLING_ONLY_CLICK) {
    voidlingOnly = !voidlingOnly;
    voidlingOnly ? document.getElementById(PORTFOLIOBOX).style.visibility = "hidden" : document.getElementById("portfoliobox").style.visibility = "visible";
    voidlingOnly ? document.getElementById(VOIDLINGBOX).style.visibility = "hidden" : document.getElementById("voidlingbox").style.visibility = "visible";
    if(voidlingOnly) {
      document.documentElement.style.setProperty('--text-opacity', '70%')
    }
  } else if (msg.onclick == TRADING_ONLY_CLICK) {
    tradingOnly = !tradingOnly;
    tradingOnly ? document.documentElement.style.setProperty('--text-opacity', '100%') : document.documentElement.style.setProperty('--text-opacity', '70%');

    if (tradingOnly) {
      document.getElementById(PORTFOLIOBOX).style.visibility = "visible";
      document.getElementById(VOIDLNGBOX).style.visibility = "visible";
    } 
  } else if (msg.onclick == COLOR_CLICK) {
    schemeCounter = (schemeCounter == (schemes.length - 1)) ? 0 : ++schemeCounter;
    scheme = schemes[schemeCounter]
    document.body.style.backgroundColor = colorScheme.get(scheme).background;
    document.documentElement.style.setProperty('--text-color', colorScheme.get(scheme).textColor);
  } else if (msg.onclick == INDEX_CLICK) {
    currentState = STATE_INDEX_PAGE;
    indexPageActive = !indexPageActive;	
    document.getElementById(VOIDLING_CANVAS).style.visibility = "hidden";
    document.getElementById(PORTFOLIOBOX).style.visibility = "hidden";
    document.getElementById(VOIDLINGBOX).style.visibility = "hidden";
    document.getElementById(NOMINEES_CANVAS).style.visibility = "hidden";
    document.getElementById(INDEX_CANVAS).style.visibility = "visible";
    initIndexPage();

  } else if(msg.onclick == VOIDLING_PAGE_CLICK) {
    currentState = STATE_VOIDLING_PAGE;
    document.getElementById(INDEX_CANVAS).style.visibility = "hidden";
    document.getElementById(NOMINEES_CANVAS).style.visibility = "hidden";
    document.getElementById(VOIDLING_CANVAS).style.visibility = "visible";
    if(!aboutClicked) {
      document.getElementById(PORTFOLIOBOX).style.visibility = "visible";
      document.getElementById(VOIDLINGBOX).style.visibility = "visible";
    }

  }
  else if (msg.onclick == NOMINEES_CLICK) {
    currentState = STATE_NOMINEES_PAGE;
    document.getElementById(INDEX_CANVAS).style.visibility = "hidden";
    document.getElementById(VOIDLING_CANVAS).style.visibility = "hidden";
    document.getElementById(PORTFOLIOBOX).style.visibility = "hidden";
    document.getElementById(VOIDLINGBOX).style.visibility = "hidden";
    document.getElementById(NOMINEES_CANVAS).style.visibility = "visible";

    initNomineesPage();

  } else if (msg.onclick == INFO_CLICK) {
    showInfoPage = !showInfoPage;

    if(showInfoPage) {
      document.getElementById(INDEX_CANVAS).style.visibility = "hidden";
      document.getElementById(VOIDLING_CANVAS).style.visibility = "hidden";
      document.getElementById(PORTFOLIOBOX).style.visibility = "hidden";
      document.getElementById(VOIDLINGBOX).style.visibility = "hidden";
      document.getElementById(NOMINEES_CANVAS).style.visibility = "hidden";
      document.getElementById(INFO_CANVAS).style.visibility = "visible";
      initInfoPage();  
    } else {
      // TODO: here identify whatever page was active BEFORE the info page was visible and go back to that one
      document.getElementById(VOIDLING_CANVAS).style.visibility = "visible";
      document.getElementById(INFO_CANVAS).style.visibility = "hidden"
    }    

  } else if(msg.onclick == INDEX_TOGGLE_CLICK) {
    if(msg.toggler.first) {
      return;
    }
    msg.toggler.first = !msg.toggler.first
    return { activateTable: false }
  } else if(msg.onclick == TABLE_TOGGLE_CLICK) {
    if(!msg.toggler.first) {
      return;
    }
    msg.toggler.first = !msg.toggler.first
    return { activateTable: true }
  }
}

export function manageBorderMouseClick(mouseX, mouseY, horizontalLinkCandidates, verticalLinkCandidates) {
  for (const msg of flattenArray(horizontalLinkCandidates)) {
    if (msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box, horizontalFuzziness, true, false, true)) {
      let action = borderClick(msg);
      if(action) {
        return action;
      }
    }
  }

  for (const msg of flattenArray(verticalLinkCandidates)) {
    if (msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box, verticalFuzziness, true, true, true)) {
      return borderClick(msg);
    }
  }
}

export function manageMouseMove(event, rect, horizontalLinkCandidates, verticalLinkCandidates, canvas) {
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  let isPointer = false;

  for (const msg of flattenArray(horizontalLinkCandidates)) {
    if (msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box, horizontalFuzziness, true, false, true)) {
      isPointer = true;
    }
  }

  for (const msg of flattenArray(verticalLinkCandidates)) {
    if (msg.box && msg.onclick && isMouseOverRect(mouseX, mouseY, msg.box, verticalFuzziness, true, true, true)) {
      isPointer = true;
    }
  }
  canvas.style.cursor = isPointer ? 'pointer' : 'default';
  return isPointer;

}

export function isMouseOverRect(mouseX, mouseY, rect, calculateBox, extendXleft = false, extendXright = false, extendY = false) {
  let yMargin = 1;
  let { startX, endX, startY, endY } = calculateBox(extendXleft, rect, extendXright, extendY);
  let xCondition = mouseX > startX && mouseX < endX;
  let yCondition = mouseY > (startY - yMargin) && mouseY < (endY + yMargin);
  return xCondition && yCondition
}

export function handleClick(x, y, linkPositions) {
  for (const link of linkPositions) {
    if (y >= link.box.starty && y <= link.box.endy && x >= link.box.startx && x <= link.box.endx) {
      link.onclick();
      return true;
    }
  }
  return false;
}

export function isHovering(x, y, linkPositions) {
  for (const link of linkPositions) {
    if (y === link.y && x >= link.startX && x < link.endX) {
      return true;
    }
  }
  return false;
}

