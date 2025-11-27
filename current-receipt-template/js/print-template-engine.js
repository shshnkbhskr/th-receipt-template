/**
 * Print Template Engine - Handles receipt template processing for print format
 * Compatible with ${variable} syntax and flat data structure
 */

// eslint-disable-next-line no-unused-vars
const PrintTemplateEngine = (() => {
    let sampleData = null;

    /**
     * Load sample data from JSON file or use default
     */
    async function loadSampleData() {
        try {
            const dataUrl = 'data/variables-example.json?t=' + Date.now() + '&_=' + Math.random();
            console.log('Loading sample data from:', dataUrl);
            const response = await fetch(dataUrl, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            sampleData = await response.json();
            console.log('Sample data loaded:', sampleData);
        } catch (error) {
            console.error('Error loading sample data:', error);
            sampleData = getDefaultSampleData();
        }
        return sampleData;
    }

    /**
     * Get default sample data
     */
    function getDefaultSampleData() {
        return {
            shop_name: "Tohands Store",
            shop_address: "123 Main Street, Bangalore, Karnataka 560001",
            gstin: "29ABCDE1234F1Z5",
            phone_number: "+9876543210",
            customer_name: "John Doe",
            customer_mobile: "+91-9876543210",
            qr_data: "upi://pay?pa=merchant@upi&pn=Tohands%20Store&am=1040.00&cu=INR",
            bill_date: "2025-01-15T14:30:00Z",
            bill_number: "BILL-2025-001",
            transaction_type: "Sale",
            payment_type: "UPI",
            cashier: "Cashier-001",
            items: [
                {
                    slNo: 1,
                    name: "Product A",
                    qty: 2,
                    rate: 100.00,
                    amount: 200.00,
                    sku: "SKU-001"
                },
                {
                    slNo: 2,
                    name: "Product B",
                    qty: 3,
                    rate: 150.00,
                    amount: 450.00,
                    sku: "SKU-002"
                }
            ],
            subtotal: 1000.00,
            discount: 50.00,
            tax: {
                cgst: { rate: 9, amount: 45.00 },
                sgst: { rate: 9, amount: 45.00 },
                igst: { rate: 0, amount: 0.00 }
            },
            total: 1040.00,
            calculation_steps: [
                {
                    operator: 'x',
                    operand: '100.00'
                },
                {
                    operator: 'x',
                    operand: '2.00'
                },
                {
                    operator: '+',
                    operand: '150.00'
                },
                {
                    operator: 'x',
                    operand: '3.00'
                },
                {
                    operator: '-',
                    operand: '50.00'
                },
                {
                    operator: '=',
                    operand: '₹1,040.00',
                    isFinal: true
                }
            ]
        };
    }

    /**
     * Replace variables in template with data (${variable} syntax)
     * @param {string} text - Text with ${variables}
     * @param {object} data - Data object
     * @returns {string} Text with replaced values
     */
    function replaceVariables(text, data) {
        if (!text || typeof text !== 'string') return text;

        return text.replace(/\$\{([^}]+)\}/g, (match, varName) => {
            const value = data[varName.trim()];
            return value !== undefined && value !== null ? value : match;
        });
    }

    /**
     * Format date from ISO string to readable format
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (_e) {
            return dateString;
        }
    }

    /**
     * Format time from ISO string to readable format
     */
    function formatTime(dateString) {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString('en-IN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (_e) {
            return dateString;
        }
    }

    /**
     * Format currency value
     */
    function formatCurrency(value) {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        return '₹' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Format number without currency symbol, with max character limit
     * @param {number} value - Numeric value
     * @param {number} maxLength - Maximum character length (including decimal)
     * @returns {string} Formatted number string
     */
    function formatNumberLimited(value, maxLength) {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        const formatted = value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        // Truncate if exceeds max length
        if (formatted.length > maxLength) {
            return formatted.substring(0, maxLength);
        }
        return formatted;
    }
    /**
     * Format number with Indian numbering system (commas)
     */
    function formatIndianNumber(value) {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        // Indian numbering: first 3 digits, then groups of 2
        const parts = value.toFixed(2).split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] || '00';

        // Format with Indian numbering system
        let formatted = '';
        const len = integerPart.length;

        if (len <= 3) {
            formatted = integerPart;
        } else if (len <= 5) {
            // 4-5 digits: 12,345
            formatted = integerPart.slice(0, len - 3) + ',' + integerPart.slice(len - 3);
        } else {
            // 6+ digits: 12,34,567 or 1,23,45,678
            formatted = integerPart.slice(0, len - 3);
            // Add commas for groups of 2 from right
            for (let i = formatted.length - 2; i > 0; i -= 2) {
                formatted = formatted.slice(0, i) + ',' + formatted.slice(i);
            }
            formatted += ',' + integerPart.slice(len - 3);
        }

        return formatted + '.' + decimalPart;
    }

    /**
     * Render preview HTML from template
     * @param {object} template - Template JSON
     * @param {object} data - Sample data
     * @returns {string} HTML string
     */
    function renderPreview(template, data = null) {
        if (!data) data = sampleData || getDefaultSampleData();
        if (!template || !template.receipt_template || !template.receipt_template.elements) {
            return '<div class="receipt-empty">No template elements to preview</div>';
        }

        const characterWidth = template.receipt_template.characterWidth || 32;

        let html = '';
        template.receipt_template.elements.forEach(element => {
            html += renderElement(element, data, characterWidth);
        });

        return html || '<div class="receipt-empty">Empty template</div>';
    }

    /**
     * Render single element
     * @param {object} element - Element object
     * @param {object} data - Sample data
     * @param {number} characterWidth - Character width for formatting
     * @returns {string} HTML string
     */
    function renderElement(element, data, characterWidth) {
        const renderers = {
            'text': renderText,
            'static_text': renderStaticText,
            'separator': renderSeparator,
            'newline': renderNewline,
            'placeholder_block': renderPlaceholderBlock,
            'bill_date_row': renderBillDateRow,
            'customer_info_row': renderCustomerInfoRow,
            'transaction_payment_row': renderTransactionPaymentRow,
            'transaction_calculation': renderTransactionCalculation,
            'transaction_calculation_v2': renderTransactionCalculationV2,
            'item_header_row': renderItemHeaderRow,
            'bill_items': renderBillItems,
            'total_qty_items_row': renderTotalQtyItemsRow,
            'total_amount_row': renderTotalAmountRow,
            'total_amount_row_simple': renderTotalAmountRowSimple,
            'footer_message': renderFooterMessage,
            'qr_code': renderQRCode,
            'cut_paper': renderCutPaper
        };

        const renderer = renderers[element.type];
        return renderer ? renderer(element, data, characterWidth) : '';
    }

    /**
     * Render text element with variables
     */
    function renderText(element, data, _characterWidth) {
        const value = element.value || '';
        const text = replaceVariables(value, data);
        const alignment = element.alignment || 'LEFT';
        const fontSize = element.font_size || 'NORMAL';
        const fontWeight = element.font_weight || 'NORMAL';

        const alignClass = alignment.toLowerCase();
        const sizeClass = fontSize.toLowerCase();
        const weightClass = fontWeight.toLowerCase();

        return `<div class="receipt-text text-${alignClass} font-${sizeClass} font-${weightClass}">${escapeHtml(text)}</div>`;
    }

    /**
     * Render static text element (no variables)
     */
    function renderStaticText(element, _data, _characterWidth) {
        const value = element.value || '';
        const alignment = element.alignment || 'CENTER';
        const fontSize = element.font_size || 'NORMAL';
        const fontWeight = element.font_weight || 'NORMAL';

        const alignClass = alignment.toLowerCase();
        const sizeClass = fontSize.toLowerCase();
        const weightClass = fontWeight.toLowerCase();

        return `<div class="receipt-static-text text-${alignClass} font-${sizeClass} font-${weightClass}">${escapeHtml(value)}</div>`;
    }

    /**
     * Render separator/dividing line
     */
    function renderSeparator(_element, _data, _characterWidth) {
        // Use CSS border instead of text characters for consistent dashed line style
        return '<div class="receipt-separator"></div>';
    }

    /**
     * Render newline
     */
    function renderNewline(_element, _data, _characterWidth) {
        return '<div class="receipt-newline"></div>';
    }

    /**
     * Render placeholder block (for logo/image space above business name)
     */
    function renderPlaceholderBlock(element, _data, _characterWidth) {
        const height = element.height || 90; // Default height in pixels (increased by 50% from 60px)
        let html = '<div class="receipt-placeholder-block">';
        html += `<div class="placeholder-box" style="height: ${height}px;">`;
        html += '<div class="placeholder-text">Logo/Image</div>';
        html += '</div>';
        html += '</div>';
        return html;
    }

    /**
     * Render bill date row (Bill No, Date, Time)
     */
    function renderBillDateRow(_element, data, _characterWidth) {
        const billNumber = data.bill_number || data.billNumber || 'N/A';
        const billDate = formatDate(data.bill_date || data.billDate);
        const billTime = formatTime(data.bill_date || data.billDate);

        let html = '<div class="receipt-bill-date-row">';
        html += `<span>Bill No: ${billNumber}</span>`;
        html += `<div class="receipt-date-time-row">`;
        html += `<span class="bill-date">Date: ${billDate}</span>`;
        html += `<span class="bill-time">Time: ${billTime}</span>`;
        html += `</div>`;
        html += '</div>';

        return html;
    }

    /**
     * Render customer info row (Customer name and Mobile No)
     */
    function renderCustomerInfoRow(_element, data, _characterWidth) {
        const customerName = data.customer_name || data.customerName || 'N/A';
        const customerMobile = data.customer_mobile || data.customerMobile || 'N/A';

        let html = '<div class="customer-info">';
        html += `<div class="receipt-text text-left font-normal font-normal">Customer: ${escapeHtml(customerName)}</div>`;
        html += `<div class="receipt-text text-left font-normal font-normal">Mobile No: ${escapeHtml(customerMobile)}</div>`;
        html += '</div>';

        return html;
    }

    /**
     * Render transaction and payment row
     */
    function renderTransactionPaymentRow(_element, data, _characterWidth) {
        const transactionType = data.transaction_type || data.transactionType || 'Sale';
        const paymentType = data.payment_type || data.paymentType || 'Cash';
        const cashier = data.cashier || 'N/A';

        let html = '<div class="receipt-transaction-payment-row">';
        html += `<div class="receipt-transaction-info">`;
        html += `<div class="receipt-type-payment-row">`;
        html += `<span class="transaction-type">Type: ${transactionType}</span>`;
        html += `<span class="payment-type">Payment: ${paymentType}</span>`;
        html += `</div>`;
        if (cashier !== 'N/A') {
            html += `<span>Cashier: ${cashier}</span>`;
        }
        html += `</div>`;
        html += '</div>';

        return html;
    }

    /**
     * Render transaction calculation (for transaction receipts)
     * Format: Multiplication on single line, addition/subtraction on separate lines
     */
    function renderTransactionCalculation(element, data, _characterWidth) {
        const alignment = element.alignment || 'RIGHT';
        const fontSize = element.font_size || 'NORMAL';

        let html = `<div class="receipt-transaction-calculation text-${alignment.toLowerCase()} font-${fontSize.toLowerCase()}">`;
        html += '<div class="calculation-items">';

        if (data.items && data.items.length > 0) {
            // Show multiplication expressions (rate x qty)
            data.items.forEach((item) => {
                const rate = item.rate || 0;
                const qty = item.qty || 0;
                const formattedRate = formatIndianNumber(rate);
                const formattedQty = formatIndianNumber(qty);
                // Multiplication on single line: 99,99,999 x 500
                html += `<div class="calculation-multiply">${formattedRate} x ${formattedQty}</div>`;
            });

            // Show discount as subtraction if present
            const discount = data.discount || 0;
            if (discount > 0) {
                const discountType = data.discount_type || data.discountType || 'amount';
                if (discountType === 'percentage' || discountType === 'percent') {
                    html += `<div class="calculation-subtract">- ${formatIndianNumber(discount)}%</div>`;
                } else {
                    html += `<div class="calculation-subtract">- ${formatIndianNumber(discount)}</div>`;
                }
            }
        }

        html += '</div>';
        html += '</div>';
        return html;
    }

    /**
     * Render transaction calculation v2 (step-wise calculation)
     * Format: Each step on a separate row with operator on left and operand on right
     * Finalizing operations (=, %, GT, M+, M-) have top and bottom borders
     */
    function renderTransactionCalculationV2(element, data, _characterWidth) {
        const alignment = element.alignment || 'RIGHT';
        const fontSize = element.font_size || 'NORMAL';

        // Get calculation steps from data
        const calculationSteps = data.calculation_steps || [];

        // If no steps provided, generate from items (backward compatibility)
        if (calculationSteps.length === 0 && data.items && data.items.length > 0) {
            // Generate steps from items
            data.items.forEach((item) => {
                const rate = item.rate || 0;
                const qty = item.qty || 0;
                calculationSteps.push({
                    operator: 'x',
                    operand: formatIndianNumber(rate)
                });
                calculationSteps.push({
                    operator: 'x',
                    operand: formatIndianNumber(qty)
                });
            });

            // Add discount if present
            const discount = data.discount || 0;
            if (discount > 0) {
                const discountType = data.discount_type || data.discountType || 'amount';
                if (discountType === 'percentage' || discountType === 'percent') {
                    calculationSteps.push({
                        operator: '-',
                        operand: formatIndianNumber(discount) + '%'
                    });
                } else {
                    calculationSteps.push({
                        operator: '-',
                        operand: formatIndianNumber(discount)
                    });
                }
            }

            // Don't add final result here - it will be shown in total_amount_row_simple
        }

        // Filter out finalizing operations - they should not be displayed in calculation steps
        // Finalizing operations: =, %, GT, M+, M-
        const finalizingOps = ['=', '%', 'GT', 'M+', 'M-'];
        const displaySteps = calculationSteps.filter(step => {
            const operator = step.operator || '';
            const isFinal = step.isFinal === true;
            return !isFinal && !finalizingOps.includes(operator);
        });

        let html = `<div class="receipt-transaction-calculation-v2 text-${alignment.toLowerCase()} font-${fontSize.toLowerCase()}">`;
        html += '<div class="calculation-steps">';

        displaySteps.forEach((step, index) => {
            const operator = step.operator || '';
            const operand = step.operand || '';

            html += `<div class="calculation-step">`;
            html += `<span class="calculation-operator">${escapeHtml(operator)}</span>`;
            html += `<span class="calculation-operand">${escapeHtml(operand)}</span>`;
            html += '</div>';
        });

        html += '</div>';
        html += '</div>';
        return html;
    }

    /**
     * Render item header row
     */
    function renderItemHeaderRow(_element, _data, _characterWidth) {
        let html = '<div class="receipt-item-header-row">';
        html += '<div class="item-table">';
        html += '<div class="item-header-row">';
        html += '<span class="item-sno">#</span>';
        html += '<span class="item-name">Item</span>';
        html += '<span class="item-qty">Qty</span>';
        html += '<span class="item-price">Price</span>';
        html += '<span class="item-amount">Amount</span>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        return html;
    }

    /**
     * Render bill items table
     */
    function renderBillItems(element, data, _characterWidth) {
        const items = data.items || [];

        let html = '<div class="receipt-bill-items">';
        html += '<div class="item-table">';

        items.forEach((item, index) => {
            const slNo = item.slNo !== undefined ? item.slNo : index + 1;
            const name = item.name || 'Item';
            const qty = item.qty || 0;
            const rate = item.rate || 0;
            const amount = item.amount || 0;

            html += '<div class="bill-item-row">';
            html += `<span class="item-sno">${slNo}</span>`;
            html += `<span class="item-name">${escapeHtml(name)}</span>`;
            html += `<span class="item-qty">${qty}</span>`;
            html += `<span class="item-price">${formatNumberLimited(rate, 7)}</span>`;
            html += `<span class="item-amount">${formatNumberLimited(amount, 8)}</span>`;
            html += '</div>';
        });

        html += '</div>';
        html += '</div>';
        return html;
    }

    /**
     * Render total qty and items row
     */
    function renderTotalQtyItemsRow(_element, data, _characterWidth) {
        const items = data.items || [];
        
        // Calculate total quantity
        const totalQty = items.reduce((sum, item) => sum + (item.qty || 0), 0);
        const totalItems = items.length;

        let html = '<div class="receipt-total-qty-items-row">';
        html += `<div class="total-row"><span>Total Qty: ${totalQty}</span><span>Total Items: ${totalItems}</span></div>`;
        html += '</div>';

        return html;
    }

    /**
     * Render total amount row
     */
    function renderTotalAmountRow(_element, data, _characterWidth) {
        const subtotal = data.subtotal || 0;
        const discount = data.discount || 0;
        const discountType = data.discount_type || data.discountType || 'amount'; // 'amount' or 'percentage'
        const tax = data.tax || {};
        const total = data.total || 0;

        let html = '<div class="receipt-total-amount-row">';

        html += `<div class="total-row"><span>Subtotal:</span><span>${formatCurrency(subtotal)}</span></div>`;

        if (discount > 0) {
            // Determine discount label and value based on type
            let discountLabel = 'Discount';
            let discountValue;
            
            if (discountType === 'percentage' || discountType === 'percent') {
                // Show percentage in label with minus operator (e.g., "Discount -50%:")
                discountLabel = `Discount -${discount}%`;
                // Calculate and show discount amount in rupees
                const discountAmount = (subtotal * discount) / 100;
                discountValue = formatCurrency(discountAmount);
            } else {
                // Show currency label and amount
                discountLabel = 'Discount (₹)';
                discountValue = formatCurrency(discount);
            }

            html += `<div class="total-row"><span>${discountLabel}:</span><span>${discountValue}</span></div>`;
        }

        // Tax rows
        if (tax.cgst && tax.cgst.amount > 0) {
            html += `<div class="total-row"><span>CGST @ ${tax.cgst.rate}%:</span><span>${formatCurrency(tax.cgst.amount)}</span></div>`;
        }
        if (tax.sgst && tax.sgst.amount > 0) {
            html += `<div class="total-row"><span>SGST @ ${tax.sgst.rate}%:</span><span>${formatCurrency(tax.sgst.amount)}</span></div>`;
        }
        if (tax.igst && tax.igst.amount > 0) {
            html += `<div class="total-row"><span>IGST @ ${tax.igst.rate}%:</span><span>${formatCurrency(tax.igst.amount)}</span></div>`;
        }

        html += `<div class="total-row total-final"><span>TOTAL:</span><span>${formatCurrency(total)}</span></div>`;
        html += '</div>';

        return html;
    }

    /**
     * Render simple total amount row (only shows total, no subtotal/discount/tax)
     * Used for transaction v2 receipts
     */
    function renderTotalAmountRowSimple(_element, data, _characterWidth) {
        const total = data.total || 0;

        let html = '<div class="receipt-total-amount-row">';
        html += `<div class="total-row total-final"><span>TOTAL:</span><span>${formatCurrency(total)}</span></div>`;
        html += '</div>';

        return html;
    }

    /**
     * Render footer message (Thank you message)
     */
    function renderFooterMessage(_element, data, _characterWidth) {
        let html = '<div class="receipt-footer-message">';
        html += '<div class="receipt-static-text text-center font-small font-normal">Thank you for shopping with us! Visit again</div>';
        html += '</div>';
        return html;
    }

    /**
     * Render QR code
     */
    function renderQRCode(element, data, _characterWidth) {
        const qrData = element.value ? replaceVariables(element.value, data) : data.qr_data || '';
        const size = element.size || 'MEDIUM';

        // Generate QR code using a library or placeholder
        // For now, we'll use a placeholder div
        let html = '<div class="receipt-qr-code">';
        html += `<div class="qr-placeholder qr-${size.toLowerCase()}" data-qr="${escapeHtml(qrData)}">`;
        html += '<div class="qr-text">QR Code</div>';
        html += '</div>';
        html += '<div class="receipt-static-text text-center font-normal font-normal">SCAN TO PAY</div>';
        html += '</div>';

        return html;
    }

    /**
     * Render cut paper indicator
     */
    function renderCutPaper(_element, _data, _characterWidth) {
        // Cut paper indicator removed - return empty string
        return '';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Validate template structure
     */
    function validateTemplate(template) {
        const errors = [];
        const warnings = [];

        if (!template) {
            errors.push('Template is null or undefined');
            return { valid: false, errors, warnings };
        }

        if (!template.receipt_template) {
            errors.push('Missing "receipt_template" property');
        }

        if (!template.receipt_template?.elements) {
            errors.push('Missing "receipt_template.elements" array');
        } else if (!Array.isArray(template.receipt_template.elements)) {
            errors.push('"receipt_template.elements" must be an array');
        }

        if (!template.receipt_template?.characterWidth) {
            warnings.push('Missing "characterWidth" property, defaulting to 32');
        }

        if (!template.receipt_template?.paperWidth) {
            warnings.push('Missing "paperWidth" property, defaulting to 58');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Extract variables from template
     */
    function extractVariables(template) {
        const variables = new Set();

        if (!template || !template.receipt_template || !template.receipt_template.elements) {
            return Array.from(variables);
        }

        template.receipt_template.elements.forEach(element => {
            if (element.value && typeof element.value === 'string') {
                const matches = element.value.matchAll(/\$\{([^}]+)\}/g);
                for (const match of matches) {
                    variables.add(match[1].trim());
                }
            }
        });

        return Array.from(variables);
    }

    // Public API
    return {
        loadSampleData,
        getDefaultSampleData,
        replaceVariables,
        renderPreview,
        renderElement,
        validateTemplate,
        extractVariables,
        formatCurrency,
        formatIndianNumber,
        formatDate,
        formatTime
    };
})();

