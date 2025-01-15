
export let openingAnimation = [
  /*{
    background: '$',
    text: ['$'],
    timeseconds: 1,
    voidling: true,
    customVoidling: {
      height: 1300,
      width: 1300
    }
  },*/
  {
    background: '$',
    text : ["wif" , "goat", "www" , "pepito", "rg" , "sendai", "cents", "fartcoin", "zerebro", "ongo", "ai16z", "degenai", "shoggoth", "shegen", "gnon", "lola", "luna", "yousim", "project89", "bully", "pippin", "rex"],
    type: "randomtext",
    timeseconds: 1.8,
    overlapNext: true
  },
  {
    backgroundFromPrevious: true,
    background: '$',
    text : [" standard & voids "],
    type: "fillprogressively",
    timeseconds: 2
  },
  {
    backgroundFromPrevious: true,
    voidling: false,
    background: '$',
    text : [' S&V '],
    type: "fillprogressively",
    timeseconds: 2
  },
  {
    backgroundFromPrevious: true,
    voidling: false,
    voidlingAtPercentage: 0.3,
    background: ' ',
    text : [' '],
    type: "fillprogressively",
    timeseconds: 2
  }
];

export let randomAnimations = [
  {
    voidling: false,
    background: ' ',
    text : [' S&V '],
    fillrate: 0.5,
    type: "fillprogressively",
    timeseconds: 2
  },
  {
    backgroundFromPrevious: true,
    startFromPreviousStart: true,
    background: ' ',
    text : [' '],
    type: "fillprogressively",
    timeseconds: 2
  }
];

export function resetAnimations(animation) {
  for(const anim of animation) {
    anim.previous = null;
    anim.elapsedTime = null;
    anim.startTime = null;
    anim.latestBackground = null;
  }
}