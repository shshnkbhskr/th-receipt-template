# Receipt Template to ESC/POS Implementation Guide

This guide provides specifications for converting receipt templates into ESC/POS commands for thermal printer printing.

## Table of Contents

1. [Overview](#overview)
2. [Template Structure](#template-structure)
3. [ESC/POS Command Mapping](#escpos-command-mapping)
4. [Element Type Translations](#element-type-translations)
5. [Character Width Handling](#character-width-handling)
6. [Font Mapping](#font-mapping)
7. [Alignment Mapping](#alignment-mapping)
8. [Implementation Examples](#implementation-examples)
9. [Testing Guidelines](#testing-guidelines)

## Overview

Receipt templates are JSON files that define the structure and content of thermal printer receipts. To print these receipts, you need to convert the template elements into ESC/POS commands that thermal printers understand.

### Key Concepts

- **Character Width**: Maximum characters per line (32 for 2-inch, 48 for 3-inch)
- **Paper Width**: Physical paper width in mm (48mm for 2-inch, 80mm for 3-inch)
- **ESC/POS**: Standard command set for thermal printers
- **Font A/B**: Printer font modes (Font A = normal, Font B = double width/height)

## Template Structure

### Basic Template Format

```json
{
  "receipt_template": {
    "characterWidth": 32,  // or 48 for 3-inch
    "paperWidth": 58,      // or 80 for 3-inch
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

### Paper Size Specifications

| Format | Character Width | Paper Width (mm) | Typical Use |
|--------|----------------|------------------|-------------|
| 2-inch | 32 characters | 48mm | Compact receipts |
| 3-inch | 48 characters | 80mm | Standard receipts |

## ESC/POS Command Mapping

### Common ESC/POS Commands

| Command | Hex | Decimal | Description |
|---------|-----|---------|-------------|
| ESC @ | 1B 40 | 27 64 | Initialize printer |
| ESC a n | 1B 61 n | 27 97 n | Select justification (0=left, 1=center, 2=right) |
| ESC ! n | 1B 21 n | 27 33 n | Select character font |
| ESC d n | 1B 64 n | 27 100 n | Print and feed n lines |
| GS v 0 | 1D 76 00 | 29 118 0 | Cut paper |
| GS ( k | 1D 28 k | 29 40 k | QR code commands |

### Font Selection (ESC ! n)

| Font | Bit Pattern | Value | Description |
|------|-------------|-------|-------------|
| Font A | 00000000 | 0x00 | Normal (12×24 dots) |
| Font B | 00000001 | 0x01 | Double width |
| Bold | 00001000 | 0x08 | Bold |
| Double Height | 00010000 | 0x10 | Double height |
| Font B + Bold | 00001001 | 0x09 | Double width + bold |
| Font B + Bold + Height | 00011001 | 0x19 | Double width/height + bold |

**Note**: Font B typically means double width AND height (0x11 = 0x01 + 0x10)

## Element Type Translations

### 1. Text Element (`type: "text"`)

**Template:**
```json
{
  "type": "text",
  "alignment": "CENTER",
  "font_size": "NORMAL",
  "font_weight": "BOLD",
  "value": "${shop_name}"
}
```

**ESC/POS Commands:**
```
ESC @                    // Initialize
ESC a 1                  // Center alignment
ESC ! 0x08               // Bold font
[Replaced text]          // Text with variables replaced
ESC ! 0x00               // Reset font
ESC a 0                  // Reset alignment
```

**Implementation Steps:**
1. Replace `${variable}` placeholders with actual data
2. Set alignment (ESC a n)
3. Set font style (ESC ! n)
4. Print text
5. Reset font and alignment

### 2. Static Text Element (`type: "static_text"`)

**Template:**
```json
{
  "type": "static_text",
  "alignment": "CENTER",
  "font_size": "SMALL",
  "value": "Thank you for shopping!"
}
```

**ESC/POS Commands:**
```
ESC a 1                  // Center alignment
ESC ! 0x00               // Normal font (SMALL = NORMAL in ESC/POS)
[Static text]            // Print text directly
ESC a 0                  // Reset alignment
```

**Note**: ESC/POS doesn't have a "SMALL" font mode. Use normal Font A for small text.

### 3. Separator Element (`type: "separator"`)

**Template:**
```json
{
  "type": "separator",
  "length": 32,
  "style": "DASHED"
}
```

**ESC/POS Commands:**
```
ESC a 1                  // Center alignment (for centered separator)
[Repeat character]       // Repeat '-' or '=' for specified length
ESC a 0                  // Reset alignment
ESC d 1                  // Feed one line
```

**Implementation:**
- DASHED: Use `-` character
- SOLID: Use `=` character
- Repeat character `length` times
- Center-align if separator should be centered

### 4. Newline Element (`type: "newline"`)

**Template:**
```json
{
  "type": "newline"
}
```

**ESC/POS Commands:**
```
ESC d 1                  // Print and feed 1 line
```

### 5. Bill Date Row (`type: "bill_date_row"`)

**Template:**
```json
{
  "type": "bill_date_row"
}
```

**ESC/POS Commands:**
```
ESC a 0                  // Left alignment
ESC ! 0x00               // Normal font
Bill No: [bill_number]
ESC d 1                  // Line feed
Date: [formatted_date]
ESC d 1                  // Line feed
Time: [formatted_time]
ESC d 1                  // Line feed
```

**Data Required:**
- `bill_number`: String
- `bill_date`: ISO date-time string (format as needed)

### 6. Transaction Payment Row (`type: "transaction_payment_row"`)

**Template:**
```json
{
  "type": "transaction_payment_row"
}
```

**ESC/POS Commands:**
```
ESC a 0                  // Left alignment
ESC ! 0x00               // Normal font
Type: [transaction_type]
ESC d 1                  // Line feed
Payment: [payment_type]
ESC d 1                  // Line feed
Cashier: [cashier]       // If available
ESC d 1                  // Line feed
```

### 7. Transaction Calculation (`type: "transaction_calculation"`)

**Template:**
```json
{
  "type": "transaction_calculation",
  "alignment": "RIGHT"
}
```

**ESC/POS Commands:**
```
ESC a 2                  // Right alignment
ESC ! 0x00               // Normal font
[For each item:]
[item_name] x [qty] = [amount]
ESC d 1                  // Line feed
ESC a 0                  // Reset alignment
```

### 8. Item Header Row (`type: "item_header_row"`)

**Template:**
```json
{
  "type": "item_header_row"
}
```

**ESC/POS Commands:**
```
ESC a 0                  // Left alignment
ESC ! 0x08               // Bold font
Sl No.  Item            Qty    Price    Amount
ESC ! 0x00               // Reset font
ESC d 1                  // Line feed
```

**Column Layout (for 32-character width):**
- Sl No: 5 chars
- Item: 12 chars
- Qty: 4 chars
- Price: 5 chars
- Amount: 6 chars

**Column Layout (for 48-character width):**
- Sl No: 6 chars
- Item: 20 chars
- Qty: 6 chars
- Price: 8 chars
- Amount: 8 chars

### 9. Bill Items (`type: "bill_items"`)

**Template:**
```json
{
  "type": "bill_items",
  "source": "items"
}
```

**ESC/POS Commands:**
```
ESC a 0                  // Left alignment
ESC ! 0x00               // Normal font
[For each item:]
[slNo]  [name]          [qty]   [rate]   [amount]
ESC d 1                  // Line feed
```

**Implementation Notes:**
- Format numbers with proper spacing
- Handle long item names (truncate or wrap)
- Align columns using spaces or tabs

### 10. Total Amount Row (`type: "total_amount_row"`)

**Template:**
```json
{
  "type": "total_amount_row"
}
```

**ESC/POS Commands:**
```
ESC a 2                  // Right alignment
ESC ! 0x00               // Normal font
Subtotal:        [subtotal]
ESC d 1                  // Line feed
[If discount > 0:]
Discount:        [discount]
ESC d 1                  // Line feed
[If CGST > 0:]
CGST @ [rate]%:  [cgst_amount]
ESC d 1                  // Line feed
[If SGST > 0:]
SGST @ [rate]%:  [sgst_amount]
ESC d 1                  // Line feed
[If IGST > 0:]
IGST @ [rate]%:  [igst_amount]
ESC d 1                  // Line feed
ESC ! 0x19               // Font B + Bold + Double height
Total:           [total]
ESC ! 0x00               // Reset font
ESC a 0                  // Reset alignment
ESC d 1                  // Line feed
```

### 11. QR Code (`type: "qr_code"`)

**Template:**
```json
{
  "type": "qr_code",
  "alignment": "CENTER",
  "size": "MEDIUM",
  "error_correction": "M",
  "value": "${qr_data}"
}
```

**ESC/POS Commands (GS ( k):**
```
ESC a 1                  // Center alignment
GS ( k 03 00 31 41 32 00  // QR code model 2, size 6
GS ( k 03 00 31 43 03     // Error correction level M
GS ( k [len] [data]       // Store QR data
GS ( k 03 00 31 51 30     // Print QR code
ESC a 0                  // Reset alignment
ESC d 1                  // Line feed
```

**QR Code Parameters:**
- Size: 1-8 (1=smallest, 8=largest)
- Error Correction: L (7%), M (15%), Q (25%), H (30%)
- Model: 2 (standard)

**Simplified QR Command (varies by printer):**
Some printers support simpler commands:
```
GS v 0                   // QR code (printer-specific)
[QR data]
```

### 12. Cut Paper (`type: "cut_paper"`)

**Template:**
```json
{
  "type": "cut_paper"
}
```

**ESC/POS Commands:**
```
ESC d 3                  // Feed 3 lines before cut
GS V 0                   // Full cut
// or
GS V 1                   // Partial cut
```

## Character Width Handling

### Text Wrapping

When text exceeds `characterWidth`, you need to wrap it:

**Algorithm:**
1. Check if text length > characterWidth
2. If yes, split at word boundaries
3. Print first line
4. Repeat for remaining text

**Example (32-character width):**
```
Input: "This is a very long shop name that exceeds 32 characters"
Output:
Line 1: "This is a very long shop name"
Line 2: "that exceeds 32 characters"
```

### Column Layout

For tables (items, totals), calculate column widths:

**2-inch (32 chars):**
```
Sl No | Item Name      | Qty | Price | Amount
  5   |     12         |  4  |   5   |   6
```

**3-inch (48 chars):**
```
Sl No | Item Name              | Qty  | Price  | Amount
  6   |        20              |  6   |   8    |   8
```

## Font Mapping

### Template Font Properties → ESC/POS

| Template Property | ESC/POS Command | Value |
|-------------------|-----------------|-------|
| `font_size: "NORMAL"` + `font_weight: "NORMAL"` | ESC ! 0x00 | Font A, normal |
| `font_size: "NORMAL"` + `font_weight: "BOLD"` | ESC ! 0x08 | Font A, bold |
| `font_size: "LARGE"` or BOLD | ESC ! 0x19 | Font B, bold, double size |
| `font_size: "SMALL"` | ESC ! 0x00 | Font A, normal (no small font) |

**Recommended Mapping:**
- **Font A (Normal)**: `font_size: "NORMAL"` + `font_weight: "NORMAL"`
- **Font B (Bold/Large)**: `font_weight: "BOLD"` OR `font_size: "LARGE"`

## Alignment Mapping

| Template Alignment | ESC/POS Command | Value |
|-------------------|-----------------|-------|
| `LEFT` | ESC a 0 | 0 |
| `CENTER` | ESC a 1 | 1 |
| `RIGHT` | ESC a 2 | 2 |

**Important:** Always reset alignment after use to avoid affecting subsequent elements.

## Implementation Examples

### Complete Example: Shop Header

**Template:**
```json
{
  "type": "text",
  "alignment": "CENTER",
  "font_size": "NORMAL",
  "font_weight": "BOLD",
  "value": "${shop_name}"
}
```

**Data:**
```json
{
  "shop_name": "Tohands Store"
}
```

**ESC/POS Output (hex):**
```
1B 40              // ESC @ - Initialize
1B 61 01           // ESC a 1 - Center alignment
1B 21 08           // ESC ! 0x08 - Bold font
54 6F 68 61 6E 64 73 20 53 74 6F 72 65  // "Tohands Store"
1B 21 00           // ESC ! 0x00 - Reset font
1B 61 00           // ESC a 0 - Reset alignment
0A                 // Line feed
```

**ESC/POS Output (readable):**
```
ESC @
ESC a 1
ESC ! 0x08
Tohands Store
ESC ! 0x00
ESC a 0
LF
```

### Complete Example: Separator

**Template:**
```json
{
  "type": "separator",
  "length": 32,
  "style": "DASHED"
}
```

**ESC/POS Output:**
```
ESC a 1             // Center alignment
--------------------------------    // 32 dashes
ESC a 0             // Reset alignment
ESC d 1             // Line feed
```

### Complete Example: Items Table

**Template:**
```json
{
  "type": "bill_items",
  "source": "items"
}
```

**Data:**
```json
{
  "items": [
    {"slNo": 1, "name": "Product A", "qty": 2, "rate": 100.00, "amount": 200.00},
    {"slNo": 2, "name": "Product B", "qty": 3, "rate": 150.00, "amount": 450.00}
  ]
}
```

**ESC/POS Output (32-char width):**
```
ESC a 0
ESC ! 0x00
1   Product A    2   100.00  200.00
ESC d 1
2   Product B    3   150.00  450.00
ESC d 1
```

## Testing Guidelines

### 1. Test with Sample Data

Use `variables-example.json` to test your implementation:
- Load template
- Load sample data
- Generate ESC/POS commands
- Print to thermal printer

### 2. Verify Character Width

- Test with maximum length text (32/48 characters)
- Verify text wrapping works correctly
- Check column alignment in tables

### 3. Test All Element Types

- Text elements (with variables)
- Static text
- Separators
- Newlines
- Date/time formatting
- Items tables
- Totals calculations
- QR codes
- Paper cut

### 4. Test Different Paper Sizes

- 2-inch (32 chars)
- 3-inch (48 chars)

### 5. Printer-Specific Testing

Different printer models may have variations:
- Test QR code commands (some use different syntax)
- Verify cut commands (full vs partial)
- Check font rendering (Font A vs Font B)

## Common Implementation Patterns

### Pattern 1: Element Processing Loop

```javascript
function generateESCPOS(template, data) {
  let commands = [];
  
  // Initialize printer
  commands.push(ESC_INIT);
  
  // Process each element
  template.receipt_template.elements.forEach(element => {
    const elementCommands = processElement(element, data, template.receipt_template.characterWidth);
    commands.push(...elementCommands);
  });
  
  // Cut paper
  commands.push(ESC_FEED_LINES(3));
  commands.push(GS_CUT_PAPER);
  
  return commands;
}
```

### Pattern 2: Variable Replacement

```javascript
function replaceVariables(text, data) {
  return text.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    return data[varName.trim()] || match;
  });
}
```

### Pattern 3: Text Wrapping

```javascript
function wrapText(text, maxWidth) {
  if (text.length <= maxWidth) return [text];
  
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  
  words.forEach(word => {
    if ((currentLine + ' ' + word).length <= maxWidth) {
      currentLine += (currentLine ? ' ' : '') + word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  });
  
  if (currentLine) lines.push(currentLine);
  return lines;
}
```

## Printer Compatibility

### Supported Printers

This specification targets ESC/POS compatible printers:
- Epson TM series
- Star Micronics printers
- Bixolon printers
- Citizen printers
- Most thermal receipt printers

### Printer-Specific Notes

1. **QR Code Commands**: May vary between manufacturers
2. **Cut Commands**: Some printers use different cut sequences
3. **Font Rendering**: Font A/B may render differently
4. **Character Encoding**: Use UTF-8 or printer-specific encoding

## Additional Resources

- ESC/POS Command Reference: [Epson ESC/POS Manual](https://reference.epson-biz.com/)
- Thermal Printer Specifications: Check your printer's manual
- Testing Tools: Use printer emulators or test print utilities

## Support

For questions or clarifications about template structure or ESC/POS translation, refer to:
- Template examples in `templates/` directory
- Sample data in `data/variables-example.json`
- Reference implementation in `escpos-generator.js`

