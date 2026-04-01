# UI Animation Implementation Plan
**Low-Latency Subtle Animations for Next.js Dashboard**

---

## Executive Summary

**Current State**: Scattered CSS transitions (`0.2s ease` everywhere), framer-motion installed but unused, zero modal/dropdown animations, inconsistent patterns.

**Goal**: Systematic low-latency animation system with subtle, consistent interactions across expand/collapse, click/tap, hover, dropdowns, and modals.

**Strategy**: CSS-first for performance, WAAPI for complex cases, Motion only where necessary.

---

## 1. Motion Principles & Animation Tokens

### Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Subtle over flashy** | Max opacity: 1, max blur: 0, no bounces/overshoots |
| **Fast over smooth** | Prefer 100-200ms over 300-500ms |
| **Performance > expressiveness** | Only animate `transform`, `opacity`, `filter`, `clip-path` |
| **Reduced motion = reduced, not removed** | Keep opacity fades (0.01ms), remove transforms |
| **Consistent timing** | Use token system, never hardcode durations |

### Animation Tokens

Create `src/lib/motion-tokens.ts`:

```typescript
export const DURATION = {
  instant: 100,    // Click feedback, tooltip appear
  fast: 150,       // Hover states, focus rings
  normal: 200,     // Expand/collapse, accordion
  moderate: 300,   // Modal enter, slide panels
  slow: 500,       // Page transitions (use sparingly)
} as const;

export const EASING = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Material standard
  in: 'cubic-bezier(0.4, 0, 1, 1)',         // Exits, dismissals
  out: 'cubic-bezier(0, 0, 0.2, 1)',        // Enters, reveals
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',    // Two-way (same as default)
} as const;

// Tailwind CSS variable integration
export const cssVars = `
  :root {
    --duration-instant: ${DURATION.instant}ms;
    --duration-fast: ${DURATION.fast}ms;
    --duration-normal: ${DURATION.normal}ms;
    --duration-moderate: ${DURATION.moderate}ms;
    --duration-slow: ${DURATION.slow}ms;
    
    --ease-default: ${EASING.default};
    --ease-in: ${EASING.in};
    --ease-out: ${EASING.out};
    --ease-in-out: ${EASING.inOut};
  }
`;
```

Add to `globals.css`:

```css
/* Animation Tokens */
:root {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-moderate: 300ms;
  --duration-slow: 500ms;
  
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

/* Reduced Motion Safety Net */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

### Tailwind Config Extension

Add to `tailwind.config.ts`:

```typescript
export default {
  theme: {
    extend: {
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        moderate: 'var(--duration-moderate)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'ease-default': 'var(--ease-default)',
        'ease-in': 'var(--ease-in)',
        'ease-out': 'var(--ease-out)',
        'ease-in-out': 'var(--ease-in-out)',
      },
    },
  },
};
```

---

## 2. CSS Transitions vs Framer Motion vs WAAPI

### Decision Matrix

| Use Case | Technology | Duration | Easing | Example |
|----------|-----------|----------|--------|---------|
| **Hover state** (bg, color) | CSS Transition | 150ms | ease-in-out | `transition: background-color var(--duration-fast) var(--ease-in-out)` |
| **Focus ring** | CSS Transition | 150ms | ease-out | `transition: box-shadow var(--duration-fast) var(--ease-out)` |
| **Click feedback** (button press) | CSS Transition + active: | 100ms | ease-out | `active:scale-95 transition-transform duration-instant` |
| **Expand/collapse** (known height) | CSS grid-template-rows | 200ms | default | `grid-template-rows: 0fr → 1fr` |
| **Expand/collapse** (dynamic height) | WAAPI `element.animate()` | 200ms | default | See Wave 2 implementation |
| **List item hover** | CSS Transition | 150ms | ease-in-out | `transition: background-color var(--duration-fast)` |
| **Dropdown appear** | WAAPI + opacity | 150ms | ease-out | `element.animate([{opacity: 0}, {opacity: 1}], {duration: 150})` |
| **Modal enter** | WAAPI multi-property | 300ms | ease-out | Opacity + scale transform |
| **Modal exit** | WAAPI multi-property | 200ms | ease-in | Faster than enter (150ms vs 300ms) |
| **Toast notification** | Framer Motion AnimatePresence | 300ms | ease-in-out | Only if need stacking/queue management |
| **List reorder** | Framer Motion `layout` | 200ms | default | Only if drag-and-drop |

### Technology Selection Rules

```
Use CSS Transitions when:
✅ Single property animation (color, opacity, transform)
✅ Declarative (hover, focus, active)
✅ No JS needed

Use WAAPI when:
✅ Multi-property coordination (opacity + transform)
✅ Dynamic values (height measurement)
✅ Playback control (pause, reverse)
✅ Want zero bundle cost

Use Framer Motion when:
✅ AnimatePresence (enter/exit of conditional renders)
✅ Spring physics required
✅ Shared layout transitions
✅ Gesture interactions (drag, swipe)
❌ NOT for simple hover/focus (CSS is faster)
```

### ⚠️ Critical Performance Rules

1. **Only animate compositor-only properties**: `transform`, `opacity`, `filter`, `clip-path`
2. **Never animate**: `height` (use CSS Grid trick or WAAPI), `width`, `top/left`, `margin`, `padding`
3. **Framer Motion gotcha**: Use `transform: "translateX(100px)"` NOT `x: 100` for hardware acceleration
4. **Apply `will-change` only during animation**, never always-on:
   ```tsx
   <div className="hover:will-change-transform transition-transform">
   ```

---

## 3. Prioritized Rollout Waves

### Wave 1: Foundation (Week 1) — Zero Bundle Cost
**Goal**: Establish token system, fix low-hanging fruit with CSS only.

| Component | File | Current State | Change | Method |
|-----------|------|---------------|--------|--------|
| **Animation tokens** | `src/lib/motion-tokens.ts` | None | Create token file | New file |
| **Global CSS** | `src/app/globals.css` | Inconsistent durations | Add CSS vars + reduced-motion | Edit |
| **Tailwind config** | `tailwind.config.ts` | No animation tokens | Extend with duration/easing tokens | Edit |
| **Hover states** | `src/components/Sidebar.tsx` (30+ instances) | `transition: 'background-color 0.2s ease'` | Replace with `transition-colors duration-fast` | Edit inline styles → Tailwind |
| **Button hover** | All buttons (BatchSwitcher, CompanyCard, etc.) | `transition: 'background-color 0.2s ease'` | Replace with `transition-colors duration-fast motion-reduce:transition-none` | Edit |
| **Chevron rotations** | Sidebar, BatchSwitcher | `transition: 'transform 0.2s ease'` | Replace with `transition-transform duration-fast` | Edit |
| **Focus rings** | Form inputs | None or instant | Add `focus:ring-2 transition-shadow duration-fast` | Edit |

**Acceptance Criteria**:
- [ ] All inline `transition: '...'` replaced with Tailwind classes using tokens
- [ ] `useReducedMotion` hook created in `src/hooks/useReducedMotion.ts`
- [ ] Global CSS reduced-motion media query present
- [ ] Zero console errors
- [ ] Visual regression test: hover states work identically

---

### Wave 2: Expand/Collapse (Week 1-2) — WAAPI
**Goal**: Add smooth height animations to sidebars, accordions, dropdowns.

| Component | File | Current State | Implementation |
|-----------|------|---------------|----------------|
| **Sidebar sections** | `src/components/DashboardSidebar.tsx` | `max-height` transition (causes layout) | CSS Grid `grid-template-rows: 0fr/1fr` OR WAAPI `element.animate()` |
| **BatchSwitcher dropdown** | `src/components/BatchSwitcher.tsx` | Instant appear | WAAPI fade-in with `element.animate([{opacity: 0, transform: 'translateY(-4px)'}, {opacity: 1, transform: 'translateY(0)'}], {duration: 150, easing: 'ease-out'})` |
| **DropdownMenu** | `src/components/ui/DropdownMenu.tsx` | Instant appear/disappear | Same WAAPI pattern |

**Implementation Pattern** (CSS Grid — Recommended):

```tsx
// Before
<div style={{ 
  maxHeight: isOpen ? '500px' : '0',
  transition: 'max-height 0.2s ease'
}}>

// After
<div className={cn(
  "grid transition-[grid-template-rows] duration-normal ease-default",
  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
)}>
  <div className="overflow-hidden">
    {children}
  </div>
</div>
```

**Alternative: WAAPI for Dynamic Heights** (when grid doesn't work):

Create `src/lib/animate-height.ts`:

```typescript
export function animateHeight(
  element: HTMLElement,
  from: number | 'auto',
  to: number | 'auto',
  duration = 200
): Animation {
  const fromHeight = from === 'auto' ? element.scrollHeight : from;
  const toHeight = to === 'auto' ? element.scrollHeight : to;

  return element.animate(
    { height: [`${fromHeight}px`, `${toHeight}px`] },
    { duration, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'both' }
  );
}
```

**Acceptance Criteria**:
- [ ] All expand/collapse animations complete in <200ms
- [ ] Zero layout thrashing (check Performance panel: no purple bars during animation)
- [ ] Works with `prefers-reduced-motion` (instant)
- [ ] No visible jank on low-end devices

---

### Wave 3: Click Feedback (Week 2) — CSS
**Goal**: Tactile press feedback on all interactive elements.

| Component | Pattern |
|-----------|---------|
| **Buttons** | `active:scale-[0.98] transition-transform duration-instant` |
| **Cards** (clickable) | `active:scale-[0.99] transition-transform duration-instant` |
| **List items** (selectable) | `active:scale-[0.995] transition-transform duration-instant` |

**Implementation**:

```tsx
// Before
<button className="bg-blue-500 text-white">Click me</button>

// After
<button className={cn(
  "bg-blue-500 text-white",
  "transition-all duration-instant",
  "hover:bg-blue-600 active:scale-[0.98]",
  "motion-reduce:transition-none motion-reduce:active:scale-100"
)}>
  Click me
</button>
```

**Files to Update**:
- All `<button>` elements in Sidebar, BatchSwitcher, Navbar, CompanyCard
- Clickable cards in FeedView
- List items in GroupsList, SessionsList

**Acceptance Criteria**:
- [ ] All buttons have press feedback
- [ ] Feedback completes in 100ms
- [ ] No accidental triggering on scroll (mobile)
- [ ] Reduced motion disables scale

---

### Wave 4: Modals & Overlays (Week 2-3) — WAAPI
**Goal**: Smooth modal/dialog enter/exit.

| File | Current State | Implementation |
|------|---------------|----------------|
| `src/components/ui/Modal.tsx` | Native `<dialog>` instant show | WAAPI backdrop fade + content scale |
| `CreateGroupModal.tsx`, `GroupBrowseModal.tsx`, etc. | Conditional render, instant | Same pattern |

**Implementation Pattern**:

Create `src/hooks/useModalAnimation.ts`:

```typescript
import { useEffect, useRef } from 'react';

export function useModalAnimation(isOpen: boolean, onAnimationEnd?: () => void) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backdropRef.current || !contentRef.current) return;

    if (isOpen) {
      // Enter animation
      backdropRef.current.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { duration: 300, easing: 'cubic-bezier(0, 0, 0.2, 1)', fill: 'both' }
      );
      contentRef.current.animate(
        [
          { opacity: 0, transform: 'scale(0.95) translateY(-20px)' },
          { opacity: 1, transform: 'scale(1) translateY(0)' },
        ],
        { duration: 300, easing: 'cubic-bezier(0, 0, 0.2, 1)', fill: 'both' }
      );
    } else {
      // Exit animation (faster)
      const backdropAnim = backdropRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' }
      );
      contentRef.current.animate(
        [
          { opacity: 1, transform: 'scale(1) translateY(0)' },
          { opacity: 0, transform: 'scale(0.95) translateY(-20px)' },
        ],
        { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'both' }
      );

      backdropAnim.onfinish = () => onAnimationEnd?.();
    }
  }, [isOpen, onAnimationEnd]);

  return { backdropRef, contentRef };
}
```

**Usage**:

```tsx
function Modal({ isOpen, onClose, children }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const { backdropRef, contentRef } = useModalAnimation(isOpen, () => {
    if (!isOpen) setShouldRender(false);
  });

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div ref={backdropRef} className="fixed inset-0 bg-black/50 z-50">
      <div ref={contentRef} className="...">
        {children}
      </div>
    </div>
  );
}
```

**Acceptance Criteria**:
- [ ] Modal enter: 300ms with ease-out
- [ ] Modal exit: 200ms with ease-in (faster dismiss)
- [ ] No flash of unstyled content
- [ ] Backdrop click closes with animation
- [ ] Escape key closes with animation
- [ ] Reduced motion: instant (0.01ms)

---

### Wave 5: List Selection & Hover (Week 3) — CSS
**Goal**: Highlight selected/hovered list items.

| Component | Pattern |
|-----------|---------|
| **Feed items** | `hover:bg-gray-50 transition-colors duration-fast` |
| **Group list items** | `hover:bg-blue-50 data-[selected=true]:bg-blue-100 transition-colors duration-fast` |
| **Session list items** | Same pattern |

**Files**:
- `src/app/(authenticated)/feed/FeedView.tsx`
- `src/components/GroupsList.tsx`
- `src/components/SessionsList.tsx`

**Acceptance Criteria**:
- [ ] Hover state appears in 150ms
- [ ] Selected state persists (no transition)
- [ ] No lag on lists with 100+ items

---

### Wave 6: Dropdown/Context Menu (Week 3) — WAAPI
**Goal**: Smooth dropdown reveals.

| File | Implementation |
|------|----------------|
| `src/components/ui/DropdownMenu.tsx` | Already covered in Wave 2 |
| Navbar dropdowns (BookfaceTopNav, Navbar) | Replace `@keyframes slideDown` with WAAPI |

**Pattern** (Replace CSS `@keyframes slideDown`):

```typescript
// Remove inline <style> with @keyframes slideDown

// Add in component:
useEffect(() => {
  if (!isOpen || !dropdownRef.current) return;
  
  dropdownRef.current.animate(
    [
      { opacity: 0, transform: 'translateY(-10px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: 150, easing: 'cubic-bezier(0, 0, 0.2, 1)', fill: 'both' }
  );
}, [isOpen]);
```

**Acceptance Criteria**:
- [ ] Dropdown appears in 150ms
- [ ] No duplicate `slideDown` keyframes
- [ ] Consistent timing across all dropdowns

---

## 4. Performance Guardrails & Anti-Patterns

### Guardrails (Enforce in Code Review)

| Rule | Enforcement |
|------|-------------|
| **Only animate `transform`, `opacity`, `filter`, `clip-path`** | ESLint rule (custom): flag `transition: height/width/top/left` |
| **Max 300ms for UI animations** | Token system: `DURATION.slow` (500ms) only for page transitions |
| **Always include `motion-reduce:` variant** | Checklist in PR template |
| **No `will-change` in static styles** | ESLint rule: flag `will-change` outside `:hover`/`:focus` |
| **Max 30 active compositor layers** | Performance budget CI check (DevTools Layers API) |

### Anti-Patterns to Avoid

#### ❌ Anti-Pattern 1: Layout Thrashing

```tsx
// BAD: Reading offsetHeight forces synchronous layout
const height = element.offsetHeight;
element.style.height = height * 2 + 'px';

// GOOD: Batch reads, animate with WAAPI
const heights = elements.map(el => el.scrollHeight);
requestAnimationFrame(() => {
  elements.forEach((el, i) => {
    el.animate({ height: [`${heights[i]}px`, '0px'] }, { duration: 200 });
  });
});
```

#### ❌ Anti-Pattern 2: Re-rendering During Animation

```tsx
// BAD: State update triggers React re-render every frame
const [x, setX] = useState(0);
useEffect(() => {
  const id = requestAnimationFrame(() => setX(prev => prev + 1));
  return () => cancelAnimationFrame(id);
}, [x]);

// GOOD: Use refs for animation state, CSS/WAAPI for visuals
const xRef = useRef(0);
const elemRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  let id: number;
  const animate = () => {
    xRef.current += 1;
    elemRef.current!.style.transform = `translateX(${xRef.current}px)`;
    id = requestAnimationFrame(animate);
  };
  id = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(id);
}, []);
```

#### ❌ Anti-Pattern 3: Motion Individual Transforms (Not Accelerated)

```tsx
// BAD: Uses CSS variables, NOT hardware accelerated
<motion.div animate={{ x: 100, scale: 2 }} />

// GOOD: Hardware accelerated
<motion.div animate={{ transform: "translateX(100px) scale(2)" }} />
```

#### ❌ Anti-Pattern 4: Always-On `will-change`

```tsx
// BAD: Wastes GPU memory
<div style={{ willChange: 'transform' }}>

// GOOD: Apply only during interaction
<div className="hover:will-change-transform">
```

#### ❌ Anti-Pattern 5: Animating Non-Compositor Properties

```css
/* BAD: Triggers Layout + Paint every frame */
.accordion {
  transition: height 300ms;
}

/* GOOD: CSS Grid trick (compositor-only) */
.accordion {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows 300ms;
}
```

---

## 5. Validation Plan with Measurable Acceptance Criteria

### Performance Budgets

| Metric | Budget | Measurement Tool |
|--------|--------|------------------|
| **Animation frame time** | <10ms per frame @ 60fps | Chrome DevTools → Performance → Frame chart |
| **Total Blocking Time (TBT)** | <200ms | Lighthouse CI |
| **Cumulative Layout Shift (CLS)** | <0.1 | Lighthouse CI |
| **Long Animation Frames (LoAF)** | <50ms | `PerformanceObserver('long-animation-frame')` |
| **Active compositor layers** | <30 during peak interaction | DevTools → Layers panel |
| **Bundle size increase** | <10 KB gzip (if using Motion) | `bundlephobia` or `next-bundle-analyzer` |

### Automated Tests

#### 1. Visual Regression (Playwright)

```typescript
// tests/animations.spec.ts
test('hover state appears in <200ms', async ({ page }) => {
  await page.goto('/dashboard');
  const button = page.locator('[data-testid="sidebar-item"]');
  
  const startTime = Date.now();
  await button.hover();
  await expect(button).toHaveCSS('background-color', 'rgb(243, 244, 246)'); // gray-100
  const duration = Date.now() - startTime;
  
  expect(duration).toBeLessThan(200);
});

test('modal animation respects prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/dashboard');
  
  const openButton = page.locator('[data-testid="open-modal"]');
  await openButton.click();
  
  const modal = page.locator('[data-testid="modal"]');
  // Should appear instantly (within 50ms) with reduced motion
  await expect(modal).toBeVisible({ timeout: 50 });
});
```

#### 2. Performance Monitoring (Production)

```typescript
// src/lib/performance-monitor.ts
if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) {
        // Log to analytics
        console.warn('[Animation Performance]', {
          duration: entry.duration,
          type: entry.entryType,
          name: entry.name,
        });
      }
    }
  });
  
  observer.observe({ type: 'long-animation-frame', buffered: true });
}
```

### Manual QA Checklist (Per Wave)

Before merging each wave:

- [ ] **Chrome DevTools Performance**: Record 5 interactions, confirm:
  - Zero purple bars (layout) during animation
  - Green (paint) <5ms per frame
  - Yellow (JS) <10ms per frame
- [ ] **Reduced motion**: Toggle in DevTools → Rendering → Emulate prefers-reduced-motion
  - Confirm animations are instant (0.01ms)
- [ ] **Mobile Safari**: Test on real iOS device
  - No jank on 60Hz iPhone 11
  - No excessive battery drain
- [ ] **Low-end device**: Chrome DevTools → CPU throttling 4x slowdown
  - Animations still complete in <500ms
- [ ] **Accessibility**: Screen reader test (VoiceOver/NVDA)
  - Animations don't interrupt focus announcements

---

## 6. Risk & Rollback Plan

### Identified Risks

| Risk | Likelihood | Impact | Mitigation | Rollback |
|------|------------|--------|------------|----------|
| **Bundle size increase** (if using Motion) | Medium | Medium | Use Motion only for AnimatePresence (Waves 4+), keep CSS for 80% of animations | Feature flag: `ENABLE_FRAMER_MOTION=false` |
| **Jank on low-end devices** | Low | High | Test with CPU throttling 4x, avoid layout-triggering props | Per-wave rollback: revert to instant transitions |
| **Breaking modal focus trap** | Medium | High | Test with keyboard nav + screen reader before/after | Keep native `<dialog>` API, animation is additive |
| **iOS Safari compositing bug** | Low | Medium | Avoid `backdrop-filter: blur()`, use `bg-white/95` instead | CSS fallback already in place |
| **Accessibility regression** | Low | Critical | Mandatory `prefers-reduced-motion` in every animation PR | Automated Playwright test gate |

### Feature Flags (Environment Variables)

```env
# .env.local
NEXT_PUBLIC_ENABLE_ANIMATIONS=true           # Master kill switch
NEXT_PUBLIC_ENABLE_MODAL_ANIMATIONS=true     # Wave 4 only
NEXT_PUBLIC_ENABLE_LIST_ANIMATIONS=true      # Wave 5 only
```

Usage:

```typescript
// src/lib/motion-config.ts
export const ANIMATION_ENABLED = {
  all: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS !== 'false',
  modals: process.env.NEXT_PUBLIC_ENABLE_MODAL_ANIMATIONS !== 'false',
  lists: process.env.NEXT_PUBLIC_ENABLE_LIST_ANIMATIONS !== 'false',
};

// In component
import { ANIMATION_ENABLED } from '@/lib/motion-config';

const duration = ANIMATION_ENABLED.modals ? 300 : 0.01;
```

### Rollback Strategy

#### Immediate Rollback (Production Issue)

1. Set env var: `NEXT_PUBLIC_ENABLE_ANIMATIONS=false`
2. Redeploy (Next.js will inline at build time)
3. Investigate, fix, re-enable

#### Per-Wave Rollback (QA Failure)

1. Revert PR for that wave only (waves are independent)
2. Keep token system + Wave 1 (CSS-only, zero risk)
3. Re-plan failed wave

#### Full Rollback (Catastrophic)

1. Revert all animation PRs
2. Keep only `globals.css` reduced-motion media query (accessibility requirement)
3. Return to current inline `transition: 'background-color 0.2s ease'` pattern

---

## 7. Example Implementation Checklist

### Wave 1 Example: Update Sidebar Hover States

**File**: `src/components/Sidebar.tsx`

**Before**:
```tsx
<div
  style={{
    backgroundColor: isActive ? '#F3F4F6' : 'transparent',
    transition: 'background-color 0.2s ease',
  }}
>
  Sidebar Item
</div>
```

**After**:
```tsx
<div
  className={cn(
    "transition-colors duration-fast motion-reduce:transition-none",
    isActive ? "bg-gray-100" : "bg-transparent hover:bg-gray-50"
  )}
>
  Sidebar Item
</div>
```

**Checklist**:
- [ ] Replace inline `style={{ transition }}` with Tailwind classes
- [ ] Use `duration-fast` token (150ms)
- [ ] Add `motion-reduce:transition-none`
- [ ] Add hover state if missing
- [ ] Test in browser: hover triggers in <200ms
- [ ] Test with reduced motion: instant

---

### Wave 2 Example: Animate Sidebar Section Expand

**File**: `src/components/DashboardSidebar.tsx`

**Before**:
```tsx
<div style={{
  maxHeight: isOpen ? '1000px' : '0',
  overflow: 'hidden',
  transition: 'max-height 0.2s ease',
}}>
  {children}
</div>
```

**After (CSS Grid Method)**:
```tsx
<div className={cn(
  "grid transition-[grid-template-rows] duration-normal ease-default",
  "motion-reduce:transition-none",
  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
)}>
  <div className="overflow-hidden">
    {children}
  </div>
</div>
```

**Checklist**:
- [ ] Replace `max-height` with CSS Grid rows
- [ ] Wrap children in `overflow-hidden` div
- [ ] Use `duration-normal` token (200ms)
- [ ] Test: animation completes in exactly 200ms
- [ ] Chrome DevTools Performance: zero purple (layout) bars during animation
- [ ] Test with reduced motion: instant expand

---

### Wave 4 Example: Animate Modal Enter/Exit

**File**: `src/components/ui/Modal.tsx`

**Before**:
```tsx
{isOpen && (
  <div className="fixed inset-0 bg-black/50">
    <div className="bg-white rounded-lg p-6">
      {children}
    </div>
  </div>
)}
```

**After**:
```tsx
function Modal({ isOpen, onClose, children }) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const { backdropRef, contentRef } = useModalAnimation(isOpen, () => {
    if (!isOpen) setShouldRender(false);
  });

  useEffect(() => {
    if (isOpen) setShouldRender(true);
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <div 
      ref={backdropRef}
      className="fixed inset-0 bg-black/50 z-50"
      onClick={onClose}
    >
      <div 
        ref={contentRef}
        className="bg-white rounded-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
```

**Checklist**:
- [ ] Import `useModalAnimation` hook
- [ ] Add `shouldRender` state for exit animation delay
- [ ] Attach refs to backdrop and content
- [ ] Test: modal enter 300ms, exit 200ms
- [ ] Test: backdrop click closes with animation
- [ ] Test: Escape key closes with animation
- [ ] Test: no flash of unstyled content
- [ ] Test with reduced motion: instant

---

## Implementation Timeline

| Wave | Duration | Risk | Dependencies |
|------|----------|------|--------------|
| **Wave 1**: Foundation | 2 days | Low | None |
| **Wave 2**: Expand/Collapse | 3 days | Medium | Wave 1 |
| **Wave 3**: Click Feedback | 2 days | Low | Wave 1 |
| **Wave 4**: Modals | 4 days | Medium | Wave 1 |
| **Wave 5**: List Hover | 2 days | Low | Wave 1 |
| **Wave 6**: Dropdowns | 2 days | Low | Wave 2 |
| **QA & Polish** | 3 days | — | All waves |
| **Total** | ~18 days (3.5 weeks) | — | — |

---

## Success Metrics (6 Weeks Post-Launch)

| Metric | Baseline | Target |
|--------|----------|--------|
| **Lighthouse Performance Score** | 85 | >80 (no regression) |
| **Time to Interactive (TTI)** | 2.1s | <2.5s (no regression) |
| **Long Animation Frames** | 0 events | 0 events |
| **User feedback (NPS survey)** | N/A | "Feels smoother/faster" >60% |
| **Accessibility audit (WAVE)** | 0 errors | 0 errors |
| **Bundle size** | 245 KB | <255 KB (+10 KB max) |

---

## Appendix: File Inventory

### Files to Modify (by Wave)

#### Wave 1 (15 files)
- `src/lib/motion-tokens.ts` (new)
- `src/hooks/useReducedMotion.ts` (new)
- `src/app/globals.css`
- `tailwind.config.ts`
- `src/components/Sidebar.tsx`
- `src/components/DashboardSidebar.tsx`
- `src/components/BatchSwitcher.tsx`
- `src/components/CompanyCard.tsx`
- `src/components/ui/Button.tsx` (if exists, else create)
- `src/app/(authenticated)/bookface/BookfaceTopNav.tsx`
- `src/components/Navbar.tsx`
- All form components (6 files: `GroupForm.tsx`, `SessionForm.tsx`, etc.)

#### Wave 2 (5 files)
- `src/lib/animate-height.ts` (new, if WAAPI method chosen)
- `src/components/DashboardSidebar.tsx` (already in Wave 1)
- `src/components/BatchSwitcher.tsx` (already in Wave 1)
- `src/components/ui/DropdownMenu.tsx`
- `src/app/(authenticated)/bookface/BookfaceTopNav.tsx` (dropdown part)

#### Wave 3 (10 files)
- All components with buttons (see Wave 1 list)
- `src/app/(authenticated)/feed/FeedView.tsx` (clickable cards)

#### Wave 4 (6 files)
- `src/hooks/useModalAnimation.ts` (new)
- `src/components/ui/Modal.tsx`
- `src/components/CreateGroupModal.tsx`
- `src/components/GroupBrowseModal.tsx`
- `src/components/BrowseGroupsModal.tsx`
- Any other modals (search codebase)

#### Wave 5 (3 files)
- `src/app/(authenticated)/feed/FeedView.tsx`
- `src/components/GroupsList.tsx`
- `src/components/SessionsList.tsx`

#### Wave 6 (3 files)
- `src/components/ui/DropdownMenu.tsx` (already in Wave 2)
- `src/app/(authenticated)/bookface/BookfaceTopNav.tsx` (remove `@keyframes slideDown`)
- `src/components/Navbar.tsx` (remove duplicate `@keyframes slideDown`)

---

## Quick Start

1. **Create branch**: `git checkout -b feat/ui-animations-wave-1`
2. **Copy tokens**: Create `src/lib/motion-tokens.ts` (see section 1)
3. **Update globals.css**: Add CSS variables + reduced-motion (see section 1)
4. **Update Tailwind**: Extend config with duration tokens (see section 1)
5. **Start with Sidebar.tsx**: Replace 5 inline transitions → see checklist
6. **Test**: `npm run dev`, hover items, check DevTools Performance
7. **Commit**: `git commit -m "feat: add animation tokens + update Sidebar hover states"`
8. **Repeat for Wave 1 files**, then PR

---

**End of Plan** — Ready for implementation. All decisions are concrete, all files identified, all patterns provided.
