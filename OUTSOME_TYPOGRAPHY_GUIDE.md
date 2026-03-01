# Outsome.co Typography Reference Guide

## Overview
This guide documents the exact fonts, sizes, weights, and styles used on outsome.co website. This information is sourced from the `outsome-react` component library CSS files.

---

## Font Families

### 1. **Headings Font**
- **Font Name**: Libre Caslon Condensed
- **Type**: Serif (Display/Heading)
- **Weights Available**: 400 (Regular), 400 Italic
- **Source Files**: 
  - `LibreCaslonCondensed-Regular.otf`
  - `LibreCaslonCondensed-Italic.otf`
- **Fallback Chain**: `"Libre Caslon Condensed", "Times New Roman", sans-serif`
- **CSS Variable**: `--_typography---type-font-headings`

### 2. **Body Text Font**
- **Font Name**: BDO Grotesk
- **Type**: Sans-serif (Variable Font)
- **Weights Available**: 300–900 (Variable Font with full weight range)
- **Source File**: `BDOGrotesk-VF.ttf`
- **Fallback Chain**: `"BDO Grotesk", Arial, sans-serif`
- **CSS Variable**: `--_typography---type-font-body`

### 3. **Badge/Accent Font**
- **Font Name**: Roboto Mono
- **Type**: Monospace
- **Weight**: 500 (Medium)
- **Source File**: `RobotoMono-Medium.ttf`
- **Fallback Chain**: `"Roboto Mono", "Trebuchet MS", sans-serif`
- **CSS Variable**: `--_typography---type-font-badges`
- **Use Case**: Badges, code, or technical elements

---

## Typography Scale

### Base Settings
- **Base Unit**: 14px
- **Scale Factor**: 1.26 (modular scale)

### Heading Sizes

| Level | Size (px) | CSS Variable | Context |
|-------|-----------|-------------|---------|
| H1 | 70.59px ≈ **71px** | `--_typography---type-h1-size` | Hero/Main heading |
| H2 | 56.02px ≈ **56px** | `--_typography---type-h2-size` | Section heading |
| H3 | 44.46px ≈ **44px** | `--_typography---type-h3-size` | Subsection heading |
| H4 | 35.29px ≈ **35px** | `--_typography---type-h4-size` | Smaller heading |
| H5 | 28.01px ≈ **28px** | `--_typography---type-h5-size` | Minor heading |

### Body Text Sizes

| Type | Size (px) | CSS Variable | Use Case |
|------|-----------|-------------|----------|
| **Body** | 14px | `--_typography---type-body-size` | Default body text |
| **Lead/Large** | 17.64px ≈ **18px** | `--_typography---type-lead-size` | Intro paragraphs, emphasis |
| **Small** | 11.11px ≈ **11px** | `--_typography---type-small-size` | Fine print, labels |

---

## Line Heights

| Element | Line Height | CSS Variable |
|---------|-------------|-------------|
| H1 | 1em | `--_typography---type-h1-line-height` |
| H2 | 1.1em | `--_typography---type-h2-line-height` |
| H3 | 1.2em | `--_typography---type-h3-line-height` |
| H4 | 1.25em | `--_typography---type-h4-line-height` |
| H5 | 1.3em | `--_typography---type-h5-line-height` |
| Body | 1.4em | `--_typography---type-body-line-height` |
| Small | 1.4em | `--_typography---type-small-line-height` |
| Lead | 1.4em | `--_typography---type-lead-line-height` |

---

## Letter Spacing

| Element | Letter Spacing | CSS Variable |
|---------|-----------------|-------------|
| H1 | -0.02em | `--_typography---type-h1-letter-spacing` |
| H2 | -0.02em | `--_typography---type-h2-letter-spacing` |
| H3 | -0.02em | `--_typography---type-h3-letter-spacing` |
| H4 | -0.02em | `--_typography---type-h4-letter-spacing` |
| H5 | -0.01em | (inherited) |

---

## Implementation Guide

### For Next.js App CSS

```css
/* 1. Import or self-host the fonts */
@font-face {
  font-family: 'Libre Caslon Condensed';
  src: url('/fonts/LibreCaslonCondensed-Regular.otf') format('opentype');
  font-weight: 400;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'Libre Caslon Condensed';
  src: url('/fonts/LibreCaslonCondensed-Italic.otf') format('opentype');
  font-weight: 400;
  font-style: italic;
  font-display: block;
}

@font-face {
  font-family: 'BDO Grotesk';
  src: url('/fonts/BDOGrotesk-VF.ttf') format('truetype');
  font-weight: 300 900;
  font-style: normal;
  font-display: block;
}

@font-face {
  font-family: 'Roboto Mono';
  src: url('/fonts/RobotoMono-Medium.ttf') format('truetype');
  font-weight: 500;
  font-style: normal;
  font-display: block;
}

/* 2. Set root typography variables */
:root {
  --typography-font-body: "BDO Grotesk", Arial, sans-serif;
  --typography-font-headings: "Libre Caslon Condensed", "Times New Roman", sans-serif;
  --typography-font-badges: "Roboto Mono", "Trebuchet MS", sans-serif;
  
  --typography-base-unit: 14px;
  --typography-scale-factor: 1.26;
  
  /* Heading sizes */
  --typography-h1-size: 70.59px;
  --typography-h2-size: 56.02px;
  --typography-h3-size: 44.46px;
  --typography-h4-size: 35.29px;
  --typography-h5-size: 28.01px;
  
  /* Body sizes */
  --typography-body-size: 14px;
  --typography-lead-size: 17.64px;
  --typography-small-size: 11.11px;
  
  /* Line heights */
  --typography-h1-line-height: 1em;
  --typography-h2-line-height: 1.1em;
  --typography-h3-line-height: 1.2em;
  --typography-h4-line-height: 1.25em;
  --typography-h5-line-height: 1.3em;
  --typography-body-line-height: 1.4em;
  
  /* Letter spacing */
  --typography-h1-letter-spacing: -0.02em;
  --typography-h2-letter-spacing: -0.02em;
  --typography-h3-letter-spacing: -0.02em;
  --typography-h4-letter-spacing: -0.02em;
  --typography-h5-letter-spacing: -0.01em;
}

/* 3. Apply to elements */
body {
  font-family: var(--typography-font-body);
  font-size: var(--typography-body-size);
  line-height: var(--typography-body-line-height);
}

h1 {
  font-family: var(--typography-font-headings);
  font-size: var(--typography-h1-size);
  line-height: var(--typography-h1-line-height);
  letter-spacing: var(--typography-h1-letter-spacing);
}

h2 {
  font-family: var(--typography-font-headings);
  font-size: var(--typography-h2-size);
  line-height: var(--typography-h2-line-height);
  letter-spacing: var(--typography-h2-letter-spacing);
}

/* Continue for h3, h4, h5... */

.badge {
  font-family: var(--typography-font-badges);
}
```

### For Tailwind CSS

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    fontFamily: {
      'body': ['BDO Grotesk', 'Arial', 'sans-serif'],
      'heading': ['Libre Caslon Condensed', 'Times New Roman', 'sans-serif'],
      'mono': ['Roboto Mono', 'Trebuchet MS', 'sans-serif'],
    },
    fontSize: {
      'xs': ['11.11px', { lineHeight: '1.4em' }],
      'sm': ['14px', { lineHeight: '1.4em' }],
      'base': ['14px', { lineHeight: '1.4em' }],
      'lg': ['17.64px', { lineHeight: '1.4em' }],
      'h5': ['28.01px', { lineHeight: '1.3em', letterSpacing: '-0.01em' }],
      'h4': ['35.29px', { lineHeight: '1.25em', letterSpacing: '-0.02em' }],
      'h3': ['44.46px', { lineHeight: '1.2em', letterSpacing: '-0.02em' }],
      'h2': ['56.02px', { lineHeight: '1.1em', letterSpacing: '-0.02em' }],
      'h1': ['70.59px', { lineHeight: '1em', letterSpacing: '-0.02em' }],
    },
  },
  extend: {
    fontFamily: {
      'body': ['BDO Grotesk', 'Arial', 'sans-serif'],
      'heading': ['Libre Caslon Condensed', 'Times New Roman', 'sans-serif'],
      'mono': ['Roboto Mono', 'Trebuchet MS', 'sans-serif'],
    },
  },
};
```

---

## Hero Section ("Silicon Valley Accelerating for Korean Startups")

Based on the outsome-react codebase analysis:

| Property | Value |
|----------|-------|
| **Font Family** | Libre Caslon Condensed (serif) |
| **Size** | ~56–71px (likely H1 or H2) |
| **Weight** | 400 (Regular) |
| **Line Height** | 1.0–1.1em |
| **Letter Spacing** | -0.02em |
| **Color** | See design system colors |
| **Style** | Elegant, condensed serif |

---

## Font Sources & Files

All fonts are **self-hosted** in the `/public/fonts/` directory:

```
/public/fonts/
├── BDOGrotesk-VF.ttf          (259.5 KB)
├── LibreCaslonCondensed-Regular.otf (71.4 KB)
├── LibreCaslonCondensed-Italic.otf  (100.7 KB)
└── RobotoMono-Medium.ttf       (87.5 KB)
```

**No external CDN dependencies** (Google Fonts, Adobe Fonts, etc.)

---

## Additional Notes

1. **BDO Grotesk** is a variable font with weight range 300–900, allowing precise weight selection for any design need
2. **Libre Caslon Condensed** is a condensed serif optimized for headings with good readability
3. The typography system uses a **1.26 modular scale**, creating harmonious size relationships
4. **Negative letter spacing** on headings creates a tighter, more premium appearance
5. All fonts use `font-display: block` for optimal web rendering

---

## Design Philosophy

The Outsome.co typography system embodies:
- **Elegance**: Serif headings (Libre Caslon Condensed)
- **Modernity**: Sans-serif body (BDO Grotesk)
- **Precision**: Monospace accents (Roboto Mono)
- **Harmony**: Modular scale (1.26) for consistent sizing
- **Premium Feel**: Negative letter spacing on headings

