
import { config } from './config/config.js';


export function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

export function getRandomIntBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function formatAmount(amount) {
  return parseInt(amount, 10).toLocaleString('en-US');
}

export function roundToDecimals(n, decimals) {
  var log10 = n ? Math.floor(Math.log10(n)) : 0,
      div = log10 < 0 ? Math.pow(10, decimals - log10 - 1) : Math.pow(10, decimals);

  return Math.round(n * div) / div;
}

export function formatNumber(num) {
  return (num).toFixed(20).match(/^-?\d*\.?0*\d{0,2}/)[0];
}

export function cleanText(str) {
  // Replace the matched text with an empty string
  str = str.replace(/\*[^*]*\*/g, '');
  return str.replace(/[^a-zA-Z0-9 ?.,!#'&%$*()-+:\n]/g, '');
}

export function removeExtraTokens(str) {
  const colonIndex = str.indexOf(':');
  if (colonIndex !== -1) {
      return str.substring(colonIndex + 1).trim();
  }
  return str;
}