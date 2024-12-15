import { getRedisConnection } from "./db/redismanager.js";
import { VoidlingBot } from './voidlingbot.js'
import { logger } from './logger.js';


(async () => {
  let redisConnection = await getRedisConnection();
  new VoidlingBot(redisConnection);
  logger.info("voidlingBot started")
})();



