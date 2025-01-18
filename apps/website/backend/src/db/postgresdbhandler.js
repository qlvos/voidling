import { config } from './../config/config.js';
import knex from 'knex'
let connectionString = 'postgres://' + config.VLING_POSTGRES_CREDENTIALS + "@" + config.VLING_POSTGRES_URL + "/" + config.VLING_POSTGRES_DATABASE;

const db = knex({
  client: 'pg',
  connection: connectionString
});

export async function addBuy(from, to, fromAmount, toAmount, toAmountRaw, timestamp) {
  await db.raw(`INSERT INTO "buys" ("fromaddress", "toaddress", "spentamount", "receivedamount", "receivedamountraw", "timestamp") VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`, 
    [from, to, fromAmount, toAmount, toAmountRaw, timestamp]);
}

export async function addSell(buyid, profitloss, timestamp) {
  await db.raw(`INSERT INTO "sells" ("buyid", "profitloss", "timestamp") VALUES (?, ?, ?) ON CONFLICT DO NOTHING`, 
    [buyid, profitloss, timestamp]);
}

export async function getLastOpenTrade() {
  let res = await db.raw(`select b.* from "buys" b left join "sells" s on b.id = s.buyid where s.buyid is null order by s.timestamp desc limit 1`);
  return res && res.rows.length > 0 ? res.rows[0] : null;
}

export async function getFeedback() {
  let res = await db.raw(`select f.* from "feedback" f order by f.timestamp desc`);
  return res && res.rows.length > 0 ? res.rows : null;
}

export async function addFeedback(text) {
  let timestamp = Date.now();
  await db.raw(`INSERT INTO "feedback" ("timestamp", "content") VALUES (?, ?)`, [timestamp, text]);
}

export async function getWatchlist() {
  let res = await db.raw(`select * from "watchlist" order by address desc`);
  return res && res.rows.length > 0 ? res.rows : null;
}

export async function getIndexTokens(indexName) {
  let res = await db.raw(`select * from "indexassets" ia inner join "asset" a on a.address=ia.asset where ia.index=? order by ia.asset desc`, [indexName]);
  return res && res.rows.length > 0 ? res.rows : null;
}

export async function getBuys() {
  let res = await db.raw(`select * from "buys" order by timestamp desc`);
  return res && res.rows.length > 0 ? res.rows : null;
}

export async function getSells() {
  let res = await db.raw(`select s.*, b.toaddress, b.receivedamount as boughtamount, b.tokenusdvalue as boughtusdvalue from "sells" s inner join "buys" b on s.buyid=b.id order by s.timestamp desc`);
  return res && res.rows.length > 0 ? res.rows : null;
}

export async function whitelistWallet(wallet) {
  await db.raw(`INSERT INTO "whitelist" ("wallet") VALUES (?)`, [wallet]);
}
