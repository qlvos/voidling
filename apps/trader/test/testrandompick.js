
import { init } from './../src/app.js'
import { getRedisConnection } from "./../src/db/redismanager.js";
import { config } from './../src/config/config.js';
import { CAT_BUY_RANDOM_TOKEN } from './../src/config/eventkeys.js';


let redis = await getRedisConnection();

let redisPublisher = redis.duplicate();
redisPublisher.on('error', err => logger.error(err));
redisPublisher.connect();

console.log("yo")

await redisPublisher.publish(config.CAT_EVENT_KEY, JSON.stringify({event: CAT_BUY_RANDOM_TOKEN }));