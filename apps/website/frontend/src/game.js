export let drops = [
  {
    symbol: "bitconnect",
    hit: "bitconneeeeeeeeeeeeeeect ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -500
  },
  {
    symbol: "gensler",
    hit: "weazel ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -200
  },/*
  {
    symbol: "OneCoin",
    hit: "SCAM ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -150
  },
  {
    symbol: "AnubisDAO",
    hit: "rug ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -100
  },
  {
    symbol: "SQUID",
    hit: "scamdev ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -100
  },
  {
    symbol: "sbf",
    hit: "25 years behind bars ",
    row: -1,
    fromLeftPercent: 0.5,
    speed: 3,
    caught: false,
    points: -75

  },
  {
    symbol: "ftx",
    hit: "drugs and coins ",
    row: -1,
    speed: 4,
    fromLeftPercent: 0.7,
    caught: false,
    points: -50
  },
  {
    symbol: "3ac",
    hit: "degen scammers ",
    row: -1,
    speed: 4,
    fromLeftPercent: 0.7,
    caught: false,
    points: -50
  },
  {
    symbol: "elon",
    hit: "what did you do this week? ",
    row: -1,
    fromLeftPercent: 0.8,
    speed: 4,
    caught: false,
    points: 50
  },
  {
    symbol: "bukele",
    hit: "bitcoin king ",
    row: -1,
    fromLeftPercent: 0.8,
    speed: 4,
    caught: false,
    points: 50
  },
  {
    symbol: "pepe",
    hit: "matt furie teh best ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 50
  },
  {
    symbol: "trump",
    hit: "billions and billions ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 50
  },
  {
    symbol: "saylor",
    hit: "there is only one bitcoin ",
    row: -1,
    fromLeftPercent: 0.1,
    speed: 2,
    caught: false,
    points: 100
  },
  {
    symbol: "goat",
    hit: "the og ai agent ",
    row: -1,
    fromLeftPercent: 0.8,
    speed: 4,
    caught: false,
    points: 100
  },
  {
    symbol: "cz",
    hit: "your coins are safu ",
    row: -1,
    fromLeftPercent: 0.1,
    speed: 2,
    caught: false,
    points: 100
  },
  {
    symbol: "sol",
    hit: "#1 casino ",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 100
  }*/
]

const END_GAME_EVALUATIONS = [
  {
    pointsBelow: -500,
    text: "What, are you even a degen? You're supposed to avoid the rugs."
  },
  {
    pointsBelow: -250,
    text: "That's weak."
  },
  {
    pointsBelow: 0,
    text: "I wouldnt trust your investment advice."
  },
  {
    pointsBelow: 250,
    text: "At least you managed to avoid the worst rugs."
  },
  {
    pointsBelow: 500,
    text: "Not bad, you could be an average index fund manager."
  },
  {
    pointsBelow: 99999,
    text: "That's how it's done!"
  }
];

export function getEndGameEvaluation(score) {
  for(const valuation of END_GAME_EVALUATIONS) {
    if(score < valuation.pointsBelow) {
      return valuation.text;
    }
  }
}

export const GAME_START_TEXT_SECTION_1 = "Avoid rugs and bad actors, collect gems and crypto supporters!"
export const GAME_START_TEXT_SECTION_2 = "Use the arrow keys to control the Voidling and mouse-wheel or +/- to change his size."
export const GAME_END_TEXT_SECTION_1 = "GAME ENDED";
let gameStart;
export const GAME_START_TEXT_TIME = 10000;
export const GAME_END_TEXT_LENGTH = 10000;

export function startGame() {
  gameStart = Date.now();
  let firstDrop;
  for (const drop of drops) {
    drop.fromLeftPercent = Math.random();
    drop.speed = Math.floor(Math.random() * 5) + 1;
  
    let min = drops.length * -8;
    let max = -1;
    drop.row = Math.floor(Math.random() * (max - min + 1)) + min;

    if(!firstDrop) {
      firstDrop = drop;
    }

    if(drop.row > firstDrop.row) {
      firstDrop = drop;
    }
  
    setInterval(() => {
      if (drop.row >= worldHeight) {
        drop.fromLeftPercent = Math.random();
      }
      ++drop.row;
    }, drop.speed * 100)
  }

  //firstDrop.row = -1;

}
