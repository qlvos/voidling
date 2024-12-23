import { logger } from './logger.js';
import { config } from './config/config.js';
import express from 'express';
import compression from 'compression';
const app = express();
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { getPortfolioStats } from './chaindata.js';
import { getRedisConnection } from './db/redismanager.js';
import { whitelistWallet } from './db/postgresdbhandler.js';
import { callReaper } from './aimodel.js';
const router = express.Router();

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

  server.listen(config.VLINGSITE_WS_PORT, () => { logger.info(`server is listening on ws port ${config.VLINGSITE_WS_PORT}`); });

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


app.get('/', (req, res) => {
  // default route
  res.json({
    api: ""
  })
});

app.use('/api', router);

// basic spam control
let walletsAdded = 0;
const SPAM_CHECK_INTERVAL = 5000;
const WALLET_ADD_SPAM_CHECK_PERIOD = 60000;
const MAX_WALLETS_ADDED = 150;
let spamStop = false;
setInterval(() => { spamStop = walletsAdded > MAX_WALLETS_ADDED }, SPAM_CHECK_INTERVAL);
setInterval(() => { walletsAdded = 0; }, WALLET_ADD_SPAM_CHECK_PERIOD);

router.post('/whitelist', async (req, res) => {
  try {
    if(spamStop) {
      res.json({ status: "ko" });
      return;
    }
  
    if(req.body.wallet) {
      if(!validateWallet(req.body.wallet.trim())) {
        res.json({ status: "ko" });
        return;
      }
      ++walletsAdded;
      await whitelistWallet(req.body.wallet.trim());
      res.json({ status: "ok" });
    }
  } catch(err) {
    logger.error("failed to whitelist: " + err);
  }  
});

router.post('/evaluation', async (req, res) => {
  try {
    if(req.body.points != undefined) {
      if(!validatePoints(req.body.points)) {
        res.json({ status: "ko" });
        return;
      }
      let evaluation = await callReaper(req.body.points);
      res.json({ status: "ok", approved: evaluation && evaluation.includes("YES"), comment: evaluation });
    } else {
      res.json({ status: "ko" });
    }
  } catch(err) {
    logger.error("failed to whitelist: " + err);
  }  
});

function validateWallet(wallet) {
  const solanaWalletRegex = /^[A-Za-z0-9]{1,44}$/;
  return solanaWalletRegex.test(wallet);
}

function validatePoints(points) {
  if(points && points.length > 15) {
    return false;
  }
  return !isNaN(points)
}


