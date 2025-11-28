# Print Receipt Template Engine

A template engine for rendering receipt templates using the `${variable}` syntax format, compatible with thermal printer receipt templates.

## ⚠️ Important: Preview Prototype

**This is a preview/demonstration tool, not an interactive application.**

The preview page (`preview.html`) is designed to show how receipts will look when printed under various conditions. It does **not** respond to user data input—instead, it uses sample data and control panel settings to demonstrate different receipt layouts and configurations.

**Purpose:**
- Visualize receipt layouts before implementing on thermal printers
- Test different template configurations (2-inch vs 3-inch, tax types, etc.)
- Demonstrate conditional visibility (Customer Info, GSTIN, Logo, etc.)
- Serve as a reference for mobile app developers implementing the actual print functionality

**The control panel toggles simulate conditions that would be determined by the mobile app:**
- **Customer Info**: ON when customer is identified via phone/ID in the mobile app
- **GSTIN**: ON when the business has registered GST
- **Cashier**: ON when cashier is assigned to the transaction
- **Logo**: ON when business has uploaded a logo
- etc.

## Directory Structure

```
current-receipt-template/
├── preview.html              # HTML preview page for testing templates
├── README.md                 # This file
├── css/
│   └── print-preview.css     # Stylesheet for receipt preview rendering
├── js/
│   └── print-template-engine.js  # Main template engine
├── templates/
│   ├── print_bill_2inch_template.json
│   ├── print_bill_3inch_template.json
│   ├── print_transaction_2inch_template.json
│   ├── print_transaction_3inch_template.json
│   └── receipt-templates.json  # Combined templates file
└── data/
    ├── variables-example.json   # Sample data file
    └── variables-schema.json   # JSON Schema definition
```

## Files

- **`preview.html`** - HTML preview page for testing templates
- **`css/print-preview.css`** - Stylesheet for receipt preview rendering
- **`js/print-template-engine.js`** - Main template engine that processes templates and renders HTML previews
- **`templates/`** - Directory containing all receipt template JSON files
- **`data/variables-schema.json`** - JSON Schema definition for all template variables
- **`data/variables-example.json`** - Sample data file showing how to populate variables

## Usage

### Basic Usage

```javascript
// Load the engine
<script src="js/print-template-engine.js"></script>

// Load template and data
const template = await fetch('templates/print_bill_3inch_template.json').then(r => r.json());
const data = await fetch('data/variables-example.json').then(r => r.json());

// Render preview
const html = PrintTemplateEngine.renderPreview(template, data);
document.getElementById('preview').innerHTML = html;
```

### Preview in Browser

1. Open `preview.html` in a web browser
2. Select a template from the dropdown
3. Click "Refresh Preview" to render

## Template Format

Templates use the following structure:

```json
{
  "receipt_template": {
    "characterWidth": 32,
    "paperWidth": 58,
    "elements": [
      {
        "type": "text",
        "alignment": "CENTER",
        "font_size": "NORMAL",
        "font_weight": "BOLD",
        "value": "${shop_name}"
      }
    ]
  }
}
```

## Supported Element Types

- **`text`** - Dynamic text with variable substitution
- **`static_text`** - Static text (no variables)
- **`separator`** - Dividing line (dashed or solid)
- **`newline`** - Line break
- **`bill_date_row`** - Bill number, date, and time
- **`transaction_payment_row`** - Transaction type and payment method
- **`transaction_calculation`** - Calculation details (for transaction receipts)
- **`item_header_row`** - Items table header
- **`bill_items`** - Items list/table
- **`total_amount_row`** - Subtotal, discount, tax, and total
- **`qr_code`** - QR code placeholder
- **`cut_paper`** - Paper cut indicator

## Variable Syntax

Variables use `${variable_name}` syntax:

- `${shop_name}` - Shop name
- `${shop_address}` - Shop address
- `${gstin}` - GSTIN number
- `${phone_number}` - Phone number
- `${customer_name}` - Customer name
- `${customer_mobile}` - Customer mobile
- `${qr_data}` - QR code data
- `${bill_date}` - Bill date (ISO format)
- `${bill_number}` - Bill number
- `${transaction_type}` - Transaction type
- `${payment_type}` - Payment method
- `${cashier}` - Cashier name/ID

## Data Structure

The data object should have a flat structure matching the variable names:

```json
{
  "shop_name": "Tohands Store",
  "shop_address": "123 Main Street",
  "gstin": "29ABCDE1234F1Z5",
  "phone_number": "+91-9876543210",
  "customer_name": "John Doe",
  "customer_mobile": "+91-9876543210",
  "qr_data": "upi://pay?...",
  "bill_date": "2025-01-15T14:30:00Z",
  "bill_number": "BILL-2025-001",
  "transaction_type": "Sale",
  "payment_type": "UPI",
  "cashier": "Cashier-001",
  "items": [...],
  "subtotal": 1000.00,
  "discount": 50.00,
  "tax": {...},
  "total": 1040.00
}
```

## API Reference

### `PrintTemplateEngine.renderPreview(template, data)`
Renders HTML preview from template and data.

**Parameters:**
- `template` (object) - Template JSON object
- `data` (object) - Data object with variable values

**Returns:** HTML string

### `PrintTemplateEngine.replaceVariables(text, data)`
Replaces `${variable}` placeholders in text with data values.

**Parameters:**
- `text` (string) - Text with variables
- `data` (object) - Data object

**Returns:** String with replaced values

### `PrintTemplateEngine.validateTemplate(template)`
Validates template structure.

**Parameters:**
- `template` (object) - Template JSON object

**Returns:** Object with `valid`, `errors`, and `warnings` properties

### `PrintTemplateEngine.extractVariables(template)`
Extracts all variable names from template.

**Parameters:**
- `template` (object) - Template JSON object

**Returns:** Array of variable names

### `PrintTemplateEngine.formatCurrency(value)`
Formats number as currency (₹).

**Parameters:**
- `value` (number) - Numeric value

**Returns:** Formatted currency string

### `PrintTemplateEngine.getDefaultSampleData()`
Returns default sample data for testing.

**Returns:** Sample data object

## Differences from Demo Template Engine

This engine differs from `demo-receipt-template/template-engine.js`:

1. **Variable Syntax:** Uses `${variable}` instead of `{{variable}}`
2. **Data Structure:** Flat structure instead of nested
3. **Element Types:** Different element types optimized for print format
4. **Template Structure:** Uses `receipt_template` wrapper instead of `template`

## Font Support

The preview uses a monospace font stack to accurately represent thermal printer output:

- **Primary**: `Courier New` (Windows)
- **Fallbacks**: `Courier`, `Consolas`, `Monaco`, `Lucida Console`, `monospace`
- **Purpose**: Monospace fonts provide consistent character width matching thermal printer output

### Font Rendering

The CSS includes properties to make the preview look more like thermal printer output:
- Disabled font smoothing for crisp appearance
- Optimized rendering for consistent character spacing
- Monospace font ensures proper alignment and column layout

## Browser Compatibility

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires ES6+ support
- Uses Fetch API for loading files

## Printer Implementation

For engineers implementing thermal printer support, see the **`../printer-implementation/`** directory:

- **`IMPLEMENTATION_GUIDE.md`** - Complete specification mapping template properties to ESC/POS commands
- **`escpos-generator.js`** - Reference implementation showing how to convert templates to printer commands
- **`README.md`** - Quick start guide for printer implementation

The implementation guide provides:
- ESC/POS command mappings for all element types
- Character width handling specifications
- Font and alignment translations
- Complete implementation examples
- Testing guidelines

## License

Internal use for Tohands receipt template system.

