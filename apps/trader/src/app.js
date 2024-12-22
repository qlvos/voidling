import { logger } from './logger.js';
import { getRedisConnection } from "./db/redismanager.js";
import { config } from './config/config.js';
import { catRouter } from './catrouter.js';
import { startCatTrader } from './trademaster.js';

export async function init() {
  let redis = await getRedisConnection();
  let redisPublisher = redis.duplicate();
  redisPublisher.on('error', err => logger.error(err));
  redisPublisher.connect();
  
  logger.info("redis subscribing to " + config.VLING_EVENT_KEY);
  await redis.subscribe(config.VLING_EVENT_KEY, async (message) => {
  
    if (message != null) {
      try {
        await catRouter(JSON.parse(message), redisPublisher);
      } catch (err) {
        logger.error("RG Agent redis. Error parsing json on message: " + message);
        logger.error(err)
        console.log(err)
      }
    }
  });

  startCatTrader(redisPublisher);
}
init();