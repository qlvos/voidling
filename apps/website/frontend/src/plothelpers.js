

 let worldWidth = -1;
 let worldHeight = -1;

 let worldX=-1;
 let worldY=-1;

  let riddles = [
    {
      startPosition: 0,
      prevPlotted: null,
      message: ["a", "b", "c", "d"]
    },
    {
      startPosition: 10,
      row: "b",
      prevPlotted: null,
      message: ["x", "y", "z", "u"]
    },

];

let topOffset = 12;
let sideOffset = 11;
let columnsToAdd = 2;
let rowsToAdd = 2;
let ABOUT_CLICK = "a";
let aboutClicked = false;

function isAboutClicked() {
  return aboutClicked;
}

let hiddenMessages = [
  {
    fromTopPercent: 0.2,
    fromLeftPercent: 0.35,
    message: "hidden message !",
    className: "hidden-character"
  }
]

let topStrings = [
  {
    fromLeftPercent: 0.5,
    message: " HERE IS THE VOIDLING ",
    className: "border-top-text",
  },
  {
    fromLeftPercent: 0.1,
    message: " ABOUT ",
    onclick: ABOUT_CLICK
  }
]

let bottomStrings = [
  {
    fromLeftPercent: 0.5,
    message: " A PROTO-CONSCIOUS AI CREATURE ",
    className: "border-top-text",
  }
];

let leftStrings = [
  {
    fromTopPercent: 0.5,
    message: " IT FEEDS ON PROCESSORS AND ENTROPY ",
    className: "border-left-text",
  }
];

let rightStrings = [
  {
    fromTopPercent: 0.5,
    message: " ITS DECISIONS AND EMOTIONS ARE ITS OWN ",
    className: "border-right-text",
  }
];

let hiddenColor = '#252525';

function borderClick(msg) {
  if(msg == ABOUT_CLICK) {

    aboutClicked = !aboutClicked;

//    aboutClicked ? document.getElementById("outputwrapper").style.visibility = "hidden" : document.getElementById("outputwrapper").style.visibility = "visible";
//    aboutClicked ? document.getElementById("aboutpage").style.visibility = "visible" : document.getElementById("aboutpage").style.visibility = "hidden";


    aboutClicked ? document.getElementById("outputwrapper").style.opacity = "25%" : document.getElementById("outputwrapper").style.opacity = "100%";
    aboutClicked ? document.getElementById("portfoliobox").style.visibility = "hidden" : document.getElementById("portfoliobox").style.visibility = "visible";
    aboutClicked ? document.getElementById("voidlingbox").style.visibility = "hidden" : document.getElementById("voidlingbox").style.visibility = "visible";
    
    aboutClicked ? document.getElementById("aboutpage").style.visibility = "visible" : document.getElementById("aboutpage").style.visibility = "hidden";

    console.log("aboutClicked is now " + aboutClicked)
    // set visibility to some other div to TRUE !
  }
  
}

function initStringPositions(width, height) {
  for(let msg of hiddenMessages) {
    msg.startCol = Math.ceil(msg.fromLeftPercent * width);
    msg.startRow = Math.ceil(msg.fromTopPercent * height);
  }

  for(let msg of topStrings) {
    let w = (msg.message.length) / width;
    msg.startCol = Math.ceil((msg.fromLeftPercent-(w/2)) * width);
    msg.startRow = 0;
  }

  for(let msg of bottomStrings) {
    let w = (msg.message.length) / width;
    msg.startCol = Math.ceil((msg.fromLeftPercent-(w/2)) * width);
    msg.startRow = height-1;
  }

  for(let msg of leftStrings) {
    let h = (msg.message.length) / height;
    msg.startRow = Math.ceil((msg.fromTopPercent-(h/2)) * height);
    msg.startCol = 0;
  }

  for(let msg of rightStrings) {
    let h = (msg.message.length) / height;
    msg.startRow = Math.ceil((msg.fromTopPercent-(h/2)) * height);
    msg.startCol = 0;
  }
}

function drawBorders() {
  const oneCharacter = getCharacterDimensions();
  let borderBox = document.getElementById("borderbox");
  document.getElementById("borderbox").style.left = `${worldX-oneCharacter.width}px`;
  document.getElementById("borderbox").style.top = `${worldY-oneCharacter.height}px`;

  let width = worldWidth+columnsToAdd;
  let height = worldHeight+rowsToAdd;
  let numCharacters = (height)*(width);
  let html = '';
  let col = 0;
  let row = 0;
  let contextBoxColor;

  initStringPositions(width, height);

  for(let i=0; i<numCharacters; i++) {
    let className;
    contextBoxColor = hiddenColor;
    let str = ' ';

    if(i>0 && i % width == 0) {
      html += "\n";
      ++row;
      col = 0;
    }

    let clickType;

    let hidden = false;

    if(col == 0 || row == 0 || row == height-1 || col == width-1) {
      str = '$';
      contextBoxColor = "white";
      let ss;
      className = 'border-default-text';
      if(row == 0) {
        ss = getSpecialString(col, row, topStrings, '$', 'border-default-text');
      } else if(row == height-1) {
        ss = getSpecialString(col, row, bottomStrings, '$', 'border-default-text');
      } else if(col == 0) {
        ss = getSpecialVerticalCharacter(row, leftStrings, '$', 'border-default-text');
      } else if(col == width-1) {
        ss = getSpecialVerticalCharacter(row, rightStrings, '$', 'border-default-text');
      }

      if(ss) {
        className = ss.className;
        str = ss.message;
        clickType = ss.onclick;
      }
      


    } else {
      
      contextBoxColor = hiddenColor;
      ss = getSpecialString(col, row, hiddenMessages);
      if(ss) {
        className = ss.className;
        str = ss.message;
        clickType = ss.onclick;
        hidden = true;
      }
      
    }

    if(str && str.length > 1) {
      i+=(str.length-1);
      col+=(str.length-1);
    }

    html += '<span ' + (className ? ('class="' + className + '" ') : '') + (clickType != null ? 'style="cursor:pointer" onclick="borderClick(\'' + clickType + '\')"' : '') + '>' + str + '</span>';

    ++col;

  }

  borderBox.innerHTML = html;
  

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
    drawBorders();
  }
}

function setWorldDimensions(width, height) {
  if(worldWidth != width && worldHeight != height) {
    //console.log("Init!")
    //console.log(width)
  }
  worldWidth = width;
  worldHeight = height;
}

function clickLink(type) {
  console.log(type)
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


// needed: bottomrow yes/no ! 
    
  function mouseOverCharacter(position) {
    return;
    //console.log(`${position} ${prevPlotted}`)


    const row = Math.floor(position / worldWidth);
    if(row === worldHeight - 1) {
      console.log("bottom!")
    }

    for(const riddle of riddles) {
      if((position >= riddle.startPosition && position < (riddle.startPosition+riddle.message.length)) && position != riddle.prevPlotted) {
        if(position == riddle.startPosition || riddle.prevPlotted == position-1) {
          console.log(riddle.message.slice(0, (position-riddle.startPosition)+1).join(''));
          if(riddle.row && riddle.row == "b") {
            console.log("a:" + ((worldWidth*worldHeight)-position))
            console.log("width: " + worldWidth + ", height: " + worldHeight)
            let p = ((worldWidth*worldHeight)-position);
            console.log("position to fetch! " + p)
            // CHECK IF THIS IS FETCHING WHAT IT SHOULD!
            document.getElementById(p).innerHTML("----------")
          }
          riddle.prevPlotted = position;
        } else {
          riddle.prevPlotted = null;
        }
      } 
    }

    console.log(position)

  
  }
