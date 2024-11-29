
import { init } from './../src/app.js'
import { getRedisConnection } from "./../src/db/redismanager.js";
import { config } from './../src/config/config.js';
import { CAT_BUY_TOKEN } from './../src/config/eventkeys.js';

const GOAT = 'CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump';
const WWW = '45A2W6WEkQGkLpawnkkDhgNMKkTs3oYHrabxfUzppump'
const RG = '4XGi8LD2hmcbEYrHKxGgZCKHakE5pyAtfPG3ffKv7ZSr'
const AURORA = 'bozdUuCb2kdipxES9PzsYHmDVrf7FBTSW3p1CFBpump'

let redis = await getRedisConnection();

let redisPublisher = redis.duplicate();
redisPublisher.on('error', err => logger.error(err));
redisPublisher.connect();

await redisPublisher.publish(config.CAT_EVENT_KEY, JSON.stringify(
  {event: CAT_BUY_TOKEN, token: AURORA }
));