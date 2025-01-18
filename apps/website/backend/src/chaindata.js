import { config } from './config/config.js';
import { logger } from './logger.js';
import { getWatchlist, getBuys, getSells, getIndexTokens } from './db/postgresdbhandler.js';
import { getVoidlingEmotion } from './aimodel.js';
import { getVoidlingUserPrompt } from './prompts.js';
import { SERENE, AGITATED, EXCITED, CURIOUS, CAUTIOUS } from './prompts.js';
import bent from 'bent';
const getJSON = bent('json');

const TOKEN_PRICE_URL = 'https://public-api.dextools.io/trial/v2/token/solana';
const ALCHEMY_API_URL = `https://api.g.alchemy.com/prices/v1/${config.VLING_ALCHEMY_API_KEY}/tokens/historical`
const HELIUS_API_URL = "https://mainnet.helius-rpc.com/?api-key=" + config.VLING_HELIUS_API_KEY;
const API_CALL_WAIT = 3500;
const ALCHEMY_API_CALL_WAIT = 200;
const MAIN_INDEX = "mainindex";
const HOLO_INDEX = "holoworld";
const NOMINEE_INDEX = "nominees";

const walletAddress = '5KjM3kBNii6kuNaRWr8f74PguuQ44qpxS1RKw2YKERSM';

const indexCache = new Map();
const nomineeCache = new Map();
const INDEX_CACHE_MAX_AGE = 1000 * 60 * 60; // 60 minutes

async function fetchTokenBalances() {
  try {
    logger.info("getting wallet information")
    const tokenAccounts = await getParsedTokenAccountsByOwner();
    const tokenBalances = tokenAccounts.value.map(accountInfo => {
      const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount.uiAmount;
      const tokenMint = accountInfo.account.data.parsed.info.mint;
      return { tokenMint, tokenAmount };
    });
  
    let assetData = [];
    let counter = 0;
    let maxAssets = config.INDEX_MAX_ASSETS;
    for (const asset of tokenBalances) {
      if(maxAssets && counter >= maxAssets) {
        break;
      }
      ++counter;
      let url = `${TOKEN_PRICE_URL}/${asset.tokenMint}/price`;
      logger.info("calling " + url);
      try {
        let res = await getJSON(url, null, { 'x-api-key': config.DEXTOOLS_API_KEY });
        if (res && res.statusCode && res.statusCode == 200 && res.data) {
  
          let tokenDetails = await getTokenDetails(asset.tokenMint);
  
          let tokenData = res.data;
          assetData.push({
            token: tokenDetails,
            address: asset.tokenMint,
            tokenUsd: tokenData.price,
            holdingsToken: asset.tokenAmount,
            holdingsUsdValue: tokenData.price * asset.tokenAmount,
            priceChange5m: tokenData.variation5m != null ? tokenData.variation5m : 0,
            priceChange6h: tokenData.variation6h != null ? tokenData.variation6h : 0,
            priceChange24h: tokenData.variation24h != null ? tokenData.variation24h : 0
          });
        }
      } catch (err) {
        logger.warn("Error trying to get dextools information: " + err);
      }
      await new Promise(resolve => setTimeout(resolve, API_CALL_WAIT));
    }
  
    return assetData;

  } catch (err) {
    console.log(err)
    console.log("error fetching token balances")
  }
}

const VARIATION_MIN = -100;
const VARIATION_MAX = 100;
const RADIUS_MIN = 4;
const RADIUS_MAX = 8;

let valueChangeMoods = [
  {
    emotion: AGITATED,
    maxValue: -50
  },
  {
    emotion: CAUTIOUS,
    maxValue: -10
  },  
  {
    emotion: SERENE,
    maxValue: 5
  },
  {
    emotion: CURIOUS,
    maxValue: 20
  },
  {
    emotion: EXCITED,
    maxValue: 99999
  },
]

function getMood(moodMatrix, value) {
  for(const mood of moodMatrix) {
    if(value <= mood.maxValue) {
      return { emotion : mood.emotion } ;
    }
  }
}

export async function getIndexStats(indexName, cache) {
  let assets = await getIndexTokens(indexName);
  
  if(!assets) {
    return;
  }

  const TIME_RANGE_HOURS = 168;
  const interval = '1h';
  const endTime = new Date();
  const startTime = new Date(endTime - TIME_RANGE_HOURS * 60 * 60 * 1000);

  let assetData = [];

  let counter = 0;
  let maxAssets = config.INDEX_MAX_ASSETS;
  for(const asset of assets) {
    if(maxAssets && counter >= maxAssets) {
      break;
    }

    let cached = cache.get(asset.address);
    if(cached && cached.timestamp && (new Date() - cached.timestamp) < INDEX_CACHE_MAX_AGE) {
      assetData.push(cached.data);
      continue;
    }

    let params = { 
      network: asset.network,
      address: asset.address,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      interval: interval
    }
    const response = await fetch(ALCHEMY_API_URL, {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "jsonrpc": "2.0",
        "id": "text",
        "method": "getAsset",
        ...params
      }),
    });

    logger.info("calling " + ALCHEMY_API_URL + " for " + params.address);
    let res = await response.json();

    let obj = {
      name: asset.name,
      address: asset.address,
      network: asset.network,
      symbol: asset.symbol,
      created: asset.created,
      xprofile: asset.xprofile,
      github: asset.github,
      totalSupply: asset.totalsupply,
    }

    if(res && !res.error) {
      obj.currency = res.currency,
      obj.data = res.data
    }

    cache.set(asset.address, {data: obj,  timestamp: new Date() });
    assetData.push(obj);
    ++counter;
    await new Promise(resolve => setTimeout(resolve, ALCHEMY_API_CALL_WAIT));
  }

  return assetData; 

}

export async function getPortfolioStats() {

  let assets = await fetchTokenBalances();
  if(!assets) {
    return;
  }

  const sixHchangeAvg = assets.reduce((sum, asset) => sum + asset.priceChange6h, 0) / assets.length;

  let emotion;
  try {
    let reply = await getVoidlingEmotion(getVoidlingUserPrompt(assets));
    emotion = JSON.parse(reply);
  } catch(err) {
    // json parse failed, backup
    emotion = getMood(valueChangeMoods, sixHchangeAvg);
  }
  
  let normalized = {
    radius: normalize(RADIUS_MIN, RADIUS_MAX, Math.min(VARIATION_MIN, sixHchangeAvg), Math.max(VARIATION_MAX, sixHchangeAvg), sixHchangeAvg)
  }

  assets = assets.sort((a, b) => {
    if (a.holdingsUsdValue < b.holdingsUsdValue) {
      return 1;
    } else if (a.holdingsUsdValue > b.holdingsUsdValue) {
      return -1;
    }
    return 0;
  });

  // the last trade
  let assetDictionary = new Map();
  assets.map((asset) => assetDictionary.set(asset.address.toLowerCase(), asset));

  let tradeLog = await getTradeLog(assetDictionary);

  // find this token and get it's up to date name and price information etc
  let wList = await getWatchlist();
  let watchList = wList ? wList.map((asset) => { return { token: { name: asset.name, symbol: asset.symbol }, address: asset.address } }) : null;


  let indexes = [];
  let mainIndexData = await getIndexStats(MAIN_INDEX, indexCache);
  let holoIndexData = await getIndexStats(HOLO_INDEX, indexCache);

  if(mainIndexData && mainIndexData.length > 0) {
    indexes.push({
      name: "S&V AI Index",
      data: mainIndexData
    })
  }

  if(holoIndexData && holoIndexData.length > 0) {
    indexes.push({
      name: "S&V Holoworld Index",
      data: holoIndexData
    })
  }

  let nomineeData = await getIndexStats(NOMINEE_INDEX, nomineeCache);

  return {
    assets: assets,
    stats: normalized,
    watchlist: watchList,
    indexdata: indexes,
    nominees: nomineeData,
    tradelog: tradeLog,
    ...emotion
  }
}

async function getTradeLog(assetDictionary) {
  let buys = await getBuys();

  let log = [];

  if(buys && buys.length > 0) {
    for(const buy of buys) {
      let tokenDetails;
      if(assetDictionary && assetDictionary.has(buy.toaddress.toLowerCase())) {
        tokenDetails = assetDictionary.get(buy.toaddress.toLowerCase());
      } else {
        tokenDetails = await getTokenDetails(buy.toaddress);
        if(!assetDictionary) {
          assetDictionary = new Map();
        }
        assetDictionary.set(buy.toaddress.toLowerCase(), tokenDetails);
        await new Promise(resolve => setTimeout(resolve, API_CALL_WAIT));
      }

      log.push({
        action: "buy",
        token: tokenDetails.token,
        address: buy.toaddress,
        tokens: buy.receivedamount,
        usdvalue: Number(buy.receivedamount) * Number(buy.tokenusdvalue),
        timestamp: Number(buy.timestamp)
      })
    }
  }

  let sells = await getSells();
  if(sells && sells.length > 0) {
    for(const sell of sells) {
      let tokenDetails;
      if(assetDictionary && assetDictionary.has(sell.toaddress.toLowerCase())) {
        tokenDetails = assetDictionary.get(sell.toaddress.toLowerCase());
      } else {
        tokenDetails = await getTokenDetails(sell.toaddress);
        if(!assetDictionary) {
          assetDictionary = new Map();
        }
        assetDictionary.set(sell.toaddress.toLowerCase(), tokenDetails);
        await new Promise(resolve => setTimeout(resolve, API_CALL_WAIT));
      }

      let usdValueAtSell = Number(sell.boughtamount) * Number(sell.tokenusdvalue);
      log.push({
        action: "sell",
        token: tokenDetails.token,
        address: sell.toaddress,
        tokens: sell.boughtamount,
        usdvalue: usdValueAtSell,
        variation: usdValueAtSell / (Number(sell.boughtamount) * Number(sell.boughtusdvalue)),
        timestamp: Number(sell.timestamp)
      })
    }
  }

  log.sort((a, b) => { return b.timestamp - a.timestamp });

  return log;

}


function normalize(rangeMin, rangeMax, valueMin, valueMax, value) {
  return ((rangeMax - rangeMin) * (value - valueMin) / (valueMax - valueMin)) + rangeMin;
}

async function getTokenDetails(token) {

  const response = await fetch(HELIUS_API_URL, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": "text",
      "method": "getAsset",
      "params": { id: token }
    }),
  });

  const data = await response.json();
  return { name: data.result.content.metadata.name, symbol: data.result.content.metadata.symbol }
}

async function getParsedTokenAccountsByOwner() {
  const response = await fetch(HELIUS_API_URL, {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "jsonrpc": "2.0",
      "id": 1,
      "method": "getTokenAccountsByOwner",
      "params": [
        walletAddress,
        {
          "programId": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "encoding": "jsonParsed"
        }
      ]
    }),
  });
  const data = await response.json();
  return data ? data.result : null;
}