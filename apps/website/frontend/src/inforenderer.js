import { calculateDimensions, getCharacterDimensions } from "./canvashelper.js";

export class ContentRenderer {
    constructor(width, height, pages) {
        this.width = width;
        this.height = height;
        this.pages = pages;
        this.currentPage = 'landing';
        this.buffer = new Array(width * height).fill(' ');
        this.colorBuffer = new Array(width * height).fill(null);
        this.linkPositions = [];
        
        // Colors
        this.colors = {
            text: '#211e3a',
            link: '#fc8726',
            highlight: '#c0b0ff',
            border: '#1c1936',
            logo: {
                dollar: '#211e3a',    // Color for '$' characters in logo
                plus: '#211e3a'       // Color for '+' characters in logo
            },
            sectionTitle: '#c0b0ff',
            background: '#875fff'
        };

        // Export colors as CSS variables
        const root = document.documentElement;
        root.style.setProperty('--background-color', this.colors.background);
        root.style.setProperty('--text-color', this.colors.text);
        
        // Layout constants with updated spacing
        this.MARGIN_LEFT = 7;
        this.MARGIN_TOP = 5;
        this.LINE_SPACING = 2;
        this.SECTION_SPACING = 2;
        this.TITLE_CONTENT_SPACING = 3;
        this.LOGO_CONTENT_SPACING = 3;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.buffer = new Array(width * height).fill(' ');
        this.colorBuffer = new Array(width * height).fill(null);
        this.draw();
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
      ({ char, c } = borderCharacter(x, 0, x, 0, cv, null, null, cscheme, [...infoStrings.top]));
      if (char != null) {
        this.buffer[topIndex] = char;
        this.colorBuffer[topIndex] = c;
      }

      const bottomIndex = x + (plotHeight * this.width) - this.width;

      this.buffer[bottomIndex] = '$';
      ({ char, c } = borderCharacter(x, (plotStartY + plotHeight), x, (plotStartY + plotHeight), cv, null, null, cscheme, [...infoStrings.bottom]));
      if (char != null) {
        this.buffer[bottomIndex] = char;
        this.colorBuffer[bottomIndex] = c;
      }
    }

    for (let y = plotStartY; y < plotStartY + plotHeight; y++) {
      const leftIndex = plotStartX + (y * this.width);
      const rightIndex = (plotStartX + this.width) + (y * this.width) - 1;

      this.buffer[leftIndex] = '$';
      ({ char, c } = borderCharacter(plotStartX, y, plotStartX, y, cv, null, null, cscheme, [...infoStrings.left], true));
      if (char != null) {
        this.buffer[leftIndex] = char;
        this.colorBuffer[leftIndex] = c;
      }

      this.buffer[rightIndex] = '$';
      ({ char, c } = borderCharacter(plotStartX + plotWidth, y, plotStartX + plotWidth, y, cv, null, null, cscheme, [...infoStrings.right], true));
      if (char != null) {
        this.buffer[rightIndex] = char;
        this.colorBuffer[rightIndex] = c;
      }

    }
    return { plotStartX, plotWidth, plotStartY, plotHeight };
  }

    /*drawBorder() {
        // Draw top and bottom borders
        for (let x = 0; x < this.width; x++) {
            this.buffer[x] = '$';
            this.buffer[x + (this.height - 1) * this.width] = '$';
            this.colorBuffer[x] = this.colors.border;
            this.colorBuffer[x + (this.height - 1) * this.width] = this.colors.border;
        }
        
        // Draw left and right borders
        for (let y = 0; y < this.height; y++) {
            this.buffer[y * this.width] = '$';
            this.buffer[this.width - 1 + y * this.width] = '$';
            this.colorBuffer[y * this.width] = this.colors.border;
            this.colorBuffer[this.width - 1 + y * this.width] = this.colors.border;
        }
    }*/

    drawReturnButton() {
        if (this.currentPage !== 'landing') {
            const buttonText = '< RETURN ';
            const startX = 5;  // Position closer to left border
            const startY = 0;  // Position on the top border line
            
            for (let i = 0; i < buttonText.length; i++) {
                const idx = (startX + i) + (startY * this.width);
                this.buffer[idx] = buttonText[i];
                this.colorBuffer[idx] = this.colors.highlight;
            }
            
            this.linkPositions.push({
                text: 'return',
                action: 'return',
                startX,
                endX: startX + buttonText.length,
                y: startY
            });
        }
    }

    drawText(text, startX, startY, color = null, maxWidth = this.width - this.MARGIN_LEFT * 2) {
        let x = startX;
        let y = startY;
        let totalLines = 0;
        
        // Split into paragraphs first
        const paragraphs = text.split('\n');
        
        paragraphs.forEach((paragraph, pIndex) => {
            // Reset x position for each paragraph
            x = startX;
            
            // Add extra spacing between paragraphs
            if (pIndex > 0) {
                y += this.LINE_SPACING * 2;
                totalLines += 2;
            }
    
            // Split by pipe character first, preserving the separator
            const segments = paragraph.split(/(\|)/g).map(seg => seg.trim()).filter(Boolean);
            
            segments.forEach((segment, segIndex) => {
                // Handle pipe separator
                if (segment === '|') {
                    // Always add a space before pipe if not at start
                    if (x > startX) {
                        const spaceBeforeIdx = x + (y * this.width);
                        this.buffer[spaceBeforeIdx] = ' ';
                        if (color) this.colorBuffer[spaceBeforeIdx] = color;
                        x += 1;
                    }
    
                    // Write the pipe character
                    const pipeIdx = x + (y * this.width);
                    this.buffer[pipeIdx] = '|';
                    if (color) this.colorBuffer[pipeIdx] = color;
                    x += 1;
                    
                    // Always add a space after pipe
                    const spaceAfterIdx = x + (y * this.width);
                    this.buffer[spaceAfterIdx] = ' ';
                    if (color) this.colorBuffer[spaceAfterIdx] = color;
                    x += 0;
                    return;
                }
    
                // Process regular text or links
                let remainingText = segment;
                while (remainingText.length > 0) {
                    let linkStart = remainingText.indexOf('[');
                    let linkEnd = remainingText.indexOf(']');
                    
                    // No more links in this text
                    if (linkStart === -1 || linkEnd === -1) {
                        // Process remaining text as normal words
                        const words = remainingText.split(' ').filter(w => w.length > 0);
                        words.forEach((word, wordIndex) => {
                            if (x > startX && x + word.length > startX + maxWidth) {
                                // Wrap to new line
                                y += this.LINE_SPACING;
                                totalLines++;
                                x = startX;
                            } else if (wordIndex > 0 && x > startX) {
                                // Add space between words on the same line
                                const spaceIdx = x + (y * this.width);
                                this.buffer[spaceIdx] = ' ';
                                if (color) this.colorBuffer[spaceIdx] = color;
                                x += 1;
                            }
                            
                            // Write the word
                            for (let i = 0; i < word.length; i++) {
                                const idx = (x + i) + (y * this.width);
                                this.buffer[idx] = word[i];
                                if (color) this.colorBuffer[idx] = color;
                            }
                            x += word.length;
                        });
                        break;
                    }
                    
                    // Process text before link if any
                    if (linkStart > 0) {
                        const beforeLink = remainingText.substring(0, linkStart).trim();
                        if (beforeLink) {
                            const words = beforeLink.split(' ').filter(w => w.length > 0);
                            words.forEach((word, wordIndex) => {
                                if (x > startX && x + word.length > startX + maxWidth) {
                                    y += this.LINE_SPACING;
                                    totalLines++;
                                    x = startX;
                                } else if (wordIndex > 0 && x > startX) {
                                    const spaceIdx = x + (y * this.width);
                                    this.buffer[spaceIdx] = ' ';
                                    if (color) this.colorBuffer[spaceIdx] = color;
                                    x += 1;
                                }
                                
                                for (let i = 0; i < word.length; i++) {
                                    const idx = (x + i) + (y * this.width);
                                    this.buffer[idx] = word[i];
                                    if (color) this.colorBuffer[idx] = color;
                                }
                                x += word.length;
                            });
                        }
                    }
                    
                    // Extract and process link
                    const linkText = remainingText.substring(linkStart + 1, linkEnd);
                    const linkKey = linkText;
                    
                    // Check if this is a valid link
                    if (this.pages[this.currentPage].links[linkKey]) {
                        if (x > startX && x + linkText.length > startX + maxWidth) {
                            y += this.LINE_SPACING;
                            totalLines++;
                            x = startX;
                        } else if (x > startX) {
                            const spaceIdx = x + (y * this.width);
                            this.buffer[spaceIdx] = ' ';
                            if (color) this.colorBuffer[spaceIdx] = color;
                            x += 1;
                        }
                        
                        const linkStart = { x, y };
                        
                        // Draw link text
                        for (let i = 0; i < linkText.length; i++) {
                            const idx = (x + i) + (y * this.width);
                            this.buffer[idx] = linkText[i];
                            this.colorBuffer[idx] = this.colors.link;
                        }
                        
                        // Register link position
                        this.linkPositions.push({
                            text: linkKey,
                            url: this.pages[this.currentPage].links[linkKey],
                            startX: linkStart.x,
                            endX: x + linkText.length,
                            y: linkStart.y
                        });
                        
                        x += linkText.length;
                        
                        // Handle the text after the link
                        const afterLink = remainingText.substring(linkEnd + 1);
                        if (afterLink.startsWith(' ')) {
                            // Add space after link if there was one
                            const spaceIdx = x + (y * this.width);
                            this.buffer[spaceIdx] = ' ';
                            if (color) this.colorBuffer[spaceIdx] = color;
                            x += 1;
                        }
                        
                        // Update remaining text
                        remainingText = afterLink.trim();
                    } else {
                        // If not a valid link, skip it
                        remainingText = remainingText.substring(linkEnd + 1).trim();
                    }
                }
            });
            
            // Move to next line after paragraph
            y += this.LINE_SPACING;
            totalLines++;
        });
        
        return totalLines;
    }

    drawLogo() {
        if (this.currentPage === 'landing' && this.pages.landing.logo) {
            const lines = this.pages.landing.logo.split('\n');
            let y = this.MARGIN_TOP;
            
            lines.forEach(line => {
                for (let x = 0; x < line.length; x++) {
                    const char = line[x];
                    const idx = (x + this.MARGIN_LEFT) + (y * this.width);
                    
                    if (idx >= 0 && idx < this.buffer.length) {
                        this.buffer[idx] = char;
                        
                        // Set different colors based on the character
                        if (char === '$') {
                            this.colorBuffer[idx] = this.colors.logo.dollar;
                        } else if (char === '+') {
                            this.colorBuffer[idx] = this.colors.logo.plus;
                        }
                    }
                }
                y++;
            });
            
            return y;
        }
        return this.MARGIN_TOP;
    }

    draw() {
        // Clear buffers
        this.buffer.fill(' ');
        this.colorBuffer.fill(null);
        this.linkPositions = [];
        
        // Draw border
        const { plotStartX, plotWidth, plotStartY, plotHeight } = this.drawBorder();

        this.drawBorder();
        
        // Draw return button if not on landing page
        this.drawReturnButton();
        
        const page = this.pages[this.currentPage];
        if (!page) return;
        
        let currentY;
        
        // Set initial Y position based on whether we have a logo
        if (this.currentPage === 'landing' && page.logo) {
            currentY = this.drawLogo();
            currentY += this.LOGO_CONTENT_SPACING; // Add specific spacing after logo
        } else {
            currentY = this.MARGIN_TOP;
        }
        
        // Draw sections with updated spacing
        if (page.sections) {
            page.sections.forEach((section, index) => {
                // Add extra spacing before sections (except first one)
                if (index > 0) {
                    currentY += this.SECTION_SPACING;
                }
                
                // Draw section title only if it exists
                if (section.title) {
                    this.drawText(section.title, this.MARGIN_LEFT, currentY, this.colors.sectionTitle);
                    currentY += this.TITLE_CONTENT_SPACING;
                }
                
                // Draw section content if it exists
                if (section.content) {
                    const linesUsed = this.drawText(
                        section.content, 
                        this.MARGIN_LEFT, 
                        currentY, 
                        this.colors.text,
                        this.width - this.MARGIN_LEFT * 2
                    );
                    currentY += linesUsed * this.LINE_SPACING;
                }
            });
        }
    }
    
    handleClick(x, y) {
        // Check for link clicks
        for (const link of this.linkPositions) {
            if (y === link.y && x >= link.startX && x < link.endX) {
                if (link.action === 'return') {
                    this.currentPage = 'landing';
                    this.draw();
                } else if (link.url.startsWith('#')) {
                    this.currentPage = link.url.slice(1);
                    this.draw();
                } else if (link.url.startsWith('http')) {
                    window.open(link.url, '_blank');
                }
                return true;
            }
        }
        return false;
    }

    getBuffer() {
        return {
            chars: this.buffer,
            colors: this.colorBuffer
        };
    }
}