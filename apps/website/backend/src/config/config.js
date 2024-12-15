
let currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV : "test";

function get(parameter) {
  return parameter[currentEnvironment] ? parameter[currentEnvironment] : parameter.default;
}

export const config = {};

config.VLING_HYPERBOLIC_API_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.VLING_HYPERBOLIC_API_KEY
});

config.VLING_HELIUS_API_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.VLING_HELIUS_API_KEY
});

config.DEXTOOLS_API_KEY = get({
  dev: null,
  test: null,
  prod: null,
  default: process.env.DEXTOOLS_API_KEY
})

config.VLINGSITE_WS_PORT = get({
  dev: null,
  test: null,
  prod: null,
  default: "47901"
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

config.VLINGSITE_REST_PORT = get({
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