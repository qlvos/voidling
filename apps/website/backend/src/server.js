import { logger } from './logger.js';
import { config } from './config/config.js';
import EventSource from 'eventsource';
import express from 'express';
import compression from 'compression';
const app = express();
const router = express.Router();
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { addCatEvent, getLastOpenTrade } from './db/postgresdbhandler.js'
import { getPortfolioStats } from './chaindata.js';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(compression());

let cachedReply = null;
let lastCacheRefresh = -1;
let maxCacheAge = 12000; // 12 seconds
const pingInterval = 4500;
const checkConnectionInterval = pingInterval * 2;
const maxPongWaitTime = 3000;
const CACHE_UPDATE_FREQUENCY = 60000 * 10;
const SLOW_CACHE_UPDATE_FREQUENCY = 60000 * 60 * 1; // 1 per hour
const VOIDLING_DATA = "vdata";

// Define the SSE endpoint URL
const sseUrl = 'https://api.thecatdoor.com/sse/v1/events'; // Replace with your actual SSE endpoint URL

// Create an EventSource instance
const eventSource = new EventSource(sseUrl);

let cachedChainData = null;
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
        await this.redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_SELL_TOKEN }));
      } else {
        // buy
        await this.redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_BUY_RANDOM_TOKEN }));
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

// Optional: Listen for specific event types
eventSource.addEventListener('customEvent', function (event) {
  console.log('Custom event received:', event.data);
});


app.listen(config.VLINGSITE_REST_PORT, () => {
  logger.info('REST server running on port: ' + config.VLINGSITE_REST_PORT)
});

let wss = startWebsocketServer();

function broadcast(message) {
  wss.clients.forEach(client => {
    if (client.readyState === client.OPEN) {
      client.send(message);
    }
  });
}

app.get('/', (req, res) => {
  // default route
  res.json({
    api: ""
  })
});

app.use('/api', router);

router.get('/cat', async (req, res) => {
  // fetch last event from db
  // second step would be to cache that to protect the db
  // if none, default to some fake one (should rarely happen in reality!)
  // return to caller!

  console.log("cat api called !!!")
  return;

  let now = Date.now();

  if (now - lastCacheRefresh > maxCacheAge) {
    cachedReply = null;
  }

  if (cachedReply != null) {
    res.json({ status: "ok", content: cachedReply });
    return;
  }

  logger.info("feed request received");
  try {
    lastCacheRefresh = Date.now();
    //let feedData = await fetchFeed();
    res.json({ status: "ok", content: "abc" });
    cachedReply = feedData;
  } catch (err) {
    logger.error("Something went wrong trying to fetch the cat feed " + err);
    res.status(500).json({ message: "KO" });
  }

});

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

  let port = config.VLINGSITE_WS_PORT;

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

  server.listen(port, () => { console.log(`Server is listening on port ${port}`); });

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

function randomNumber(max) {
  return Math.floor(Math.random() * (max + 1));
}

function time(seconds) {
  const secsPerDay = 86400;
  const secsPerHour = 3600;
  const secsPerMinute = 60;

  let days = Math.floor(seconds / secsPerDay);
  seconds = (seconds % secsPerDay);
  let hours = Math.floor(seconds / secsPerHour);
  seconds = (seconds % secsPerHour);
  let minutes = Math.floor(seconds / secsPerMinute);
  seconds = Math.trunc((seconds % secsPerMinute));

  let timeText = '';
  if (days > 0) {
    timeText += new String(days) + "d";
  }

  if (hours > 0) {
    timeText += new String(hours) + (hours == 1 ? "h" : "h");
  }

  if (minutes > 0) {
    timeText += new String(minutes) + (minutes == 1 ? "m" : "m");
  }

  if (seconds > 0) {
    timeText += new String(seconds) + (seconds == 1 ? "s" : "s");
  }

  return timeText;

}

cachedChainData = await getPortfolioStats();

