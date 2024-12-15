import { logger } from './logger.js';
import { EventSource } from 'eventsource';
import { CAT_BOUGHT_TOKEN, CAT_SOLD_TOKEN } from "./config/eventkeys.js";
import { config } from './config/config.js';
import { buyToken, sellToken } from './services/solana.service.js';
import { getWatchlist, addCatEvent, getLastOpenTrade } from './db/postgresdbhandler.js';

const sseUrl = 'https://api.thecatdoor.com/sse/v1/events';
const eventSource = new EventSource(sseUrl);
const SELL_BUY_WAIT_TIME = 30000;

export async function pickToken() {
  let wlist = await getWatchlist()
  if (!wlist || wlist.length == 0) {
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

export async function buyAndSignalToken(redis) {
  let choice = await pickToken();
  let tokenInfo = await buyToken(choice.address);
  await redis.publish(config.VLING_EVENT_KEY, JSON.stringify({ event: CAT_BOUGHT_TOKEN, tokenInfo }));
}

export async function sellAndSignalToken(redis) {
  let sellInfo = await sellToken();
  await redis.publish(config.VLING_EVENT_KEY, JSON.stringify({ event: CAT_SOLD_TOKEN, ...sellInfo }));
}

export function startCatTrader(redis) {
  // Listen for messages from the SSE endpoint
  eventSource.onmessage = async function (event) {
    try {
      let catEvent = JSON.parse(event.data);
      if (catEvent.event == "pepito") {
        logger.info('New cat event received:', event.data);
        catEvent.time = Date.now();

        // https://github.com/Clement87/Pepito-API
        await addCatEvent(catEvent.type, catEvent.img, catEvent.time);
        if(catEvent.type == "out") {
          let lastOpenTrade = await getLastOpenTrade();
          if (lastOpenTrade) {
            await sellAndSignalToken(redis);
            await new Promise(resolve => setTimeout(resolve, SELL_BUY_WAIT_TIME));
          }
          await buyAndSignalToken(redis);
        }
      }
    } catch (err) {
      console.log(err);
      logger.error("Error on cat event fetching " + err);
    }
  };

  // Listen for errors
  eventSource.onerror = function (error) {
    console.log(error)
    console.error('Error occurred on event source:', error);
  };

  logger.info("listening for pepito events");

}
