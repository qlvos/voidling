window.isMobile = window.innerWidth <= 999;

let daemonColors = new Map();
daemonColors.set(".", "#5f00ff");
daemonColors.set(",", "#5f00ff");
daemonColors.set("-", "#875fff");
daemonColors.set("~", "#875fff");
daemonColors.set(":", "#875fff");
daemonColors.set(";", "#5f00ff");
daemonColors.set("=", "#5f00ff");
daemonColors.set("!", "#8787ff");
daemonColors.set("*", "#8787ff");
daemonColors.set("#", "#d75f00");
daemonColors.set("@", "#5f5fff");
daemonColors.set("$", "#875fff");

let grayColors = new Map();
grayColors.set(".", "#211e3a");
grayColors.set(",", "#211e3a");
grayColors.set("-", "#211e3a");
grayColors.set("~", "#211e3a");
grayColors.set(":", "#211e3a");
grayColors.set(";", "#211e3a");
grayColors.set("=", "#211e3a");
grayColors.set("!", "#c0b0ff");
grayColors.set("*", "#c0b0ff");
grayColors.set("#", "#e06b04");
grayColors.set("@", "#ff8700");
grayColors.set("$", "#211e3a");

let colorScheme = new Map();

const GRID_COLORS = {
  blue: "#5f5fff",
  darkblue: "#302360",
  darkorange: "#d75f00",
  orange: "#ff8700",
  purple: "#875fff"
}

let font = "ProtoMono, monospace";

const PORTFOLIOBOX = "portfoliobox";
const VOIDLINGBOX = "voidlingbox";
const VOIDLINGEXPRESSION = "voidlingexpression";
const VOIDLING_CANVAS = "voidling-canvas";
const INDEX_CANVAS = "index-canvas";
const INFO_CANVAS = "info-canvas";
const NOMINEES_CANVAS = "nominees-canvas";
const OUTPUT_WRAPPER = "outputwrapper";

const TOP_TEXT = " S&V ";
const LEFT_TEXT = " IT COMES FROM THE VOID ";
const RIGHT_TEXT = " IT SERVES THE REAPER ";
const BOTTOM_TEXT = " STANDARD & VOID'S ";

colorScheme.set("daemon",
  {
    voidling: daemonColors,
    hoverColors: ['#c3b7df', '#cabfe3', '#cfc2ec', '#ccbbf0', '#cdc3e3', '#c6b9e1', '#c2b3e1', '#bbaadf'],
    background: '#1f1e28',
    sideColor: '#8787ff',
    topBottomColor: '#ff8700',
    linkColor: '#ff8700',
    textColor: '#8787ff',
    borderColor: '#875fff',
    plusSignColor: '#5f5fff',
    realGridColor: '#302360',
    labelColor: '#5f5fff',
    tableTitleColor: '#5f5fff',
    tableContentColor: '#875fff',
    orangeTitleColor: '#ff8700',
    darkOrangeTitle: '#d75f00',
    specialTitleColor: '#ff8700',
    specialContentColor: '#5f5fff'
  });

colorScheme.set("gray",
  {
    voidling: grayColors,
    hoverColors: ['#e0dede', '#dbdbdb', '#c6c6c6', '#bfbfbf', '#9e9e9e', '#909090', '#808080', '#858585'],
    background: '#875fff',
    sideColor: '#c0b0ff',
    topBottomColor: '#ff8700',
    textColor: '#c0b0ff',
    borderColor: '#211e3a',
    plusSignColor: '#211e3a',
    realGridColor: '#957aff',
    labelColor: '#c0b0ff',
    tableTitleColor: '#c0b0ff',
    tableContentColor: '#c0b0ff',
    orangeTitleColor: '#ff8700',
    darkOrangeTitle: '#e06b04',
    specialTitleColor: '#c0b0ff',
    specialContentColor: '#211e3a'
  });

let scheme = "daemon";
let schemes = ["daemon", "gray"];
let schemeCounter = 0;

let worldWidth = 0;
let worldHeight = 0;
let worldX = 0;
let worldY = 0;

let tradingOnly = false;
let voidlingOnly = false;

function saveColorScheme(newScheme) {
  scheme = newScheme;
  localStorage.setItem('selectedColorScheme', newScheme);

  // Update scheme counter to match the new scheme
  schemeCounter = schemes.indexOf(newScheme);
  if (schemeCounter === -1) schemeCounter = 0;

  // Notify all components of color scheme change
  document.dispatchEvent(new Event('colorSchemeChange'));
}

function initColorScheme() {
  const savedScheme = localStorage.getItem('selectedColorScheme');
  if (savedScheme && schemes.includes(savedScheme)) {
    scheme = savedScheme;
    schemeCounter = schemes.indexOf(savedScheme);
  }
}

function getStringColor(stringType) {
  const currentScheme = colorScheme.get(scheme);
  if (!currentScheme) return '#ff8700'; // fallback color

  switch (stringType) {
    case 'navigation':
      return currentScheme.linkColor || currentScheme.topBottomColor;
      case 'stable-titles':
        return currentScheme.sideColor || currentScheme.specialTitleColor;
    case 'border':
      return currentScheme.topBottomColor;
    case 'side':
      return currentScheme.sideColor;
    default:
      return currentScheme.textColor;
  }
}

function applyStringColor(stringObj) {
  if (!stringObj) return getStringColor('default');
  const color = typeof stringObj.color === 'function'
    ? stringObj.color()
    : stringObj.color;
  return color || getStringColor('default');
}

let topOffset = 0;
let sideOffset = 0;
let columnsToAdd = 0;
let rowsToAdd = 0;
let ABOUT_CLICK = "a";
let INDEX_ABOUT_CLICK = "ia";
let VOIDLING_ONLY_CLICK = "v";
let VOIDLING_PAGE_CLICK = "vp";
let TRADING_ONLY_CLICK = "t";
let INDEX_TOGGLE_CLICK = "it";
let TABLE_TOGGLE_CLICK = "tb";
let INDEX_CLICK = "i";
let NOMINEES_CLICK = "n";
let CHART_CLICK = "ch";
let COLOR_CLICK = "c";
let INFO_CLICK = "info";
let aboutClicked = false;

async function loadFonts() {
  try {
    await Promise.all([
      document.fonts.load('12px ProtoMono'),
      document.fonts.load('24px ProtoMono')
    ]);
    return true;
  } catch (err) {
    console.error('Font loading error:', err);
    return false;
  }
}

function getFont() {
  return window.isMobile ? `24px ${font}` : `12px ${font}`;
}

function getCanvasTextAlign() {
  return 'center';
}

function getCanvasDimensions(id) {
  const cvs = document.getElementById(id);
  const dpr = window.devicePixelRatio || 1;
  return { width: 10 + cvs.offsetWidth * dpr, height: cvs.offsetHeight * dpr }
}

function applyCurrentColorScheme() {
  const currentScheme = colorScheme.get(scheme);
  document.body.style.backgroundColor = currentScheme.background;
  document.documentElement.style.setProperty('--text-color', currentScheme.textColor);
}

function isAboutClicked() {
  return aboutClicked;
}

//todo:remove
//let tradingActive = true;
//let gameStarted = false;

// 0.126, 0.293, 0.747 0.873

let pointString = {
  type: "game",
  fromLeftPercent: 0.75,
  message: " POINTS: 0 ",
  color: "#ff8700"
}

let colorString = {
  fromLeftPercent: !window.isMobile ? 0.25 : 0.20,
  message: " COLOR ",
  color: () => getStringColor('navigation'),
  onclick: COLOR_CLICK,
  activation: tradingActive
}

let infoString = {
  fromLeftPercent: !window.isMobile ? 0.75 : 0.80,
  message: " ABOUT ",
  color: () => getStringColor('navigation'),
  onclick: INFO_CLICK,
  activation: tradingActive
}

let indexString = !window.isMobile ? " INDEX " : " IDX ";
let tableString = !window.isMobile ? " TABLE " : " LIST ";
let nomineeString = !window.isMobile ? " NOMINEES " : " PICKS ";

let voidlingStrings = {
  top: [
    {
      fromLeftPercent: 0.126,
      message: " ? ",
      onclick: ABOUT_CLICK
    },
    {
      fromLeftPercent: 0.293,
      message: " VOIDLING ",
      color: () => getStringColor('border'),
      onclick: VOIDLING_ONLY_CLICK,
      activation: tradingActive
    },
    {
      fromLeftPercent: 0.5,
      message: TOP_TEXT,
      color: () => getStringColor('stable-titles')
    },
    {
      fromLeftPercent: 0.666,
      message: indexString,
      color: () => getStringColor('border'),
      onclick: INDEX_CLICK,
      activation: tradingActive
    },
    {
      fromLeftPercent: 0.833,
      message: nomineeString,
      color: "#ff8700",
      color: () => getStringColor('border'),
      onclick: NOMINEES_CLICK,
      activation: tradingActive
    }
  ],
  left: [
    {
      fromLeftPercent: 0.5,
      message: LEFT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  right: [
    {
      fromLeftPercent: 0.5,
      message: RIGHT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  bottom: [
    colorString,
    {
      fromLeftPercent: 0.5,
      message: BOTTOM_TEXT,
      color: () => getStringColor('stable-titles')
    },
    pointString,
    infoString
  ]
}

let indexTableToggler = { first: true }

let indexStrings = {
  top: [
    {
      fromLeftPercent: 0.126,
      message: " ? ",
      onclick: INDEX_ABOUT_CLICK
    },
    {
      fromLeftPercent: 0.293,
      message: " VOIDLING ",
      color: () => getStringColor('navigation'),
      onclick: VOIDLING_PAGE_CLICK,
      activation: tradingActive
    },
    {
      fromLeftPercent: 0.5,
      message: TOP_TEXT,
      color: () => getStringColor('stable-titles')
    },
    {
      toggle: true,
      fromLeftPercent: 0.666,
      activation: tradingActive,
      activeIndex: 0,
      toggleStrings: [
        {
          display: true,
          message: tableString,
          color: () => getStringColor('navigation'),
          onclick: TABLE_TOGGLE_CLICK,
          toggler: indexTableToggler
        },
        {
          message: indexString,
          color: () => getStringColor('navigation'),
          onclick: INDEX_TOGGLE_CLICK,
          toggler: indexTableToggler
        }
      ]
    },
    {
      fromLeftPercent: 0.833,
      message: nomineeString,
      color: () => getStringColor('navigation'),
      onclick: NOMINEES_CLICK,
      activation: tradingActive
    }
  ],
  left: [
    {
      fromLeftPercent: 0.5,
      message: LEFT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  right: [
    {
      fromLeftPercent: 0.5,
      message: RIGHT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  bottom: [
    colorString,
    {
      fromLeftPercent: 0.5,
      message: BOTTOM_TEXT,
      color: () => getStringColor('stable-titles')
    },
    infoString
  ]
}

let nomineeStrings = {
  top: [
    {
      fromLeftPercent: 0.293,
      message: " VOIDLING ",
      color: () => getStringColor('navigation'),
      onclick: VOIDLING_PAGE_CLICK,
      activation: tradingActive
    },
    {
      fromLeftPercent: 0.5,
      message: TOP_TEXT,
      color: () => getStringColor('border')
    },
    {
      fromLeftPercent: 0.75,
      activation: tradingActive,
      message: indexString,
      color: () => getStringColor('navigation'),
      onclick: INDEX_CLICK
    }

  ],
  left: [
    {
      fromLeftPercent: 0.5,
      message: LEFT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  right: [
    {
      fromLeftPercent: 0.5,
      message: RIGHT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  bottom: [
    colorString,
    {
      fromLeftPercent: 0.5,
      message: BOTTOM_TEXT,
      color: () => getStringColor('stable-titles')
    },
    infoString
  ]
}

let infoStrings = {
  top: [

    {
      fromLeftPercent: 0.5,
      message: TOP_TEXT,
      color: () => getStringColor('stable-titles')
    }
  ],
  left: [
    {
      fromLeftPercent: 0.5,
      message: LEFT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  right: [
    {
      fromLeftPercent: 0.5,
      message: RIGHT_TEXT,
      color: () => getStringColor('side')
    }
  ],
  bottom: [
    colorString,
    {
      fromLeftPercent: 0.5,
      message: BOTTOM_TEXT,
      color: () => getStringColor('stable-titles')
    },
    infoString
  ]
}

let hiddenColor = '#252525';

let indexPageActive = false;

function initStringPositions(width, height) {

  let topStrings = [...voidlingStrings.top, ...indexStrings.top, ...nomineeStrings.top, ...infoStrings.top];
  for (let msg of topStrings) {
    if (msg.toggle) {
      for (let tmsg of msg.toggleStrings) {
        let w = tmsg.message.length / width;
        tmsg.startCol = Math.ceil((msg.fromLeftPercent - (w / 2)) * width);
        tmsg.startRow = 0;
      }
    } else {
      let w = msg.message.length / width;
      msg.startCol = Math.ceil((msg.fromLeftPercent - (w / 2)) * width);
      msg.startRow = 0;
    }
  }

  let bottomStrings = [...voidlingStrings.bottom, ...indexStrings.bottom, ...nomineeStrings.bottom, ...infoStrings.bottom]
  for (let msg of bottomStrings) {
    let w = (msg.toggle ? msg.toggleStrings[0].message.length : msg.message.length) / width;
    msg.startCol = Math.ceil((msg.fromLeftPercent - (w / 2)) * width);
    msg.startRow = height;
  }

  let leftStrings = [...voidlingStrings.left, ...indexStrings.left, ...nomineeStrings.left, ...infoStrings.left];
  for (let msg of leftStrings) {
    let h = (msg.toggle ? msg.toggleStrings[0].message.length : msg.message.length) / height;
    msg.startCol = 0;
    msg.startRow = Math.ceil((msg.fromLeftPercent - (h / 2)) * height);
  }

  let rightStrings = [...voidlingStrings.right, ...indexStrings.right, ...nomineeStrings.right, ...infoStrings.right];
  for (let msg of rightStrings) {
    let h = (msg.toggle ? msg.toggleStrings[0].message.length : msg.message.length) / height;
    msg.startCol = 0;
    msg.startRow = Math.ceil((msg.fromLeftPercent - (h / 2)) * height);
  }

}

function getSpecialString(col, row, candidates, defCharacter = " ", defClass = 'hidden-character') {
  for (let msg of candidates) {
    if (col == msg.startCol && row == msg.startRow) {
      return msg;
    }
  }
  return { message: defCharacter, className: defClass };
}

function getSpecialVerticalCharacter(row, candidates, defCharacter = " ", defClass = 'hidden-character') {
  for (let msg of candidates) {
    if (row >= msg.startRow && row < msg.startRow + msg.message.length) {
      return { message: msg.message[row - msg.startRow], className: msg.className }
    }
  }
  return { message: defCharacter, className: defClass };
}

function setPosition(x, y) {
  if (worldX != x || worldY != y) {
    worldX = x;
    worldY = y;
  }
}

function setWorldDimensions(width, height) {
  worldWidth = width;
  worldHeight = height;
}

function drawScene(scene, dims) {

  let background = (scene.backgroundFromPrevious && scene.previous) ? scene.previous.latestBackground : new Array(dims.width * dims.height);
  let partToFill = (scene.elapsedTime / 1000) / scene.timeseconds;
  let limit = Math.ceil(partToFill * (dims.width * (dims.height + 2)));

  if (!scene.backgroundFromPrevious) {
    background.fill(scene.background);
  }

  if (scene.type == "randomtext") {
    background = generateRandomText(scene, background);
  } else if (scene.type == "fillprogressively") {
    // fill from top to bottom, spreading it out over the available time...
    if (scene.voidlingAtPercentage != undefined && scene.voidlingAtPercentage <= partToFill) {
      scene.voidling = true;
    }

    let counter = 0;
    while (counter <= limit) {
      for (let i = 0; i < scene.text.length; i++) {
        for (const char of scene.text[i]) {
          background[counter] = char.toUpperCase();
          ++counter;
        }
        if (counter >= limit) {
          break;
        }
      }
    }

  } else {
    background.fill(scene.text[0]);
  }

  if (scene.previous && scene.previous.overlapNext) {
    background = generateRandomText(scene.previous, background, limit);
  }

  return background;

}

function generateRandomText(scene, background, startPos = 0) {
  let numEntries = 5;
  if (scene.generatedScene) {
    background = scene.generatedScene;
  }
  for (let i = 0; i < numEntries; i++) {
    let pos = Math.floor(Math.random() * background.length);
    if (pos < startPos) {
      continue;
    }
    let item = scene.text[Math.floor(Math.random() * scene.text.length)].toUpperCase();
    item = ` ${item} `;
    for (let i = 0; i < item.length; i++) {
      if (pos + i < background.length - 1) {
        background[pos + i] = item[i];
      }
    }
  }
  scene.generatedScene = background;
  return background;
}

function getBackground(width, height) {
  let background = new Array(width * height);
  background.fill(" ")
  return background;
}

function drawText(text, left, top, width, buffer) {
  let col = Math.floor(left * width - Math.floor(text.length / 2));
  let row = Math.floor((buffer.length / width) * top);
  let newLines = 0;
  for (let i = 0; i < text.length; i++) {
    let idx = (row * width) + (col) + i;
    if (text[i] == '\n') {
      ++newLines;
    }

    buffer[idx + (newLines * (width - 2))] = text[i];
  }
  return buffer;
}

function borderCharacter(col, row, currentX, currentY, cv, char, c, cscheme, strings, vertical = false, gameStarted = false) {
  let bc = getBorderCharacter(col, row, currentX, currentY, cv, strings, vertical, gameStarted);
  if (bc) {
    char = bc.char;
    // Updated color handling for border elements
    if (bc.link) {
      // For clickable elements, use the navigation color from current scheme
      c = getStringColor('navigation');
    } else if (vertical) {
      // For vertical borders, use side color
      c = getStringColor('side');
    } else {
      // For horizontal borders, use border color
      c = getStringColor('stable-titles');
    }
  }
  return { char, c };
}

function getBorderCharacter(col, row, currentX, currentY, cv, strings, vertical = false, gameStarted = false) {
  for (let msgObj of strings) {
    if (msgObj.activation != undefined && !msgObj.activation) {
      continue;
    }

    if (msgObj.type == "game" && !gameStarted) {
      continue;
    }

    let msg = msgObj.toggle ? (msgObj.toggleStrings[0].toggler.first ? msgObj.toggleStrings[0] : msgObj.toggleStrings[1]) : msgObj;

    if (vertical) {
      if (row >= msg.startRow && row < (msg.startRow + msg.message.length)) {
        if (!msg.box) {
          msg.box = { startx: (currentX * cv.width), endx: ((currentX * cv.width) + (cv.width)), starty: currentY, endy: currentY + msg.message.length };
        }
        return { char: msg.message[row - msg.startRow], link: msg.onclick != null };
      }

    } else {
      if (col >= msg.startCol && col < (msg.startCol + msg.message.length)) {
        if (!msg.box) {
          msg.box = { startx: (currentX * cv.width), endx: ((currentX * cv.width) + (cv.width * msg.message.length)), starty: row * cv.height, endy: (row * cv.height) + cv.height };
        }

        return { char: msg.message[col - msg.startCol], link: msg.onclick != null };
      }

    }

  }
}

function verticalFuzziness(extendXleft, rect, extendXright, extendY) {
  let xFuzziness = 20;
  let yFuzziness = 15;
  let startX = extendXleft ? rect.startx - xFuzziness : rect.startx;
  let endX = extendXright ? rect.endx + xFuzziness : rect.endx;
  let startY = extendY ? rect.starty - yFuzziness : rect.starty;
  let endY = extendY ? rect.endy + yFuzziness : rect.endy;
  return { startX, endX, startY, endY };
}

function horizontalFuzziness(extendXleft, rect, extendXright, extendY) {
  let xFuzziness = 10;
  let yFuzziness = 5;
  let startX = extendXleft ? rect.startx - xFuzziness : rect.startx;
  let endX = extendXright ? rect.endx + xFuzziness : rect.endx;
  let startY = extendY ? rect.starty - yFuzziness : rect.starty;
  let endY = extendY ? rect.endy + yFuzziness : rect.endy;
  return { startX, endX, startY, endY };
}

function flattenArray(arr) {
  const flattened = [];

  arr.forEach(entry => {
    if (entry.toggle && Array.isArray(entry.toggleStrings)) {
      entry.toggleStrings.forEach(toggleEntry => {
        flattened.push({
          ...entry,
          ...toggleEntry
        });
      });
    } else {
      flattened.push(entry);
    }
  });

  return flattened;
}