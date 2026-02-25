# Button Hover Animation Plan

> Port the outsome.co black button "text slide" hover animation to `founder-sprint` Button component.

## Source Analysis (outsome.co)

### Animation Behavior
- **Resting**: Button shows text normally (`.button-text-initial`)
- **Hover**: Text slides UP and out of view. A second copy of the text (`.button-text-reveal`) slides UP into view from below
- **Effect**: Smooth vertical text carousel on hover

### HTML Structure
```html
<button class="button">
  <div class="button-text-wrap" style="display:flex; flex-direction:column; height:19.6px;">
    <div class="button-text-initial">{text}</div>
    <div class="button-text-reveal">{text}</div>
  </div>
</button>
```

### CSS Mechanics
- **Parent button**: `overflow: hidden` (masks the sliding text)
- **Wrap**: `display: flex; flex-direction: column; height: {one line};` (viewport for single line)
- **Initial text (resting)**: `transform: translate(0, 0); opacity: 1`
- **Initial text (hover)**: `transform: translate3d(0, -170%, 0) scale3d(0.9, 0.9, 1)`
- **Reveal text (resting)**: `transform: translate(0, 80%); opacity: 0; scale3d(1.1, 1.1, 1)`
- **Reveal text (hover)**: `transform: translate3d(0, -100%, 0) scale3d(1, 1, 1); opacity: 1`
- **Transition**: ~300ms ease on transform + opacity

### Visual Specs (from outsome.co)
- Background: `#000000` (our `#1A1A1A`)
- Text color: `#FEFAF3` (our `white`)
- Height: 48px, Padding: 0 24px, Border-radius: 9px
- Font: 500 14px

## Implementation Plan

### Approach: Pure CSS (no framer-motion needed)
The animation is a simple CSS transition on hover — no JS orchestration needed. Pure CSS keeps it lightweight and avoids adding runtime overhead to 28+ button instances.

### Changes Required

#### 1. `Button.tsx` — Structural Changes
- Add `overflow: hidden` to button styles
- When `animate` prop is true (or for primary/secondary variants by default):
  - Wrap `children` in a `<span className="btn-text-wrap">` container
  - Render children twice: `<span className="btn-text-initial">{children}</span>` + `<span className="btn-text-reveal">{children}</span>`
- When `loading` or `disabled`, skip animation (no double-render)
- The animation applies to ALL variants (primary, secondary, danger, ghost, linkedin)

#### 2. `globals.css` — Animation Styles
```css
/* Button text slide animation */
.btn-text-wrap {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}

.btn-text-initial,
.btn-text-reveal {
  transition: transform 0.35s cubic-bezier(0.65, 0, 0.35, 1), opacity 0.35s cubic-bezier(0.65, 0, 0.35, 1);
  white-space: nowrap;
}

.btn-text-initial {
  transform: translateY(0);
}

.btn-text-reveal {
  position: absolute;
  left: 0;
  top: 0;
  transform: translateY(80%);
  opacity: 0;
}

.btn:hover .btn-text-initial {
  transform: translateY(-170%) scale(0.9);
}

.btn:hover .btn-text-reveal {
  transform: translateY(0) scale(1);
  opacity: 1;
}

/* Disable animation when button is disabled */
.btn:disabled .btn-text-initial,
.btn:disabled .btn-text-reveal {
  transform: none !important;
  opacity: 1 !important;
  position: static !important;
}
```

#### 3. Backward Compatibility
- `children` that are NOT simple text (e.g., icons + text, loading spinner) should still render correctly
- The loading spinner renders OUTSIDE the text-wrap, alongside it
- The `children` content is duplicated inside both `.btn-text-initial` and `.btn-text-reveal`

### Scope
- **Files changed**: 2 (`Button.tsx`, `globals.css`)
- **Files NOT changed**: 0 consumer files (fully backward compatible)
- **Risk**: Low — CSS-only change, no API changes, no consumer changes needed

### Opt-out
- `disabled` and `loading` states skip animation naturally
- Could add `animated={false}` prop if specific buttons need to opt out
