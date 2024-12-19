export let drops = [
  {
    symbol: "saylor",
    row: -1,
    fromLeftPercent: 0.1,
    speed: 2,
    caught: false,
    points: 100
  },
  {
    symbol: "sbf",
    row: -1,
    fromLeftPercent: 0.5,
    speed: 3,
    caught: false,
    points: -100

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
    symbol: "elon",
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
    symbol: "bitconnect",
    row: -1,
    fromLeftPercent: 0.9,
    speed: 3,
    caught: false,
    points: -500
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
  for (const drop of drops) {
    drop.fromLeftPercent = Math.random();
    drop.speed = Math.floor(Math.random() * 5) + 1;
  
    let min = -15;
    let max = -1;
    drop.row = Math.floor(Math.random() * (max - min + 1)) + min;
  
    setInterval(() => {
      if (drop.row >= worldHeight) {
        drop.fromLeftPercent = Math.random();
      }
      ++drop.row;
    }, drop.speed * 100)
  }
}
