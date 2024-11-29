
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV : "test";

function get(parameter) {
  return parameter[currentEnvironment] ? parameter[currentEnvironment] : parameter.default;
}

export const config = {};

config.DEXTOOLS_API_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.DEXTOOLS_API_KEY
})

config.CATSITE_WS_PORT = get({
  dev: null,
  test: null,
  prod: null,
  default: "47901"
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

config.CATSITE_REST_PORT = get({
  dev: null,
  test: null,
  prod: null,
  default: 47900
});

config.RG_API_BACKEND = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.RG_API_BACKEND_IP
});