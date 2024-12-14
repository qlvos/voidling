
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

let angelColors = new Map();
angelColors.set(".", "#5f00af");
angelColors.set(",", "#5f00af");
angelColors.set("-", "#0000af");
angelColors.set("~", "#0000af");
angelColors.set(":", "#0000af");
angelColors.set(";", "#0000d7");
angelColors.set("=", "#0000d7");
angelColors.set("!", "#0000af");
angelColors.set("*", "#0000d7");
angelColors.set("#", "#00d700");
angelColors.set("@", "#00d75f");
angelColors.set("$", "#00005f");

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

let hoverColors = [ '#FFFFFF', '#FFCCCC', '#FF9999', '#FF6666', '#FF3333', '#FF0000', '#CC0000', '#990000']

colorScheme.set("daemon", { voidling: daemonColors, hoverColors: hoverColors, background: "#17131d" });
colorScheme.set("angel",  { voidling: angelColors, hoverColors: hoverColors, background: "#f1edf8" });
colorScheme.set("gray",   { voidling: grayColors, hoverColors: hoverColors, background: "#19191a" });

let scheme = "daemon";
let schemes = ["daemon", "angel", "gray"];
let schemeCounter = 0;

 let worldWidth = 0;
 let worldHeight = 0;

 let worldX=0;
 let worldY=0;

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
    fromLeftPercent: 0.5,
    message: " HERE IS THE VOIDLING ",
    color: "#ff8700"
  },
  {
    fromLeftPercent: 0.1,
    message: " ? ",
    color: "#ff8700",
    onclick: ABOUT_CLICK
  },
  {
    fromLeftPercent: 0.2,
    message: " V ",
    color: "#ff8700",
    onclick: VOIDLING_ONLY_CLICK
  },
  {
    fromLeftPercent: 0.3,
    message: " % ",
    color: "#ff8700",
    onclick: TRADING_ONLY_CLICK
  },
  {
    fromLeftPercent: 0.9,
    message: " C ",
    color: "#ff8700",
    onclick: COLOR_CLICK
  }
]



let hiddenColor = '#252525';

function borderClick(msg) {
  if(msg == ABOUT_CLICK) {

    aboutClicked = !aboutClicked;

//    aboutClicked ? document.getElementById("outputwrapper").style.visibility = "hidden" : document.getElementById("outputwrapper").style.visibility = "visible";
//    aboutClicked ? document.getElementById("aboutpage").style.visibility = "visible" : document.getElementById("aboutpage").style.visibility = "hidden";


    //aboutClicked ? document.getElementById("outputwrapper").style.opacity = "25%" : document.getElementById("outputwrapper").style.opacity = "100%";
    aboutClicked ? document.getElementById("portfoliobox").style.visibility = "hidden" : document.getElementById("portfoliobox").style.visibility = "visible";
    aboutClicked ? document.getElementById("voidlingbox").style.visibility = "hidden" : document.getElementById("voidlingbox").style.visibility = "visible";
    //aboutClicked ? document.getElementById("aboutpage").style.visibility = "visible" : document.getElementById("aboutpage").style.visibility = "hidden";
    aboutClicked ? document.getElementById("abouttext").style.visibility = "visible" : document.getElementById("abouttext").style.visibility = "hidden";
    aboutClicked ? document.getElementById("voidlingscontainer").style.visibility = "visible" : document.getElementById("voidlingscontainer").style.visibility = "hidden";

    // set visibility to some other div to TRUE !
  } else if(msg == VOIDLING_ONLY_CLICK) {
    voidlingOnly = !voidlingOnly;
    voidlingOnly ? document.getElementById("portfoliobox").style.visibility = "hidden" : document.getElementById("portfoliobox").style.visibility = "visible";
    voidlingOnly ? document.getElementById("voidlingbox").style.visibility = "hidden" : document.getElementById("voidlingbox").style.visibility = "visible";
   
  } else if(msg == TRADING_ONLY_CLICK) {
    tradingOnly = !tradingOnly;
    if(tradingOnly) {
      document.getElementById("portfoliobox").style.visibility = "visible";
      document.getElementById("voidlingbox").style.visibility = "visible";
    }
  } else if(msg == COLOR_CLICK) {
    schemeCounter = (schemeCounter == (schemes.length-1)) ? 0 : ++schemeCounter;
    scheme = schemes[schemeCounter]
    document.body.style.backgroundColor = colorScheme.get(scheme).background;
  }
  
}

function initStringPositions(width, height) {
  for(let msg of topStrings) {
    let w = (msg.message.length) / width;
    msg.startCol = Math.ceil((msg.fromLeftPercent-(w/2)) * width);
    msg.startRow = 0;
  }
}


function getCharPlusGapWidth() {
      const canvas = document.getElementById('cvas');
      const context = canvas.getContext('2d');
      context.font = window.isMobile ? '24px monospace' : '12px monospace';
      const text = '$$$$$$$$$$';
      // Measure the width of the entire string
      const textWidth = context.measureText(text).width;
  
      // Measure the width of each character
      let totalCharWidth = 0;
      for (let i = 0; i < text.length; i++) {
        totalCharWidth += context.measureText(text[i]).width;
      }
  
      // Calculate the space between characters
      const width = (textWidth / text.length);
      // Measure the height of the character
      const metrics = context.measureText(text);
      const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      return {width: width, height:height}
}

function getSpecialString(col, row, candidates, defCharacter=" ", defClass='hidden-character') {
  for(let msg of candidates) {
    if(col == msg.startCol && row == msg.startRow) {
      return msg;
    }
  }
  return {message: defCharacter, className: defClass};
}

function getSpecialVerticalCharacter(row, candidates, defCharacter=" ", defClass='hidden-character') {
  for(let msg of candidates) {
    if(row >= msg.startRow && row < msg.startRow+msg.message.length) {
      return { message: msg.message[row-msg.startRow] , className: msg.className }
    }
  }
  return {message: defCharacter, className: defClass};
}

function setPosition(x, y) {
  if(worldX != x || worldY != y) {
    worldX = x;
    worldY = y;
  }
}

function setWorldDimensions(width, height) {
  worldWidth = width;
  worldHeight = height;
}

function getCharacterDimensions() {
  const font = window.isMobile ? '24px monospace' : '12px monospace';
  const character = '$';
  // Create a canvas element
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  // Set the font
  context.font = font;

  // Measure the width of the character
  const width = context.measureText(character).width;

  // Measure the height of the character
  const metrics = context.measureText(character);
  const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;

  return { width, height };
}
