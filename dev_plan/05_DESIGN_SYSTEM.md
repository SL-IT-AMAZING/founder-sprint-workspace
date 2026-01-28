# Design System - Founder Sprint Workspace MVP

> Extracted from outsome-react (Webflow template) and converted for Next.js 16 + Tailwind CSS 4

## Design Tokens (CSS Variables)

### Colors
```css
:root {
  /* Primary Colors */
  --color-light-1: #fefaf3;      /* Background - Cream/Off-white */
  --color-light-2: #f1eadd;      /* Secondary Background - Warm beige */
  --color-dark: #000;            /* Primary text */
  --color-white: white;
  
  /* Transparency Variants */
  --color-dark-7: #2f2c250f;     /* 6% opacity - Input background */
  --color-dark-12: #2f2c251f;    /* 12% opacity - Borders */
  --color-light-1-10: #fefaf31a; /* 10% opacity - Light borders */
  --color-light-1-30: #fefaf34d; /* 30% opacity - Glass button bg */
  
  /* Glass Effects */
  --color-glass-border: #fff6;
  --color-glass-surface: #fefaf399;
  
  /* Form States */
  --forms-success-bg: #a9ee81;   /* Green success */
  --forms-error-bg: #f5aaaa;     /* Red error */
}
```

### Typography
```css
:root {
  /* Font Families */
  --type-font-body: "BDO Grotesk", Arial, sans-serif;
  --type-font-headings: "Libre Caslon Condensed", "Times New Roman", sans-serif;
  --type-font-badges: "Roboto Mono", "Trebuchet MS", sans-serif;
  
  /* Base Unit & Scale */
  --type-base-unit: 14px;
  --type-scale-factor: 1.26;     /* Modular scale */
  
  /* Body */
  --type-body-size: 14px;
  --type-body-line-height: 1.4em;
  
  /* Headings (calculated with scale factor 1.26) */
  --type-h1-size: ~44px;
  --type-h1-line-height: 1em;
  --type-h1-letter-spacing: -0.02em;
  
  --type-h2-size: ~35px;
  --type-h2-line-height: 1.1em;
  --type-h2-letter-spacing: -0.02em;
  
  --type-h3-size: ~28px;
  --type-h3-line-height: 1.2em;
  --type-h3-letter-spacing: -0.02em;
  
  --type-h4-size: ~22px;
  --type-h4-line-height: 1.25em;
  --type-h4-letter-spacing: -0.02em;
  
  --type-h5-size: ~18px;
  --type-h5-line-height: 1.3em;
  --type-h5-letter-spacing: -0.01em;
  
  /* Lead (larger body text) */
  --type-lead-size: ~18px;
  --type-lead-line-height: 1.4em;
  
  /* Small */
  --type-small-size: ~11px;
  --type-small-line-height: 1.4em;
}
```

### Spacing (Gap System)
```css
:root {
  --gap-base-unit: 24px;
  
  --gap-0-125x: 3px;    /* gap-base-unit * 0.125 */
  --gap-0-25x: 6px;     /* gap-base-unit * 0.25 */
  --gap-0-5x: 12px;     /* gap-base-unit * 0.5 */
  --gap-0-75x: 18px;    /* gap-base-unit * 0.75 */
  --gap-1x: 24px;       /* gap-base-unit */
  --gap-1-5x: 36px;     /* gap-base-unit * 1.5 */
  --gap-2x: 48px;       /* gap-base-unit * 2 */
  --gap-3x: 72px;       /* gap-base-unit * 3 */
  --gap-4x: 96px;       /* gap-base-unit * 4 */
  --gap-5x: 120px;      /* gap-base-unit * 5 */
  --gap-6x: 144px;      /* gap-base-unit * 6 */
  --gap-7x: 168px;      /* gap-base-unit * 7 */
}
```

### Section Padding
```css
:root {
  --section-padding-base-unit: 96px;
  --section-padding-0-5x: 48px;
  --section-padding-1-5x: 144px;
}
```

### Border Radius
```css
:root {
  --border-radius-base-unit: 6px;
  --border-radius-2x: 12px;
}
```

### Buttons
```css
:root {
  --button-height: 48px;
  --button-height-small: 42px;
  --button-x-padding: 24px;
  --button-x-padding-small: 18px;
  --button-border-radius: 9px;
}
```

### Forms
```css
:root {
  --forms-input-height: 48px;
  --forms-input-x-padding: 18px;
  --forms-input-border-radius: 9px;   /* Same as button */
  --forms-input-bg: #2f2c250f;        /* color-dark-7 */
  --forms-textarea-min-height: 200px;
  --forms-input-group-spacing: 12px;
  --forms-checkbox-size: 18px;
}
```

### Container & Grid
```css
:root {
  --container-max-width: 1440px;
  --container-window-gutter: 24px;
  
  --grid-gap-xs: 6px;
  --grid-gap-s: 12px;
  --grid-gap-m: 24px;
  
  /* Named column widths (for max-width constraints) */
  --grid-1-column: 94px;
  --grid-2-column: 212px;
  --grid-3-column: 330px;
  --grid-4-column: 448px;
  --grid-5-column: 566px;
  --grid-6-column: 684px;
  --grid-7-column: 802px;
  --grid-8-column: 920px;
  --grid-9-column: 1038px;
  --grid-10-column: 1156px;
  --grid-11-column: 1274px;
}
```

### Navbar
```css
:root {
  --navbar-bg: var(--color-light-1);
  --navbar-height: 72px;
  --navbar-links-gap: 24px;
}
```

### Effects (Glass Morphism)
```css
:root {
  --effects-glass-blur: 12px;
  --effects-glass-drop-shadow-blur: 18px;
  --effects-glass-drop-shadow-color: #0000001f;
}
```

---

## Tailwind CSS 4 Theme Configuration

Add these to your `globals.css` (already included in templates):

```css
@import "tailwindcss";

@theme inline {
  /* Colors */
  --color-background: #fefaf3;
  --color-background-secondary: #f1eadd;
  --color-foreground: #000000;
  --color-muted: #2f2c250f;
  --color-border: #2f2c251f;
  --color-glass-surface: #fefaf399;
  --color-glass-border: #fff6;
  --color-success: #a9ee81;
  --color-error: #f5aaaa;
  
  /* Spacing */
  --spacing-xs: 6px;
  --spacing-sm: 12px;
  --spacing-md: 24px;
  --spacing-lg: 36px;
  --spacing-xl: 48px;
  --spacing-2xl: 72px;
  --spacing-3xl: 96px;
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 9px;
  --radius-lg: 12px;
  
  /* Font Families (use web-safe fallbacks for MVP) */
  --font-sans: "Inter", system-ui, sans-serif;
  --font-serif: "Georgia", "Times New Roman", serif;
  --font-mono: "Roboto Mono", monospace;
}
```

---

## Component Classes (from Webflow CSS)

### Button Variants

| Class | Description |
|-------|-------------|
| `.button` | Base button - dark bg, light text |
| `.button.small` | Smaller height (42px) and padding |
| `.button.light` | Transparent bg with light text |
| `.button.bg-light-1` | White background, dark text |
| `.button.bg-light-2` | Beige background, dark text |

### Typography Classes

| Class | Description |
|-------|-------------|
| `.heading---h1` through `.heading---h5` | Heading styles |
| `.text---lead` | Larger body text |
| `.text---small` | Smaller text |
| `.text---badge` | Uppercase, monospace, letter-spaced |
| `.text---bold` | Bold variant |
| `.text---muted` | 50% opacity |
| `.italic` | Italic style |

### Layout Classes

| Class | Description |
|-------|-------------|
| `.main-container` | Max-width container with padding |
| `.section` | Section with vertical padding |
| `.group` | Flex column with gap |
| `.group.title` | Larger gap for title groups |
| `.group.centered` | Center-aligned |
| `.buttons` | Horizontal button group |
| `.grid` | CSS Grid base |

### Card & Widget Classes

| Class | Description |
|-------|-------------|
| `.card` | Card container with border and shadow |
| `.card-body` | Card content area |
| `.widget` | Glass morphism widget |
| `.glass-surface` | Glass effect with blur |

### Navigation Classes

| Class | Description |
|-------|-------------|
| `.navbar` | Sticky navbar |
| `.navbar-row` | Navbar content row |
| `.nav-link` | Navigation link |
| `.nav-dropdown` | Dropdown container |
| `.dropdown-content` | Dropdown menu content |

### Form Classes

| Class | Description |
|-------|-------------|
| `.form-input` | Text input styling |
| `.form-input.textarea` | Textarea variant |
| `.form-input.light` | Dark background variant |
| `.input-group` | Input with label wrapper |
| `.checkbox-field` | Checkbox with label |
| `.form-success` | Success message |
| `.form-error` | Error message |

---

## Animation Patterns

### CSS Animations (no framer-motion)

```css
/* Marquee animation */
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}

.marquee-group {
  animation: marquee 40s linear infinite;
}

/* Button hover - text slide up effect */
.button:hover .button-text-wrap {
  transform: translateY(-50%);
  transition: transform 0.3s ease;
}

/* Link hover - opacity change */
.nav-link:hover,
.footer-link:hover,
.dropdown-link:hover {
  opacity: 0.5;
  transition: opacity 0.2s;
}

/* Card hover - subtle lift */
.card:hover {
  transform: translateY(-2px);
  transition: transform 0.2s;
}
```

---

## Font Loading (for MVP, use web-safe alternatives)

The original design uses:
- **BDO Grotesk** (body) -> Use **Inter** or system-ui
- **Libre Caslon Condensed** (headings) -> Use **Georgia** or serif
- **Roboto Mono** (badges) -> Use **Roboto Mono** (Google Font)

```html
<!-- In layout.tsx -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono:wght@500&display=swap" rel="stylesheet">
```

---

## Component File Reference

See `03_CODE_TEMPLATES/components/` for ready-to-use components:

| File | Description |
|------|-------------|
| `button.tsx` | Button with variants and animated text |
| `card.tsx` | Card container component |
| `input.tsx` | Form input with label |
| `modal.tsx` | Modal/dialog component |
| `navbar.tsx` | App navigation bar |
| `avatar.tsx` | User avatar with fallback |
| `badge.tsx` | Status/category badge |
| `sidebar.tsx` | Dashboard sidebar navigation |
| `page-header.tsx` | Page title and breadcrumb |
