const dexScreenerUrl = function (address) {
  return "https://dexscreener.com/solana/" + address;
}

function formatAmount(amount) {
  return parseInt(amount, 10).toLocaleString('en-US');
  return amnt < 0 ? ("-" + amnt) : amnt;
}

function formatPercentage(variation) {
  let percentage = ((variation * 100) - 100).toFixed(1);
  return (percentage > 0 ? "+" : "") + percentage + "%";
}

function formatAmount(amount) {
  if(amount == null) {
    return null;
  }
  return parseInt(amount, 10).toLocaleString('en-US');
  return amnt < 0 ? ("-" + amnt) : amnt;
}

function formatPercentage(variation, ratio) {
  if(variation == null) {
    return null;
  }
  let percentage = ratio ? ((variation * 100) - 100).toFixed(0) : variation.toFixed(0);
  return (percentage > -1 ? "+" : "") + percentage + "%";
}

function calculatePaddings(strings, maxLength) {
  return strings.map(str => {
    const paddingNeeded = maxLength - str.length;
    return ' '.repeat(paddingNeeded);
  });
}

function truncateString(str, maxLength) {
  if (str.length > maxLength) {
    return str.slice(0, maxLength) + '...';
  } else {
    return str;
  }
}

function shortenIfNeeded(str) {
  let maxlength = 15;
  return (window.isMobile && str.length > maxlength) ? (str.substr(0, 3) + "..." + str.substr(str.length - 3)) : str;
}

function shorten(str) {
  return (str.substr(0, 3) + "..." + str.substr(str.length - 3));
}