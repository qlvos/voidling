import { logger } from './logger.js';
import { getWatchlist } from './db/postgresdbhandler.js';



export async function pickToken() {
  let wlist = await getWatchlist()
  if(!wlist || wlist.length == 0) {
    return;
  }

  let idx = randomNumber(wlist.length);
  let winner = wlist[idx];
  logger.info("random pick: " + winner.symbol);
  return winner;
}

function randomNumber(max) {
  return Math.floor(Math.random() * max);
}