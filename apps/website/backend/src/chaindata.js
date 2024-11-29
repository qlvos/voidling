import { config } from './config/config.js';
import { logger } from './logger.js';
import bent from 'bent';
const getJSON = bent('json');

const priceUrl = 'https://public-api.dextools.io/trial/v2/pool/solana';

let rgPair = 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW';
let pnutPair = '4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i'

const API_CALL_WAIT = 3500;

let portfolio = [
  rgPair,
  pnutPair
]

export async function getData() {
  let portfolioData = [];
  for(const pair of portfolio) {
    let url = `${priceUrl}/${pair}/price`;
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

  return portfolioData

}