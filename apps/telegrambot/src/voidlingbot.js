import { logger } from './logger.js';
import { config } from './config/config.js';
import TelegramBot from "node-telegram-bot-api";
import { CAT_BOUGHT_TOKEN, CAT_SOLD_TOKEN, CAT_BUY_RANDOM_TOKEN, CAT_SELL_TOKEN } from './config/eventkeys.js';

const VOIDLING_IMAGE = "https://i.ibb.co/DbNb3rN/voidling.png";

export class VoidlingBot {
  // new ReaperBot(simulator, test, activate, block);
  constructor(redis) {
    this.redis = redis;

    this.redisPublisher = redis.duplicate();
    this.redisPublisher.on('error', err => logger.error(err));
    this.redisPublisher.connect();

    this.TELEGRAM_BOT_TOKEN = config.VLING_TELEGRAM_TOKEN;

    this.bot = new TelegramBot(this.TELEGRAM_BOT_TOKEN, { polling: true });
    
    this.bot.onText(/\/catbought/, this.fakecatbought.bind(this));
    this.bot.onText(/\/buyrandom/, this.buyrandom.bind(this));
    this.bot.onText(/\/closetrade/, this.closetrade.bind(this));
    this.bot.onText(/\/t/, this.testmessage.bind(this));
    
    // 60 second timeout
    this.nextMinintervalSeconds = 60;//this.test ? 0 : 60;
    this.throttle = new Map();
    this.userThrottle = new Map();
    this.channel = new Map();
    this.startGlobal;

    this.channel.set(Number(config.VLING_TG_CHANNEL_ID), true);


    redis.subscribe(config.VLING_EVENT_KEY, async (message) => {
  
      if (message != null) {
        try {
          let msg = JSON.parse(message);
          
          if(msg.event == CAT_BOUGHT_TOKEN) {
            await this.signalBoughtToken(msg);
          } else if(msg.event == CAT_SOLD_TOKEN) {
            await this.signalSoldToken(msg);
          }

        } catch (err) {
          logger.error("RG Agent redis. Error parsing json on message: " + message);
          logger.error(err)
          console.log(err)
        }
      }
    });

    logger.info("subscribed to redis event key " + config.VLING_EVENT_KEY);  

  }

  async testmessage(context) {
    if(!this.isSuperUser(context.from.id)) {
      logger.info("not a super user, cannot buy random tokens!")
      return;
    }

    await this.sendPhoto(config.VLING_TG_CHANNEL_ID, `The voidling bought a token`);
    
  }

  async sendPhoto(channel, message) {
    try {
      await this.bot.sendPhoto(channel, VOIDLING_IMAGE, {caption:message, parse_mode:"html"});
    } catch (err) {
      // backup
      await this.bot.sendMessage(channel, message);
    }
  }

  async buyrandom(context) {
    if(!this.isSuperUser(context.from.id)) {
      logger.info("not a super user, cannot buy random tokens!")
      return;
    }
    await this.redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_BUY_RANDOM_TOKEN }));
  }

  async closetrade(context) {
    if(!this.isSuperUser(context.from.id)) {
      logger.info("not a super user, cannot stop a trade!")
      return;
    }
    await this.redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_SELL_TOKEN }));
  }

  async fakecatbought(context) {
    if(!this.isSuperUser(context.from.id)) {
      logger.info("not a super user, cannot do a fake bought message!")
      return;
    }
    await this.redisPublisher.publish(config.VLING_EVENT_KEY, JSON.stringify({event: CAT_BOUGHT_TOKEN }));
  }

  async signalBoughtToken(msg) {
    await this.sendPhoto(config.VLING_TG_CHANNEL_ID, `The voidling bought ${msg.tokenInfo.receivedToken.name} (${msg.tokenInfo.receivedToken.symbol})`);
  }

  async signalSoldToken(msg) {
    await this.sendPhoto(config.VLING_TG_CHANNEL_ID, `The voidling sold ${msg.soldToken.name}`);
  }

  async start(ctx) {
    logger.debug(ctx);
    if(await this.isAdmin(ctx.chat.id, ctx.from.id, ctx) || this.isGod(ctx.from.id)) {
      this.setValue(ctx.chat.id, true);
    }
  }

  async stop(ctx) {
    logger.debug(ctx);
    if(await this.isAdmin(ctx.chat.id, ctx.from.id, ctx) || this.isGod(ctx.from.id)) {
      this.setValue(ctx.chat.id, false);
    }
  }

  async activateBot() {
    this.startGlobal = true;
  }

  async setStartGlobal(context) {
    logger.debug(context);
    if(!this.isGod(context.from.id)) {
      return;
    }
    this.startGlobal = true;
  }

  async setStopGlobal(context) {
    logger.debug(context);
    if(!this.isGod(context.from.id)) {
      return;
    }
    this.startGlobal = false;
  }


  getActive(context) {
    if(context.chat.type == 'private') {
      // dont check this in private chats
      return true;
    }

    // if startglobal consider that the channel is active, unless a stop has been called
    if(this.startGlobal !== undefined) {
      if(this.startGlobal) {
        if(this.channel.get(context.chat.id) === undefined) {
          this.channel.set(Number(context.chat.id), true);
        }
      } else {
        return false;
      }
    }

    return this.channel.get(context.chat.id);
  }

  isGod(idOfUser) {
    return idOfUser == get(config.GOD_TG_ACCOUNT);
  }

  isSuperUser(idOfUser) {
    return idOfUser == config.GOD_TG_ACCOUNT || idOfUser == config.FIGURE_TG_ACCOUNT;
  }

  async isAdmin(idOfChat, idOfUser, ctx) {
    try {
      let admins = await this.bot.getChatAdministrators(idOfChat);
      for(let i=0; i<admins.length; i++) {
        if(idOfUser === admins[i].user.id) {
          return true;
        }        
      }
    } catch(err) {
      // this will happen if its send in a private chat, consider this OK!
      return true;
    }
    return false;
  }

  async spamCheck(chatId, fromId, key) {
    let check = true;

    if(this.isGod(fromId)) {
      return true;
    }

    // does this guy have a bb rank?
 

    let specialLimit = false;

    // if so get his throttle value
    let throttle = this.throttle;
    let throttleKey = chatId+key;
    let minInterval = this.nextMinintervalSeconds;
    let prev = throttle.get(throttleKey);
    if (prev == null) {
      prev = 0;
    }
    let now = new Date().getTime();
    if (now - prev < minInterval*1000) {
      this.bot.sendMessage(chatId, "Calm down, " + (specialLimit ? "" : "only one request per minute"));
      check = false;
    } else {
      throttle.set(throttleKey, now);
    }
    return check;
  }

  setValue(chatId, value) {
    this.channel.set(chatId, value);
  }

  time(seconds) {
    const secsPerDay = 86400;
    const secsPerHour = 3600;
    const secsPerMinute = 60;
    
    let days    = Math.floor(seconds / secsPerDay);
    seconds     = (seconds % secsPerDay);
    let hours   = Math.floor(seconds / secsPerHour);
    seconds     = (seconds % secsPerHour);
    let minutes = Math.floor(seconds / secsPerMinute);
    seconds     = Math.trunc((seconds % secsPerMinute));

    let timeText = '';
    if (days > 0) {
      timeText += new String(days) + "d ";
    }

    if (hours > 0) {
      timeText += new String(hours) + (hours == 1 ? "h " : "h ");
    }

    if (minutes > 0) {
      timeText += new String(minutes) + (minutes == 1 ? "m " : "m ");
    }

    if (seconds > 0) {
      timeText += new String(seconds) + (seconds == 1 ? "s " : "s ");
    }

    return timeText;

  }
  
}