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
        
        // Layout constants with updated spacing
        this.MARGIN_LEFT = !window.isMobile ? 6 : 3;
        this.MARGIN_TOP = !window.isMobile ? 4 : 3;
        this.MARGIN_RIGHT = !window.isMobile ? 6 : 12;
        this.LINE_SPACING = 2;
        this.SECTION_SPACING = 2;
        this.TITLE_CONTENT_SPACING = 2;
        this.LOGO_CONTENT_SPACING = 3;
    
        // Initialize color scheme
        this.colors = { ...GRID_COLORS }; // Assuming GRID_COLORS is imported
    }

    getSchemeColor(type) {
        const currentScheme = colorScheme.get(scheme);
        if (!currentScheme) return '#ff8700'; // fallback color
    
        switch (type) {
            case 'text':
                return currentScheme.textColor;
            case 'link':
                return currentScheme.darkOrangeTitle;
            case 'highlight':
                return currentScheme.orangeTitleColor;
            case 'border':
                return currentScheme.borderColor;
            case 'logo-dollar':
                return currentScheme.plusSignColor;
            case 'logo-plus':
                return currentScheme.plusSignColor;
            case 'section-title':
                return currentScheme.specialTitleColor;
            case 'background':
                return currentScheme.backgroundColor;
            case 'special-title':
                return currentScheme.specialTitleColor;
            case 'special-content':
                return currentScheme.specialContentColor;
            default:
                return currentScheme.textColor;
        }
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

        // Draw top and bottom borders
    for (let x = plotStartX; x < plotStartX + plotWidth; x++) {
      const topIndex = x;
      this.buffer[topIndex] = '$';
          this.colorBuffer[topIndex] = this.getSchemeColor('border');
          
      ({ char, c } = borderCharacter(x, 0, x, 0, cv, null, null, cscheme, [...infoStrings.top]));
      if (char != null) {
        this.buffer[topIndex] = char;
            this.colorBuffer[topIndex] = c;  // Use the color returned by borderCharacter
      }

      const bottomIndex = x + (plotHeight * this.width) - this.width;
      this.buffer[bottomIndex] = '$';
          this.colorBuffer[bottomIndex] = this.getSchemeColor('border');
          
      ({ char, c } = borderCharacter(x, (plotStartY + plotHeight), x, (plotStartY + plotHeight), cv, null, null, cscheme, [...infoStrings.bottom]));
      if (char != null) {
        this.buffer[bottomIndex] = char;
            this.colorBuffer[bottomIndex] = c;  // Use the color returned by borderCharacter
      }
    }

        // Draw left and right borders
    for (let y = plotStartY; y < plotStartY + plotHeight; y++) {
      const leftIndex = plotStartX + (y * this.width);
      const rightIndex = (plotStartX + this.width) + (y * this.width) - 1;

      this.buffer[leftIndex] = '$';
          this.colorBuffer[leftIndex] = this.getSchemeColor('border');
          
      ({ char, c } = borderCharacter(plotStartX, y, plotStartX, y, cv, null, null, cscheme, [...infoStrings.left], true));
      if (char != null) {
        this.buffer[leftIndex] = char;
            this.colorBuffer[leftIndex] = c;  // Use the color returned by borderCharacter
      }

      this.buffer[rightIndex] = '$';
          this.colorBuffer[rightIndex] = this.getSchemeColor('border');
          
      ({ char, c } = borderCharacter(plotStartX + plotWidth, y, plotStartX + plotWidth, y, cv, null, null, cscheme, [...infoStrings.right], true));
      if (char != null) {
        this.buffer[rightIndex] = char;
            this.colorBuffer[rightIndex] = c;  // Use the color returned by borderCharacter
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
            const startX = 5;
            const startY = 0;
            
            for (let i = 0; i < buttonText.length; i++) {
                const idx = (startX + i) + (startY * this.width);
                this.buffer[idx] = buttonText[i];
                this.colorBuffer[idx] = this.getSchemeColor('highlight');
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

    drawText(text, startX, startY, colorType = 'text', maxWidth = this.width - this.MARGIN_LEFT * 2) {
        let x = startX;
        let y = startY;
        let totalLines = 0;
        const color = this.getSchemeColor(colorType);
        
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
                            this.colorBuffer[idx] = this.getSchemeColor('link');
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
                        
                        // Set colors using getSchemeColor
                        if (char === '$') {
                            this.colorBuffer[idx] = this.getSchemeColor('logo-dollar');
                        } else if (char === '+') {
                            this.colorBuffer[idx] = this.getSchemeColor('logo-plus');
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
        this.upArrowPosition = null;
        this.downArrowPosition = null;
        
        // Draw border
        const { plotStartX, plotWidth, plotStartY, plotHeight } = this.drawBorder();
    
        // Draw return button if not on landing page
        this.drawReturnButton();
        
        const page = this.pages[this.currentPage];
        if (!page) return;
        
        let currentY;
        let firstTitleY = null;
        
        if (this.currentPage === 'landing' && page.logo) {
            currentY = this.drawLogo();
            currentY += this.LOGO_CONTENT_SPACING;
        } else {
            currentY = this.MARGIN_TOP;
        }
        
        // Draw sections with updated mobile handling
        if (page.sections) {
            // Determine which sections to show based on page and device
            let visibleSections;
            if (window.isMobile && (this.currentPage === 'build' || this.currentPage === 'story')) {
                // On mobile for build/story pages, only show one section at a time
                visibleSections = [page.sections[this.topIndex]];
            } else {
                // Otherwise show all sections from topIndex
                visibleSections = page.sections.slice(this.topIndex);
            }
    
            visibleSections.forEach((section, index) => {
                // Check if we're about to exceed the height with padding
                if (currentY >= this.height - 4) { // Increased padding from bottom
                    return;
                }
                
                if (index > 0) {
                    currentY += this.SECTION_SPACING;
                }
                
                if (section.title) {
                    if (firstTitleY === null) {
                        firstTitleY = currentY;
                    }
                    this.drawText(section.title, this.MARGIN_LEFT, currentY, 'special-title', 
                        this.width - (this.MARGIN_LEFT + this.MARGIN_RIGHT));
                    currentY += this.TITLE_CONTENT_SPACING;
                }
                
                if (section.content) {
                    // Handle both string and array content
                    const contentArray = Array.isArray(section.content) ? section.content : [section.content];
                    
                    contentArray.forEach((contentItem, contentIndex) => {
                        const linesUsed = this.drawText(
                            contentItem, 
                            this.MARGIN_LEFT, 
                            currentY, 
                            'special-content',
                            this.width - (this.MARGIN_LEFT + this.MARGIN_RIGHT)
                        );
                        currentY += linesUsed * this.LINE_SPACING;
                        
                        // Add a small space between multiple content items
                        if (contentIndex < contentArray.length - 1) {
                            currentY += 1;
                        }
                    });
                }
            });
    
            // Draw navigation arrows on mobile - only on build/story pages
            if (window.isMobile && (this.currentPage === 'build' || this.currentPage === 'story') && firstTitleY !== null) {
                const navigationX = this.width - 10;
                
                // Up arrow - show if not at first section
                if (this.topIndex > 0) {
                    const upText = '▲ up';
                    this.drawText(upText, navigationX, firstTitleY - 1, 'link');
                    this.upArrowPosition = {
                        x: navigationX,
                        y: firstTitleY - 1,
                        endX: navigationX + upText.length
                    };
                }
    
                // Down arrow - show if not at last section
                if (this.topIndex < page.sections.length - 1) {
                    const downText = '▼ down';
                    this.drawText(downText, navigationX, firstTitleY + 1, 'link');
                    this.downArrowPosition = {
                        x: navigationX,
                        y: firstTitleY + 1,
                        endX: navigationX + downText.length
                    };
                }
            }
        }
    }
        
    handleClick(x, y) {
        // Check for mobile navigation arrows
        if (window.isMobile && this.currentPage !== 'landing') {
            if (this.upArrowPosition && 
                y === this.upArrowPosition.y && 
                x >= this.upArrowPosition.x && 
                x < this.upArrowPosition.endX) {
                this.topIndex = Math.max(0, this.topIndex - 1);
                this.draw();
                return true;
            }
            
            if (this.downArrowPosition && 
                y === this.downArrowPosition.y && 
                x >= this.downArrowPosition.x && 
                x < this.downArrowPosition.endX) {
                const page = this.pages[this.currentPage];
                if (page && this.topIndex < page.sections.length - 1) {
                    this.topIndex++;
                    this.draw();
                    return true;
                }
            }
        }

        // Check for link clicks
        for (const link of this.linkPositions) {
            if (y === link.y && x >= link.startX && x < link.endX) {
                if (link.action === 'return') {
                    this.currentPage = 'landing';
                    this.topIndex = 0;
                    this.draw();
                    return true;
                } else if (link.url?.startsWith('#')) {
                    this.currentPage = link.url.slice(1);
                    this.topIndex = 0;
                    this.draw();
                    return true;
                } else if (link.url?.startsWith('http')) {
                    window.open(link.url, '_blank');
                    return true;
                }
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
