# Animation Quick Reference
**Copy-paste patterns for common use cases**

---

## When to Use What

```
Hover state? → CSS Transition (150ms)
Click feedback? → CSS active: + transform (100ms)
Expand/collapse? → CSS Grid rows OR WAAPI (200ms)
Modal enter/exit? → WAAPI (300ms enter, 200ms exit)
List reorder? → Framer Motion layout (200ms)
```

---

## CSS Patterns (Use 90% of the time)

### Hover State (Color/Background)
```tsx
<div className="transition-colors duration-fast hover:bg-gray-100 motion-reduce:transition-none">
  Hover me
</div>
```

### Click Feedback (Button Press)
```tsx
<button className={cn(
  "transition-all duration-instant",
  "active:scale-[0.98]",
  "motion-reduce:transition-none motion-reduce:active:scale-100"
)}>
  Click me
</button>
```

### Focus Ring
```tsx
<input className={cn(
  "transition-shadow duration-fast",
  "focus:ring-2 focus:ring-blue-500",
  "motion-reduce:transition-none"
)} />
```

### Expand/Collapse (CSS Grid Method)
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

### Chevron Rotation
```tsx
<svg className={cn(
  "transition-transform duration-fast",
  isOpen && "rotate-180"
)}>
  {/* chevron icon */}
</svg>
```

---

## WAAPI Patterns (Use for multi-property or dynamic values)

### Dropdown Fade-In
```typescript
useEffect(() => {
  if (!isOpen || !dropdownRef.current) return;
  
  dropdownRef.current.animate(
    [
      { opacity: 0, transform: 'translateY(-4px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { 
      duration: 150, 
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      fill: 'both' 
    }
  );
}, [isOpen]);
```

### Dynamic Height Animation
```typescript
import { animateHeight } from '@/lib/animate-height';

const expandSection = () => {
  const element = sectionRef.current;
  const from = element.scrollHeight;
  const to = 0;
  
  animateHeight(element, from, to, 200);
};
```

### Modal Enter/Exit (Complete Pattern)
```typescript
// src/hooks/useModalAnimation.ts
import { useEffect, useRef } from 'react';

export function useModalAnimation(isOpen: boolean, onAnimationEnd?: () => void) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backdropRef.current || !contentRef.current) return;

    if (isOpen) {
      // Enter: 300ms
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
      // Exit: 200ms (faster)
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

// Usage in Modal component:
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
      <div ref={contentRef} className="bg-white rounded-lg p-6">
        {children}
      </div>
    </div>
  );
}
```

---

## Framer Motion Patterns (Use sparingly)

### AnimatePresence (List Item Exit)
```tsx
import { motion, AnimatePresence } from 'framer-motion';

<AnimatePresence mode="popLayout">
  {items.map(item => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

### Hardware-Accelerated Transform (Correct Way)
```tsx
// ❌ WRONG: Not hardware accelerated
<motion.div animate={{ x: 100, scale: 2 }} />

// ✅ CORRECT: Hardware accelerated
<motion.div animate={{ transform: "translateX(100px) scale(2)" }} />
```

### With Reduced Motion Support
```tsx
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 20 }}
  animate={{ opacity: 1, x: 0 }}
  transition={{ duration: shouldReduceMotion ? 0.01 : 0.3 }}
/>
```

---

## Reduced Motion Hook

```typescript
// src/hooks/useReducedMotion.ts
import { useEffect, useState } from 'react';

export function useReducedMotion(): boolean {
  const [matches, setMatch] = useState(
    typeof window !== 'undefined' 
      ? !!window.matchMedia('(prefers-reduced-motion: reduce)')?.matches 
      : false
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setMatch(e.matches);
    
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return matches;
}

// Usage:
const shouldReduceMotion = useReducedMotion();
const duration = shouldReduceMotion ? 0.01 : 300;
```

---

## Animation Tokens Reference

| Token | Value | Use Case |
|-------|-------|----------|
| `duration-instant` | 100ms | Click feedback, tooltip appear |
| `duration-fast` | 150ms | Hover states, focus rings |
| `duration-normal` | 200ms | Expand/collapse, accordion |
| `duration-moderate` | 300ms | Modal enter, slide panels |
| `duration-slow` | 500ms | Page transitions (rare) |

| Easing | Curve | Use Case |
|--------|-------|----------|
| `ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | General purpose |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exits, dismissals |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Enters, reveals |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Two-way (same as default) |

---

## Performance Checklist

Before committing animation code:

- [ ] Only animates `transform`, `opacity`, `filter`, or `clip-path`
- [ ] Includes `motion-reduce:` variant
- [ ] Duration ≤300ms for UI elements
- [ ] No `will-change` in static styles
- [ ] Chrome DevTools Performance: zero purple (layout) bars during animation
- [ ] Works with `prefers-reduced-motion: reduce`

---

## Common Mistakes to Avoid

### ❌ Don't Do This
```tsx
// Animating height directly (causes layout thrashing)
<div style={{ transition: 'height 300ms' }}>

// Always-on will-change (wastes GPU memory)
<div style={{ willChange: 'transform' }}>

// Re-rendering during animation
const [x, setX] = useState(0);
useEffect(() => {
  requestAnimationFrame(() => setX(x + 1));
}, [x]); // 60 React re-renders per second!

// Motion individual transforms (not accelerated)
<motion.div animate={{ x: 100, y: 50 }} />
```

### ✅ Do This Instead
```tsx
// CSS Grid for height animation
<div className={cn(
  "grid transition-[grid-template-rows]",
  isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
)}>

// will-change only on hover
<div className="hover:will-change-transform">

// Use refs for animation state
const xRef = useRef(0);
useEffect(() => {
  requestAnimationFrame(() => {
    xRef.current += 1;
    elemRef.current.style.transform = `translateX(${xRef.current}px)`;
  });
}, []);

// Hardware-accelerated transform string
<motion.div animate={{ transform: "translate(100px, 50px)" }} />
```

---

## Testing Checklist

### Manual Tests
1. **Visual check**: Animation looks smooth at 60fps
2. **Timing**: Completes in expected duration (use DevTools Performance)
3. **Reduced motion**: Toggle in DevTools → Rendering → Emulate reduced motion
4. **Mobile**: Test on real iOS/Android (not just simulator)
5. **Low-end**: CPU throttling 4x slowdown in DevTools

### DevTools Checks
1. Open Performance panel
2. Record interaction
3. Look for:
   - **Purple bars** = layout (BAD during animation)
   - **Green bars** = paint (keep <5ms)
   - **Yellow bars** = JS (keep <10ms)
   - **Red frames** = dropped frames (jank)

### Accessibility
1. Tab navigation still works
2. Screen reader announces focus (VoiceOver/NVDA)
3. Keyboard shortcuts not blocked
4. `prefers-reduced-motion` respected

---

**End of Quick Reference** — Bookmark this for copy-paste during implementation.
