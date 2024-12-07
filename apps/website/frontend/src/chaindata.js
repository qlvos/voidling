import { forceCleanup, getEmotion, setEmotion, assetBoxId, tradeLogId, watchlistBoxId, getModuleInitialized } from "./main.js";
const EMOTION_LOAD_WAIT = 3000;

let socket;
let reconnectInterval = 2000;
let keepAliveTimer;

const currentUrl = window.location.href; // Create a new URL object 
const url = new URL(currentUrl); // Get the base part of the URL 
const baseUrl = `${url.hostname}${url.port ? ':' + url.port : ''}`;
const WS_ADDRESS = `ws://${baseUrl}/ws`

const scrollSettings = new Map();
scrollSettings.set(assetBoxId, { top: 1, size: 3 })
scrollSettings.set(watchlistBoxId, { top: 1, size: 3 })
scrollSettings.set(tradeLogId, { top: 1, size: 5 })

const dexScreenerUrl = function (address) {
  return "https://dexscreener.com/solana/" + address;
}

export function connectWebSocket() {
  // Open a WebSocket connection
  socket = new WebSocket(WS_ADDRESS);

  // Handle the open event
  socket.onopen = function (event) {
    // Handle incoming messages
    socket.onmessage = function (event) {
      //console.log('Message received:', event.data);
      try {
        let msg = JSON.parse(event.data);
        if (msg.action == "vdata") {
          if (getEmotion() != msg.emotion) {
            //console.log("New emotion!")
            document.getElementById("voidlingemotion").innerHTML = msg.emotion;
            //console.log(msg.emotion)
  
            let emotionChangeTimeout = getModuleInitialized() ? 0 : EMOTION_LOAD_WAIT;
            setTimeout(() => { forceCleanup(); }, emotionChangeTimeout)
          }
          setEmotion(msg.emotion);
  
          if (msg.comment) {
            document.getElementById("voidlingcomment").innerHTML = msg.comment;
          }
  
  
          renderAssets(assetBoxId, msg.assets, scrollSettings.get(assetBoxId));
          renderLog(tradeLogId, msg.tradelog, scrollSettings.get(tradeLogId));
          renderAssets("watchlistbox", msg.watchlist, scrollSettings.get(watchlistBoxId));
  
        } else if (msg.action == "ping") {
          socket.send(JSON.stringify({ action: "pong" }));
        }
      } catch (err) {
        console.log("wrong json data, could parse it");
      }
    };

    // Handle the close event
    socket.onclose = function (event) {
      console.log('WebSocket connection closed:', event);
      // Clear the keepalive timer
      clearInterval(keepAliveTimer);
      // Attempt to reconnect
      setTimeout(connectWebSocket, reconnectInterval);
    };

    // Handle errors
    socket.onerror = function (error) {
      console.error('WebSocket error:', error);
    };
  }
}

const textGap = "    ";
const MOBILE_NAME_LENGTH = 8;

function renderAssets(containerId, assets, scrollSettings) {
  if (!assets || assets.length == 0) {
    return;
  }
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  let formattedAssets = assets.map((asset) => {
    return {
      token: {
        symbol: asset.token.symbol,
        name: truncateString(asset.token.name, (window.isMobile ? MOBILE_NAME_LENGTH : 20))
      },
      address: shorten(asset.address),
      holdingsUsdValue: formatAmount(asset.holdingsUsdValue),
      priceChange6h: formatPercentage(asset.priceChange6h, true),
      assetBagValue: formatAmount(asset.assetBagValue),
      variation: formatPercentage(asset.variation, true)
    }
  });

  let names = formattedAssets.map(asset => asset.token.name);
  const maxNameLength = Math.max(...names.map(name => name.length));
  const namePaddings = calculatePaddings(names, maxNameLength);

  let holdingUsdValues = formattedAssets.map(item => item.holdingsUsdValue);
  let hasHoldingValues = formattedAssets.length > 0 && formattedAssets[0].holdingsUsdValue != null;
  const maxHoldingUsdValueLength = hasHoldingValues ? Math.max(...holdingUsdValues.map(item => item.length)) : null;
  const usdHoldingPaddings = hasHoldingValues ? calculatePaddings(holdingUsdValues, maxHoldingUsdValueLength) : null;

  let priceChange6hValues = formattedAssets.map(item => item.priceChange6h);
  let hasPriceChange6hValues = formattedAssets.length > 0 && formattedAssets[0].priceChange6h != null;
  const max6hValueLength = hasPriceChange6hValues ? Math.max(...priceChange6hValues.map(item => item.length)) : null;
  const priceChangePaddings = hasPriceChange6hValues ? calculatePaddings(priceChange6hValues, max6hValueLength) : null;

  let start = scrollSettings ? (scrollSettings.top - 1) : 0;

  let counter = 0;

  const upDiv = document.createElement('div');
  container.appendChild(upDiv)
  if (scrollSettings && scrollSettings.top > 1) {
    upDiv.innerHTML = "<b>^ </b>";
    upDiv.style.cursor = "pointer";

    upDiv.onclick = function () {
      scrollSettings.top = (scrollSettings.top - 1);
      renderAssets(containerId, assets, scrollSettings);
    };

  } else {
    upDiv.innerHTML = "&nbsp;";
  }


  for (let i = start; i < formattedAssets.length; i++) {
    if (scrollSettings) {
      if (counter >= scrollSettings.size) {
        break;
      }
    }
    ++counter;

    let asset = formattedAssets[i];
    const assetDiv = document.createElement('div');
    assetDiv.className = 'asset';
    assetDiv.innerHTML = `${i + 1} ${asset.token.name}${namePaddings[i]} | <a target="_blank" href="${dexScreenerUrl(asset.address)}">${asset.address}</a>`;

    if (asset.holdingsUsdValue != null) {
      assetDiv.innerHTML += ` | $${asset.holdingsUsdValue}`
    }

    if (asset.priceChange6h != null) {
      assetDiv.innerHTML += ` ${usdHoldingPaddings[i]}| ${asset.priceChange6h}${priceChangePaddings[i]} [6H]`
    }

    if (asset.variation != null) {
      assetDiv.innerHTML += ` | $${asset.bagValue} (${asset.variation})`
    }
    container.appendChild(assetDiv);
  }

  if (scrollSettings) {
    const nextDiv = document.createElement('div');

    if (!((formattedAssets.length > scrollSettings.size) && !((scrollSettings.top) + scrollSettings.size > formattedAssets.length))) {
      nextDiv.innerHTML = "&nbsp;"
      container.appendChild(nextDiv)
      return;
    }

    nextDiv.innerHTML = "<b>v </b>";
    nextDiv.style.cursor = "pointer";

    nextDiv.onclick = function () {
      scrollSettings.top = (scrollSettings.top + 1);
      renderAssets(containerId, assets, scrollSettings);
    };
    container.appendChild(nextDiv)
  }
}

function renderLog(containerId, assets, scrollSettings) {
  if (!assets || assets.length == 0) {
    return;
  }
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  let formattedAssets = assets.map((asset) => {
    return {
      token: {
        symbol: asset.token.symbol,
        name: truncateString(asset.token.name, (window.isMobile ? MOBILE_NAME_LENGTH : 20))
      },
      action: asset.action.toUpperCase(),
      address: shorten(asset.address),
      tokens: formatAmount(asset.tokens),
      usdvalue: formatAmount(asset.usdvalue),
      variation: formatPercentage(asset.variation, true)
    }
  });

  let tokens = formattedAssets.map(asset => asset.tokens);
  const maxTokensLength = Math.max(...tokens.map(item => item.length));
  const tokensPaddings = calculatePaddings(tokens, maxTokensLength);

  let symbols = formattedAssets.map(asset => asset.token.symbol);
  const maxSymbolsLength = Math.max(...symbols.map(item => item.length));
  const symbolsPaddings = calculatePaddings(symbols, maxSymbolsLength);

  let names = formattedAssets.map(asset => asset.token.name);
  const maxNameLength = Math.max(...names.map(name => name.length));
  const namePaddings = calculatePaddings(names, maxNameLength);


  let start = scrollSettings ? (scrollSettings.top - 1) : 0;

  let counter = 0;

  const upDiv = document.createElement('div');
  container.appendChild(upDiv)
  if (scrollSettings && scrollSettings.top > 1) {
    upDiv.innerHTML = "<b>^ </b>";
    upDiv.style.cursor = "pointer";

    upDiv.onclick = function () {
      scrollSettings.top = (scrollSettings.top - 1);
      renderLog(containerId, assets, scrollSettings);
    };

  } else {
    upDiv.innerHTML = "&nbsp;";
  }


  for (let i = start; i < formattedAssets.length; i++) {
    if (scrollSettings) {
      if (counter >= scrollSettings.size) {
        break;
      }
    }
    ++counter;

    let asset = formattedAssets[i];
    const assetDiv = document.createElement('div');
    assetDiv.className = 'asset';
    assetDiv.innerHTML = `${i + 1} [${asset.action}]${asset.action.length == 3 ? " " : ""} ${asset.token.name}${namePaddings[i]} | <a target="_blank" href="${dexScreenerUrl(asset.address)}">${asset.address}</a>`;

    if (asset.tokens != null) {
      assetDiv.innerHTML += ` | ${asset.tokens} ${tokensPaddings[i]}${asset.token.symbol}${symbolsPaddings[i]} ($${asset.usdvalue}${asset.variation != null ? (", " + asset.variation) : ""})`
    }
    container.appendChild(assetDiv);
  }

  if (scrollSettings) {
    const nextDiv = document.createElement('div');

    if (!((formattedAssets.length > scrollSettings.size) && !((scrollSettings.top) + scrollSettings.size > formattedAssets.length))) {
      nextDiv.innerHTML = "&nbsp;"
      container.appendChild(nextDiv)
      return;
    }

    nextDiv.innerHTML = "<b>v </b>";
    nextDiv.style.cursor = "pointer";

    nextDiv.onclick = function () {
      scrollSettings.top = (scrollSettings.top + 1);
      renderLog(containerId, assets, scrollSettings);
    };
    container.appendChild(nextDiv)
  }
}

function formatAmount(amount) {
  if(amount == null) {
    return null;
  }
  return parseInt(amount, 10).toLocaleString('en-US');
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

function shorten(str) {
  return (str.substr(0, 3) + "..." + str.substr(str.length - 3));
}