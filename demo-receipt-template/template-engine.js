/**
 * Template Engine - Handles JSON template processing and rendering
 */

// eslint-disable-next-line no-unused-vars
const TemplateEngine = (() => {
    let sampleData = null;

    /**
     * Load sample data from JSON file or use default
     */
    async function loadSampleData() {
        try {
            const response = await fetch('sample-data.json');
            sampleData = await response.json();
            console.log('Sample data loaded');
        } catch (error) {
            console.error('Error loading sample data:', error);
            // Use default sample data
            sampleData = getDefaultSampleData();
        }
        return sampleData;
    }

    /**
     * Get default sample data
     */
    function getDefaultSampleData() {
        return {
            company: {
                logo: "",
                name: "Sample Company Name",
                address: "123 Main Street, City, State 12345",
                gstin: "29ABCDE1234F1Z5"
            },
            transaction: {
                billNo: "102394",
                cashier: "007",
                date: "31-05-2025",
                time: "14:35"
            },
            items: [
                {
                    name: "Sample Product 1",
                    qty: 2,
                    rate: 150.00,
                    amount: 300.00,
                    sku: "SKU001"
                },
                {
                    name: "Sample Product 2",
                    qty: 1,
                    rate: 500.00,
                    amount: 500.00,
                    sku: "SKU002"
                }
            ],
            summary: {
                subtotal: 800.00,
                discount: 50.00,
                total: 750.00
            },
            tax: {
                cgst: { rate: 9, amount: 67.50 },
                sgst: { rate: 9, amount: 67.50 },
                igst: { rate: 0, amount: 0.00 }
            },
            payment: {
                qrCode: "upi://pay?pa=merchant@upi&am=750.00&cu=INR",
                qrCodeImage: ""
            }
        };
    }

    /**
     * Replace variables in template with data
     * @param {string} text - Text with {{variables}}
     * @param {object} data - Data object
     * @returns {string} Text with replaced values
     */
    function replaceVariables(text, data) {
        if (!text || typeof text !== 'string') return text;
        
        return text.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
            const value = getNestedValue(data, path.trim());
            return value !== undefined ? value : match;
        });
    }

    /**
     * Get nested value from object using dot notation
     * @param {object} obj - Object to search
     * @param {string} path - Dot notation path (e.g., 'company.name')
     * @returns {*} Value at path
     */
    function getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Render preview HTML from template
     * @param {object} template - Template JSON
     * @param {object} data - Sample data
     * @returns {string} HTML string
     */
    function renderPreview(template, data = null) {
        if (!data) data = sampleData || getDefaultSampleData();
        if (!template || !template.template || !template.template.elements) {
            return '<div class="receipt-empty">No template elements to preview</div>';
        }

        let html = '';

        template.template.elements.forEach(element => {
            html += renderElement(element, data);
        });

        return html || '<div class="receipt-empty">Empty template</div>';
    }

    /**
     * Render single element
     * @param {object} element - Element object
     * @param {object} data - Sample data
     * @returns {string} HTML string
     */
    function renderElement(element, data) {
        const renderers = {
            'header': renderHeader,
            'transaction': renderTransaction,
            'items-table': renderItemsTable,
            'summary': renderSummary,
            'tax': renderTax,
            'payment': renderPayment,
            'footer': renderFooter,
            'divider': renderDivider,
            'spacer': renderSpacer,
            'text': renderText,
            'custom': renderCustomComponent
        };

        const renderer = renderers[element.type];
        return renderer ? renderer(element, data) : '';
    }

    /**
     * Render header element
     */
    function renderHeader(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        const fontClass = styles.font === 'fontB' ? 'font-b' : 'font-a';
        
        let html = `<div class="receipt-header ${fontClass}">`;
        
        if (props.logo) {
            const logoUrl = replaceVariables(props.logo, data);
            if (logoUrl) {
                html += `<img src="${logoUrl}" class="receipt-logo" alt="Logo">`;
            }
        }
        
        if (props.companyName) {
            const companyFontClass = styles.font === 'fontB' ? 'font-b' : 'font-b'; // Company name defaults to Font B
            html += `<div class="receipt-company-name ${companyFontClass}">${replaceVariables(props.companyName, data)}</div>`;
        }
        
        if (props.address) {
            html += `<div class="receipt-address font-a">${replaceVariables(props.address, data)}</div>`;
        }
        
        if (props.gstin) {
            html += `<div class="receipt-gstin font-a">GSTIN: ${replaceVariables(props.gstin, data)}</div>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Render transaction element
     */
    function renderTransaction(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        const fontClass = styles.font === 'fontB' ? 'font-b' : 'font-a';
        
        let html = `<div class="receipt-transaction ${fontClass}">`;
        html += '<div class="receipt-transaction-left">';
        
        if (props.billNo) {
            html += `<div class="font-a">Bill No: ${replaceVariables(props.billNo, data)}</div>`;
        }
        if (props.cashier) {
            html += `<div class="font-a">Cashier: ${replaceVariables(props.cashier, data)}</div>`;
        }
        
        html += '</div>';
        html += '<div class="receipt-transaction-right">';
        
        if (props.date) {
            html += `<div class="font-a">${replaceVariables(props.date, data)}</div>`;
        }
        if (props.time) {
            html += `<div class="font-a">${replaceVariables(props.time, data)}</div>`;
        }
        
        html += '</div>';
        html += '</div>';
        return html;
    }

    /**
     * Render items table element
     */
    function renderItemsTable(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        const fontClass = styles.font === 'fontB' ? 'font-b' : 'font-a';
        const columns = props.columns || [
            { field: 'name', label: 'Item Name', width: '40%', alignment: 'left' },
            { field: 'qty', label: 'Qty', width: '15%', alignment: 'right' },
            { field: 'rate', label: 'Rate', width: '20%', alignment: 'right' },
            { field: 'amount', label: 'Amount', width: '25%', alignment: 'right' }
        ];
        
        const items = data.items || [];
        
        let html = `<table class="receipt-items-table ${fontClass}">`;
        
        // Header row - Font B for headers
        html += '<thead><tr>';
        columns.forEach(col => {
            const alignClass = col.alignment === 'right' ? ' class="text-right font-b"' : ' class="font-b"';
            html += `<th${alignClass}>${col.label}</th>`;
        });
        html += '</tr></thead>';
        
        // Data rows - Font A for data
        html += '<tbody>';
        items.forEach(item => {
            html += '<tr>';
            columns.forEach(col => {
                const alignClass = col.alignment === 'right' ? ' class="text-right font-a"' : ' class="font-a"';
                let value = item[col.field];
                
                // Format numbers
                if (typeof value === 'number' && col.field !== 'qty') {
                    value = formatCurrency(value);
                }
                
                html += `<td${alignClass}>${value}</td>`;
            });
            html += '</tr>';
            
            // SKU row if enabled - Font A
            if (props.showSku && item.sku) {
                html += `<tr><td colspan="${columns.length}" class="receipt-item-sku font-a">SKU: ${item.sku}</td></tr>`;
            }
        });
        html += '</tbody>';
        html += '</table>';
        
        return html;
    }

    /**
     * Render summary element
     */
    function renderSummary(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        const fontClass = styles.font === 'fontB' ? 'font-b' : 'font-a';
        
        let html = `<div class="receipt-summary ${fontClass}">`;
        
        if (props.subtotal) {
            const subtotal = replaceVariables(props.subtotal, data);
            html += `<div class="receipt-summary-row font-a">
                <span class="font-a">Subtotal</span>
                <span class="font-a">${formatCurrency(parseFloat(subtotal))}</span>
            </div>`;
        }
        
        if (props.discount) {
            const discount = replaceVariables(props.discount, data);
            html += `<div class="receipt-summary-row font-a">
                <span class="font-a">Discount</span>
                <span class="font-a">${formatCurrency(parseFloat(discount))}</span>
            </div>`;
        }
        
        if (props.total) {
            const total = replaceVariables(props.total, data);
            html += `<div class="receipt-summary-row total font-b">
                <span class="font-b">Total</span>
                <span class="font-b">${formatCurrency(parseFloat(total))}</span>
            </div>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Render tax element
     */
    function renderTax(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        const fontClass = styles.font === 'fontB' ? 'font-b' : 'font-a';
        const taxTypes = props.taxTypes || ['cgst', 'sgst', 'igst'];
        
        let html = `<div class="receipt-tax ${fontClass}">`;
        
        taxTypes.forEach(taxType => {
            const taxData = data.tax?.[taxType];
            if (taxData && taxData.amount > 0) {
                html += `<div class="receipt-tax-row font-a">
                    <span class="font-a">${taxType.toUpperCase()} @ ${taxData.rate}%</span>
                    <span class="font-a">${formatCurrency(taxData.amount)}</span>
                </div>`;
            }
        });
        
        html += '</div>';
        return html;
    }

    /**
     * Render payment element
     */
    function renderPayment(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        const fontClass = styles.font === 'fontB' ? 'font-b' : 'font-a';
        
        let html = `<div class="receipt-payment ${fontClass}">`;
        
        if (props.qrCode) {
            replaceVariables(props.qrCode, data);
            if (data.payment?.qrCodeImage) {
                html += `<img src="${data.payment.qrCodeImage}" class="receipt-qr-code" alt="QR Code">`;
            } else {
                // Placeholder for QR code
                html += '<div class="receipt-qr-code" style="width: 120px; height: 120px; margin: 0 auto; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999;">QR Code</div>';
            }
        }
        
        if (props.text) {
            html += `<div class="receipt-payment-text font-b">${replaceVariables(props.text, data)}</div>`;
        }
        
        if (props.subtext) {
            html += `<div class="font-a">${replaceVariables(props.subtext, data)}</div>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Render footer element
     */
    function renderFooter(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        const fontClass = styles.font === 'fontB' ? 'font-b' : 'font-a';
        
        let html = `<div class="receipt-footer ${fontClass}">`;
        
        if (props.message) {
            html += `<div class="receipt-footer-message font-a">${replaceVariables(props.message, data)}</div>`;
        }
        
        if (props.poweredBy) {
            html += `<div class="receipt-powered-by font-a">Powered by<br>${replaceVariables(props.poweredBy, data)}</div>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * Render divider element
     */
    function renderDivider(_element, _data) {
        return '<div class="receipt-divider"></div>';
    }

    /**
     * Render spacer element
     */
    function renderSpacer(element, _data) {
        const props = element.properties || {};
        const height = props.height || 12;
        return `<div class="receipt-spacer" style="height: ${height}px;"></div>`;
    }

    /**
     * Render text element
     */
    function renderText(element, data) {
        const props = element.properties || {};
        const styles = element.styles || {};
        
        // Determine font class - Font B for bold/important text, Font A for normal
        const fontClass = styles.font === 'fontB' || styles.bold ? 'font-b' : 'font-a';
        
        let className = `receipt-text ${fontClass}`;
        if (styles.alignment) className += ` text-${styles.alignment}`;
        if (styles.bold) className += ' text-bold';
        if (styles.uppercase) className += ' text-uppercase';
        
        const text = replaceVariables(props.text || '', data);
        
        return `<div class="${className}">${text}</div>`;
    }

    /**
     * Render custom component
     */
    function renderCustomComponent(element, data) {
        const props = element.properties || {};
        const type = props.componentType || 'text';
        
        if (type === 'text') {
            return renderText(element, data);
        } else if (type === 'image') {
            const url = replaceVariables(props.url || '', data);
            return `<img src="${url}" class="receipt-custom-image" alt="${element.name || 'Image'}">`;
        } else if (type === 'table') {
            // Similar to items table but more generic
            return renderItemsTable(element, data);
        }
        
        return `<div class="receipt-custom-component">${element.name || 'Custom Component'}</div>`;
    }

    /**
     * Format currency value
     */
    function formatCurrency(value) {
        if (typeof value !== 'number') value = parseFloat(value) || 0;
        return '₹' + value.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    /**
     * Generate variable documentation from template
     * @param {object} template - Template JSON
     * @returns {object} Variables documentation
     */
    function generateVariableDocs(template) {
        const variables = {};
        
        if (!template || !template.template || !template.template.elements) {
            return variables;
        }

        template.template.elements.forEach(element => {
            extractVariables(element, variables);
        });

        return variables;
    }

    /**
     * Extract variables from element
     */
    function extractVariables(element, variables) {
        const props = element.properties || {};
        
        Object.values(props).forEach(value => {
            if (typeof value === 'string') {
                const matches = value.matchAll(/\{\{([^}]+)\}\}/g);
                for (const match of matches) {
                    const varPath = match[1].trim();
                    if (!variables[varPath]) {
                        variables[varPath] = {
                            type: inferType(varPath),
                            description: generateDescription(varPath),
                            required: true
                        };
                    }
                }
            }
        });
    }

    /**
     * Infer variable type from path
     */
    function inferType(path) {
        if (path.includes('items')) return 'array';
        if (path.includes('date') || path.includes('time')) return 'string (date/time)';
        if (path.includes('amount') || path.includes('rate') || path.includes('total') || path.includes('subtotal') || path.includes('discount')) return 'number (currency)';
        if (path.includes('qty') || path.includes('count')) return 'number';
        return 'string';
    }

    /**
     * Generate description from variable path
     */
    function generateDescription(path) {
        const parts = path.split('.');
        const readable = parts[parts.length - 1].replace(/([A-Z])/g, ' $1').trim();
        return readable.charAt(0).toUpperCase() + readable.slice(1);
    }

    /**
     * Validate template structure
     * @param {object} template - Template JSON
     * @returns {object} Validation result
     */
    function validateTemplate(template) {
        const errors = [];
        const warnings = [];

        if (!template) {
            errors.push('Template is null or undefined');
            return { valid: false, errors, warnings };
        }

        if (!template.template) {
            errors.push('Missing "template" property');
        }

        if (!template.template?.elements) {
            errors.push('Missing "template.elements" array');
        } else if (!Array.isArray(template.template.elements)) {
            errors.push('"template.elements" must be an array');
        }

        if (!template.format) {
            warnings.push('Missing "format" property, defaulting to 3inch');
        }

        if (!template.metadata) {
            warnings.push('Missing "metadata" property');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Process items array
     */
    function processItemsArray(items, _template) {
        if (!Array.isArray(items)) return [];
        return items.map(item => ({...item}));
    }

    // Public API
    return {
        loadSampleData,
        getDefaultSampleData,
        replaceVariables,
        renderPreview,
        renderElement,
        generateVariableDocs,
        validateTemplate,
        processItemsArray,
        formatCurrency
    };
})();

