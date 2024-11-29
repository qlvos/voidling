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



config.CAT_HELIUS_API_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.CAT_HELIUS_API_KEY
});

config.CAT_BUY_AMOUNT = get({
  dev: null,
  test: null,
  prod: null,
  default: 0.0001
});

config.CAT_WALLET_PRIVATE_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.CAT_WALLET_PRIVATE_KEY
});

config.SOLANA_RPC_URL = get({
  dev: null,
  test: null,
  prod: null,
  default: "https://api.mainnet-beta.solana.com"
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