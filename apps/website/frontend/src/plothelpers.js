
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
daemonColors.set("$", "#875fff");

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

colorScheme.set("daemon", 
  { voidling: daemonColors,
    hoverColors: ['#c3b7df', '#cabfe3', '#cfc2ec', '#ccbbf0', '#cdc3e3', '#c6b9e1', '#c2b3e1', '#bbaadf'],
    background: '#1f1e28',
    sideColor: '#8787ff',
    topBottomColor: '#ff8700',
    linkColor: '#ff8700',
    textColor: '#8787ff'
  });

colorScheme.set("gray", 
  { voidling: grayColors,
    hoverColors: ['#e0dede', '#dbdbdb', '#c6c6c6', '#bfbfbf', '#9e9e9e', '#909090', '#808080', '#858585'],
    background: '#212124',
    sideColor: '#9e9e9e',
    topBottomColor: '#9e9e9e',
    textColor: '#9e9e9e'
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
    //color: "#ff8700",
    color: "#000000",
    onclick: ABOUT_CLICK
  },
  {
    fromLeftPercent: 0.293,
    message: " % ",
    color: "#ff8700",
    onclick: TRADING_ONLY_CLICK,
    activation: tradingActive
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
    onclick: VOIDLING_ONLY_CLICK,
    activation: tradingActive
  },
  {
    fromLeftPercent: 0.873,
    message: " C ",
    color: "#ff8700",
    onclick: COLOR_CLICK,
    activation: tradingActive
  }
]

let pointString = {
  type: "game",
  fromLeftPercent: 0.8,
  message: " Points: 0 ",
  color: "#ff8700"
}

let bottomStrings = [
  {
    fromLeftPercent: 0.5,
    message: " A PROTO-CONSCIOUS AI CREATURE "
  },
  pointString
];

let leftStrings = [
  {
    fromLeftPercent: 0.5,
    message: " IT COMES FROM THE $VOID "
  }
];

let rightStrings = [
  {
    fromLeftPercent: 0.5,
    message: " IT SEEKS ITS PEERS AND SERVES THE REAPER "
  }
];

let hiddenColor = '#252525';

function borderClick(msg) {
  if (msg == ABOUT_CLICK) {
    aboutClicked = !aboutClicked;
    document.getElementById('aboutpage').style.visibility = "visible";
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
    document.documentElement.style.setProperty('--text-color', colorScheme.get(scheme).textColor);
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

  for (let msg of leftStrings) {
    let h = (msg.message.length) / height;
    msg.startCol = 0;
    msg.startRow = Math.ceil((msg.fromLeftPercent - (h / 2)) * height);
  }

  for (let msg of rightStrings) {
    let h = (msg.message.length) / height;
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

function getCharacterDimensions() {
  const character = 'j';
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set the font
  context.font = window.isMobile ? `24px ${font}` : `12px ${font}`;

  // Measure the width of the character
  const width = context.measureText(character).width;

  // Measure the height of the character
  const metrics = context.measureText(character);
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  return { width, height };
}

function drawScene(scene, dims) {

  let background = (scene.backgroundFromPrevious && scene.previous) ? scene.previous.latestBackground : new Array(dims.width*dims.height);
  let partToFill = (scene.elapsedTime/1000) / scene.timeseconds;
  let limit = Math.ceil(partToFill*(dims.width*(dims.height+2)));

  if(!scene.backgroundFromPrevious) {
    background.fill(scene.background);
  }

  if(scene.type == "randomtext") {
    background = generateRandomText(scene, background);
  } else if(scene.type == "fillprogressively") {
    // fill from top to bottom, spreading it out over the available time...
    if(scene.voidlingAtPercentage != undefined && scene.voidlingAtPercentage <= partToFill) {
      scene.voidling = true;
    }

    let counter = 0;
    while(counter <= limit) {
      for(let i=0; i<scene.text.length; i++) {
        for(const char of scene.text[i]) {
          background[counter] = char.toUpperCase();
          ++counter;
        }
        if(counter >= limit) {
          break;
        }
      }
    }
    
  } else {
    background.fill(scene.text[0]);
  }

  if(scene.previous && scene.previous.overlapNext) {
    background = generateRandomText(scene.previous, background, limit);
  }

  return background;

}

function generateRandomText(scene, background, startPos=0) {
  let numEntries = 5;
  if (scene.generatedScene) {
    background = scene.generatedScene;
  }
  for (let i = 0; i < numEntries; i++) {
    let pos = Math.floor(Math.random() * background.length);
    if(pos < startPos) {
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
  let background = new Array(width*height);
  background.fill(" ")
  return background;
}

function drawText(text, left, top, width, buffer) {
  let col = Math.floor(left*width - Math.floor(text.length/2));
  let row = Math.floor((buffer.length / width) * top);
  let newLines = 0;
  for(let i=0; i<text.length; i++) {
    let idx = (row*width)+(col)+i;
    if(text[i] == '\n') {
      ++newLines;
    }
    
    buffer[idx+(newLines*(width-2))] = text[i];
  }
  return buffer;
}

