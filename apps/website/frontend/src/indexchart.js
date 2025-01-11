import { calculateDimensions, getCharacterDimensions } from "./canvashelper.js";
import { getIndexAssets } from "./chaindata.js";

const TIME_RANGE_HOURS = 168;
const TIMESTAMP_INTERVAL_HOURS = 14;
const HEADER_Y = 6;

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

    // Add these new properties for index summary
    this.latestTotalMarketCap = 0;
    this.latestIndexValue = '100.00';
    this.indexPct1h = 'N/A';
    this.indexPct24h = 'N/A';
    this.indexPct7d = 'N/A';

    this.DATA_POINTS = TIME_RANGE_HOURS + 1;

    this.starColor = '#d75f00';
    this.atColor = '#ff8700';
    this.plusColor = '#5f5fff';
    this.gridColor = '#302360';

    this.showHelp = false;
    this.helpButton = {
      text: ' HELP ',
      startX: 0,
      startY: 0,
      endX: 0
    };
    this.linkPositions = [];
    this.links = new Map();

    // Flag to show textual underlying data
    this.showUnderlying = false;

    // So main-test.js can know where we put the "button"
    // We’ll store bounding info for the top-right toggle text
    this.toggleButton = {
      text: '',     // "UNDERLYING" or "CHART"
      startX: 0,
      startY: 0,
      endX: 0
    };

    // Table pagination properties
    this.TABLE_START_Y = 17;  // Space from top
    this.BOTTOM_MARGIN = 0;   // Space at bottom
    this.ROW_HEIGHT = 2;      // Height of each table row
    this.topIndex = 0;        // Current scroll position

    // Calculate how many rows can fit
    const availableHeight = height - this.TABLE_START_Y - this.BOTTOM_MARGIN;
    this.pageSize = Math.floor(availableHeight / this.ROW_HEIGHT);

    this.currentSort = null;
    this.sortAscending = false;

    // Column definitions
    this.columns = [
      { id: 'symbol', title: 'SYMBOL', width: 14 },
      { id: 'marketCap', title: 'MARKET CAP', width: 20, sortable: true },
      { id: 'price', title: 'PRICE', width: 15, sortable: true },
      { id: 'pct1h', title: '1H%', width: 12, sortable: true },
      { id: 'pct24h', title: '24H%', width: 12, sortable: true },
      { id: 'pct7d', title: '7D%', width: 12, sortable: true }
    ];

    // Navigation arrows positions
    this.upArrowPosition = null;
    this.downArrowPosition = null;
  }

  handleTableClick(x, y) {
    // Check up arrow click
    if (this.upArrowPosition &&
      y === this.upArrowPosition.y &&
      x >= this.upArrowPosition.x &&
      x < this.upArrowPosition.endX) {
      this.topIndex = Math.max(0, this.topIndex - this.pageSize);
      return true;
    }

    // Check down arrow click
    if (this.downArrowPosition &&
      y === this.downArrowPosition.y &&
      x >= this.downArrowPosition.x &&
      x < this.downArrowPosition.endX) {
      const tokens = Object.values(TOKEN_CONFIG);
      if (this.topIndex + this.pageSize < tokens.length) {
        this.topIndex += this.pageSize;
        return true;
      }
    }

    return false;
  }

  handleColumnClick(x, y) {
    console.log('handleColumnClick called:', { x, y, showUnderlying: this.showUnderlying });

    if (!this.showUnderlying) return false;

    // The headers are actually rendered at y=7, not TABLE_START_Y + 6
    const headerY = HEADER_Y;
    console.log('Expected header Y:', headerY, 'Actual Y:', y);

    if (y !== headerY) return false;

    let currentX = 8;
    console.log('Checking columns...');

    for (const column of this.columns) {
      console.log('Column:', column.id, 'X range:', currentX, 'to', currentX + column.width);
      if (column.sortable && x >= currentX && x < currentX + column.width) {
        console.log('Column click detected:', column.id);
        if (this.currentSort === column.id) {
          this.sortAscending = !this.sortAscending;
        } else {
          this.currentSort = column.id;
          this.sortAscending = false;
        }
        return true;
      }
      currentX += column.width + 1;
    }

    return false;
  }

  isHoveringColumn(x, y) {
    console.log('handleColumnHover called:', { x, y, showUnderlying: this.showUnderlying });

    if (!this.showUnderlying) return false;

    // The headers are actually rendered at y=7, not TABLE_START_Y + 6
    const headerY = HEADER_Y;
    console.log('Expected header Y:', headerY, 'Actual Y:', y);

    if (y !== headerY) return false;

    let currentX = 8;
    console.log('Checking columns...');

    for (const column of this.columns) {
      console.log('Column:', column.id, 'X range:', currentX, 'to', currentX + column.width);
      if (column.sortable && x >= currentX && x < currentX + column.width) {
        return true;
      }
      currentX += column.width + 1;
    }

    return false;
  }

  initializeHelpLinks() {
    this.links = new Map([
      ['nominees', 'https://standardvoids.com/'],
      ['X', 'https://x.com/standardvoids'],
      ['Telegram', 'https://t.me/reaper_agent'],
      ['github', 'https://github.com/your-repo'],
      ['documentation', 'https://docs.your-site.com'],
      ['telegram', 'https://t.me/your-group']
      // Add more links as needed
    ]);
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

    if (!asset.data) {
      return;
    }

    const priceValues = asset.data.map(item => {
      const price = parseFloat(item.value);
      return price;
    });

    this.prices.set(symbol, priceValues);
    this.marketCaps.set(symbol, priceValues.map(price => (price * Number(asset.totalSupply))));

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

    // Store the latest total market cap
    this.latestTotalMarketCap = this.indexValues[this.indexValues.length - 1];

    // Normalize to start at 100
    const divisor = this.indexValues[0] / 100;
    this.indexValues = this.indexValues.map(value => value / divisor);

    const validValues = this.indexValues.filter(value => !isNaN(value));
    this.minValue = Math.min(...validValues);
    this.maxValue = Math.max(...validValues);

    // Calculate percentage changes for the index
    this.indexPct1h = this.computePercentChange(this.indexValues, 1);
    this.indexPct24h = this.computePercentChange(this.indexValues, 24);
    this.indexPct7d = ((this.indexValues[this.indexValues.length - 1] - this.indexValues[0]) / this.indexValues[0] * 100).toFixed(2) + '%';
    this.latestIndexValue = this.indexValues[this.indexValues.length - 1].toFixed(2);
  }

  toggleHelp() {
    this.showHelp = !this.showHelp;
    console.log("Toggled help view:", this.showHelp);
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

    // Draw help view if enabled
    if (this.showHelp) {
      this.drawHelp();
      return;
    }

    // Show underlying data if enabled
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
      symbol: 21,
      marketCap: 20,
      price: 15,
      pct1h: 12,
      pct24h: 12,
      pct7d: 12
    };

    const headerX = plotStartX + 8;
    let headerY = plotStartY + 6;

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
      `PROJECTS [TOTAL: ${Object.keys(getIndexAssets()).length}]`.padEnd(colWidths.symbol),
      "MARKET CAP".padEnd(colWidths.marketCap),
      "PRICE".padEnd(colWidths.price),
      "1H%".padEnd(colWidths.pct1h),
      "24H%".padEnd(colWidths.pct24h),
      "7D%".padEnd(colWidths.pct7d)
    ];

    let currentX = headerX;
    headers.forEach(header => {
      this.drawText(header, currentX, headerY, '#5f5fff');
      currentX += header.length + 1;
    });

    // Grid line below headers with proper intersections
    drawHorizontalGrid(headerY + 1);

    // Add full empty row after headers (4 lines)
    headerY += 4;

    // Draw horizontal grid line above index row
    drawHorizontalGrid(headerY - 1);

    // Draw index summary row
    currentX = headerX;

    // Symbol (orange)
    this.drawText("S&V AI INDEX".padEnd(colWidths.symbol), currentX, headerY, '#ff8700');
    currentX += colWidths.symbol + 1;

    // Market Cap (darker orange)
    const totalMarketCapStr = this.latestTotalMarketCap ?
      this.latestTotalMarketCap.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A';
    this.drawText(totalMarketCapStr.padEnd(colWidths.marketCap), currentX, headerY, '#d75f00');
    currentX += colWidths.marketCap + 1;

    // Index Value
    this.drawText(this.latestIndexValue.padEnd(colWidths.price), currentX, headerY);
    currentX += colWidths.price + 1;

    // Percentages
    const indexPercentages = [this.indexPct1h, this.indexPct24h, this.indexPct7d];
    const colWidthsArray = [colWidths.pct1h, colWidths.pct24h, colWidths.pct7d];
    indexPercentages.forEach((pct, idx) => {
      this.drawText(pct.padEnd(colWidthsArray[idx]), currentX, headerY);
      currentX += colWidthsArray[idx] + 1;
    });

    // Draw grid line after index summary with proper intersections
    drawHorizontalGrid(headerY + 1);

    // Skip two full rows (4 lines) before token list
    headerY += 4;

    // Draw vertical grid lines
    const startY = plotStartY + 1;
    const endY = plotStartY + plotHeight - 2;

    // Calculate x positions for vertical lines
    const verticalLineXs = [
      headerX - 1,
      headerX + colWidths.symbol,
      headerX + colWidths.symbol + 1 + colWidths.marketCap,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h + 1 + colWidths.pct24h,
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h + 1 + colWidths.pct24h + 1 + colWidths.pct7d
    ];

    // Draw vertical lines
    verticalLineXs.forEach(x => {
      for (let y = startY; y < endY; y++) {
        const idx = x + y * this.width;
        if (this.buffer[idx] === '-') {
          // Create proper intersections
          this.buffer[idx] = '+';
          this.colorBuffer[idx] = this.plusColor;
        } else if (this.buffer[idx] === ' ') {
          this.buffer[idx] = '¦';
          this.colorBuffer[idx] = this.gridColor;
        }
      }
    });

    // Get tokens for current page
    const sortedTokens = this.sortTokens();
    const tokens = sortedTokens.slice(this.topIndex, this.topIndex + this.pageSize);

    // Process tokens
    for (const token of tokens) {
      const symbol = token.symbol;
      const priceArray = this.prices.get(symbol);
      const mcapArray = this.marketCaps.get(symbol);
      if (!priceArray || !mcapArray) continue;

      drawHorizontalGrid(headerY - 1);  // Grid line above data

      const latestPrice = priceArray[priceArray.length - 1];
      const latestCap = mcapArray[mcapArray.length - 1];
      //totalMarketCap += latestCap || 0;

      const pct1h = this.computePercentChange(priceArray, 1);
      const pct24h = this.computePercentChange(priceArray, 24);
      const pct7d = ((priceArray[priceArray.length - 1] - priceArray[0]) / priceArray[0] * 100).toFixed(2) + '%';

      currentX = headerX;

      // Symbol (orange)
      this.drawText(symbol.padEnd(colWidths.symbol), currentX, headerY, '#ff8700');
      currentX += colWidths.symbol + 1;

      // Market Cap (darker orange)
      this.drawText((latestCap ? latestCap.toLocaleString('en-US', { maximumFractionDigits: 0 }) : 'N/A').padEnd(colWidths.marketCap),
        currentX, headerY, '#d75f00');
      currentX += colWidths.marketCap + 1;

      // Price
      this.drawText((latestPrice ? latestPrice.toFixed(6) : 'N/A').padEnd(colWidths.price),
        currentX, headerY);
      currentX += colWidths.price + 1;

      // Percentages
      const percentages = [pct1h, pct24h, pct7d];
      const widths = [colWidths.pct1h, colWidths.pct24h, colWidths.pct7d];
      percentages.forEach((pct, idx) => {
        this.drawText(pct.padEnd(widths[idx]), currentX, headerY);
        currentX += widths[idx] + 1;
      });

      headerY += 2;  // Move to next row
      if (headerY >= plotStartY + plotHeight) break;
    }

    // Draw final grid line
    drawHorizontalGrid(headerY - 1);

    // Draw navigation arrows
    const navigationX = headerX + Object.values(colWidths).reduce((sum, width) => sum + width + 1, 0) + 2;

    // Up arrow
    if (this.topIndex > 0) {
      const upArrowY = plotStartY + 6;
      const upText = '▲ scroll up';
      this.drawText(upText, navigationX, upArrowY, '#ff8700');
      this.upArrowPosition = {
        x: navigationX,
        y: upArrowY,
        endX: navigationX + upText.length
      };
    } else {
      this.upArrowPosition = null;
    }

    // Down arrow
    if (this.topIndex + this.pageSize < Object.values(getIndexAssets()).length) {
      const downArrowY = plotStartY + 8;
      const downText = '▼ scroll down';
      this.drawText(downText, navigationX, downArrowY, '#ff8700');
      this.downArrowPosition = {
        x: navigationX,
        y: downArrowY,
        endX: navigationX + downText.length
      };
    } else {
      this.downArrowPosition = null;
    }
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

  drawText(text, startX, startY, color = null, maxWidth = this.width - 2) {
    let x = startX;
    let y = startY;
    let inLink = false;
    let currentLink = '';

    // Special handling for title buttons - if text starts with space and is short
    if (text.startsWith(' ') && text.length < 15) {
      for (let i = 0; i < text.length; i++) {
        const idx = (x + i) + (y * this.width);
        if (idx >= 0 && idx < this.buffer.length) {
          this.buffer[idx] = text[i];
          if (color) {
            this.colorBuffer[idx] = color;
          }
        }
      }
      return 0;
    }

    // Regular text processing with word wrap
    let words = text.split(' ');

    words.forEach((word, index) => {
      // Handle link markers
      if (word.startsWith('[') && word.includes(']')) {
        inLink = true;
        const endBracketPos = word.indexOf(']');
        currentLink = word.slice(1, endBracketPos);
        word = word.slice(1, endBracketPos) + word.slice(endBracketPos + 1);
      }

      const wordLength = (x > startX ? 1 : 0) + word.length;

      if (x + wordLength > maxWidth) {
        x = startX;
        y += 2;
      }

      if (x > startX) {
        const spaceIdx = x + (y * this.width);
        if (spaceIdx >= 0 && spaceIdx < this.buffer.length) {
          this.buffer[spaceIdx] = ' ';
          if (color) {
            this.colorBuffer[spaceIdx] = color;
          }
        }
        x += 1;
      }

      if (inLink && this.links.has(currentLink)) {
        const linkStart = { x, y };
        for (let i = 0; i < word.length; i++) {
          const idx = (x + i) + (y * this.width);
          if (idx >= 0 && idx < this.buffer.length) {
            this.buffer[idx] = word[i];
            this.colorBuffer[idx] = '#d75f00';
          }
        }
        this.linkPositions.push({
          text: currentLink,
          url: this.links.get(currentLink),
          startX: linkStart.x,
          endX: x + word.length,
          y: linkStart.y
        });
        inLink = false;
      } else {
        for (let i = 0; i < word.length; i++) {
          const idx = (x + i) + (y * this.width);
          if (idx >= 0 && idx < this.buffer.length) {
            this.buffer[idx] = word[i];
            if (color) {
              this.colorBuffer[idx] = color;
            }
          }
        }
      }

      x += word.length;
    });

    return y - startY + 1;
  }

  sortTokens() {
    if (!this.currentSort) return Object.values(getIndexAssets());

    const tokens = Object.values(getIndexAssets());
    return tokens.filter(token => token.symbol !== "S&V AI INDEX")
      .sort((a, b) => {
        let comparison = 0;
        const symbolA = a.symbol;
        const symbolB = b.symbol;

        switch (this.currentSort) {
          case 'marketCap':
            const mcapA = this.marketCaps.get(symbolA)?.slice(-1)[0] || 0;
            const mcapB = this.marketCaps.get(symbolB)?.slice(-1)[0] || 0;
            comparison = mcapB - mcapA;
            break;

          case 'price':
            const priceA = this.prices.get(symbolA)?.slice(-1)[0] || 0;
            const priceB = this.prices.get(symbolB)?.slice(-1)[0] || 0;
            comparison = priceB - priceA;
            break;

          case 'pct1h':
            const pct1hA = parseFloat(this.computePercentChange(this.prices.get(symbolA) || [], 1)) || 0;
            const pct1hB = parseFloat(this.computePercentChange(this.prices.get(symbolB) || [], 1)) || 0;
            comparison = pct1hB - pct1hA;
            break;

          case 'pct24h':
            const pct24hA = parseFloat(this.computePercentChange(this.prices.get(symbolA) || [], 24)) || 0;
            const pct24hB = parseFloat(this.computePercentChange(this.prices.get(symbolB) || [], 24)) || 0;
            comparison = pct24hB - pct24hA;
            break;

          case 'pct7d':
            const pricesA = this.prices.get(symbolA) || [];
            const pricesB = this.prices.get(symbolB) || [];
            const pct7dA = pricesA.length ? ((pricesA[pricesA.length - 1] - pricesA[0]) / pricesA[0] * 100) : 0;
            const pct7dB = pricesB.length ? ((pricesB[pricesB.length - 1] - pricesB[0]) / pricesB[0] * 100) : 0;
            comparison = pct7dB - pct7dA;
            break;
        }

        return this.sortAscending ? -comparison : comparison;
      });
  }

  getBuffer() {
    return {
      chars: this.buffer.slice(),
      colors: this.colorBuffer.slice()
    };
  }
}

export { IndexChart };