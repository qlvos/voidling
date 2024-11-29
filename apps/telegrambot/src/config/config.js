let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV : "prod";

function get(parameter) {
  if(!parameter) {
    return null;
  }
  return parameter[currentEnvironment] ? parameter[currentEnvironment] : parameter.default;
}

/*
Template

config.NAME = {
  dev: null,
  test: null,
  prod: null,
  default: process.env.NAME
}
*/

export const config = {};

config.CAT_AGENT_TELEGRAM_TOKEN = get({
  dev: null,
  test: process.env.CAT_TG_BOT_KEY_TEST,
  prod: null,
  default: process.env.CAT_TG_BOT_KEY
});

config.CAT_TG_CHANNEL_ID = get({
  dev: null,
  test: process.env.CAT_TG_CHANNEL_ID_TEST,
  prod: null,
  default: process.env.CAT_TG_CHANNEL_ID
});

config.GOD_TG_ACCOUNT = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.GOD_TG_ACCOUNT
});

config.FIGURE_TG_ACCOUNT = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.FIGURE_TG_ACCOUNT
});


config.CAT_EVENT_KEY = get({
  dev: null,
  test: "test_cat_event",
  prod: null,
  default: "cat_event"
});

config.CAT_AGENT_POSTGRES_DATABASE = get({
  dev: null,
  test: null,
  prod: null,
  default: "cat_agent_db"
});

config.CAT_AGENT_POSTGRES_URL = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.CAT_AGENT_POSTGRES_URL,
});

config.CAT_AGENT_POSTGRES_CREDENTIALS = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.CAT_AGENT_POSTGRES_CREDENTIALS,
});

config.CAT_AGENT_REDIS_URL = get({
  dev: null,
  test: null,
  prod: null,
  default: 'localhost:6379'//process.env.CAT_AGENT_REDIS_URL
});

config.TG_REAPER_API_ID = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.TG_REAPER_API_ID
})

config.TG_REAPER_API_HASH = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.TG_REAPER_API_HASH
})