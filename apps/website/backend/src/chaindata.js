import { config } from './config/config.js';
import { logger } from './logger.js';
import { Connection, PublicKey } from '@solana/web3.js';
import { getLastOpenTrade, getWatchlist } from './db/postgresdbhandler.js';
import bent from 'bent';
const getJSON = bent('json');

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const TOKEN_PRICE_URL = 'https://public-api.dextools.io/trial/v2/token/solana';
const HELIUS_API_URL = "https://mainnet.helius-rpc.com/?api-key=" + config.VLING_HELIUS_API_KEY;

const API_CALL_WAIT = 3500;

const connection = new Connection('https://api.mainnet-beta.solana.com');
const walletAddress = '5KjM3kBNii6kuNaRWr8f74PguuQ44qpxS1RKw2YKERSM';

async function fetchTokenBalances(walletAddress) {
  const publicKey = new PublicKey(walletAddress);

  const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });

  const tokenBalances = tokenAccounts.value.map(accountInfo => {
    const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount.uiAmount;
    const tokenMint = accountInfo.account.data.parsed.info.mint;
    return { tokenMint, tokenAmount };
  });

  let assetData = [];
  let counter = 0;
  for (const asset of tokenBalances) {
    ++counter;
    if (counter > 3) {
      //continue;
    }
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
}


const NUM_BUYS_MAX_RANGE = 3000;
const NUM_SELLS_MAX_RANGE = 3000;
const VARIATION_MIN = -100;
const VARIATION_MAX = 100;
const RADIUS_MIN = 4;
const RADIUS_MAX = 8;

export async function getPortfolioStats() {

  let assets = await fetchTokenBalances(walletAddress);

  const sixHchangeAvg = assets.reduce((sum, asset) => sum + asset.priceChange6h, 0) / assets.length;
  const fiveMchangeAvg = assets.reduce((sum, asset) => sum + asset.priceChange5m, 0) / assets.length;
  const twentyfourHchangeAvg = assets.reduce((sum, asset) => sum + asset.priceChange24h, 0) / assets.length;

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
  let lastTrade = await getLastTrade(assetDictionary);

  // find this token and get it's up to date name and price information etc etc.
  let wList = await getWatchlist();
  let watchList = wList ? wList.map((asset) => { return { token: { symbol: asset.symbol }, address: asset.address } }) : null;

  return {
    assets: assets,
    stats: normalized,
    watchlist: watchList,
    latestinvestment: [lastTrade]
  }
}

async function getLastTrade(assetDictionary) {
  let lastTrade = await getLastOpenTrade();
  if (lastTrade) {
    let assetDetails = assetDictionary.get(lastTrade.toaddress.toLowerCase());
    console.log("abc")
    console.log(lastTrade)
    console.log(assetDetails)
    if (!assetDetails) {
      console.log("eehh")
      // backup
      let url = `${TOKEN_PRICE_URL}/${lastTrade.toaddress}/price`;
      let res = await getJSON(url, null, { 'x-api-key': config.DEXTOOLS_API_KEY });
      if (res && res.statusCode && res.statusCode == 200 && res.data) {
        let tokenDetails = await getTokenDetails(lastTrade.toaddress);
        assetDetails = {
          token: tokenDetails,
          tokenUsd: res.data.price
        }
      }
    }

    let variation = Number(assetDetails.tokenUsd) / Number(lastTrade.tokenusdvalue);
    return {
      token: assetDetails.token,
      address: lastTrade.toaddress,
      currentUsd: assetDetails.tokenUsd,
      buyUsd: lastTrade.tokenusdvalue,
      bagValue: Number(lastTrade.receivedamount) * assetDetails.tokenUsd,
      variation: variation,
      unrealized: variation * (Number(lastTrade.receivedamount) * Number(lastTrade.tokenusdvalue))
    }
  }

}


function normalize(rangeMin, rangeMax, valueMin, valueMax, value) {
  return ((rangeMax - rangeMin) * (value - valueMin) / (valueMax - valueMin)) + rangeMin;
}

function getStatsOverPeriod(assetStats, period) {
  let volume = 0;
  let buys = 0;
  let sells = 0;
  let variation = 0;
  console.log(period)
  for (const asset of assetStats) {
    console.log(asset)
    volume += asset['volume' + period];
    buys += asset['buys' + period];
    sells += asset['sells' + period];
    variation += asset['variation' + period];
  }
  return {
    volume: volume,
    buys: buys,
    sells: sells,
    variation: variation
  }
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