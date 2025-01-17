import { getNomineeAssets } from "./chaindata.js";
import { getCharacterDimensions, calculateDimensions, manageBorderMouseClick, manageMouseMove } from './canvashelper.js';


let mcapString = !window.isMobile ? 'MARKET CAP' : "MCAP";

class TokenVotingTable {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.buffer = new Array(width * height).fill(' ');
    this.colorBuffer = new Array(width * height).fill(null);
    this.marketCaps = new Map();
    this.links = new Map();
    this.linkPositions = [];
    this.currentSort = 'votes';
    this.sortAscending = false;
    this.topIndex = 0;

    this.colors = { ... GRID_COLORS }
    this.gridColor = this.getSchemeColor('grid');
    this.textColor = this.getSchemeColor('label');
    this.highlightColor = this.colors.orange; // Keep as is since it's used for scroll arrows
    this.plusColor = this.getSchemeColor('plus');
    this.borderColor = this.getSchemeColor('label');
    this.colors.links = this.colors.darkorange; // Keep as is
    this.colors.projectcontent = this.colors.orange;
    this.colors.symbolcontent = this.colors.darkorange;
    this.colors.xcontent = this.getSchemeColor('table-content');
    this.colors.githubcontent = this.getSchemeColor('table-content');
    this.colors.mktcapcontent = this.getSchemeColor('table-content');
    this.colors.createdcontent = this.getSchemeColor('table-content');
    this.colors.voidbalcontent = this.getSchemeColor('table-content');
    this.colors.votescontent = this.getSchemeColor('table-content');
    this.colors.vote = this.colors.orange; // Keep as is
    this.colors.tabletitles = this.getSchemeColor('table-title');

    // Constants for spacing
    this.TABLE_START_Y = 17;  // Space from top
    this.BOTTOM_MARGIN = 10;   // Space we want at bottom
    this.ROW_HEIGHT = 2;      // Height of each table row

    // Calculate how many rows can fit
    const availableHeight = height - this.TABLE_START_Y - this.BOTTOM_MARGIN;
    this.pageSize = Math.floor(availableHeight / this.ROW_HEIGHT);

    this.isLoading = false;
    this.errorMessage = null;


    this.columns = [
      { id: 'name', title: 'PROJECT', width: 26 },
      { id: 'symbol', title: 'TICKER', width: !window.isMobile ? 11 : 9 },
      { id: 'xprofile', title: 'X USERNAME', width: !window.isMobile ? 18 : 16 },
      { id: 'github', title: 'GITHUB', width: 18 },
      { id: 'marketCap', title: mcapString, width: !window.isMobile ? 14 : 7, sortable: true },
      { id: 'created', title: 'CREATED', width: 12, sortable: true },
      { id: 'voidBalance', title: 'VOIDLING', width: 10, sortable: true },
      { id: 'votes', title: 'VOTES', width: !window.isMobile ? 10 : 7, sortable: true },
      //{ id: 'vote', title: '', width: 8 }
    ];

    this.TABLE_START_Y = 17;
    this.COLUMN_START_X = !window.isMobile ? 7 : 3;
    this.HEADER_OFFSET = 1;
    this.DATA_START_OFFSET = 2;
    this.ROW_HEIGHT = 2;
    this.TITLE_MARGIN = !window.isMobile ? 7 : 3;

    // Calculate total width based on visible columns
    const visibleColumns = this.getVisibleColumns();
    this.TOTAL_TABLE_WIDTH = visibleColumns.reduce((sum, col) => sum + col.width + 1, 0);
    let currentX = this.COLUMN_START_X;
    const columnHeaderY = this.TABLE_START_Y + this.HEADER_OFFSET;

    visibleColumns.forEach(column => {
      if (column.id === 'name') {
        const sortedTokens = this.sortTokens();
        const totalCount = sortedTokens.length;
        const titleWithCount = `${column.title} [TOTAL: ${totalCount}]`;
        this.drawText(titleWithCount.padEnd(column.width), currentX, columnHeaderY,
          column.sortable ? this.textColor : this.textColor);
      } else {
        this.drawText(column.title.padEnd(column.width), currentX, columnHeaderY,
          column.sortable ? this.textColor : this.textColor);
      }
      currentX += column.width + 1;
    });

    this.fullDescription = "This is a preliminary list for the upcoming S&V AI INDEX. Anyone who possesses [$RG] on [SOL] or [ETH] can vote. Reach out to the S&V team on [Telegram] or [X] for new submissions. In order for a token to be considered, the Voidling agent [wallet] must own some. The agent takes note of all who vote and send tokens. The final index curation will be decided based on multiple criteria. The live beta version of the [index] only uses select tokens. Help us map the whole AI crypto sector and create a decentralized index market.";

    this.shortDescription = "This is a preliminary list for the upcoming S&V AI INDEX. Reach out to the S&V team on [Telegram] or [X] for new submissions. The final index curation will be decided based on multiple criteria.";
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
      case 'orange-title':
        return currentScheme.orangeTitleColor;
      case 'border':
        return currentScheme.borderColor;
      case 'darkOrange-title':
        return currentScheme.darkOrangeTitle;
      default:
        return currentScheme.textColor;
    }
  }

  getVisibleColumns() {
    const screenWidth = window.innerWidth;

    // Filter columns based on screen width
    return this.columns.filter(column => {
      if (screenWidth <= 1085) {
        // Hide name, github, created, voidling, and vote columns
        return !['name', 'github', 'created', 'voidBalance', 'vote'].includes(column.id);
      } else if (screenWidth <= 1300) {
        // Only hide github column
        return column.id !== 'github';
      }
      // Show all columns for larger screens
      return true;
    });
  }

  initializeLinks() {
    this.links = new Map([
      ['RG', 'https://x.com/reapers_gambit'],
      ['SOL', 'https://solscan.io/token/4XGi8LD2hmcbEYrHKxGgZCKHakE5pyAtfPG3ffKv7ZSr'],
      ['ETH', 'https://etherscan.io/address/0x2C91D908E9fab2dD2441532a04182d791e590f2d'],
      ['Telegram', 'https://t.me/reaper_agent'],
      ['X', 'https://x.com/standardvoids'],
      ['wallet', 'https://solscan.io/account/C5E5jsLHvFUn3ZCqwEcxDGk7mA2E3MBo5BpMuoSgdehV'],
      ['index', 'https://standardvoids.com']
    ]);
  }

  async updateMarketData() {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      let assets = getNomineeAssets();
      assets.forEach(tokenData => {
        if (!tokenData || !tokenData.data || !tokenData.data[0]) return;

        const token = Object.values(assets).find(t =>
          t.address.toLowerCase() === tokenData.address?.toLowerCase());

        let idx = tokenData.data.length-1;
        if (token && tokenData.data[idx].value) {
          const price = parseFloat(tokenData.data[idx].value);
          if (!isNaN(price)) {
            const marketCap = price * Number(token.totalSupply);
            this.marketCaps.set(token.symbol, marketCap);
          }
        }
      });

      this.lastUpdate = new Date();
      this.errorMessage = null;

    } catch (error) {
      this.errorMessage = `Failed to update prices: ${error.message}`;
      console.error('Detailed error:', error);
      console.error(this.errorMessage);
    } finally {
      this.isLoading = false;
    }
  }

  sortTokens() {
    if(!getNomineeAssets()) {
      return;
    }
    const tokens = Object.values(getNomineeAssets());

    return tokens.sort((a, b) => {
      let comparison = 0;

      switch (this.currentSort) {
        case 'votes':
          comparison = b.votes - a.votes;
          break;
        case 'marketCap':
          const mcapA = this.marketCaps.get(a.symbol) || 0;
          const mcapB = this.marketCaps.get(b.symbol) || 0;
          comparison = mcapB - mcapA;
          break;
        case 'voidBalance':
          const voidA = a.voidBalance || 0;
          const voidB = b.voidBalance || 0;
          comparison = voidB - voidA;
          break;
        case 'created':
          const dateA = this.getDate(a.created);
          const dateB = this.getDate(b.created);
          comparison = dateB - dateA;
          break;
      }

      return this.sortAscending ? -comparison : comparison;
    });
  }

  getDate(dateStr) {
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
  }

  drawText(text, startX, startY, color = null, maxWidth = this.width - this.TITLE_MARGIN) {
    let x = startX;
    let y = startY;
    let inLink = false;
    let currentLink = '';
    let words = text.split(' ');

    words.forEach((word, index) => {
      // Handle link markers
      if (word.startsWith('[') && word.includes(']')) {
        inLink = true;
        const endBracketPos = word.indexOf(']');
        currentLink = word.slice(1, endBracketPos).replace('$', ''); // Remove $ from link lookup
        word = (word.slice(1, endBracketPos)) + word.slice(endBracketPos + 1); // Keep any punctuation after the link and $ symbol
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
            this.colorBuffer[idx] = this.getSchemeColor('darkOrange-title');
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
  }

  drawHorizontalLine(y, char = '-') {
    for (let x = 1; x < this.width - 1; x++) {
      const idx = x + (y * this.width);
      if (this.buffer[idx] === '¦') {
        this.buffer[idx] = '+';
        this.colorBuffer[idx] = this.getSchemeColor('plus');
      } else {
        this.buffer[idx] = char;
        this.colorBuffer[idx] = this.getSchemeColor('grid');
      }
    }
  }

  drawVerticalLines() {
    let currentX = this.COLUMN_START_X - 1;
    const startY = this.TABLE_START_Y;
    const endY = this.height - 2;
    const visibleColumns = this.getVisibleColumns();

    // Draw first vertical line
    for (let y = startY; y <= endY; y++) {
      const idx = currentX + (y * this.width);
      if (this.buffer[idx] === '-') {
        this.buffer[idx] = '+';
        this.colorBuffer[idx] = this.getSchemeColor('plus');
      } else {
        this.buffer[idx] = '¦';
        this.colorBuffer[idx] = this.getSchemeColor('grid');
      }
    }

    // Draw lines after each column
    visibleColumns.forEach(column => {
      currentX += column.width + 1;
      for (let y = startY; y <= endY; y++) {
        const idx = currentX + (y * this.width);
        if (this.buffer[idx] === '-') {
          this.buffer[idx] = '+';
          this.colorBuffer[idx] = this.getSchemeColor('plus');
        } else {
          this.buffer[idx] = '¦';
          this.colorBuffer[idx] = this.getSchemeColor('grid');
        }
      }
    });
  }

  getDescription() {
    const screenWidth = window.innerWidth;
    return screenWidth <= 1085 ? this.shortDescription : this.fullDescription;
  }

  drawTable() {
    this.buffer.fill(' ');
    this.colorBuffer.fill(null);
    this.linkPositions = [];
    this.initializeLinks();

    let cscheme = colorScheme.get(scheme);
    let cv = getCharacterDimensions();

    // Draw border
    let char, c = null;
    // Draw top and bottom borders
    for (let x = 0; x < this.width; x++) {
        // Top border
      this.buffer[x] = '$';
        this.colorBuffer[x] = this.getSchemeColor('border');

      ({ char, c } = borderCharacter(x, 0, x, 0, cv, null, null, cscheme, [...nomineeStrings.top]));
      if (char != null) {
        this.buffer[x] = char;
        this.colorBuffer[x] = c;
      }

        // Bottom border
      let xBottom = x + (this.height - 1) * this.width;
      this.buffer[xBottom] = '$';
      this.colorBuffer[xBottom] = this.getSchemeColor('border');
    
      ({ char, c } = borderCharacter(x, 0, x, 0, cv, null, null, cscheme, [...nomineeStrings.bottom]));
      if (char != null) {
        this.buffer[xBottom] = char;
        this.colorBuffer[xBottom] = c;
      }
    }
    
    // Draw left and right borders
    for (let y = 0; y < this.height; y++) {
        // Left border
      this.buffer[y * this.width] = '$';
      this.colorBuffer[y * this.width] = this.getSchemeColor('border');  // Fixed: changed x to y * this.width

      ({ char, c } = borderCharacter(0, y, 0, y, cv, null, null, cscheme, [...nomineeStrings.left], true));
      if (char != null) {
        this.buffer[y * this.width] = char;
        this.colorBuffer[y * this.width] = c;
      }

      let indexRight = this.width - 1 + y * this.width;
      this.buffer[indexRight] = '$';
      this.colorBuffer[indexRight] = this.getSchemeColor('border');

      ({ char, c } = borderCharacter(this.width, y, this.width, y, cv, null, null, cscheme, [...nomineeStrings.right], true));
      if (char != null) {
        this.buffer[indexRight] = char;
        this.colorBuffer[indexRight] = c;
      }
    }

    // Draw title and description
    let titleStartY = !window.isMobile ? 5 : 3;
    const titleText = "STANDARD & VOID'S AI INDEX NOMINEES";
    this.drawText(titleText, this.TITLE_MARGIN, titleStartY, this.getSchemeColor('orange-title'));
    this.drawText(this.getDescription(), this.TITLE_MARGIN, titleStartY+2, this.getSchemeColor('plus'), this.width - this.TITLE_MARGIN - 1);

    // Get visible columns and calculate total width
    const visibleColumns = this.getVisibleColumns();
    this.TOTAL_TABLE_WIDTH = visibleColumns.reduce((sum, col) => sum + col.width + 1, 0) + (!window.isMobile ? 0 : - 3);

    // Draw initial horizontal line
    this.drawHorizontalLine(this.TABLE_START_Y);

    // Draw column headers
    let currentX = this.COLUMN_START_X;
    const columnHeaderY = this.TABLE_START_Y + this.HEADER_OFFSET;

    visibleColumns.forEach(column => {
      if (column.id === 'name') {
        const sortedTokens = this.sortTokens();
        const totalCount = sortedTokens.length;
        const titleWithCount = `${column.title} [TOTAL: ${totalCount}]`;
        this.drawText(titleWithCount.padEnd(column.width), currentX, columnHeaderY,
          column.sortable ? this.colors.tabletitles : this.colors.tabletitles);
      } else {
        this.drawText(column.title.padEnd(column.width), currentX, columnHeaderY,
          column.sortable ? this.colors.tabletitles : this.colors.tabletitles);
      }
      currentX += column.width + 1;
    });

    // Draw header separator lines
    this.drawHorizontalLine(columnHeaderY + 1);
    this.drawHorizontalLine(columnHeaderY + 3);

    // Draw token data
    const sortedTokens = this.sortTokens();
    const tokens = sortedTokens.slice(this.topIndex, this.topIndex + this.pageSize);

    let currentY = columnHeaderY + 4;
    tokens.forEach((token) => {
      currentX = this.COLUMN_START_X;

      visibleColumns.forEach(column => {
        switch (column.id) {
          case 'name':
            this.drawText(token.name.padEnd(column.width), currentX, currentY, this.colors.projectcontent);
            break;
          case 'symbol':
            const network = token.network.split('-')[0].toLowerCase();
            const dexscreenerNetwork = network === 'eth' ? 'ethereum' : network;
            const dexscreenerUrl = `https://dexscreener.com/${dexscreenerNetwork}/${token.address}`;
            this.linkPositions.push({
              text: token.symbol,
              url: dexscreenerUrl,
              startX: currentX,
              endX: currentX + token.symbol.length,
              y: currentY
            });
            this.drawText(token.symbol.padEnd(column.width), currentX, currentY, this.getSchemeColor('darkOrange-title'));
            break;
          case 'xprofile':
            if (token.xprofile) {
              const xProfile = token.xprofile.startsWith('@') ? token.xprofile.slice(1) : token.xprofile;
              const xProfileUrl = `https://x.com/${xProfile}`;
              this.linkPositions.push({
                text: token.xprofile,
                url: xProfileUrl,
                startX: currentX,
                endX: currentX + token.xprofile.length,
                y: currentY
              });
              this.drawText(token.xprofile.padEnd(column.width), currentX, currentY, this.colors.xcontent);
            }
            break;
          case 'github':
            if (token.github) {
              const githubUrl = `https://github.com/${token.github}`;
              this.linkPositions.push({
                text: token.github,
                url: githubUrl,
                startX: currentX,
                endX: currentX + token.github.length,
                y: currentY
              });
              this.drawText(token.github.padEnd(column.width), currentX, currentY, this.colors.githubcontent);
            } else {
              this.drawText(''.padEnd(column.width), currentX, currentY);
            }
            break;
          case 'marketCap':
              const mcap = this.marketCaps.get(token.symbol);
              const mcapText = mcap ? 
                (!window.isMobile ? 
                  '$' + mcap.toLocaleString('en-US', { maximumFractionDigits: 0 }) :
                  `${(mcap/1000000).toFixed(1)}M`) :
                '';
              this.drawText(mcapText.padEnd(column.width), currentX, currentY, this.colors.mktcapcontent);
          break;
          case 'created':
            this.drawText(token.created.padEnd(column.width), currentX, currentY, this.colors.createdcontent);
            break;
          case 'voidBalance':
            const voidBalance = token.voidBalance || 0;
            const voidBalanceText = voidBalance >= 1000000 ?
              `${(voidBalance / 1000000).toFixed(2)}M` :
              voidBalance.toString();
            this.drawText(voidBalanceText.padEnd(column.width), currentX, currentY, this.colors.voidbalcontent);
            break;
          case 'votes':
              const votes = token.votes || 0;
              const votesText = !window.isMobile ?
                votes.toLocaleString('en-US', { maximumFractionDigits: 0 }) :
                (votes >= 1000000 ? `${(votes/1000000).toFixed(1)}M` : votes.toString());
              this.drawText(votesText.padEnd(column.width), currentX, currentY, this.colors.votescontent);
          break;
          case 'vote':
            this.drawText('+ VOTE', currentX, currentY, this.colors.vote);
            break;
        }
        currentX += column.width + 1;
      });

      this.drawHorizontalLine(currentY + 1);
      currentY += this.ROW_HEIGHT;
    });

    // Draw vertical lines
    this.drawVerticalLines();

    // Draw navigation arrows
    const navigationX = this.COLUMN_START_X + this.TOTAL_TABLE_WIDTH + (!window.isMobile ? 2 : 3);
    const navigationBaseY = this.TABLE_START_Y + this.HEADER_OFFSET;

    // Draw up arrow
    if (this.topIndex > 0) {
      const upArrowY = navigationBaseY - 1;
      const upText = !window.isMobile ? `▲ scroll up` : `▲ up`;
      this.drawText(upText, navigationX, upArrowY, this.highlightColor);
      this.upArrowPosition = {
        x: navigationX,
        y: upArrowY,
        endX: navigationX + upText.length
      };
    } else {
      this.upArrowPosition = null;
    }

    // Draw down arrow
    if (this.topIndex + this.pageSize < sortedTokens.length) {
      const downArrowY = navigationBaseY + 1;
      const downText = !window.isMobile ? `▼ scroll down` : `▼ down`;
      this.drawText(downText, navigationX, downArrowY, this.highlightColor);
      this.downArrowPosition = {
        x: navigationX,
        y: downArrowY,
        endX: navigationX + downText.length
      };
    } else {
      this.downArrowPosition = null;
    }
  }

  handleClick(x, y) {
    // Check for link clicks
    for (const link of this.linkPositions) {
      if (y === link.y && x >= link.startX && x < link.endX) {
        window.open(link.url, '_blank');
        return true;
      }
    }

    const columnHeaderY = this.TABLE_START_Y + this.HEADER_OFFSET;
    if (y === columnHeaderY) {
      let currentX = this.COLUMN_START_X;
      const visibleColumns = this.getVisibleColumns();
      for (const column of visibleColumns) {
        if (column.sortable &&
          x >= currentX &&
          x < currentX + column.width) {
          if (this.currentSort === column.id) {
            this.sortAscending = !this.sortAscending;
          } else {
            this.currentSort = column.id;
            this.sortAscending = false;
          }
          this.drawTable();
          return true;
        }
        currentX += column.width + 1;
      }
    }

    // Check up arrow click
    if (this.upArrowPosition &&
      y === this.upArrowPosition.y &&
      x >= this.upArrowPosition.x &&
      x < this.upArrowPosition.endX) {
      this.topIndex = Math.max(0, this.topIndex - this.pageSize);
      this.drawTable();
      return true;
    }

    // Check down arrow click
    if (this.downArrowPosition &&
      y === this.downArrowPosition.y &&
      x >= this.downArrowPosition.x &&
      x < this.downArrowPosition.endX) {
      const sortedTokens = this.sortTokens();
      if (this.topIndex + this.pageSize < sortedTokens.length) {
        this.topIndex += this.pageSize;
        this.drawTable();
        return true;
      }
    }

    return false;
  }

  isHoveringClickable(x, y) {
    // links
    for (const link of this.linkPositions) {
      if (y === link.y && x >= link.startX && x < link.endX) {
        return true;
      }
    }

    // column headers
    const columnHeaderY = this.TABLE_START_Y + this.HEADER_OFFSET;

    if (y !== columnHeaderY) return false;

    let currentX = 8;

    const visibleColumns = this.getVisibleColumns();
    for (const column of visibleColumns) {
      if (column.sortable && x >= currentX && x < currentX + column.width) {
        return true;
      }
      currentX += column.width + 1;
    }

    return false;
  }

  getBuffer() {
    return {
      chars: this.buffer.slice(),
      colors: this.colorBuffer.slice()
    };
  }
}

export { TokenVotingTable };

