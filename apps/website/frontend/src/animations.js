
export let openingAnimation = [
  {
    background: '$',
    text: ['$'],
    timeseconds: 1
  },
  {
    background: '$',
    text : ["wif" , "goat", "www" , "pepito", "rg" , "sendai"],
    type: "randomtext",
    timeseconds: 2,
    overlapNext: true
  },
  {
    backgroundFromPrevious: true,
    background: '$',
    text : [" standard & voids "],
    type: "fillprogressively",
    timeseconds: 3
  },
  {
    backgroundFromPrevious: true,
    voidling: false,
    background: '$',
    text : [' S&V '],
    type: "fillprogressively",
    timeseconds: 3
  },
  {
    backgroundFromPrevious: true,
    voidling: false,
    voidlingAtPercentage: 0.3,
    background: ' ',
    text : [' '],
    type: "fillprogressively",
    timeseconds: 3
  }
];