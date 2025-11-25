/**
 * ESC/POS Command Generator
 * 
 * Reference implementation for converting receipt templates to ESC/POS commands
 * This serves as a reference for engineers implementing printer support
 * 
 * Usage:
 *   const generator = new ESCPOSGenerator();
 *   const commands = generator.generate(template, data);
 *   // Send commands to printer
 */

class ESCPOSGenerator {
    constructor() {
        // ESC/POS Command Constants
        this.ESC = 0x1B;
        this.GS = 0x1D;
        this.LF = 0x0A;
        
        // Alignment values
        this.ALIGN_LEFT = 0;
        this.ALIGN_CENTER = 1;
        this.ALIGN_RIGHT = 2;
        
        // Font values
        this.FONT_A = 0x00;
        this.FONT_B = 0x01;
        this.BOLD = 0x08;
        this.DOUBLE_HEIGHT = 0x10;
        this.DOUBLE_WIDTH = 0x01;
        this.FONT_B_BOLD = 0x09; // Font B + Bold
        this.FONT_B_DOUBLE = 0x19; // Font B + Bold + Double Height
    }

    /**
     * Generate ESC/POS commands from template and data
     * @param {object} template - Receipt template JSON
     * @param {object} data - Data object with variable values
     * @returns {Uint8Array} ESC/POS command bytes
     */
    generate(template, data) {
        if (!template || !template.receipt_template) {
            throw new Error('Invalid template structure');
        }

        const commands = [];
        const characterWidth = template.receipt_template.characterWidth || 32;

        // Initialize printer
        commands.push(...this.initialize());

        // Process each element
        template.receipt_template.elements.forEach(element => {
            const elementCommands = this.processElement(element, data, characterWidth);
            commands.push(...elementCommands);
        });

        // Feed lines before cut
        commands.push(...this.feedLines(3));

        // Cut paper
        commands.push(...this.cutPaper());

        return new Uint8Array(commands);
    }

    /**
     * Initialize printer
     * @returns {Array<number>} Command bytes
     */
    initialize() {
        return [this.ESC, 0x40]; // ESC @
    }

    /**
     * Process a single template element
     * @param {object} element - Template element
     * @param {object} data - Data object
     * @param {number} characterWidth - Maximum characters per line
     * @returns {Array<number>} Command bytes
     */
    processElement(element, data, characterWidth) {
        const commands = [];

        switch (element.type) {
            case 'text':
                commands.push(...this.renderText(element, data, characterWidth));
                break;
            case 'static_text':
                commands.push(...this.renderStaticText(element, characterWidth));
                break;
            case 'separator':
                commands.push(...this.renderSeparator(element, characterWidth));
                break;
            case 'newline':
                commands.push(...this.renderNewline());
                break;
            case 'bill_date_row':
                commands.push(...this.renderBillDateRow(data));
                break;
            case 'transaction_payment_row':
                commands.push(...this.renderTransactionPaymentRow(data));
                break;
            case 'transaction_calculation':
                commands.push(...this.renderTransactionCalculation(element, data, characterWidth));
                break;
            case 'item_header_row':
                commands.push(...this.renderItemHeaderRow(characterWidth));
                break;
            case 'bill_items':
                commands.push(...this.renderBillItems(data, characterWidth));
                break;
            case 'total_amount_row':
                commands.push(...this.renderTotalAmountRow(data, characterWidth));
                break;
            case 'qr_code':
                commands.push(...this.renderQRCode(element, data));
                break;
            case 'cut_paper':
                // Cut paper is handled at the end
                break;
            default:
                console.warn(`Unknown element type: ${element.type}`);
        }

        return commands;
    }

    /**
     * Render text element with variable substitution
     * @param {object} element - Text element
     * @param {object} data - Data object
     * @param {number} characterWidth - Max characters per line
     * @returns {Array<number>} Command bytes
     */
    renderText(element, data, characterWidth) {
        const commands = [];
        const text = this.replaceVariables(element.value || '', data);
        const alignment = this.getAlignment(element.alignment);
        const fontStyle = this.getFontStyle(element.font_size, element.font_weight);

        // Set alignment
        commands.push(...this.setAlignment(alignment));

        // Set font style
        commands.push(...this.setFontStyle(fontStyle));

        // Wrap and print text
        const lines = this.wrapText(text, characterWidth);
        lines.forEach(line => {
            commands.push(...this.printText(line));
            commands.push(...this.feedLines(1));
        });

        // Reset font
        commands.push(...this.setFontStyle(this.FONT_A));
        // Reset alignment
        commands.push(...this.setAlignment(this.ALIGN_LEFT));

        return commands;
    }

    /**
     * Render static text element
     * @param {object} element - Static text element
     * @param {number} characterWidth - Max characters per line
     * @returns {Array<number>} Command bytes
     */
    renderStaticText(element, characterWidth) {
        const commands = [];
        const text = element.value || '';
        const alignment = this.getAlignment(element.alignment);
        const fontStyle = this.getFontStyle(element.font_size, element.font_weight);

        // Set alignment
        commands.push(...this.setAlignment(alignment));

        // Set font style
        commands.push(...this.setFontStyle(fontStyle));

        // Wrap and print text
        const lines = this.wrapText(text, characterWidth);
        lines.forEach(line => {
            commands.push(...this.printText(line));
            commands.push(...this.feedLines(1));
        });

        // Reset font
        commands.push(...this.setFontStyle(this.FONT_A));
        // Reset alignment
        commands.push(...this.setAlignment(this.ALIGN_LEFT));

        return commands;
    }

    /**
     * Render separator line
     * @param {object} element - Separator element
     * @param {number} characterWidth - Max characters per line
     * @returns {Array<number>} Command bytes
     */
    renderSeparator(element, characterWidth) {
        const commands = [];
        const length = element.length || characterWidth;
        const style = element.style || 'DASHED';
        const char = style === 'DASHED' ? '-' : '=';
        const line = char.repeat(length);

        // Center alignment for separator
        commands.push(...this.setAlignment(this.ALIGN_CENTER));
        commands.push(...this.printText(line));
        commands.push(...this.feedLines(1));
        commands.push(...this.setAlignment(this.ALIGN_LEFT));

        return commands;
    }

    /**
     * Render newline
     * @returns {Array<number>} Command bytes
     */
    renderNewline() {
        return this.feedLines(1);
    }

    /**
     * Render bill date row
     * @param {object} data - Data object
     * @returns {Array<number>} Command bytes
     */
    renderBillDateRow(data) {
        const commands = [];
        const billNumber = data.bill_number || data.billNumber || 'N/A';
        const billDate = this.formatDate(data.bill_date || data.billDate);
        const billTime = this.formatTime(data.bill_date || data.billDate);

        commands.push(...this.setAlignment(this.ALIGN_LEFT));
        commands.push(...this.setFontStyle(this.FONT_A));

        commands.push(...this.printText(`Bill No: ${billNumber}`));
        commands.push(...this.feedLines(1));
        commands.push(...this.printText(`Date: ${billDate}`));
        commands.push(...this.feedLines(1));
        commands.push(...this.printText(`Time: ${billTime}`));
        commands.push(...this.feedLines(1));

        return commands;
    }

    /**
     * Render transaction payment row
     * @param {object} data - Data object
     * @returns {Array<number>} Command bytes
     */
    renderTransactionPaymentRow(data) {
        const commands = [];
        const transactionType = data.transaction_type || data.transactionType || 'Sale';
        const paymentType = data.payment_type || data.paymentType || 'Cash';
        const cashier = data.cashier || 'N/A';

        commands.push(...this.setAlignment(this.ALIGN_LEFT));
        commands.push(...this.setFontStyle(this.FONT_A));

        commands.push(...this.printText(`Type: ${transactionType}`));
        commands.push(...this.feedLines(1));
        commands.push(...this.printText(`Payment: ${paymentType}`));
        commands.push(...this.feedLines(1));
        
        if (cashier !== 'N/A') {
            commands.push(...this.printText(`Cashier: ${cashier}`));
            commands.push(...this.feedLines(1));
        }

        return commands;
    }

    /**
     * Render transaction calculation
     * @param {object} element - Element object
     * @param {object} data - Data object
     * @param {number} characterWidth - Max characters per line
     * @returns {Array<number>} Command bytes
     */
    renderTransactionCalculation(element, data, characterWidth) {
        const commands = [];
        const alignment = this.getAlignment(element.alignment || 'RIGHT');

        commands.push(...this.setAlignment(alignment));
        commands.push(...this.setFontStyle(this.FONT_A));

        if (data.items && data.items.length > 0) {
            data.items.forEach(item => {
                const name = item.name || 'Item';
                const qty = item.qty || 0;
                const amount = this.formatCurrency(item.amount || 0);
                const line = `${name} x ${qty} = ${amount}`;
                commands.push(...this.printText(line));
                commands.push(...this.feedLines(1));
            });
        }

        commands.push(...this.setAlignment(this.ALIGN_LEFT));

        return commands;
    }

    /**
     * Render item header row
     * @param {number} characterWidth - Max characters per line
     * @returns {Array<number>} Command bytes
     */
    renderItemHeaderRow(characterWidth) {
        const commands = [];
        commands.push(...this.setAlignment(this.ALIGN_LEFT));
        commands.push(...this.setFontStyle(this.BOLD));

        if (characterWidth === 32) {
            // 2-inch format
            commands.push(...this.printText('Sl No  Item          Qty  Price  Amount'));
        } else {
            // 3-inch format
            commands.push(...this.printText('Sl No  Item                  Qty    Price    Amount'));
        }

        commands.push(...this.feedLines(1));
        commands.push(...this.setFontStyle(this.FONT_A));

        return commands;
    }

    /**
     * Render bill items table
     * @param {object} data - Data object
     * @param {number} characterWidth - Max characters per line
     * @returns {Array<number>} Command bytes
     */
    renderBillItems(data, characterWidth) {
        const commands = [];
        const items = data.items || [];

        commands.push(...this.setAlignment(this.ALIGN_LEFT));
        commands.push(...this.setFontStyle(this.FONT_A));

        items.forEach((item, index) => {
            const slNo = item.slNo !== undefined ? item.slNo : index + 1;
            const name = item.name || 'Item';
            const qty = item.qty || 0;
            const rate = this.formatCurrency(item.rate || 0);
            const amount = this.formatCurrency(item.amount || 0);

            if (characterWidth === 32) {
                // 2-inch format: Sl No (5) + Item (12) + Qty (4) + Price (5) + Amount (6)
                const line = `${String(slNo).padEnd(5)}${name.padEnd(12).substring(0, 12)}${String(qty).padStart(4)}${rate.padStart(5)}${amount.padStart(6)}`;
                commands.push(...this.printText(line));
            } else {
                // 3-inch format: Sl No (6) + Item (20) + Qty (6) + Price (8) + Amount (8)
                const line = `${String(slNo).padEnd(6)}${name.padEnd(20).substring(0, 20)}${String(qty).padStart(6)}${rate.padStart(8)}${amount.padStart(8)}`;
                commands.push(...this.printText(line));
            }

            commands.push(...this.feedLines(1));
        });

        return commands;
    }

    /**
     * Render total amount row
     * @param {object} data - Data object
     * @param {number} characterWidth - Max characters per line
     * @returns {Array<number>} Command bytes
     */
    renderTotalAmountRow(data, characterWidth) {
        const commands = [];
        const subtotal = this.formatCurrency(data.subtotal || 0);
        const discount = data.discount || 0;
        const tax = data.tax || {};
        const total = this.formatCurrency(data.total || 0);

        commands.push(...this.setAlignment(this.ALIGN_RIGHT));
        commands.push(...this.setFontStyle(this.FONT_A));

        // Subtotal
        commands.push(...this.printText(`Subtotal:        ${subtotal}`));
        commands.push(...this.feedLines(1));

        // Discount
        if (discount > 0) {
            commands.push(...this.printText(`Discount:        ${this.formatCurrency(discount)}`));
            commands.push(...this.feedLines(1));
        }

        // CGST
        if (tax.cgst && tax.cgst.amount > 0) {
            commands.push(...this.printText(`CGST @ ${tax.cgst.rate}%:  ${this.formatCurrency(tax.cgst.amount)}`));
            commands.push(...this.feedLines(1));
        }

        // SGST
        if (tax.sgst && tax.sgst.amount > 0) {
            commands.push(...this.printText(`SGST @ ${tax.sgst.rate}%:  ${this.formatCurrency(tax.sgst.amount)}`));
            commands.push(...this.feedLines(1));
        }

        // IGST
        if (tax.igst && tax.igst.amount > 0) {
            commands.push(...this.printText(`IGST @ ${tax.igst.rate}%:  ${this.formatCurrency(tax.igst.amount)}`));
            commands.push(...this.feedLines(1));
        }

        // Total (bold, larger font)
        commands.push(...this.setFontStyle(this.FONT_B_DOUBLE));
        commands.push(...this.printText(`Total:           ${total}`));
        commands.push(...this.feedLines(1));
        commands.push(...this.setFontStyle(this.FONT_A));
        commands.push(...this.setAlignment(this.ALIGN_LEFT));

        return commands;
    }

    /**
     * Render QR code
     * @param {object} element - QR code element
     * @param {object} data - Data object
     * @returns {Array<number>} Command bytes
     */
    renderQRCode(element, data) {
        const commands = [];
        const qrData = element.value ? this.replaceVariables(element.value, data) : (data.qr_data || '');
        const size = this.getQRSize(element.size || 'MEDIUM');
        const errorCorrection = this.getQRErrorCorrection(element.error_correction || 'M');

        // Center alignment
        commands.push(...this.setAlignment(this.ALIGN_CENTER));

        // QR Code commands (GS ( k)
        // Model 2, size, error correction, store data, print
        const dataBytes = this.stringToBytes(qrData);
        const dataLen = dataBytes.length + 3;

        // Set QR code model (Model 2)
        commands.push(this.GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00);

        // Set QR code size
        commands.push(this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size);

        // Set error correction level
        commands.push(this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, errorCorrection);

        // Store QR data
        commands.push(this.GS, 0x28, 0x6B, dataLen & 0xFF, (dataLen >> 8) & 0xFF, 0x31, 0x50, 0x30);
        commands.push(...dataBytes);

        // Print QR code
        commands.push(this.GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30);

        commands.push(...this.feedLines(1));
        commands.push(...this.setAlignment(this.ALIGN_LEFT));

        return commands;
    }

    /**
     * Cut paper
     * @returns {Array<number>} Command bytes
     */
    cutPaper() {
        return [this.GS, 0x56, 0x00]; // GS V 0 (full cut)
    }

    /**
     * Set text alignment
     * @param {number} alignment - Alignment value (0=left, 1=center, 2=right)
     * @returns {Array<number>} Command bytes
     */
    setAlignment(alignment) {
        return [this.ESC, 0x61, alignment];
    }

    /**
     * Set font style
     * @param {number} style - Font style value
     * @returns {Array<number>} Command bytes
     */
    setFontStyle(style) {
        return [this.ESC, 0x21, style];
    }

    /**
     * Print text (convert string to bytes)
     * @param {string} text - Text to print
     * @returns {Array<number>} Command bytes
     */
    printText(text) {
        return this.stringToBytes(text);
    }

    /**
     * Feed lines
     * @param {number} lines - Number of lines to feed
     * @returns {Array<number>} Command bytes
     */
    feedLines(lines) {
        return [this.ESC, 0x64, lines];
    }

    /**
     * Get alignment value from string
     * @param {string} alignment - Alignment string (LEFT, CENTER, RIGHT)
     * @returns {number} Alignment value
     */
    getAlignment(alignment) {
        const alignMap = {
            'LEFT': this.ALIGN_LEFT,
            'CENTER': this.ALIGN_CENTER,
            'RIGHT': this.ALIGN_RIGHT
        };
        return alignMap[alignment] || this.ALIGN_LEFT;
    }

    /**
     * Get font style from font_size and font_weight
     * @param {string} fontSize - Font size (NORMAL, SMALL, LARGE)
     * @param {string} fontWeight - Font weight (NORMAL, BOLD)
     * @returns {number} Font style value
     */
    getFontStyle(fontSize, fontWeight) {
        // Font A = normal, Font B = double width/height
        if (fontWeight === 'BOLD') {
            if (fontSize === 'LARGE') {
                return this.FONT_B_DOUBLE; // Font B + Bold + Double Height
            }
            return this.BOLD; // Font A + Bold
        }
        return this.FONT_A; // Normal font
    }

    /**
     * Get QR code size value
     * @param {string} size - Size string (SMALL, MEDIUM, LARGE)
     * @returns {number} Size value (1-8)
     */
    getQRSize(size) {
        const sizeMap = {
            'SMALL': 3,
            'MEDIUM': 6,
            'LARGE': 8
        };
        return sizeMap[size] || 6;
    }

    /**
     * Get QR code error correction level
     * @param {string} level - Error correction level (L, M, Q, H)
     * @returns {number} Error correction value
     */
    getQRErrorCorrection(level) {
        const levelMap = {
            'L': 0x30, // 48
            'M': 0x31, // 49
            'Q': 0x32, // 50
            'H': 0x33  // 51
        };
        return levelMap[level] || 0x31; // Default to M
    }

    /**
     * Replace variables in text
     * @param {string} text - Text with ${variable} placeholders
     * @param {object} data - Data object
     * @returns {string} Text with replaced values
     */
    replaceVariables(text, data) {
        if (!text || typeof text !== 'string') return text;
        
        return text.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            const value = data[varName.trim()];
            return value !== undefined && value !== null ? String(value) : match;
        });
    }

    /**
     * Wrap text to fit within character width
     * @param {string} text - Text to wrap
     * @param {number} maxWidth - Maximum width in characters
     * @returns {Array<string>} Array of wrapped lines
     */
    wrapText(text, maxWidth) {
        if (text.length <= maxWidth) {
            return [text];
        }

        const words = text.split(' ');
        const lines = [];
        let currentLine = '';

        words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= maxWidth) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                }
                currentLine = word.length > maxWidth ? word.substring(0, maxWidth) : word;
            }
        });

        if (currentLine) {
            lines.push(currentLine);
        }

        return lines.length > 0 ? lines : [text.substring(0, maxWidth)];
    }

    /**
     * Format date from ISO string
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date (DD/MM/YYYY)
     */
    formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Format time from ISO string
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted time (HH:MM)
     */
    formatTime(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${hours}:${minutes}`;
        } catch (e) {
            return dateString;
        }
    }

    /**
     * Format number as currency
     * @param {number} value - Numeric value
     * @returns {string} Formatted currency string
     */
    formatCurrency(value) {
        return `₹${parseFloat(value).toFixed(2)}`;
    }

    /**
     * Convert string to byte array (UTF-8)
     * @param {string} str - String to convert
     * @returns {Array<number>} Byte array
     */
    stringToBytes(str) {
        const bytes = [];
        for (let i = 0; i < str.length; i++) {
            const charCode = str.charCodeAt(i);
            if (charCode < 0x80) {
                bytes.push(charCode);
            } else if (charCode < 0x800) {
                bytes.push(0xC0 | (charCode >> 6));
                bytes.push(0x80 | (charCode & 0x3F));
            } else {
                bytes.push(0xE0 | (charCode >> 12));
                bytes.push(0x80 | ((charCode >> 6) & 0x3F));
                bytes.push(0x80 | (charCode & 0x3F));
            }
        }
        return bytes;
    }
}

// Export for Node.js or browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ESCPOSGenerator;
}

// Example usage:
/*
const generator = new ESCPOSGenerator();

// Load template and data
const template = {
  receipt_template: {
    characterWidth: 32,
    elements: [
      {
        type: "text",
        alignment: "CENTER",
        font_size: "NORMAL",
        font_weight: "BOLD",
        value: "${shop_name}"
      }
    ]
  }
};

const data = {
  shop_name: "Tohands Store"
};

// Generate ESC/POS commands
const commands = generator.generate(template, data);

// Send to printer (example)
// printer.write(commands);
*/

