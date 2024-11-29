import { logger } from './logger.js';

export function pickToken() {
  let idx = randomNumber(candidates.length);
  let winner = candidates[idx];
  logger.info("random pick: " + winner.name);
  return winner;
}

function randomNumber(max) {
  return Math.floor(Math.random() * max);
}


let candidates = [
  {
    address: "D1ySHVWnaWQsf8WiskayoF7oHuvXLp4CXvYw3PaS8N7B",
    name: "Pepito"
  },
  {
    address: "45A2W6WEkQGkLpawnkkDhgNMKkTs3oYHrabxfUzppump",
    name: "WWW"
  },
  {
    address: "C9FVTtx4WxgHmz55FEvQgykq8rqiLS8xRBVgqQVtpump",
    name: "CENTS"
  },
  {
    address: "CzLSujWBLFsSjncfkh59rUFqvafWcY5tzedWJSuypump",
    name: "GOAT"
  },
  {
    address: "21AErpiB8uSb94oQKRcwuHqyHF93njAxBSbdUrpupump",
    name: "WIF"
  }
]