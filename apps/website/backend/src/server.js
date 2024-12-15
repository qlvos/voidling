import { logger } from './logger.js';
import { config } from './config/config.js';
import EventSource from 'eventsource';
import express from 'express';
import compression from 'compression';
const app = express();
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { addCatEvent, getLastOpenTrade } from './db/postgresdbhandler.js'
import { getPortfolioStats } from './chaindata.js';
import { getRedisConnection } from './db/redismanager.js';
//const router = express.Router();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());

const pingInterval = 4500;
const checkConnectionInterval = pingInterval * 2;
const maxPongWaitTime = 3000;
const CACHE_UPDATE_FREQUENCY = 60000 * 10;
const SLOW_CACHE_UPDATE_FREQUENCY = 60000 * 60 * 1; // 1 per hour
let cachedChainData = null;
const VOIDLING_DATA = "vdata";
const sseUrl = 'https://api.thecatdoor.com/sse/v1/events';
const eventSource = new EventSource(sseUrl);
let redis = await getRedisConnection();
let redisPublisher = redis.duplicate();
redisPublisher.on('error', err => logger.error(err));
redisPublisher.connect();

setInterval(async () => {
  if(wss.clients.size > 0) {
    try {
      cachedChainData = await getPortfolioStats();
      if(!cachedChainData) {
        return;
      }
      wss.clients.forEach(async (ws) => {
        ws.send(JSON.stringify({ action: VOIDLING_DATA, ...cachedChainData }));
      });
    } catch (err) {
      console.log(err)
      logger.error("failed fetching portfolio " + err);
    }
  }
}, CACHE_UPDATE_FREQUENCY);

setInterval(async () => { cachedChainData = await getPortfolioStats(); }, SLOW_CACHE_UPDATE_FREQUENCY);

// Listen for messages from the SSE endpoint
eventSource.onmessage = async function (event) {
  try {
    let catEvent = JSON.parse(event.data);
    if (catEvent.event == "pepito") {
      logger.info('New cat event received:', event.data);
      catEvent.time = Date.now();
      
      // https://github.com/Clement87/Pepito-API
      await addCatEvent(catEvent.type, catEvent.img, catEvent.time);
      let lastOpenTrade = await getLastOpenTrade();
      if(lastOpenTrade) {
        // sell
        redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_SELL_TOKEN }));
      } else {
        // buy
        redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_BUY_RANDOM_TOKEN }));
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

app.listen(config.VLINGSITE_REST_PORT, () => {
  logger.info('rest server running on port: ' + config.VLINGSITE_REST_PORT)
});

let wss = startWebsocketServer();

async function handlePingPong(msg, ws) {
  if (msg.action == "pong") {
    ws.isAlive = true
    ws.pongReceivedAt = Date.now();
  }
}

const ping = (ws) => {
  ws.pingSentAt = Date.now();
  ws.send(JSON.stringify({ action: "ping" }));

  setTimeout(() => {
    if (!ws.pongReceivedAt || (ws.pongReceivedAt - ws.pingSentAt) > maxPongWaitTime) {
      logger.info("Close 1 stale ws connection");
      ws.terminate();
    }
  }, checkConnectionInterval);
}

function startWebsocketServer() {

  const server = createServer();
  const wss = new WebSocketServer({ server });

  wss.on('connection', (ws) => {
    logger.info("Connection attempt being made.");
    ws.isAlive = true
    ws.on('message', async (messageAsString) => {
      try {
        let msg = JSON.parse(messageAsString);
        if (msg.action) {
          if (msg.action == "") {
          } else if (msg.action == "ping" || msg.action == "pong") {
            handlePingPong(msg, ws);
          }
        }
      } catch (err) {
        logger.error("Error receiving autotrade websocket message! " + err);
      }
    });

    ws.send(JSON.stringify({ action: VOIDLING_DATA, ...cachedChainData }));

  });

  server.listen(config.VLINGSITE_WS_PORT, () => { console.log(`Server is listening on port ${config.VLINGSITE_WS_PORT}`); });

  return wss;
}

setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      logger.info("Closing connection")
      return ws.terminate()
    }
    ws.isAlive = false
    ws.ping(() => { ping(ws) })
  })
}, pingInterval);

cachedChainData = await getPortfolioStats();

/*
app.get('/', (req, res) => {
  // default route
  res.json({
    api: ""
  })
});

app.use('/api', router);
*/

