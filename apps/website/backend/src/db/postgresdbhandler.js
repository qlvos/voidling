import { config } from './../config/config.js';
import knex from 'knex'

let connectionString = 'postgres://' + config.VLING_POSTGRES_CREDENTIALS + "@" + config.VLING_POSTGRES_URL + "/" + config.VLING_POSTGRES_DATABASE;

console.log(connectionString)
const db = knex({
  client: 'pg',
  connection: connectionString
});

export async function addBuy(from, to, fromAmount, toAmount, toAmountRaw, timestamp) {
  await db.raw(`INSERT INTO "buys" ("fromaddress", "toaddress", "spentamount", "receivedamount", "receivedamountraw", "timestamp") VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`, 
    [from, to, fromAmount, toAmount, toAmountRaw, timestamp]);
}

export async function addCatEvent(type, img, timestamp) {
  await db.raw(`INSERT INTO "catevent" ("type", "img", "timestamp") VALUES (?, ?, ?) ON CONFLICT DO NOTHING`, 
    [type, img, timestamp]);
}

export async function addSell(buyid, profitloss, timestamp) {
  await db.raw(`INSERT INTO "sells" ("buyid", "profitloss", "timestamp") VALUES (?, ?, ?) ON CONFLICT DO NOTHING`, 
    [buyid, profitloss, timestamp]);
}

export async function getLastOpenTrade() {
  let res = await db.raw(`select b.* from "buys" b left join "sells" s on b.id = s.buyid where s.buyid is null order by s.timestamp desc limit 1`);
  return res && res.rows.length > 0 ? res.rows[0] : null;
}

export async function addTelegramUserIfNeeded(userId, userName, firstName, lastName, isBot) {
  await db.raw(`INSERT INTO "TelegramUser" ("userid", "username", "firstname", "lastname", "isbot") VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`, [userId, userName, firstName, lastName, isBot]);
}

export async function getTelegramMessageChain(messageId) {
  let sql = `WITH RECURSIVE relationship_chain AS (
    SELECT tu.firstname, tu.lastname, tu.username, tm.content, tm.messageid_reaper, tm.replyto_messageid_reaper 
    INNER JOIN "TelegramUser" tu ON tm.userid=tu.userid
    FROM "TelegramMessage" tm
    WHERE messageid_reaper = ?
    UNION ALL
    SELECT tus.firstname, tus.lastname, tus.username, m.content m.messageid_reaper, m.replyto_messageid_reaper 
    inner join "TelegramUser" tus on m.userid=tus.userid
    FROM "TelegramMessage" m
    INNER JOIN relationship_chain rc ON rc.replyto_messageid_reaper = m.messageid_reaper)
    SELECT * FROM relationship_chain`;
  let res = await db.raw(sql, [messageId]);
  return res && res.rows.length > 0 ? res.rows : null;
}

export async function canInteract(userid) {
  let res = await db.raw(`SELECT caninteract FROM "UserSettings" WHERE userid = ? LIMIT 1`, [userid]);
  return res && res.rows.length > 0 ? res.rows[0].caninteract : false;
}