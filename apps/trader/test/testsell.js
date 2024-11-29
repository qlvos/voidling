
import { init } from './../src/app.js'
import { getRedisConnection } from "./../src/db/redismanager.js";
import { config } from './../src/config/config.js';
import { CAT_SELL_TOKEN } from './../src/config/eventkeys.js';

const GOAT = 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump';

let redis = await getRedisConnection();

let redisPublisher = redis.duplicate();
redisPublisher.on('error', err => logger.error(err));
redisPublisher.connect();

await redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify(
  {event: CAT_SELL_TOKEN }
));