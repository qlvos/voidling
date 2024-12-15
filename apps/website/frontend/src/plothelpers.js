
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
daemonColors.set("@", "#ff8700");
daemonColors.set("$", "#af87ff");

let grayColors = new Map();
grayColors.set(".", "#3a3a3a");
grayColors.set(",", "#3a3a3a");
grayColors.set("-", "#585858");
grayColors.set("~", "#585858");
grayColors.set(":", "#585858");
grayColors.set(";", "#585858");
grayColors.set("=", "#808080");
grayColors.set("!", "#808080");
grayColors.set("*", "#808080");
grayColors.set("#", "#9e9e9e");
grayColors.set("@", "#c6c6c6");
grayColors.set("$", "#767676");

let colorScheme = new Map();
let font = '"Courier New", monospace';
let gameActive = false;

colorScheme.set("daemon", 
  { voidling: daemonColors,
    hoverColors: ['#c3b7df', '#cabfe3', '#cfc2ec', '#ccbbf0', '#cdc3e3', '#c6b9e1', '#c2b3e1', '#bbaadf'],
    background: '#1f1e28',
    sideColor: '#8787ff',
    topBottomColor: '#ff8700'
  });

colorScheme.set("gray", 
  { voidling: grayColors,
    hoverColors: ['#e0dede', '#dbdbdb', '#c6c6c6', '#bfbfbf', '#9e9e9e', '#909090', '#808080', '#858585'],
    background: '#212124',
    sideColor: '#9e9e9e',
    topBottomColor: '#9e9e9e'
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


let topOffset = 0;
let sideOffset = 0;
let columnsToAdd = 0;
let rowsToAdd = 0;
let ABOUT_CLICK = "a";
let VOIDLING_ONLY_CLICK = "v";
let TRADING_ONLY_CLICK = "t";
let COLOR_CLICK = "c";
let aboutClicked = false;

function isAboutClicked() {
  return aboutClicked;
}

let topStrings = [
  {
    fromLeftPercent: 0.126,
    message: " ? ",
    color: "#ff8700",
    onclick: ABOUT_CLICK
  },
  {
    fromLeftPercent: 0.293,
    message: " % ",
    color: "#ff8700",
    onclick: TRADING_ONLY_CLICK
  },
  {
    fromLeftPercent: 0.5,
    message: " THE VOIDLING ",
    color: "#ff8700"
  },
  {
    fromLeftPercent: 0.706,
    message: " V ",
    color: "#ff8700",
    onclick: VOIDLING_ONLY_CLICK
  },
  {
    fromLeftPercent: 0.873,
    message: " C ",
    color: "#ff8700",
    onclick: COLOR_CLICK
  }
]

let pointString = {
  fromLeftPercent: 0.8,
  message: " Points: 0 ",
  color: "#ff8700"
}

let bottomStrings = gameActive ? [pointString] : [];
let hiddenColor = '#252525';

function borderClick(msg) {
  if (msg == ABOUT_CLICK) {
    aboutClicked = !aboutClicked;
    aboutClicked ? document.getElementById("portfoliobox").style.visibility = "hidden" : document.getElementById("portfoliobox").style.visibility = "visible";
    aboutClicked ? document.getElementById("voidlingbox").style.visibility = "hidden" : document.getElementById("voidlingbox").style.visibility = "visible";
    aboutClicked ? document.getElementById("aboutpage").style.visibility = "visible" : document.getElementById("aboutpage").style.visibility = "hidden";
    aboutClicked ? document.getElementById("voidlingscontainer").style.visibility = "visible" : document.getElementById("voidlingscontainer").style.visibility = "hidden";

  } else if (msg == VOIDLING_ONLY_CLICK) {
    voidlingOnly = !voidlingOnly;
    voidlingOnly ? document.getElementById("portfoliobox").style.visibility = "hidden" : document.getElementById("portfoliobox").style.visibility = "visible";
    voidlingOnly ? document.getElementById("voidlingbox").style.visibility = "hidden" : document.getElementById("voidlingbox").style.visibility = "visible";
    if(voidlingOnly) {
      document.documentElement.style.setProperty('--text-opacity', '70%')
    }
  } else if (msg == TRADING_ONLY_CLICK) {
    tradingOnly = !tradingOnly;
    tradingOnly ? document.documentElement.style.setProperty('--text-opacity', '100%') : document.documentElement.style.setProperty('--text-opacity', '70%');

    if (tradingOnly) {
      document.getElementById("portfoliobox").style.visibility = "visible";
      document.getElementById("voidlingbox").style.visibility = "visible";
    } 
  } else if (msg == COLOR_CLICK) {
    schemeCounter = (schemeCounter == (schemes.length - 1)) ? 0 : ++schemeCounter;
    scheme = schemes[schemeCounter]
    document.body.style.backgroundColor = colorScheme.get(scheme).background;
  }

}

function initStringPositions(width, height) {
  for (let msg of topStrings) {
    let w = (msg.message.length) / width;
    msg.startCol = Math.ceil((msg.fromLeftPercent - (w / 2)) * width);
    msg.startRow = 0;
  }

  for (let msg of bottomStrings) {
    let w = (msg.message.length) / width;
    msg.startCol = Math.ceil((msg.fromLeftPercent - (w / 2)) * width);
    msg.startRow = 0;
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

function getCharacterDimensions() {
  const character = '$';
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set the font
  context.font = window.isMobile ? `24px ${font}` : `12px ${font}`;;

  // Measure the width of the character
  const width = context.measureText(character).width;

  // Measure the height of the character
  const metrics = context.measureText(character);
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  return { width, height };
}
