# Animation Implementation Code Templates
**Copy-paste ready code for all shared utilities**

---

## 1. Motion Tokens (`src/lib/motion-tokens.ts`)

```typescript
/**
 * Animation duration and easing tokens
 * Used across all UI animations for consistency
 */

export const DURATION = {
  instant: 100,    // Click feedback, tooltip appear
  fast: 150,       // Hover states, focus rings
  normal: 200,     // Expand/collapse, accordion
  moderate: 300,   // Modal enter, slide panels
  slow: 500,       // Page transitions (use sparingly)
} as const;

export const EASING = {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',  // Material standard easing
  in: 'cubic-bezier(0.4, 0, 1, 1)',         // Exit/dismissal animations
  out: 'cubic-bezier(0, 0, 0.2, 1)',        // Enter/reveal animations
  inOut: 'cubic-bezier(0.4, 0, 0.2, 1)',    // Two-way (same as default)
} as const;

/**
 * CSS variable declarations for use in globals.css
 * Copy this into your root CSS file
 */
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

/**
 * Type-safe duration/easing access
 */
export type DurationKey = keyof typeof DURATION;
export type EasingKey = keyof typeof EASING;
```

---

## 2. Reduced Motion Hook (`src/hooks/useReducedMotion.ts`)

```typescript
import { useEffect, useState } from 'react';

/**
 * Hook to detect user's reduced motion preference
 * Returns true if user prefers reduced motion
 * 
 * @example
 * const shouldReduceMotion = useReducedMotion();
 * const duration = shouldReduceMotion ? 0.01 : 300;
 */
export function useReducedMotion(): boolean {
  const [matches, setMatch] = useState(
    typeof window !== 'undefined' 
      ? !!window.matchMedia('(prefers-reduced-motion: reduce)')?.matches 
      : false
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setMatch(e.matches);
    
    // Modern browsers
    mediaQuery.addEventListener('change', handler);
    
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return matches;
}
```

---

## 3. Animate Height Utility (`src/lib/animate-height.ts`)

```typescript
/**
 * Smoothly animate element height using WAAPI
 * Useful for expand/collapse when CSS Grid trick doesn't work
 * 
 * @param element - DOM element to animate
 * @param from - Starting height in pixels or 'auto' (measures scrollHeight)
 * @param to - Ending height in pixels or 'auto' (measures scrollHeight)
 * @param duration - Animation duration in milliseconds (default: 200)
 * @param easing - CSS easing function (default: Material standard curve)
 * @returns Animation instance (can call .cancel(), .onfinish, etc.)
 * 
 * @example
 * const element = sectionRef.current;
 * const animation = animateHeight(element, 0, 'auto', 200);
 * animation.onfinish = () => console.log('Animation complete');
 */
export function animateHeight(
  element: HTMLElement,
  from: number | 'auto',
  to: number | 'auto',
  duration = 200,
  easing = 'cubic-bezier(0.4, 0, 0.2, 1)'
): Animation {
  // Measure actual heights if 'auto'
  const fromHeight = from === 'auto' ? element.scrollHeight : from;
  const toHeight = to === 'auto' ? element.scrollHeight : to;

  // Use WAAPI for smooth, hardware-accelerated animation
  return element.animate(
    { height: [`${fromHeight}px`, `${toHeight}px`] },
    { 
      duration, 
      easing,
      fill: 'both' // Keep final state after animation ends
    }
  );
}

/**
 * Expand element from 0 to natural height
 */
export function expandElement(
  element: HTMLElement, 
  duration = 200
): Animation {
  element.style.height = '0';
  element.style.overflow = 'hidden';
  
  const animation = animateHeight(element, 0, 'auto', duration);
  
  animation.onfinish = () => {
    element.style.height = 'auto'; // Allow content to grow naturally
    element.style.overflow = '';
  };
  
  return animation;
}

/**
 * Collapse element from natural height to 0
 */
export function collapseElement(
  element: HTMLElement,
  duration = 200
): Animation {
  const currentHeight = element.scrollHeight;
  element.style.overflow = 'hidden';
  
  const animation = animateHeight(element, currentHeight, 0, duration);
  
  animation.onfinish = () => {
    element.style.height = '0';
  };
  
  return animation;
}
```

---

## 4. Modal Animation Hook (`src/hooks/useModalAnimation.ts`)

```typescript
import { useEffect, useRef } from 'react';

/**
 * Hook for modal enter/exit animations using WAAPI
 * Animates backdrop fade + content scale/slide
 * 
 * @param isOpen - Whether modal is open
 * @param onAnimationEnd - Callback when exit animation completes
 * @returns Refs to attach to backdrop and content elements
 * 
 * @example
 * function Modal({ isOpen, onClose, children }) {
 *   const [shouldRender, setShouldRender] = useState(isOpen);
 *   const { backdropRef, contentRef } = useModalAnimation(isOpen, () => {
 *     if (!isOpen) setShouldRender(false);
 *   });
 * 
 *   useEffect(() => {
 *     if (isOpen) setShouldRender(true);
 *   }, [isOpen]);
 * 
 *   if (!shouldRender) return null;
 * 
 *   return (
 *     <div ref={backdropRef} className="fixed inset-0 bg-black/50">
 *       <div ref={contentRef} className="bg-white rounded-lg">
 *         {children}
 *       </div>
 *     </div>
 *   );
 * }
 */
export function useModalAnimation(
  isOpen: boolean, 
  onAnimationEnd?: () => void
) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!backdropRef.current || !contentRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) {
      // Instant show/hide for reduced motion
      if (!isOpen) {
        onAnimationEnd?.();
      }
      return;
    }

    if (isOpen) {
      // ENTER ANIMATION (300ms, ease-out)
      backdropRef.current.animate(
        [{ opacity: 0 }, { opacity: 1 }],
        { 
          duration: 300, 
          easing: 'cubic-bezier(0, 0, 0.2, 1)', // ease-out
          fill: 'both' 
        }
      );

      contentRef.current.animate(
        [
          { 
            opacity: 0, 
            transform: 'scale(0.95) translateY(-20px)' 
          },
          { 
            opacity: 1, 
            transform: 'scale(1) translateY(0)' 
          },
        ],
        { 
          duration: 300, 
          easing: 'cubic-bezier(0, 0, 0.2, 1)', // ease-out
          fill: 'both' 
        }
      );
    } else {
      // EXIT ANIMATION (200ms, ease-in — faster dismissal)
      const backdropAnim = backdropRef.current.animate(
        [{ opacity: 1 }, { opacity: 0 }],
        { 
          duration: 200, 
          easing: 'cubic-bezier(0.4, 0, 1, 1)', // ease-in
          fill: 'both' 
        }
      );

      contentRef.current.animate(
        [
          { 
            opacity: 1, 
            transform: 'scale(1) translateY(0)' 
          },
          { 
            opacity: 0, 
            transform: 'scale(0.95) translateY(-20px)' 
          },
        ],
        { 
          duration: 200, 
          easing: 'cubic-bezier(0.4, 0, 1, 1)', // ease-in
          fill: 'both' 
        }
      );

      // Call onAnimationEnd when exit completes
      backdropAnim.onfinish = () => onAnimationEnd?.();
    }
  }, [isOpen, onAnimationEnd]);

  return { backdropRef, contentRef };
}
```

---

## 5. Dropdown Animation Hook (`src/hooks/useDropdownAnimation.ts`)

```typescript
import { useEffect, useRef } from 'react';

/**
 * Hook for dropdown menu animations
 * Animates slide-down + fade-in on open
 * 
 * @param isOpen - Whether dropdown is open
 * @param duration - Animation duration in ms (default: 150)
 * @returns Ref to attach to dropdown container
 * 
 * @example
 * const dropdownRef = useDropdownAnimation(isOpen);
 * 
 * return (
 *   <div className="relative">
 *     <button onClick={toggle}>Menu</button>
 *     {isOpen && (
 *       <div ref={dropdownRef} className="absolute top-full mt-2">
 *         <MenuItem>Item 1</MenuItem>
 *       </div>
 *     )}
 *   </div>
 * );
 */
export function useDropdownAnimation(
  isOpen: boolean,
  duration = 150
) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !dropdownRef.current) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    if (prefersReducedMotion) return;

    // Animate on enter only (exit is instant via conditional render)
    dropdownRef.current.animate(
      [
        { 
          opacity: 0, 
          transform: 'translateY(-4px)' 
        },
        { 
          opacity: 1, 
          transform: 'translateY(0)' 
        },
      ],
      { 
        duration, 
        easing: 'cubic-bezier(0, 0, 0.2, 1)', // ease-out
        fill: 'both' 
      }
    );
  }, [isOpen, duration]);

  return dropdownRef;
}
```

---

## 6. Animation Config (`src/lib/motion-config.ts`)

```typescript
/**
 * Global animation feature flags
 * Set via environment variables for easy rollback
 */

export const ANIMATION_ENABLED = {
  all: process.env.NEXT_PUBLIC_ENABLE_ANIMATIONS !== 'false',
  modals: process.env.NEXT_PUBLIC_ENABLE_MODAL_ANIMATIONS !== 'false',
  lists: process.env.NEXT_PUBLIC_ENABLE_LIST_ANIMATIONS !== 'false',
  dropdowns: process.env.NEXT_PUBLIC_ENABLE_DROPDOWN_ANIMATIONS !== 'false',
} as const;

/**
 * Get effective duration considering feature flags and reduced motion
 * 
 * @example
 * const duration = getEffectiveDuration('modals', 300);
 * // Returns 0.01 if animations disabled or reduced motion preferred
 */
export function getEffectiveDuration(
  feature: keyof typeof ANIMATION_ENABLED,
  baseDuration: number
): number {
  // Check feature flag
  if (!ANIMATION_ENABLED.all || !ANIMATION_ENABLED[feature]) {
    return 0.01; // Instant
  }

  // Check reduced motion (client-side only)
  if (typeof window !== 'undefined') {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    
    if (prefersReducedMotion) {
      return 0.01; // Instant
    }
  }

  return baseDuration;
}
```

---

## 7. Performance Monitor (`src/lib/performance-monitor.ts`)

```typescript
/**
 * Client-side animation performance monitoring
 * Logs long animation frames to console/analytics
 */

const LONG_FRAME_THRESHOLD = 50; // ms

export function initAnimationPerformanceMonitor() {
  if (typeof window === 'undefined') return;
  if (!('PerformanceObserver' in window)) {
    console.warn('[Performance] PerformanceObserver not supported');
    return;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > LONG_FRAME_THRESHOLD) {
          console.warn('[Animation Performance] Long animation frame detected:', {
            duration: `${entry.duration.toFixed(2)}ms`,
            type: entry.entryType,
            name: entry.name,
            startTime: entry.startTime,
          });

          // Optional: Send to analytics
          // analytics.track('long_animation_frame', { duration: entry.duration });
        }
      }
    });

    observer.observe({ 
      type: 'long-animation-frame', 
      buffered: true 
    });

    console.log('[Performance] Animation monitoring enabled');
  } catch (error) {
    console.warn('[Performance] Failed to initialize monitor:', error);
  }
}

// Call in _app.tsx or layout.tsx:
// if (process.env.NODE_ENV === 'development') {
//   initAnimationPerformanceMonitor();
// }
```

---

## 8. Tailwind Config Extension (`tailwind.config.ts`)

```typescript
import type { Config } from 'tailwindcss';

const config: Config = {
  // ... existing config
  theme: {
    extend: {
      // Add animation duration tokens
      transitionDuration: {
        instant: 'var(--duration-instant)',
        fast: 'var(--duration-fast)',
        normal: 'var(--duration-normal)',
        moderate: 'var(--duration-moderate)',
        slow: 'var(--duration-slow)',
      },
      
      // Add animation easing tokens
      transitionTimingFunction: {
        'ease-default': 'var(--ease-default)',
        'ease-in': 'var(--ease-in)',
        'ease-out': 'var(--ease-out)',
        'ease-in-out': 'var(--ease-in-out)',
      },

      // Optional: CSS Grid animation helper
      gridTemplateRows: {
        '0': '0fr',
        '1': '1fr',
      },

      // Optional: Scale values for click feedback
      scale: {
        '98': '0.98',
        '99': '0.99',
        '995': '0.995',
      },
    },
  },
  plugins: [],
};

export default config;
```

---

## 9. Global CSS Updates (`src/app/globals.css`)

```css
/* Add after existing Tailwind directives */

/* ========================================
   ANIMATION TOKENS
   ======================================== */

:root {
  /* Duration tokens */
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-moderate: 300ms;
  --duration-slow: 500ms;
  
  /* Easing tokens */
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);  /* Material standard */
  --ease-in: cubic-bezier(0.4, 0, 1, 1);         /* Exits/dismissals */
  --ease-out: cubic-bezier(0, 0, 0.2, 1);        /* Enters/reveals */
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);   /* Two-way (same as default) */
}

/* ========================================
   REDUCED MOTION SUPPORT
   Global safety net — disables all animations
   ======================================== */

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

/* ========================================
   UTILITY CLASSES
   ======================================== */

/* Hardware acceleration hint (use sparingly) */
.transform-gpu {
  transform: translateZ(0);
  will-change: transform;
}

/* Only apply will-change during interaction */
.hover-will-change:hover,
.focus-will-change:focus {
  will-change: transform;
}

/* ========================================
   COMPONENT-SPECIFIC ANIMATIONS
   (if not using Tailwind classes)
   ======================================== */

/* Example: Global button hover transition */
.btn {
  transition: background-color var(--duration-fast) var(--ease-in-out);
}

.btn:hover {
  /* Color changes here */
}

/* Example: Focus ring transition */
.focus-ring {
  transition: box-shadow var(--duration-fast) var(--ease-out);
}

.focus-ring:focus {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5);
}
```

---

## 10. Environment Variables (`.env.local`)

```bash
# Animation feature flags for easy rollback
NEXT_PUBLIC_ENABLE_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_MODAL_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_LIST_ANIMATIONS=true
NEXT_PUBLIC_ENABLE_DROPDOWN_ANIMATIONS=true
```

---

## 11. Example Modal Component (`src/components/ui/Modal.tsx`)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useModalAnimation } from '@/hooks/useModalAnimation';
import { cn } from '@/lib/utils'; // Assuming you have a cn() utility

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, children, className }: ModalProps) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  
  const { backdropRef, contentRef } = useModalAnimation(isOpen, () => {
    // Called when exit animation completes
    if (!isOpen) {
      setShouldRender(false);
    }
  });

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!shouldRender) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        ref={contentRef}
        className={cn(
          'relative max-h-[90vh] w-full max-w-lg overflow-auto',
          'rounded-lg bg-white p-6 shadow-xl',
          'dark:bg-gray-900',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
```

---

## 12. Example Dropdown Component (`src/components/ui/DropdownMenu.tsx`)

```typescript
'use client';

import { useState, useRef, useEffect } from 'react';
import { useDropdownAnimation } from '@/hooks/useDropdownAnimation';
import { cn } from '@/lib/utils';

interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
}

export function DropdownMenu({ 
  trigger, 
  children, 
  align = 'left' 
}: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useDropdownAnimation(isOpen);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={() => setIsOpen(!isOpen)}>
        {trigger}
      </div>

      {isOpen && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute top-full z-50 mt-2 min-w-[200px]',
            'rounded-lg border border-gray-200 bg-white shadow-lg',
            'dark:border-gray-700 dark:bg-gray-800',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full px-4 py-2 text-left text-sm',
        'transition-colors duration-fast',
        'hover:bg-gray-100 dark:hover:bg-gray-700',
        'motion-reduce:transition-none'
      )}
    >
      {children}
    </button>
  );
}
```

---

## 13. Example Expandable Section (`src/components/ui/Accordion.tsx`)

```typescript
'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AccordionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function Accordion({ 
  title, 
  children, 
  defaultOpen = false 
}: AccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between py-4 text-left',
          'transition-colors duration-fast',
          'hover:bg-gray-50 dark:hover:bg-gray-800',
          'motion-reduce:transition-none'
        )}
      >
        <span className="font-medium">{title}</span>
        <svg
          className={cn(
            'h-5 w-5 transition-transform duration-fast',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* CSS Grid expand/collapse animation */}
      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-normal ease-default',
          'motion-reduce:transition-none',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden">
          <div className="pb-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 14. Testing Utilities (`src/lib/test-utils/animation-helpers.ts`)

```typescript
/**
 * Helper functions for testing animations in Playwright/Cypress
 */

/**
 * Wait for animation to complete
 * @param element - Element being animated
 * @param timeout - Max wait time in ms
 */
export async function waitForAnimation(
  element: HTMLElement,
  timeout = 1000
): Promise<void> {
  const animations = element.getAnimations();
  
  if (animations.length === 0) return;

  await Promise.race([
    Promise.all(animations.map(anim => anim.finished)),
    new Promise((resolve) => setTimeout(resolve, timeout)),
  ]);
}

/**
 * Check if element is currently animating
 */
export function isAnimating(element: HTMLElement): boolean {
  return element.getAnimations().length > 0;
}

/**
 * Get total animation duration for element
 */
export function getAnimationDuration(element: HTMLElement): number {
  const animations = element.getAnimations();
  
  if (animations.length === 0) return 0;

  return Math.max(...animations.map(anim => {
    const effect = anim.effect as KeyframeEffect;
    const timing = effect.getTiming();
    return (timing.duration as number) || 0;
  }));
}
```

---

**End of Code Templates** — All utilities ready to copy-paste into your project.
