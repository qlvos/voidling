import { logger } from './logger.js';
import { CAT_BUY_TOKEN, CAT_BUY_RANDOM_TOKEN, CAT_SELL_TOKEN, CAT_BOUGHT_TOKEN, CAT_SOLD_TOKEN } from "./config/eventkeys.js";
import { config } from './config/config.js';
import { buyToken, sellToken } from './services/solana.service.js';
import { pickToken } from './trademaster.js'; 

//import { setAiActive, isAiActive, setXactive, isXactive } from "./util/util.js";

let buyAmount = 0.0001;

export async function catRouter(message, redis) {
  console.log("catRouter")
  console.log(message)
  if(message.event == CAT_BUY_TOKEN) {
    let swapDetails = await buyToken(message.token, redis);
    await this.redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_BOUGHT_TOKEN }));
  } else if(message.event == CAT_BUY_RANDOM_TOKEN) {
    let choice = pickToken();
    console.log(choice);
    let tokenInfo = await buyToken(choice.address, redis);
    console.log(tokenInfo)
    await redis.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_BOUGHT_TOKEN, tokenInfo }));
  } else if(message.event == CAT_SELL_TOKEN) {
    let sellInfo = await sellToken(redis);
    console.log(sellInfo);
    await redis.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_SOLD_TOKEN, ...sellInfo }));
  } 
}