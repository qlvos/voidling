import { config } from './config/config.js';
import { logger } from './logger.js';
import { Connection, PublicKey } from '@solana/web3.js';
import bent from 'bent';
const getJSON = bent('json');

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');
const POOL_PRICE_URL = 'https://public-api.dextools.io/trial/v2/pool/solana';
const TOKEN_PRICE_URL = 'https://public-api.dextools.io/trial/v2/token/solana';
const HELIUS_API_URL = "https://mainnet.helius-rpc.com/?api-key=" + config.VLING_HELIUS_API_KEY;

let rgPair = 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW';
let pnutPair = '4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i'

const API_CALL_WAIT = 3500;

let portfolio = [
  {
    name : 'RG',
    address: 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW'
  },
  {
    name : 'PNUT',
    address: '4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i'
  }
]

let watchlist = [
  {
    token: {symbol : 'RG'},
    address: 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW'
  },
  {
    token: {symbol : 'PNUT'},
    address: '4AZRPNEfCJ7iw28rJu5aUyeQhYcvdcNm8cswyL51AY9i'
  }
]

let latestinvestment = [
  {
    token: {symbol : 'PNUT'},
    address: 'Feut3r89xpN6nuF1w3otRcjuYcAatygjEqxW7MeiHArW'
  }
]


// given a wallet address
 // fetch all the tokens it has
 // fetch what is the USD value of each token
 // fetch the aggregated usd value.. etc.

 
 const connection = new Connection('https://api.mainnet-beta.solana.com');
 const walletAddress = '5KjM3kBNii6kuNaRWr8f74PguuQ44qpxS1RKw2YKERSM';
 
 async function fetchTokenBalances(walletAddress) {
   const publicKey = new PublicKey(walletAddress);
   // const tokenAccounts = await connection.getParsedTokenAccountsByOwner(wallet.publicKey, { mint: new PublicKey(token) });
   //const tokenAccounts = await getParsedTokenAccountsByOwner(connection, publicKey, { programId: TOKEN_PROGRAM_ID });
   const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { programId: TOKEN_PROGRAM_ID });
 
   const tokenBalances = tokenAccounts.value.map(accountInfo => {
     const tokenAmount = accountInfo.account.data.parsed.info.tokenAmount.uiAmount;
     const tokenMint = accountInfo.account.data.parsed.info.mint;
     return { tokenMint, tokenAmount };
   });

   let assetData = [];
   let counter=0;
   for(const asset of tokenBalances) {
    ++counter;
    if(counter > 3) {
      //continue;
    }
    let url = `${TOKEN_PRICE_URL}/${asset.tokenMint}/price`;
    logger.info("calling " + url);
    try {
      let res = await getJSON(url, null, {'x-api-key': config.DEXTOOLS_API_KEY});
      if(res && res.statusCode && res.statusCode == 200 && res.data) {

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
    } catch(err) {
      logger.warn("Error trying to get dextools information: " + err);
    }
    await new Promise(resolve => setTimeout(resolve, API_CALL_WAIT));
   }

   return assetData;
 }

 export async function getHoldings() {
  let holdings = await fetchTokenBalances(walletAddress);
  return holdings;
 }
 
 /*
 async function fetchTokenPrices(tokenMints) {
   const ids = tokenMints.join(',');
   const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
   const prices = await response.json();
   return prices;
 }
   */
 /*
 async function main() {
   const tokenBalances = await fetchTokenBalances(walletAddress);
   const tokenMints = tokenBalances.map(token => token.tokenMint);
   const tokenPrices = await fetchTokenPrices(tokenMints);
 
   tokenBalances.forEach(token => {
     const price = tokenPrices[token.tokenMint]?.usd || 0;
     const valueInUSD = token.tokenAmount * price;
     console.log(`Token: ${token.tokenMint}, Amount: ${token.tokenAmount}, Value in USD: $${valueInUSD.toFixed(2)}`);
   });
 }
 
 main().catch(console.error);
 */

export async function getData() {
  let portfolioData = [];
  for(const pair of portfolio) {
    let url = `${POOL_PRICE_URL}/${pair.address}/price`;
    logger.info("calling " + url);
    try {
      let res = await getJSON(url, null, {'x-api-key': config.DEXTOOLS_API_KEY});
      if(res && res.statusCode && res.statusCode == 200 && res.data) {
        portfolioData.push(res.data);
      } 
    } catch(err) {
      logger.warn("Error trying to get dextools information: " + err);
    }
    await new Promise(resolve => setTimeout(resolve, API_CALL_WAIT));
  }

  return portfolioData;
}

const NUM_BUYS_MAX_RANGE = 3000;
const NUM_SELLS_MAX_RANGE = 3000;
const VARIATION_MIN = -100;
const VARIATION_MAX = 100;
const RADIUS_MIN = 4;
const RADIUS_MAX = 8;

export async function getPortfolioStats() {
  let assets = await getHoldings();

  const sixHchangeAvg = assets.reduce((sum, asset) => sum + asset.priceChange6h, 0) / assets.length;
  const fiveMchangeAvg = assets.reduce((sum, asset) => sum + asset.priceChange5m, 0) / assets.length;
  const twentyfourHchangeAvg = assets.reduce((sum, asset) => sum + asset.priceChange24h, 0) / assets.length;

  let normalized = {
    radius : normalize(RADIUS_MIN, RADIUS_MAX, Math.min(VARIATION_MIN, sixHchangeAvg), Math.max(VARIATION_MAX, sixHchangeAvg), sixHchangeAvg)
    //sells : normalize(RADIUS_MIN, RADIUS_MAX, 0, Math.max(NUM_SELLS_MAX_RANGE, sixHstats.sells), sixHstats.sells),
    //variation: normalize(RADIUS_MIN, RADIUS_MAX, Math.min(VARIATION_MIN, sixHstats.variation), Math.max(VARIATION_MAX, sixHstats.variation), sixHstats.variation)
  }


  assets = assets.sort((a, b) => {
    if (a.holdingsUsdValue < b.holdingsUsdValue) {
      return 1;
    } else if (a.holdingsUsdValue > b.holdingsUsdValue) {
      return -1;
    }
    return 0;
  });

  return {
    assets: assets,
    stats: normalized,
    watchlist: watchlist,
    latestinvestment: latestinvestment
  }
}


function normalize(rangeMin, rangeMax, valueMin, valueMax, value) {
  return ((rangeMax-rangeMin)*(value-valueMin)/(valueMax-valueMin)) + rangeMin;
}

function getStatsOverPeriod(assetStats, period) {
  let volume = 0;
  let buys = 0;
  let sells = 0;
  let variation = 0;
  console.log(period)
  for(const asset of assetStats) {
    console.log(asset)
    volume += asset['volume'+period];
    buys += asset['buys'+period];
    sells += asset['sells'+period];
    variation += asset['variation'+period];
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