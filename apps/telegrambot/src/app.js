import { getRedisConnection } from "./db/redismanager.js";
import { CatBot } from './cat9zbot.js'
import { logger } from './logger.js';


(async () => {
  let redisConnection = await getRedisConnection();
  let catBot = new CatBot(redisConnection);
  logger.info("CatBot started!")
})();



