import { config } from './../config/config.js';
import knex from 'knex'

let connectionString = 'postgres://' + config.VLING_POSTGRES_CREDENTIALS + "@" + config.VLING_POSTGRES_URL + "/" + config.VLING_POSTGRES_DATABASE;

const db = knex({
  client: 'pg',
  connection: connectionString
});

export async function addBuy(from, to, fromAmount, toAmount, toAmountRaw, tokenUsdValue, timestamp) {
  await db.raw(`INSERT INTO "buys" ("fromaddress", "toaddress", "spentamount", "receivedamount", "receivedamountraw", "tokenusdvalue", "timestamp") VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`, 
    [from, to, fromAmount, toAmount, toAmountRaw, tokenUsdValue, timestamp]);
}

export async function addSell(buyid, profitloss, tokenusdvalue, timestamp) {
  await db.raw(`INSERT INTO "sells" ("buyid", "profitloss", "tokenusdvalue", "timestamp") VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING`, 
    [buyid, profitloss, tokenusdvalue, timestamp]);
}

export async function addCatEvent(type, img, timestamp) {
  await db.raw(`INSERT INTO "catevent" ("type", "img", "timestamp") VALUES (?, ?, ?) ON CONFLICT DO NOTHING`, 
    [type, img, timestamp]);
}

export async function getLastOpenTrade() {
  let res = await db.raw(`select b.* from "buys" b left join "sells" s on b.id = s.buyid where s.buyid is null order by s.timestamp desc limit 1`);
  return res && res.rows.length > 0 ? res.rows[0] : null;
}

export async function getOpenTrades() {
  let res = await db.raw(`select b.* from "buys" b left join "sells" s on b.id = s.buyid where s.buyid is null order by s.timestamp desc`);
  return res && res.rows.length > 0 ? res.rows : null;
}

export async function getWatchlist() {
  let res = await db.raw(`select * from "watchlist" order by address desc`);
  return res && res.rows.length > 0 ? res.rows : null;
}