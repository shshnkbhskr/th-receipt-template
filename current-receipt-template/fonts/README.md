# Thermal Sans Mono Font

This directory is for Thermal Sans Mono font files converted to web formats.

## About Thermal Sans Mono

**Thermal Sans Mono** is a specialized bitmap font designed for thermal receipt printers and emulators.

- **Source**: https://github.com/mike42/thermal-sans-mono
- **License**: GPL-2.0
- **Sizes**: 12x24 and 9x17 (corresponding to thermal printer bitmap sizes)
- **Designed for**: ~180 DPI thermal printers

## Font Formats

The original font comes in bitmap formats:
- **BDF** (Bitmap Distribution Format)
- **PCF** (Portable Compiled Format)

## Converting to Web Formats

To use Thermal Sans Mono in the web preview, you need to convert it to web-compatible formats:

### Option 1: Use Online Converters

1. Download BDF/PCF files from the [GitHub releases](https://github.com/mike42/thermal-sans-mono/releases)
2. Use an online converter like:
   - [FontForge Online](https://fontforge.org/)
   - [CloudConvert](https://cloudconvert.com/bdf-to-ttf)
3. Convert BDF/PCF → TTF → WOFF/WOFF2
4. Place converted files in this directory

### Option 2: Use FontForge (Command Line)

```bash
# Install FontForge
# On macOS: brew install fontforge
# On Ubuntu: sudo apt-get install fontforge

# Convert BDF to TTF
fontforge -script - <<EOF
Open("thermal-sans-mono-12x24.bdf")
Generate("thermal-sans-mono-12x24.ttf")
Quit()
EOF

# Convert TTF to WOFF2 (requires woff2 tools)
woff2_compress thermal-sans-mono-12x24.ttf
```

### Option 3: Use Python Script

```python
from fontTools.ttLib import TTFont
from fontTools.woff2 import compress

# Convert BDF to TTF first (using FontForge or other tool)
# Then compress to WOFF2
compress('thermal-sans-mono-12x24.ttf', 'thermal-sans-mono-12x24.woff2')
```

## File Structure

After conversion, place files here:

```
fonts/
├── thermal-sans-mono-12x24.woff2    # Primary format (smallest, best compression)
├── thermal-sans-mono-12x24.woff     # Fallback format
├── thermal-sans-mono-12x24.ttf       # Fallback format
└── thermal-sans-mono-9x17.woff2     # Smaller size variant (optional)
```

## CSS Integration

Once font files are added, uncomment the `@font-face` declarations in `css/print-preview.css`:

```css
@font-face {
    font-family: 'Thermal Sans Mono';
    src: url('../fonts/thermal-sans-mono-12x24.woff2') format('woff2'),
         url('../fonts/thermal-sans-mono-12x24.woff') format('woff'),
         url('../fonts/thermal-sans-mono-12x24.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
```

## Current Implementation

Currently, the preview uses a monospace font stack that approximates Thermal Sans Mono:
- `'Thermal Sans Mono'` (if web fonts are available)
- `'Courier New'` (fallback)
- `'Courier'` (fallback)
- `'Consolas'`, `'Monaco'`, `'Lucida Console'` (system monospace fallbacks)
- `monospace` (generic fallback)

The CSS also includes font rendering properties to make the preview look more like thermal printer output:
- Disabled font smoothing for crisp, pixelated appearance
- Optimized rendering for bitmap-like fonts

## Notes

- Thermal Sans Mono is designed for **180 DPI** thermal printers
- The font may appear pixelated on high-DPI screens (this is intentional for accuracy)
- For best results, use the actual converted font files rather than fallbacks
- The font is licensed under **GPL-2.0** - ensure compliance if redistributing

## Resources

- [Thermal Sans Mono GitHub](https://github.com/mike42/thermal-sans-mono)
- [FontForge Documentation](https://fontforge.org/docs/)
- [Web Font Formats Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face)

