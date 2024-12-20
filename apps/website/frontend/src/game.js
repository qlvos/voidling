export let drops = [
  {
    symbol: "bitconnect",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -500
  },
  {
    symbol: "gensler",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -200
  },
  {
    symbol: "OneCoin",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -150
  },
  {
    symbol: "AnubisDAO",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -100
  },
  {
    symbol: "SQUID",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -100
  },
  {
    symbol: "sbf",
    row: -1,
    fromLeftPercent: 0.5,
    speed: 3,
    caught: false,
    points: -75

  },
  {
    symbol: "ftx",
    row: -1,
    speed: 4,
    fromLeftPercent: 0.7,
    caught: false,
    points: -50
  },
  {
    symbol: "3ac",
    row: -1,
    speed: 4,
    fromLeftPercent: 0.7,
    caught: false,
    points: -50
  },
  {
    symbol: "elon",
    row: -1,
    fromLeftPercent: 0.8,
    speed: 4,
    caught: false,
    points: 50
  },
  {
    symbol: "bukele",
    row: -1,
    fromLeftPercent: 0.8,
    speed: 4,
    caught: false,
    points: 50
  },
  {
    symbol: "pepe",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 50
  },
  {
    symbol: "trump",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 50
  },
  {
    symbol: "saylor",
    row: -1,
    fromLeftPercent: 0.1,
    speed: 2,
    caught: false,
    points: 100
  },
  {
    symbol: "goat",
    row: -1,
    fromLeftPercent: 0.8,
    speed: 4,
    caught: false,
    points: 100
  },
  {
    symbol: "cz",
    row: -1,
    fromLeftPercent: 0.1,
    speed: 2,
    caught: false,
    points: 100
  },
  {
    symbol: "sol",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: 100
  }
]


export function startGame() {
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

  firstDrop.row = -1;

  

}
