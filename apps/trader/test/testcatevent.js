import { config } from './../src/config/config.js';
import { manageCatEvent } from '../src/trademaster.js';
import { getRedisConnection } from "./../src/db/redismanager.js";
import { CAT_SELL_TOKEN } from './../src/config/eventkeys.js';

let redis = await getRedisConnection();

let redisPublisher = redis.duplicate();
redisPublisher.on('error', err => logger.error(err));
redisPublisher.connect();

await manageCatEvent(redisPublisher);
process.exit();