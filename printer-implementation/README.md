# Printer Implementation Guide

This directory contains documentation and reference code for implementing thermal printer support for receipt templates.

## Files

- **`IMPLEMENTATION_GUIDE.md`** - Comprehensive specification document mapping template properties to ESC/POS commands
- **`escpos-generator.js`** - Reference implementation showing how to convert templates to ESC/POS commands

## Purpose

These files help engineers understand:
1. **What the receipt should look like** (via the preview system)
2. **How to implement printer support** (via the implementation guide)
3. **Reference code** (via the ESC/POS generator)

## Quick Start

### For Engineers Implementing Printer Support

1. **Review the Preview**: Open `../current-receipt-template/preview.html` to see how receipts should look
2. **Read the Guide**: Read `IMPLEMENTATION_GUIDE.md` for detailed specifications
3. **Study the Reference**: Review `escpos-generator.js` for implementation patterns
4. **Test Your Implementation**: Use sample data from `../current-receipt-template/data/variables-example.json`

### Using the Reference Implementation

The `escpos-generator.js` file provides a complete reference implementation:

```javascript
const generator = new ESCPOSGenerator();

// Load template and data
const template = await loadTemplate('print_transaction_3inch_template.json');
const data = await loadData('variables-example.json');

// Generate ESC/POS commands
const commands = generator.generate(template, data);

// Send to printer
printer.write(commands);
```

## Template Structure

Templates are JSON files with this structure:

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

## Key Concepts

- **Character Width**: Maximum characters per line (32 for 2-inch, 48 for 3-inch)
- **ESC/POS Commands**: Standard command set for thermal printers
- **Font Mapping**: Template font properties → ESC/POS font commands
- **Variable Replacement**: `${variable}` syntax replaced with actual data

## Element Types

The templates support these element types:

- `text` - Dynamic text with variables
- `static_text` - Static text without variables
- `separator` - Dividing lines
- `newline` - Line breaks
- `bill_date_row` - Bill number, date, time
- `transaction_payment_row` - Transaction and payment info
- `transaction_calculation` - Calculation details
- `item_header_row` - Items table header
- `bill_items` - Items list
- `total_amount_row` - Totals and taxes
- `qr_code` - QR code
- `cut_paper` - Paper cut command

See `IMPLEMENTATION_GUIDE.md` for detailed translation specifications for each type.

## Testing

1. Use the preview system to verify visual appearance
2. Use sample data from `variables-example.json`
3. Test with actual thermal printers
4. Verify character width handling (32/48 chars)
5. Test all element types

## Printer Compatibility

This implementation targets ESC/POS compatible printers:
- Epson TM series
- Star Micronics printers
- Bixolon printers
- Most thermal receipt printers

## Support

For questions about:
- **Template structure**: See `../current-receipt-template/README.md`
- **Variable schema**: See `../current-receipt-template/data/variables-schema.json`
- **ESC/POS commands**: See `IMPLEMENTATION_GUIDE.md`
- **Implementation patterns**: See `escpos-generator.js`

## Next Steps

1. Review the implementation guide
2. Study the reference code
3. Implement printer support in your language/framework
4. Test with sample templates and data
5. Verify output matches preview

