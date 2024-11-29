import { config } from './config/config.js';
import { logger } from './logger.js';
import bent from 'bent';
const getJSON = bent('json');

const priceUrl = 'https://public-api.dextools.io/trial/v2/pool/solana';

let rgPair = 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW';
let pnutPair = '4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i'

const API_CALL_WAIT = 3500;

let portfolio = [
  {
    name : 'RG',
    address: 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW'
  },
  {
    name : 'PNUT',
    address: '4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i'
  }
]

let watchlist = [
  {
    name : 'RG',
    address: 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW'
  },
  {
    name : 'PNUT',
    address: '4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i'
  }
]

let latestinvestment = [
  {
    name : 'RG',
    address: 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW'
  }
]

export async function getData() {
  let portfolioData = [];
  for(const pair of portfolio) {
    let url = `${priceUrl}/${pair.address}/price`;
    logger.info("calling " + url);
    try {
      let res = await getJSON(url, null, {'x-api-key': config.DEXTOOLS_API_KEY});
      if(res && res.statusCode && res.statusCode == 200 && res.data) {
        portfolioData.push(res.data);
      } 
    } catch(err) {
      logger.warn("Error trying to get dextools information: " + err);
    }
    await new Promise(resolve => setTimeout(resolve, API_CALL_WAIT));
  }

  return portfolioData;
}

const NUM_BUYS_MAX_RANGE = 3000;
const NUM_SELLS_MAX_RANGE = 3000;
const VARIATION_MIN = -100;
const VARIATION_MAX = 100;
const RADIUS_MIN = 4;
const RADIUS_MAX = 8;

export async function getPortfolioStats() {
  let assetStats = await getData();
  //let oneHstats = getStatsOverPeriod(assetStats, "1h");
  let sixHstats = getStatsOverPeriod(assetStats, "6h");

// (rangeMin, rangeMax, valueMin, valueMax, value) {

  console.log(sixHstats);
  
  let normalized = {
    radius : normalize(RADIUS_MIN, RADIUS_MAX, 0, Math.max(NUM_BUYS_MAX_RANGE, sixHstats.buys), sixHstats.buys),
    sells : normalize(RADIUS_MIN, RADIUS_MAX, 0, Math.max(NUM_SELLS_MAX_RANGE, sixHstats.sells), sixHstats.sells),
    variation: normalize(RADIUS_MIN, RADIUS_MAX, Math.min(VARIATION_MIN, sixHstats.variation), Math.max(VARIATION_MAX, sixHstats.variation), sixHstats.variation)
  }

  return {
    stats: normalized,
    assets: portfolio,
    watchlist: watchlist,
    latestinvestment: latestinvestment
  }
}


function normalize(rangeMin, rangeMax, valueMin, valueMax, value) {
  return ((rangeMax-rangeMin)*(value-valueMin)/(valueMax-valueMin)) + rangeMin;
}

function getStatsOverPeriod(assetStats, period) {
  let volume = 0;
  let buys = 0;
  let sells = 0;
  let variation = 0;
  console.log(period)
  for(const asset of assetStats) {
    console.log(asset)
    volume += asset['volume'+period];
    buys += asset['buys'+period];
    sells += asset['sells'+period];
    variation += asset['variation'+period];
  }
  return {
    volume: volume,
    buys: buys,
    sells: sells,
    variation: variation
  }
}