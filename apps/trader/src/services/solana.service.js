import { Connection, Keypair, PublicKey, VersionedTransaction, sendAndConfirmRawTransaction } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import bs58 from 'bs58';
import { getMint } from '@solana/spl-token';
import { logger } from './../logger.js';
import 'dotenv/config';
import { config } from './../config/config.js';
import { addBuy, addSell, getLastOpenTrade } from '../db/postgresdbhandler.js';

const JUPITER_QUOTE_API_URL = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_API_URL = "https://quote-api.jup.ag/v6/swap";
const HELIUS_API_URL = "https://mainnet.helius-rpc.com/?api-key=" + config.VLING_HELIUS_API_KEY;
const TOKEN_PRICE_URL = 'https://public-api.dextools.io/trial/v2/token/solana';

const connection = new Connection(HELIUS_API_URL, 'confirmed');

const wallet = new Wallet(Keypair.fromSecretKey(bs58.decode(config.VLING_WALLET_PRIVATE_KEY)));
const WRAPPED_SOL = "So11111111111111111111111111111111111111112";
const MAX_AMOUNT = 0.01;
const MAX_SLIPPAGE = 10;

const TRANSACTION_DELAY = 7000;

export async function buyToken(token) {
  try {
    if (Number(config.VLING_BUY_AMOUNT) > MAX_AMOUNT) {
      logger.warn("Aborting as the amount was higher than the maximum allowed (" + MAX_AMOUNT + ")");
      return;
    }
    let swapDetails = await swap(WRAPPED_SOL, token, config.VLING_BUY_AMOUNT);
    // complement with token price
    let priceDetails = await getTokenPriceDetails(token);
    if (swapDetails) {
      // save to DB (buys) !
      await addBuy(WRAPPED_SOL, token, config.VLING_BUY_AMOUNT, swapDetails.receivedAmount, swapDetails.receivedAmountRaw, priceDetails ? priceDetails.price : -1, Date.now());
      logger.info("Buy saved in database");
    }
    return swapDetails;
  } catch (err) {
    logger.error("failed to swap " + token + ": " + err);
    console.log(err)
  }
}

async function swap(fromToken, toToken, amount, slippagePercent = 5) {
  try {
    const inputMintData = await getMint(connection, new PublicKey(fromToken));
    const outputMintData = await getMint(connection, new PublicKey(toToken));
    if (!inputMintData || !outputMintData) {
      throw new Error('Invalid input or output mint');
    }

    if (slippagePercent > MAX_SLIPPAGE) {
      throw new Error(`Slippage must be max ${MAX_SLIPPAGE}%`);
    }

    const inputDecimals = inputMintData.decimals;
    const inputAmount = amount * Math.pow(10, inputDecimals) * 0.995;
    const slippageBps = slippagePercent * 100;

    let urlGet = JUPITER_QUOTE_API_URL;
    urlGet += `?inputMint=${fromToken}&outputMint=${toToken}`;
    urlGet += `&amount=${inputAmount.toFixed(0)}&slippageBps=${slippageBps}`;
    urlGet += `&swapMode=ExactIn`;

    const quoteResponseData = await fetch(urlGet);
    const quoteResponse = await quoteResponseData.json();

    const response = await fetch(JUPITER_SWAP_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dynamicComputeUnitLimit: true,
        //computeUnitPriceMicroLamports : 'auto',
        //prioritizationFeeLamports: 'auto',
        priorityLevelWithMaxLamports: {
          maxLamports: 10000000, // Set the maximum lamports for priority fee 
          priorityLevel: 'medium', // Set the priority level to medium 
        },
        quoteResponse,
        userPublicKey: wallet.publicKey.toString(),
        wrapAndUnwrapSol: true,
      }),
    });

    const jsonResponse = await response.json();
    console.log(jsonResponse)
    if (jsonResponse.error || !jsonResponse.swapTransaction || jsonResponse.simulationError) {
      logger.error("Simulation error " + jsonResponse.error)
      logger.error("Simulation error " + jsonResponse.simulationError)
      return;
    }
    // deserialize the transaction
    const swapTransactionBuf = Buffer.from(jsonResponse.swapTransaction, 'base64');
    var transaction = VersionedTransaction.deserialize(swapTransactionBuf);
    // sign the transaction
    logger.info("signing...")
    transaction.sign([wallet.payer]);
    logger.info("signing done")

    let txid = await sendRawTransactionWithRetry(transaction)
    logger.info(`https://solscan.io/tx/${txid}`);

    logger.info("waiting " + TRANSACTION_DELAY + "ms...")
    await new Promise(resolve => setTimeout(resolve, TRANSACTION_DELAY));
    let swapDetails = await getSwapDetails(toToken, fromToken, txid);
    // todo: find a solution for this
    swapDetails.solDifference = -1;

    return swapDetails;

  } catch (error) {
    logger.error('Error building swap transaction:', error);
    throw new Error(error);
  }
}

async function sendRawTransactionWithRetry(transaction, retries = 5, delay = 1000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Execute the transaction
      const rawTransaction = transaction.serialize();
      return await sendAndConfirmRawTransaction(connection, rawTransaction)
    }
    catch (error) {
      logger.error(`Attempt ${attempt} failed:`, error);
      if (attempt < retries) {
        logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff 
      } else {
        console.error('All retry attempts failed');
        throw error;
      }
    }
  }
}

export async function sellToken(fromaddress, toaddress, amount) {
  logger.info("selling " + fromaddress)
  return await swap(fromaddress, toaddress, amount);
}

async function getSwapDetails(token, soldToken, transactionHash) {
  const cfg = { commitment: 'confirmed', maxSupportedTransactionVersion: 0 } // Set the maximum supported transaction version };
  let tx = await connection.getTransaction(transactionHash, cfg);
  let maxRetries = 3;
  let tries = 0;

  while (!tx && tries < maxRetries) {
    logger.info(`failed to get tx, wait a bit... (try ${tries + 1} / ${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, TRANSACTION_DELAY));
    tx = await connection.getTransaction(transactionHash, cfg);
    if (tx) {
      break;
    }
  }

  let receivedRaw = -1;
  let received = - 1;

  if (tx) {
    let walletPreTokens = tx.meta.preTokenBalances.filter(
      (item) => item.mint.toLowerCase() == token.toLowerCase() && item.owner.toLowerCase() == wallet.publicKey.toString().toLowerCase());
    let walletPostTokens = tx.meta.postTokenBalances.filter(
      (item) => item.mint.toLowerCase() == token.toLowerCase() && item.owner.toLowerCase() == wallet.publicKey.toString().toLowerCase());

    if (walletPostTokens.length == 1) {
      let preTokens = (walletPreTokens && walletPreTokens.length) == 1 ? walletPreTokens[0].uiTokenAmount.uiAmount : 0;
      let preTokensRaw = (walletPreTokens && walletPreTokens.length) == 1 ? walletPreTokens[0].uiTokenAmount.amount : 0;
      let postTokens = walletPostTokens[0].uiTokenAmount.uiAmount;
      let postTokensRaw = walletPostTokens[0].uiTokenAmount.amount;
      received = postTokens - preTokens;
      receivedRaw = Number(postTokensRaw) - Number(preTokensRaw);
    }
  } else {
    logger.warn("Could not get details from tx " + transactionHash + ", this does not mean it failed but token amount details will be missing");
  }

  let details = await getTokenDetails(token);
  let soldTokenDetails = await getTokenDetails(soldToken);

  return {
    spentSol: config.VLING_BUY_AMOUNT,
    receivedToken: details,
    soldToken: soldTokenDetails,
    receivedAmount: received,
    receivedAmountRaw: receivedRaw
  }
}

async function getFeeEstimation(signedTransaction) {
  console.log(signedTransaction)
  const response = await fetch(HELIUS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'helius-example',
      method: 'getPriorityFeeEstimate',
      params: [{
        transaction: signedTransaction,
        options: {
          recommended: true,
        }
      }]
    }),
  });
  return await response.json();
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

async function getTokenPriceDetails(token) {
  let url = `${TOKEN_PRICE_URL}/${token}/price`;
  logger.info("calling " + url);
  try {
    let res = await getJSON(url, null, { 'x-api-key': config.DEXTOOLS_API_KEY });
    if (res && res.statusCode && res.statusCode == 200 && res.data) {
      return res.data;
    }
  } catch (err) {
    logger.warn("Failed fetching price data from dextools on token " + token);
    logger.warn(err);
  }
}
