import { calculateDimensions, getCharacterDimensions } from "./canvashelper.js";
import { getIndexAssets } from "./chaindata.js";

const TIME_RANGE_HOURS = 168;
const TIMESTAMP_INTERVAL_HOURS = 14;

class IndexChart {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = new Array(width * height).fill(' ');
    this.colorBuffer = new Array(width * height).fill(null);

    this.prices = new Map();
    this.marketCaps = new Map();
    this.indexValues = [];
    this.minValue = 0;
    this.maxValue = 0;
    this.isLoading = false;
    this.lastUpdate = null;
    this.errorMessage = null;

    this.DATA_POINTS = TIME_RANGE_HOURS + 1;

    this.starColor = '#d75f00';
    this.atColor = '#ff8700';
    this.plusColor = '#5f5fff';
    this.gridColor = '#302360';

    // [ADDED CODE] Flag to show textual underlying data
    this.showUnderlying = false;

    // So main-test.js can know where we put the "button"
    // We’ll store bounding info for the top-right toggle text
    this.toggleButton = {
      text: '',     // "UNDERLYING" or "CHART"
      startX: 0,
      startY: 0,
      endX: 0
    };
  }

  setStarColor(color) {
    this.starColor = color;
  }
  setAtColor(color) {
    this.atColor = color;
  }
  setPlusColor(color) {
    this.plusColor = color;
  }
  setGridColor(color) {
    this.gridColor = color;
  }

  initializeBuffer() {
    this.buffer.fill(' ');
    this.colorBuffer.fill(null);
  }

  computePercentChange(prices, offsetHours) {
    try {
      const last = prices[prices.length - 1];
      const oldIndex = prices.length - 1 - offsetHours;
      if (oldIndex < 0) return 'N/A';
      const oldVal = prices[oldIndex];
      if (!oldVal || oldVal === 0) return 'N/A';  // Added null check
      const pct = ((last - oldVal) / oldVal) * 100;
      return pct.toFixed(2) + '%';
    } catch (e) {
      console.error("Error computing change:", e);  // Added error logging
      return 'N/A';
    }
  }

  async updatePriceData(symbol) {
    let indexAssets = getIndexAssets();
    const asset = Object.values(indexAssets).find(t => t.symbol === symbol);
    if (!asset) {
      throw new Error(`Asset ${symbol} not found in configuration`);
    }

      const priceValues = asset.data.map(item => {
        const price = parseFloat(item.value);
        return price;
      });

      this.prices.set(symbol, priceValues);
      this.marketCaps.set(symbol, priceValues.map(price => price * Number(asset.totalSupply)));

      this.lastUpdate = new Date();
      this.errorMessage = null;
      return true;
  }

  async updateAllPrices() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = null;

    try {
      const tokens = Object.values(getIndexAssets()).map(t => t.symbol);
      await Promise.all(tokens.map(sym => this.updatePriceData(sym)));
      this.calculateIndex();
    } catch (error) {
      console.log(error)
      this.errorMessage = `Failed to update prices: ${error.message}`;
    } finally {
      this.isLoading = false;
    }
  }

  calculateIndex() {
    if (this.marketCaps.size === 0) return;

    const firstMarketCap = Array.from(this.marketCaps.values())[0];
    const timePoints = firstMarketCap.length;
    this.indexValues = new Array(timePoints).fill(0);

    for (let i = 0; i < timePoints; i++) {
      let totalMarketCap = 0;
      let validDataPoints = 0;

      this.marketCaps.forEach(mcaps => {
        if (mcaps[i] !== undefined && !isNaN(mcaps[i])) {
          totalMarketCap += mcaps[i];
          validDataPoints++;
        }
      });

      if (validDataPoints > 0) {
        this.indexValues[i] = totalMarketCap;
      } else {
        this.indexValues[i] = i > 0 ? this.indexValues[i - 1] : 0;
      }
    }

    // Normalize to start at 100
    const divisor = this.indexValues[0] / 100;
    this.indexValues = this.indexValues.map(value => value / divisor);

    const validValues = this.indexValues.filter(value => !isNaN(value));
    this.minValue = Math.min(...validValues);
    this.maxValue = Math.max(...validValues);
  }

  toggleUnderlying() {
    this.showUnderlying = !this.showUnderlying;
  }

  drawChart() {
    console.log("drawChart, buffer length: " + this.buffer.length)
    this.initializeBuffer();

    if (this.isLoading) {
      const loadingText = "Loading price data...";
      const x = Math.floor((this.width - loadingText.length) / 2);
      const y = Math.floor(this.height / 2);
      this.drawText(loadingText, x, y);
      return;
    }

    if (this.errorMessage) {
      const errorLines = this.errorMessage.match(/.{1,40}/g) || [];
      const startY = Math.floor(this.height / 2) - Math.floor(errorLines.length / 2);
      errorLines.forEach((line, i) => {
        const x = Math.floor((this.width - line.length) / 2);
        this.drawText(line, x, startY + i);
      });
      return;
    }

    // [ADDED CODE] If in "showUnderlying" mode, draw the textual listing instead
    if (this.showUnderlying) {
      this.drawUnderlying();
      return;
    }

    if (!this.indexValues.length) {
      const noDataText = "No data available";
      const x = Math.floor((this.width - noDataText.length) / 2);
      const y = Math.floor(this.height / 2);
      this.drawText(noDataText, x, y);
      return;
    }

    // ---------------------------
    // 1) Draw the main outer border
    // ---------------------------
    const { plotStartX, plotWidth, plotStartY, plotHeight } = this.drawBorder();

    // 2) Define data region
    const TOP_OFFSET = 2;
    const LEFT_OFFSET = 3;
    const BOTTOM_OFFSET = 3;
    const RIGHT_OFFSET = 6;

    const dataStartX = plotStartX + LEFT_OFFSET;
    const dataStartY = plotStartY + TOP_OFFSET;
    const dataWidth = plotWidth - (LEFT_OFFSET + RIGHT_OFFSET);
    const dataHeight = plotHeight - (TOP_OFFSET + BOTTOM_OFFSET);

    if (dataWidth < 2 || dataHeight < 2) {
      this.drawText("Not enough space", 2, 2);
      return;
    }

    const timeIntervals = TIME_RANGE_HOURS;
    const intervalWidth = dataWidth / timeIntervals;
    const markerPositions = new Array(this.DATA_POINTS).fill(0);

    // 3) Draw grid lines (vertical, horizontal)
    for (let hour = 0; hour <= timeIntervals; hour++) {
      const x = dataStartX + Math.round(hour * intervalWidth);
      markerPositions[hour] = x;

      if (hour % TIMESTAMP_INTERVAL_HOURS === 0) {
        if (hour !== 0 && hour !== timeIntervals) {
          for (let y = dataStartY; y < dataStartY + dataHeight; y++) {
            const idx = x + y * this.width;
            if (this.buffer[idx] !== ' ' && this.buffer[idx] !== '+') {
              this.buffer[idx] = '¦';
              this.colorBuffer[idx] = this.gridColor;
            } else if (this.buffer[idx] === ' ') {
              this.buffer[idx] = '¦';
              this.colorBuffer[idx] = this.gridColor;
            }
          }
        }
      }
    }

    const priceSteps = Math.min(10, dataHeight - 1);
    const priceSpacing = Math.max(1, Math.floor(dataHeight / priceSteps));
    const priceLabels = [];

    for (let y = 0; y < dataHeight; y++) {
      if (y % priceSpacing === 0 && y > 0 && y < dataHeight) {
        const screenY = dataStartY + y;
        for (let x = dataStartX; x < dataStartX + dataWidth; x++) {
          const idx = x + screenY * this.width;
          if (this.buffer[idx] !== '¦' && this.buffer[idx] !== '+') {
            this.buffer[idx] = '-';
            this.colorBuffer[idx] = this.gridColor;
          } else if (this.buffer[idx] === '¦') {
            this.buffer[idx] = '+';
            this.colorBuffer[idx] = this.plusColor;
          }
        }
        const level = y / priceSpacing;
        const stepValue = this.maxValue - level * (this.maxValue - this.minValue) / priceSteps;
        const label = stepValue.toFixed(0);
        priceLabels.push({
          text: label,
          x: dataStartX + dataWidth - label.length + 5,
          y: screenY,
          color: '#5f5fff'
        });
      }
    }

    // 4) Plot index line
    if (this.indexValues.length > 0) {
      for (let i = 0; i < this.indexValues.length - 1; i++) {
        const value = this.indexValues[i];
        const nextValue = this.indexValues[i + 1];
        if (isNaN(value) || isNaN(nextValue)) continue;

        const normVal = (value - this.minValue) / (this.maxValue - this.minValue);
        const normNextVal = (nextValue - this.minValue) / (this.maxValue - this.minValue);

        const x1 = markerPositions[i];
        const x2 = markerPositions[i + 1];
        const y1 = dataStartY + Math.floor((1 - normVal) * (dataHeight - 1));
        const y2 = dataStartY + Math.floor((1 - normNextVal) * (dataHeight - 1));

        if (this.isInBounds(x1, y1) && this.isInBounds(x2, y2)) {
          this.drawLine(x1, y1, x2, y2);

          const idx1 = x1 + y1 * this.width;
          if (this.buffer[idx1] !== '@' && this.buffer[idx1] !== '+') {
            this.buffer[idx1] = '@';
            this.colorBuffer[idx1] = this.atColor;
          }
          if (i === this.indexValues.length - 2) {
            const idx2 = x2 + y2 * this.width;
            if (this.buffer[idx2] !== '@' && this.buffer[idx2] !== '+') {
              this.buffer[idx2] = '@';
              this.colorBuffer[idx2] = this.atColor;
            }
          }
        }
      }
    }

    // 5) Draw price labels
    for (const p of priceLabels) {
      this.drawText(p.text, p.x, p.y, p.color);
    }
  }

  // YOU ARE HERE/ SEEMS LIKE BUFFER GETS ONE ROW (at least) TOO BIG SOMEWHERE !!
  drawBorder() {
    const plotStartX = 0;
    const plotStartY = 0;
    const plotWidth = this.width;
    const plotHeight = this.height;

    let cscheme = colorScheme.get(scheme);
    let cv = getCharacterDimensions();

    const dims = calculateDimensions();
    const height = Math.floor(this.buffer.length / dims.width);
    initStringPositions(dims.width, height);
    let char, c = null;

    console.log("current length: " + this.buffer.length)

    for (let x = plotStartX; x < plotStartX + plotWidth; x++) {
      const topIndex = x;
      this.buffer[topIndex] = '$';
      ({ char, c } = borderCharacter(x, 0, x, 0, cv, null, null, cscheme, [...indexStrings.top]));
      if (char != null) {
        this.buffer[topIndex] = char;
        this.colorBuffer[topIndex] = c;
      }
    
      const bottomIndex = x + (plotHeight * this.width) - this.width;

      this.buffer[bottomIndex] = '$';
      ({ char, c } = borderCharacter(x, (plotStartY + plotHeight), x, (plotStartY + plotHeight), cv, null, null, cscheme, [...indexStrings.bottom]));
      if (char != null) {
        this.buffer[bottomIndex] = char;
        this.colorBuffer[bottomIndex] = c;
      }
    }

    for (let y = plotStartY; y < plotStartY + plotHeight; y++) {
      const leftIndex = plotStartX + (y * this.width);
      const rightIndex = (plotStartX + this.width) + (y * this.width) - 1;

        this.buffer[leftIndex] = '$';
        ({ char, c } = borderCharacter(plotStartX, y, plotStartX, y, cv, null, null, cscheme, [...indexStrings.left], true));
        if (char != null) {
          this.buffer[leftIndex] = char;
          this.colorBuffer[leftIndex] = c;
        }
      

        this.buffer[rightIndex] = '$';
        ({ char, c } = borderCharacter(plotStartX + plotWidth, y, plotStartX + plotWidth, y, cv, null, null, cscheme, [...indexStrings.right], true));
        if (char != null) {
          this.buffer[rightIndex] = char;
          this.colorBuffer[rightIndex] = c;
        }
      
    }
    return { plotStartX, plotWidth, plotStartY, plotHeight };
  }

  drawUnderlying() {
    this.initializeBuffer();

    const { plotStartX, plotWidth, plotStartY, plotHeight } = this.drawBorder();

    // Column widths and positions
    const colWidths = {
      symbol: 14,
      marketCap: 20,
      latest: 15,
      pct1h: 12,
      pct24h: 12,
      pct7d: 12
    };

    const headerX = plotStartX + 8;
    const headerY = plotStartY + 6;

    // Function to draw full-width horizontal grid line
    const drawHorizontalGrid = (y) => {
      for (let x = plotStartX + 1; x < plotStartX + plotWidth - 1; x++) {
        const idx = x + y * this.width;
        if (x === headerX - 1 || x === headerX + colWidths.symbol ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.latest ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.latest + 1 + colWidths.pct1h ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.latest + 1 + colWidths.pct1h + 1 + colWidths.pct24h) {
          this.buffer[idx] = '+';
          this.colorBuffer[idx] = this.plusColor;
        } else {
          this.buffer[idx] = '-';
          this.colorBuffer[idx] = this.gridColor;
        }
      }
    };

    // Initial grid line above titles
    drawHorizontalGrid(headerY - 1);

    // Draw headers
    const headers = [
      "SYMBOL".padEnd(colWidths.symbol),
      "MARKET CAP".padEnd(colWidths.marketCap),
      "PRICE".padEnd(colWidths.latest),
      "1H%".padEnd(colWidths.pct1h),
      "24H%".padEnd(colWidths.pct24h),
      "7D%".padEnd(colWidths.pct7d)
    ];

    let currentX = headerX;
    headers.forEach(header => {
      this.drawText(header, currentX, headerY, '#5f5fff');
      currentX += header.length + 1;
    });

    // Grid line below titles
    drawHorizontalGrid(headerY + 1);

    // Start tokens data after two full empty lines
    let currentY = headerY + 4;

    // Draw vertical grid lines
    const startY = plotStartY + 1;
    const endY = plotStartY + plotHeight - 2;

    // Calculate x positions for vertical lines
    const verticalLineXs = [
      headerX - 1,
      headerX + colWidths.symbol,
      headerX + colWidths.symbol + 1 + colWidths.marketCap,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.latest,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.latest + 1 + colWidths.pct1h,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.latest + 1 + colWidths.pct1h + 1 + colWidths.pct24h,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.latest + 1 + colWidths.pct1h + 1 + colWidths.pct24h + 1 + colWidths.pct7d
    ];

    // Draw vertical lines
    verticalLineXs.forEach(x => {
      for (let y = startY; y < endY; y++) {
        const idx = x + y * this.width;
        if (this.buffer[idx] === '-') continue;  // Don't override intersections
        this.buffer[idx] = '¦';
        this.colorBuffer[idx] = this.gridColor;
      }
    });

    // Sort tokens by market cap
    const sortedTokens = Object.values(getIndexAssets())
      .map(token => {
        const mcapArray = this.marketCaps.get(token.symbol);
        return {
          token,
          marketCap: mcapArray ? mcapArray[mcapArray.length - 1] : 0
        };
      })
      .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0))
      .map(item => item.token);

    let totalMarketCap = 0;

    // Process sorted tokens
    for (const token of sortedTokens) {
      const symbol = token.symbol;
      const priceArray = this.prices.get(symbol);
      const mcapArray = this.marketCaps.get(symbol);
      if (!priceArray || !mcapArray) continue;

      drawHorizontalGrid(currentY - 1);  // Grid line above data

      const latestPrice = priceArray[priceArray.length - 1];
      const latestCap = mcapArray[mcapArray.length - 1];
      totalMarketCap += latestCap || 0;

      const pct1h = this.computePercentChange(priceArray, 1);
      const pct24h = this.computePercentChange(priceArray, 24);
      const pct7d = ((priceArray[priceArray.length - 1] - priceArray[0]) / priceArray[0] * 100).toFixed(2) + '%';

      currentX = headerX;

      // Symbol (orange)
      this.drawText(symbol.padEnd(colWidths.symbol), currentX, currentY, '#ff8700');
      currentX += colWidths.symbol + 1;

      // Market Cap (darker orange)
      this.drawText((latestCap ? latestCap.toLocaleString('en-US', { maximumFractionDigits: 2 }) : 'N/A').padEnd(colWidths.marketCap),
        currentX, currentY, '#d75f00');
      currentX += colWidths.marketCap + 1;

      // Other values
      const remainingData = [
        (latestPrice ? latestPrice.toFixed(6) : 'N/A').padEnd(colWidths.latest),
        pct1h.padEnd(colWidths.pct1h),
        pct24h.padEnd(colWidths.pct24h),
        pct7d.padEnd(colWidths.pct7d)
      ];

      remainingData.forEach(data => {
        this.drawText(data, currentX, currentY);
        currentX += data.length + 1;
      });

      currentY += 2;  // One line of data + one empty line
      drawHorizontalGrid(currentY - 1);
      if (currentY > plotStartY + plotHeight - 6) break;
    }

    // Draw grid line after tokens
    drawHorizontalGrid(currentY - 1);

    // Add a single empty line before INDEX
    currentY += 1;

    // Draw grid line before INDEX row
    drawHorizontalGrid(currentY);

    // Position for INDEX row
    currentY += 1;

    // Index information
    if (this.indexValues && this.indexValues.length > 0) {
      const latestIndex = this.indexValues[this.indexValues.length - 1];
      const pct1h = this.computePercentChange(this.indexValues, 1);
      const pct24h = this.computePercentChange(this.indexValues, 24);
      const pct7d = ((this.indexValues[this.indexValues.length - 1] - this.indexValues[0]) / this.indexValues[0] * 100).toFixed(2) + '%';

      currentX = headerX;

      // Index name (special purple)
      this.drawText("S&V AI INDEX".padEnd(colWidths.symbol), currentX, currentY, '#ff8700');
      currentX += colWidths.symbol + 1;

      // Market Cap and Latest (lighter purple)
      this.drawText(totalMarketCap.toLocaleString('en-US', { maximumFractionDigits: 2 }).padEnd(colWidths.marketCap),
        currentX, currentY, '#d75f00');
      currentX += colWidths.marketCap + 1;

      this.drawText(latestIndex.toFixed(2).padEnd(colWidths.latest),
        currentX, currentY, '#d75f00');
      currentX += colWidths.latest + 1;

      // Percentages
      const indexPercentages = [
        pct1h.padEnd(colWidths.pct1h),
        pct24h.padEnd(colWidths.pct24h),
        pct7d.padEnd(colWidths.pct7d)
      ];

      indexPercentages.forEach(pct => {
        this.drawText(pct, currentX, currentY);
        currentX += pct.length + 1;
      });
    }

    // Draw final grid line
    drawHorizontalGrid(currentY + 1);
  }

  isInBounds(x, y) {
    return (
      x >= 1 &&
      x <= this.width - 2 &&
      y >= 1 &&
      y <= this.height - 2
    );
  }

  drawLine(x1, y1, x2, y2) {
    let dx = Math.abs(x2 - x1);
    let dy = Math.abs(y2 - y1);
    let sx = (x1 < x2) ? 1 : -1;
    let sy = (y1 < y2) ? 1 : -1;
    let err = dx - dy;

    while (true) {
      if (this.isInBounds(x1, y1)) {
        const idx = x1 + y1 * this.width;
        if (this.buffer[idx] !== '@' && this.buffer[idx] !== '+') {
          this.buffer[idx] = '*';
          this.colorBuffer[idx] = this.starColor;
        }
      }
      if (x1 === x2 && y1 === y2) break;
      let e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
    }
  }

  drawText(text, x, y, color = null) {
    for (let i = 0; i < text.length && (x + i) < (this.width - 1); i++) {
      const idx = x + i + y * this.width;
      if (idx >= 0 && idx < this.buffer.length) {
        this.buffer[idx] = text[i];
        if (color) {
          this.colorBuffer[idx] = color;
        }
      }
    }
  }

  getBuffer() {
    return {
      chars: this.buffer.slice(),
      colors: this.colorBuffer.slice()
    };
  }
}

export { IndexChart };