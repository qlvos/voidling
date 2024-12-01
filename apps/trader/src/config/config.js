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

config.DEXTOOLS_API_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.DEXTOOLS_API_KEY
})

config.VLING_HELIUS_API_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.VLING_HELIUS_API_KEY
});

config.VLING_BUY_AMOUNT = get({
  dev: null,
  test: null,
  prod: null,
  default: 0.0001
});

config.VLING_WALLET_PRIVATE_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.VLING_WALLET_PRIVATE_KEY
});

config.SOLANA_RPC_URL = get({
  dev: null,
  test: null,
  prod: null,
  default: "https://api.mainnet-beta.solana.com"
});


config.VLING_EVENT_KEY = get({
  dev: null,
  test: "test_voidling_event",
  prod: null,
  default: "voidling_event"
});

config.VLING_POSTGRES_DATABASE = get({
  dev: null,
  test: null,
  prod: null,
  default: "voidling_db"
});

config.VLING_POSTGRES_URL = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.VLING_POSTGRES_URL,
});

config.VLING_POSTGRES_CREDENTIALS = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.VLING_POSTGRES_CREDENTIALS,
});

config.VLING_REDIS_URL = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.VLING_REDIS_URL
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