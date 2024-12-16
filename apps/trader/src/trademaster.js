import { logger } from './logger.js';
import { EventSource } from 'eventsource';
import { CAT_BOUGHT_TOKEN, CAT_SOLD_TOKEN } from "./config/eventkeys.js";
import { config } from './config/config.js';
import { buyToken, sellToken } from './services/solana.service.js';
import { getWatchlist, addCatEvent, getLastOpenTrade, getOpenTrades, addSell } from './db/postgresdbhandler.js';
import bent from 'bent';
const getJSON = bent('json');

const TOKEN_PRICE_URL = 'https://public-api.dextools.io/trial/v2/token/solana';
const sseUrl = 'https://api.thecatdoor.com/sse/v1/events';

let eventSource = new EventSource(sseUrl);

const SELL_BUY_WAIT_TIME = 30000;
const MAX_OPEN_TRADES = 9;
const API_CALL_WAIT = 3500;
const PEPITO_RECONNECT_INTERVAL = 30000;

setInterval(() => { eventSource = new EventSource(sseUrl); }, PEPITO_RECONNECT_INTERVAL);

export async function pickToken() {
  let wlist = await getWatchlist()
  if (!wlist || wlist.length == 0) {
    return;
  }

  let filteredList = [];
  let openTrades = await getOpenTrades();
  if(openTrades && openTrades.length > 0) {
    for(const candidate of wlist) {
      let isTrade = false;
      for(const trade of openTrades) {
        if(trade.toaddress.toLowerCase() == candidate.address.toLowerCase()) {
          isTrade = true;
          break;
        }
      }
      if(!isTrade) {
        filteredList.push(candidate);
      }
    }
  } else {
    filteredList = wlist;
  }
  
  let idx = randomNumber(filteredList.length);
  let winner = filteredList[idx];
  logger.info("random pick: " + winner.symbol);
  return winner;
}

function randomNumber(max) {
  return Math.floor(Math.random() * max);
}

export async function buyAndSignalToken(redis) {
  let choice = await pickToken();
  logger.info("buying " + choice.address);
  let tokenInfo = await buyToken(choice.address);
  await redis.publish(config.VLING_EVENT_KEY, JSON.stringify({ event: CAT_BOUGHT_TOKEN, tokenInfo }));
}

export async function sellAndSignalToken(fromaddress, toaddress, amount, redis) {
  let sellInfo = await sellToken(fromaddress, toaddress, amount);
  await redis.publish(config.VLING_EVENT_KEY, JSON.stringify({ event: CAT_SOLD_TOKEN, ...sellInfo }));
  return sellInfo;
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
        if(catEvent.type == "in" || catEvent.type == "out") {
          await manageCatEvent(redis);
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

export async function manageCatEvent(redis) {
  console.log("cat event !")
  let openTrades = await getOpenTrades();
  if(openTrades && openTrades.length >= MAX_OPEN_TRADES) {
    let positions = await getOpenPositionDataHighToLowProfit(openTrades);
    if(positions && positions.length > 0) {
      logger.info("closing position: " + trade.toaddress);
      let trade = positions[0];
      if(trade.variation < 1) {
        logger.info("No position in profit and will not open new ones, aborting.")
        return;
      }
      let sellInfo = await sellAndSignalToken(trade.toaddress, trade.fromaddress, trade.holdingsToken, redis);
      await addSell(trade.id, sellInfo.solDifference, trade.tokenUsd, Date.now());
      logger.info("executed sell transaction, wait a bit before buying...")
      await new Promise(resolve => setTimeout(resolve, SELL_BUY_WAIT_TIME));
    }
  }

  await buyAndSignalToken(redis);
}

async function getOpenPositionDataHighToLowProfit(openTrades) {
  let tradeData = [];
  for (const trade of openTrades) {
    let url = `${TOKEN_PRICE_URL}/${trade.toaddress}/price`;
    logger.info("calling " + url);
    try {
      let res = await getJSON(url, null, { 'x-api-key': config.DEXTOOLS_API_KEY });
      if (res && res.statusCode && res.statusCode == 200 && res.data) {
        let tokenData = res.data;
        let origUsdValue = Number(trade.tokenusdvalue) * Number(trade.receivedamount);
        let currentUsdValue = Number(tokenData.price) * Number(trade.receivedamount);
        tradeData.push({
          id: trade.id,
          toaddress: trade.toaddress,
          fromaddress: trade.fromaddress,
          tokenUsd: tokenData.price,
          holdingsToken: Number(trade.receivedamount),
          holdingsOriginalUsdValue: origUsdValue,
          holdingsCurrentUsdValue: currentUsdValue,
          variation: currentUsdValue / origUsdValue
        });

      }
    } catch (err) {
      logger.warn("Error trying to get dextools information: " + err);
    }
    await new Promise(resolve => setTimeout(resolve, API_CALL_WAIT));
  }
  // sort desc
  return tradeData.sort((a, b) => { return b.variation - a.variation; });
}

