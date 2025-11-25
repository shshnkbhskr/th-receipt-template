# Changelog

All notable changes to the Print Receipt Template Engine will be documented in this file.

---

## [v1.1.0] - 2025-11-25 (Tuesday, 3:24 PM IST)

### 🎉 Summary
This version establishes the project on GitHub and includes refinements to the template engine, enhanced styling, and font additions for improved thermal printer accuracy.

### ✨ Added
- **GitHub Repository Setup**: Project initialized and pushed to [th-receipt-template](https://github.com/shshnkbhskr/th-receipt-template)
- **B612 Mono Font Family**: Added monospace font files for consistent thermal printer rendering
  - `B612Mono-Regular.ttf`
  - `B612Mono-Bold.ttf`
  - `B612Mono-Italic.ttf`
  - `B612Mono-BoldItalic.ttf`
- **`.gitignore`**: Added comprehensive gitignore for Node.js, IDE files, and generated exports

### 🔧 Changed
- **CSS Styling** (`print-preview.css`): Enhanced styling with 373+ lines of improvements
  - Better receipt container styling
  - Improved grid layouts for item tables
  - Enhanced separator and calculation row styling
- **Template Engine** (`print-template-engine.js`): Added 43+ lines of new functionality
  - Improved variable replacement
  - Better formatting functions
- **Preview System** (`preview.html`): Enhanced with 279+ lines of improvements
  - Better export functionality
  - Improved UI controls
  - Cache-busting for development

### 🗑️ Removed/Simplified
- **Template JSON files**: Streamlined and simplified template structures
  - Removed redundant elements
  - Cleaner JSON structure for easier maintenance

### 📁 Files Modified
| File | Changes |
|------|---------|
| `css/print-preview.css` | +373 lines |
| `js/print-template-engine.js` | +43 lines |
| `preview.html` | +279 lines |
| `print_bill_2inch_template.json` | Simplified |
| `print_bill_3inch_template.json` | Simplified |
| `print_transaction_2inch_template.json` | Simplified |
| `print_transaction_3inch_template.json` | Simplified |
| `receipt-templates.json` | Simplified |
| `escpos-generator.js` | Minor fixes |

---

## [v1.0.0] - 2025-11-25 (Tuesday, Initial Release)

### 🎉 Summary
Initial release of the Print Receipt Template Engine - a complete system for rendering thermal printer receipts with HTML preview.

### ✨ Features
- **Template Engine**: Custom JavaScript engine with `${variable}` syntax
- **4 Receipt Templates**: Bill and Transaction receipts in 2-inch and 3-inch formats
- **HTML Preview System**: Interactive preview with template selector
- **Export Functionality**: PNG and PDF export capabilities
- **Printer Implementation Guide**: Complete ESC/POS command documentation
- **Data Schema**: JSON Schema validation for template variables
- **Indian Currency Support**: ₹ symbol and Indian numbering format (1,23,456.00)

### 📂 Project Structure
```
receipt-template/
├── current-receipt-template/    # Main template engine
│   ├── preview.html             # Preview page
│   ├── css/print-preview.css    # Receipt styling
│   ├── js/print-template-engine.js
│   ├── templates/               # 4 receipt templates
│   └── data/                    # Schema & sample data
├── printer-implementation/      # ESC/POS guide
├── demo-receipt-template/       # Demo version
└── digital/                     # Reference images
```

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| v1.1.0 | 2025-11-25 | GitHub setup, font additions, styling improvements |
| v1.0.0 | 2025-11-25 | Initial release - fully functional template engine |

---

*Maintained by Tohands Team*

