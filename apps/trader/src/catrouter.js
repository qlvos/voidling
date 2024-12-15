import { CAT_BUY_TOKEN, CAT_BUY_RANDOM_TOKEN, CAT_SELL_TOKEN } from "./config/eventkeys.js";
import { buyToken } from './services/solana.service.js';
import { buyAndSignalToken, sellAndSignalToken } from './trademaster.js';

export async function catRouter(message, redis) {
  if(message.event == CAT_BUY_TOKEN) {
    await buyToken(message.token);
  } else if(message.event == CAT_BUY_RANDOM_TOKEN) {
    buyAndSignalToken(redis)
  } else if(message.event == CAT_SELL_TOKEN) {
    sellAndSignalToken(redis);
  } 
}