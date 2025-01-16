import { calculateDimensions, getCharacterDimensions } from "./canvashelper.js";
import { getIndexAssets } from "./chaindata.js";

const TIME_RANGE_HOURS = 168;
const TIMESTAMP_INTERVAL_HOURS = 14;
const HEADER_Y = (!window.isMobile ? 6 : 3);
let mcapString = !window.isMobile ? 'MARKET CAP' : "MCAP";
let indexString = !window.isMobile ? "S&V AI INDEX" : "S&V INDEX";
let projectString = !window.isMobile  ? "PROJECTS" : "ASSETS";


class IndexChart {
  constructor(width, height) {
    // Help text scroll position
    this.helpViewOffset = 0;
    this.helpMaxLines = !window.isMobile ? 30 : 20; // Visible lines in viewport

    this.colors = { ...GRID_COLORS }
    this.starColor = this.colors.darkorange;
    this.atColor = this.colors.orange;
    this.plusColor = this.colors.blue;
    this.gridColor = this.colors.darkblue;
    this.colors.labels = this.colors.blue;
    this.colors.tabletitles = this.colors.blue;
    this.colors.svtable = this.colors.orange;
    this.colors.mktcaptable = this.colors.darkorange;
    this.colors.symboltablecontent = this.colors.orange;
    this.colors.mktcaptablecontent = this.colors.darkorange;
    this.colors.scroll = this.colors.orange;
    this.colors.links = this.colors.darkorange;
    this.colors.tablecontent = this.colors.purple;

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

    // Table pagination properties - adjust for mobile
    this.TABLE_START_Y = !window.isMobile ? 17 : 10;  // Less space from top on mobile
    this.BOTTOM_MARGIN = !window.isMobile ? 2 : 4;  // Space at bottom
    this.ROW_HEIGHT = 2;      // Height of each table row
    this.topIndex = 0;        // Current scroll position

    // Calculate how many rows can fit
    const availableHeight = height - this.TABLE_START_Y - this.BOTTOM_MARGIN;
    this.pageSize = Math.floor(availableHeight / this.ROW_HEIGHT);

    this.currentSort = 'marketCap';
    this.sortAscending = false;
    this.timeLabelsConfig = {
      bottomMargin: 0  // Distance from bottom border (meaning bottom border of the grid above the time labels)
    };

    // Column definitions
    this.columns = [
      { id: 'symbol', title: 'SYMBOL', width: 21 },
      { id: 'marketCap', title: mcapString, width: 16, sortable: true },
      { id: 'price', title: 'PRICE', width: 11, sortable: true },
      { id: 'pct1h', title: '1H%', width: 9, sortable: true },
      { id: 'pct24h', title: '24H%', width: 9, sortable: true },
      { id: 'pct7d', title: '7D%', width: 9, sortable: true }
    ];

    // Navigation arrows positions
    this.upArrowPosition = null;
    this.downArrowPosition = null;
  }

  getSchemeColor(type) {
    const currentScheme = colorScheme.get(scheme);
    if (!currentScheme) return '#ff8700'; // fallback color

    switch (type) {
      case 'plus':
        return currentScheme.plusSignColor;
      case 'grid':
        return currentScheme.realGridColor;
      case 'label':
        return currentScheme.labelColor;
      case 'table-title':
        return currentScheme.tableTitleColor;
      case 'table-content':
        return currentScheme.tableContentColor;
      case 'darkOrange-title':
        return currentScheme.darkOrangeTitle;
      default:
        return currentScheme.textColor;
    }
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
      const tokens = Object.values(getIndexAssets());
      if (this.topIndex + this.pageSize < tokens.length) {
        this.topIndex += this.pageSize;
        return true;
      }
    }

    return false;
  }

  handleColumnClick(x, y) {
    console.log("column click! " + x + " " + y)

    if (!this.showUnderlying) return false;

    // The headers are actually rendered at y=7, not TABLE_START_Y + 6
    const headerY = HEADER_Y;

    if (y !== headerY) return false;

    let currentX = 8;

    for (const column of this.columns) {
      console.log(column)
      if (column.sortable && x >= currentX && x < currentX + column.width) {
        console.log("yoo")
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

    if (!this.showUnderlying) return false;

    // The headers are actually rendered at y=7, not TABLE_START_Y + 6
    const headerY = HEADER_Y;

    if (y !== headerY) return false;

    let currentX = 8;

    for (const column of this.columns) {
      if (column.sortable && x >= currentX && x < currentX + column.width) {
        return true;
      }
      currentX += column.width + 1;
    }

    return false;
  }

  initializeHelpLinks() {
    // the keys all need to be in lower case here
    this.links = new Map([
      ['x', 'https://x.com/standardvoids'],
      ['telegram', 'https://t.me/reaper_agent']
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
      return pct.toFixed(2);
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
  }

  handleHelpScroll(direction) {
    const scrollAmount = 5; // Number of lines to scroll at once
    if (direction === 'up') {
      this.helpViewOffset = Math.max(0, this.helpViewOffset - scrollAmount);
      return true;
    } else if (direction === 'down') {
      this.helpViewOffset += scrollAmount;
      return true;
    }
    return false;
  }

  drawHelp() {
    this.buffer.fill(' ');
    this.colorBuffer.fill(null);
    this.linkPositions = [];
    this.initializeHelpLinks();

    // Draw border
    const { plotStartX, plotWidth, plotStartY, plotHeight } = this.drawBorder();

    const contentX = plotStartX + (!window.isMobile ? 5 : 4);  // 2 characters less padding on mobile
    const contentStartY = plotStartY + (!window.isMobile ? 4 : 3);  // One character lower on mobile
    let currentY = contentStartY;
    const maxWidth = plotWidth - 10;

    // Define help content sections
    const helpSections = [
      {
        title: indexString,
        content: "This is a beta version of the S&V AI69 index. It is a work in progress while we catalogue as many projects as possible from all chains. You can personnally contribute to this process by visiting the [nominees] page and vote for different projects or submit new ones. The goal of this index is to track the development of the AI-crypto sector in a transparent and decentralized manner. The current beta version of the index you see on this page is curated by the S&V team from the [nominees] list. It does not include all projects. To see the list of projects included in the index, use the TABLE view."
      },
      {
        title: "CALCULATIONS",
        content: "The index tracks the combined market capitalization of selected projects. We use circulating supply to reflect tokens directly available on public markets (excluding any tokens that are locked or have never left allocation wallets). The total index market cap is normalized to start at 100, allowing the index to measure percentage changes in the sector's overall value. Each token's contribution to the index is proportional to its market cap, with larger projects having greater impact on the index movement. In its current form, the index is normalized every generation (7-day total range, 1h intervals) until the selection becomes final. If you represent a project and wish to modify or correct your token's circulating supply, please reach out to the S&V team on [X] or [Telegram]."
      },
      {
        title: "TABLE VIEW/UNDERLYING DATA",
        content: "On TABLE view, click column headers to sort. You can find direct links to individual projects social and token chart pages on the [nominees] page. Our historical price data is synced every hour + 5 min."
      }
    ];

    // Draw sections
    helpSections.forEach((section, index) => {
      // Draw section title
      this.drawText(section.title, contentX, currentY - this.helpViewOffset, '#ff8700');
      currentY += 3;

      // Draw section content and get number of lines used
      const linesUsed = this.drawText(section.content, contentX, currentY - this.helpViewOffset, this.getSchemeColor('plus'), maxWidth);
      currentY += linesUsed + 3;  // Add spacing after content
    });

    // Add scroll buttons if content extends beyond viewport
    const navigationX = contentX + maxWidth - (!window.isMobile ? 10 : 4);  // Moved 2 chars right
    
    // Up arrow - show if scrolled down
    if (this.helpViewOffset > 0) {
      const upArrowY = plotStartY + 4;  // Moved down 2 characters
      const upText = !window.isMobile ? `▲ scroll up` : `▲ up`;
      this.drawText(upText, navigationX, upArrowY, this.colors.scroll);
      this.upArrowPosition = {
        x: navigationX,
        y: upArrowY,
        endX: navigationX + upText.length
      };
    }

    // Down arrow - show if more content below and on mobile only
    if (window.isMobile && currentY > this.helpMaxLines + this.helpViewOffset) {
      const downArrowY = plotStartY + 6;  // Moved down 2 characters
      const downText = !window.isMobile ? `▼ scroll down` : `▼ down`;
      this.drawText(downText, navigationX, downArrowY, this.colors.scroll);
      this.downArrowPosition = {
        x: navigationX,
        y: downArrowY,
        endX: navigationX + downText.length
      };
    }
  }

  handleHelpClick(x, y) {
    // Check for scroll button clicks
    if (this.upArrowPosition && 
        y === this.upArrowPosition.y && 
        x >= this.upArrowPosition.x && 
        x < this.upArrowPosition.endX) {
      return this.handleHelpScroll('up');
    }
    
    if (this.downArrowPosition && 
        y === this.downArrowPosition.y && 
        x >= this.downArrowPosition.x && 
        x < this.downArrowPosition.endX) {
      return this.handleHelpScroll('down');
    }

    // Check for link clicks when in help view
    for (const link of this.linkPositions) {
      if (y === link.y && x >= link.startX && x < link.endX) {
        window.open(link.url, '_blank');
        return true;
      }
    }
    return false;
  }

  isHoveringHelpLink(x, y) {
    for (const link of this.linkPositions) {
      if (y === link.y && x >= link.startX && x < link.endX) {
        return true;
      }
    }
    return false;
  }

  toggleUnderlying() {
    this.showUnderlying = !this.showUnderlying;
  }

  drawChart() {
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
    const LEFT_OFFSET = window.isMobile ? 2 : 3;  // One character less on mobile
    const BOTTOM_OFFSET = window.isMobile ? 4 : 3;
    const RIGHT_OFFSET = window.isMobile ? 6 : 6;  // One character less on mobile
    
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
              this.colorBuffer[idx] = this.getSchemeColor('grid');
            } else if (this.buffer[idx] === ' ') {
              this.buffer[idx] = '¦';
              this.colorBuffer[idx] = this.getSchemeColor('grid');
            }
          }
        }
      }
    }

    const timeLabelsY = dataStartY + dataHeight + this.timeLabelsConfig.bottomMargin + (window.isMobile ? 1 : 0);
    for (let hour = 0; hour <= timeIntervals; hour++) {
        // Skip first (0h) and last (168h) labels
        if (hour !== 0 && hour !== timeIntervals) {
          if (hour % TIMESTAMP_INTERVAL_HOURS === 0 && (!window.isMobile || Math.floor(hour / TIMESTAMP_INTERVAL_HOURS) % 2 === 1)) {
            const x = dataStartX + Math.round(hour * intervalWidth);
            const label = `${hour}h`;
            const labelX = x - Math.floor(label.length / 2);  // Center align the label
            this.drawText(label, labelX, timeLabelsY, this.getSchemeColor('label'));
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
            this.colorBuffer[idx] = this.getSchemeColor('grid');
          } else if (this.buffer[idx] === '¦') {
            this.buffer[idx] = '+';
            this.colorBuffer[idx] = this.getSchemeColor('plus');
          }
        }
        const level = y / priceSpacing;
        const stepValue = this.maxValue - level * (this.maxValue - this.minValue) / priceSteps;
        const label = stepValue.toFixed(0);
        priceLabels.push({
          text: label,
          x: dataStartX + dataWidth - label.length + 4,
          y: screenY - 2,
          color: this.getSchemeColor('label')
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
        const y2 = dataStartY + Math.floor((1 - normNextVal) * (dataHeight - (window.isMobile ? 1 : 2)));

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

    for (let x = plotStartX; x < plotStartX + plotWidth; x++) {
      const topIndex = x;
      this.buffer[topIndex] = '$';
      // Use scheme border color instead of local color
      this.colorBuffer[topIndex] = cscheme.borderColor;  // This gets the correct border color from the scheme

      ({ char, c } = borderCharacter(x, 0, x, 0, cv, null, null, cscheme, [...indexStrings.top]));
      if (char != null) {
        this.buffer[topIndex] = char;
        this.colorBuffer[topIndex] = c;
      }

      const bottomIndex = x + (plotHeight * this.width) - this.width;
      this.buffer[bottomIndex] = '$';
      this.colorBuffer[bottomIndex] = cscheme.borderColor;

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
      this.colorBuffer[leftIndex] = cscheme.borderColor;  // Use side color for left border

      ({ char, c } = borderCharacter(plotStartX, y, plotStartX, y, cv, null, null, cscheme, [...indexStrings.left], true));
      if (char != null) {
        this.buffer[leftIndex] = char;
        this.colorBuffer[leftIndex] = c;
      }

      this.buffer[rightIndex] = '$';
      this.colorBuffer[rightIndex] = cscheme.borderColor;  // Use side color for right border

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

    const colWidths = {
      symbol: !window.isMobile ? 21 : 10,
      marketCap: !window.isMobile ? 16 : 8,
      price: !window.isMobile ? 11 : 8,
      pct1h: !window.isMobile ? 9 : 8,
      pct24h: !window.isMobile ? 9 : 8,
      pct7d: !window.isMobile ? 9 : 8
    };

    const headerX = plotStartX + (!window.isMobile ? 8 : 3);
    let headerY = plotStartY + HEADER_Y;

    // Function to draw full-width horizontal grid line
    const drawHorizontalGrid = (y) => {
      for (let x = plotStartX + 1; x < plotStartX + plotWidth - 1; x++) {
        const idx = x + y * this.width;
        if (x === headerX - 1 || x === headerX + colWidths.symbol ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h + 1 + colWidths.pct24h ||
          x === headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h + 1 + colWidths.pct24h + 1 + colWidths.pct7d) {
          this.buffer[idx] = '+';
          this.colorBuffer[idx] = this.getSchemeColor('plus');
        } else {
          this.buffer[idx] = '-';
          this.colorBuffer[idx] = this.getSchemeColor('grid');
        }
      }
    };

    // Initial grid line above titles
    drawHorizontalGrid(headerY - 1);

    // Draw headers
    let totalString = !window.isMobile ? `[TOTAL: ${Object.keys(getIndexAssets()).length}]` : '';
    const headers = [
      `${projectString} ${totalString}`.padEnd(colWidths.symbol),
      mcapString.padEnd(colWidths.marketCap),
      "PRICE".padEnd(colWidths.price)
    ];

    if(!window.isMobile) {
      headers.push("1H%".padEnd(colWidths.pct1h));
      headers.push("24H%".padEnd(colWidths.pct24h));
    }
    headers.push("7D%".padEnd(colWidths.pct7d));

    let currentX = headerX;
    headers.forEach(header => {
      this.drawText(header, currentX, headerY, this.getSchemeColor('table-title'));
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
    this.drawText(indexString.padEnd(colWidths.symbol), currentX, headerY, this.colors.svtable);
    currentX += colWidths.symbol + 1;

    // Market Cap (darker orange)
    const totalMarketCapStr = this.latestTotalMarketCap ? (!window.isMobile ? '$' + this.latestTotalMarketCap.toLocaleString('en-US', { maximumFractionDigits: 0 }) : (this.latestTotalMarketCap/1000000).toFixed(0) + "M") : "N/A";

    this.drawText(totalMarketCapStr.padEnd(colWidths.marketCap), currentX, headerY, this.getSchemeColor('darkOrange-title'));
    currentX += colWidths.marketCap + 1;

    // Index Value
    this.drawText(this.latestIndexValue.padEnd(colWidths.price), currentX, headerY, this.getSchemeColor('table-content'));
    currentX += colWidths.price + 1;

    // Percentages
    const indexPercentages = []
    if(!window.isMobile) {
      indexPercentages.push(this.indexPct1h);
      indexPercentages.push(this.indexPct24h);
    }
    indexPercentages.push(this.indexPct7d);

    const colWidthsArray = [];
    if(!window.isMobile) {
      colWidthsArray.push(colWidths.pct1h);
      colWidthsArray.push(colWidths.pct24h);
    }
    colWidthsArray.push(colWidths.pct7d);

    indexPercentages.forEach((pct, idx) => {
      this.drawText(pct.padEnd(colWidthsArray[idx]), currentX, headerY, this.getSchemeColor('table-content'));
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
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price
    ];

    // Only add pct1h and pct24h lines if not mobile
    if (!window.isMobile) {
      verticalLineXs.push(
        headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h,
        headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + colWidths.pct1h + 1 + colWidths.pct24h
      );
    }

    // Always add the final pct7d line
    verticalLineXs.push(
      headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + 
      (!window.isMobile ? (colWidths.pct1h + 1 + colWidths.pct24h + 1) : 0) + 
      colWidths.pct7d
    );

    // Draw vertical lines
    verticalLineXs.forEach(x => {
      for (let y = startY; y < endY; y++) {
        const idx = x + y * this.width;
        if (this.buffer[idx] === '-') {
          // Create proper intersections
          this.buffer[idx] = '+';
          this.colorBuffer[idx] = this.getSchemeColor('plus');
        } else if (this.buffer[idx] === ' ') {
          this.buffer[idx] = '¦';
          this.colorBuffer[idx] = this.getSchemeColor('grid');
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
      const pct7d = ((priceArray[priceArray.length - 1] - priceArray[0]) / priceArray[0] * 100).toFixed(2);

      currentX = headerX;

      // Symbol (orange)
      this.drawText(symbol.padEnd(colWidths.symbol), currentX, headerY, '#ff8700');
      currentX += colWidths.symbol + 1;

      let mcapString = latestCap ? (
  !window.isMobile ? 
    "$" + latestCap.toLocaleString('en-US', { maximumFractionDigits: 0 }) :
    (latestCap/1000000).toFixed(1) + "M"
) : "N/A";
this.drawText(mcapString.padEnd(colWidths.marketCap),
        currentX, headerY, this.getSchemeColor('darkOrange-title'));
      currentX += colWidths.marketCap + 1;

      // Price
      this.drawText((latestPrice ? latestPrice.toFixed(!window.isMobile ? 6 : 3) : 'N/A').padEnd(colWidths.price), currentX, headerY, this.getSchemeColor('table-content'));
      currentX += colWidths.price + 1;

      // Percentages
      const percentages = []

      if(!window.isMobile) {
        percentages.push(pct1h);
        percentages.push(pct24h);
      }
      percentages.push(pct7d);
      

      const widths = [];
      if(!window.isMobile) {
        widths.push(colWidths.pct1h);
        widths.push(colWidths.pct24h);
      }
      widths.push(colWidths.pct7d);
      
      percentages.forEach((pct, idx) => {
        this.drawText(pct.padEnd(widths[idx]), currentX, headerY, this.getSchemeColor('table-content'));
        currentX += widths[idx] + 1;
      });

      headerY += 2;  // Move to next row
      if (headerY >= plotStartY + plotHeight) break;
    }

    // Draw final grid line
    drawHorizontalGrid(headerY - 1);

    // Calculate navigation X position based on visible columns only
    const navigationX = headerX + colWidths.symbol + 1 + colWidths.marketCap + 1 + colWidths.price + 1 + 
    (!window.isMobile ? (colWidths.pct1h + 1 + colWidths.pct24h + 1) : 0) + 
    colWidths.pct7d + 2;

    // Up arrow
    if (this.topIndex > 0) {
      const upArrowY = plotStartY + 6;
      const upText = !window.isMobile ? `▲ scroll up` : `▲ up`;
      this.drawText(upText, navigationX, upArrowY, this.colors.scroll);
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
      const downText = !window.isMobile ? `▼ scroll down` : `▼ down`;
      this.drawText(downText, navigationX, downArrowY, this.colors.scroll);
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
          this.buffer[idx] = '×';
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
    // Don't render text if it would appear above our minimum spacing requirement
    if (startY < 2) return 0;

    let x = startX;
    let y = startY;
    let inLink = false;
    let currentLink = '';
    let linesUsed = 0;

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
      // Skip rendering if this line would appear above minimum spacing
      if (y < 2) {
        if (x + word.length > maxWidth) {
          x = startX;
          y += 2;
          linesUsed += 2;
        }
        x += word.length + 1;
        return;
      }

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
        linesUsed += 2;
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

      if (inLink && this.links.has(currentLink.toLowerCase())) {
        const linkStart = { x, y };
        for (let i = 0; i < word.length; i++) {
          const idx = (x + i) + (y * this.width);
          if (idx >= 0 && idx < this.buffer.length) {
            this.buffer[idx] = word[i];
            this.colorBuffer[idx] = this.getSchemeColor('darkOrange-title');
          }
        }
        this.linkPositions.push({
          text: currentLink,
          url: this.links.get(currentLink.toLowerCase()),
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

    // Calculate final lines used
    linesUsed = Math.max(linesUsed, y - startY + 1);
    return linesUsed;
  }

  sortTokens() {
    if (!this.currentSort) return Object.values(getIndexAssets());

    const tokens = Object.values(getIndexAssets());
    return tokens.filter(token => token.symbol !== indexString)
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
