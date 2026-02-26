# UI Animation Implementation — Getting Started

**Implementation-ready plan for low-latency subtle animations in Next.js dashboard**

---

## 📁 Files in This Package

| File | Purpose | When to Use |
|------|---------|-------------|
| **`UI_ANIMATION_IMPLEMENTATION_PLAN.md`** | Complete implementation plan with 6 rollout waves | Read first — your roadmap |
| **`ANIMATION_QUICK_REFERENCE.md`** | Copy-paste patterns for common use cases | During development — quick lookup |
| **`ANIMATION_CODE_TEMPLATES.md`** | Full source code for all shared utilities | During development — copy utilities |
| **`ANIMATION_PR_TEMPLATE.md`** | PR checklist and validation criteria | Before opening PRs — quality gate |
| **`ANIMATION_README.md`** (this file) | Quick start guide | Start here |

---

## 🚀 Quick Start (30 Minutes)

### Step 1: Read the Plan (10 min)
Open `UI_ANIMATION_IMPLEMENTATION_PLAN.md` and read:
- Section 1: Motion principles (what makes animations subtle)
- Section 2: Technology decision matrix (when to use CSS vs WAAPI vs Motion)
- Section 3: Wave 1 scope (foundation — your first PR)

### Step 2: Set Up Tokens (10 min)
1. Copy `src/lib/motion-tokens.ts` from `ANIMATION_CODE_TEMPLATES.md` → create file
2. Copy CSS variables block → paste into `src/app/globals.css`
3. Copy Tailwind config extension → merge into `tailwind.config.ts`
4. Run `npm run dev` → verify no errors

### Step 3: First Component (10 min)
1. Open `src/components/Sidebar.tsx`
2. Find any inline `style={{ transition: 'background-color 0.2s ease' }}`
3. Replace with Tailwind: `className="transition-colors duration-fast motion-reduce:transition-none"`
4. Test hover state in browser
5. Test reduced motion: DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`

**Checkpoint**: Hover works, reduced motion disables it → you're ready for Wave 1!

---

## 📋 Implementation Order

Work through waves sequentially (each builds on previous):

| Wave | Scope | Duration | Files Changed |
|------|-------|----------|---------------|
| **Wave 1** | Foundation + CSS-only transitions | 2 days | 15 files |
| **Wave 2** | Expand/collapse with WAAPI | 3 days | 5 files |
| **Wave 3** | Click feedback | 2 days | 10 files |
| **Wave 4** | Modals & overlays | 4 days | 6 files |
| **Wave 5** | List hover states | 2 days | 3 files |
| **Wave 6** | Dropdowns | 2 days | 3 files |

**Total: ~18 days (3.5 weeks) + 3 days QA = 4 weeks**

---

## 🎯 Key Principles (Remember These)

### 1. Performance First
- ✅ Only animate: `transform`, `opacity`, `filter`, `clip-path`
- ❌ Never animate: `height`, `width`, `top/left`, `margin`, `padding`

### 2. Subtle Timing
- Hover: 150ms
- Click: 100ms
- Expand: 200ms
- Modal enter: 300ms
- Modal exit: 200ms (faster dismissal)

### 3. Reduced Motion Always
Every animation MUST support `prefers-reduced-motion`:
- CSS: `motion-reduce:transition-none`
- JS: `useReducedMotion()` hook

### 4. Technology Selection
```
Simple hover/focus → CSS Transitions
Expand/collapse → CSS Grid OR WAAPI
Modal enter/exit → WAAPI
Spring physics → Framer Motion (only if needed)
```

---

## 🛠️ Shared Utilities to Create

Before starting Wave 1, create these files from `ANIMATION_CODE_TEMPLATES.md`:

1. ✅ `src/lib/motion-tokens.ts` — Duration/easing constants
2. ✅ `src/hooks/useReducedMotion.ts` — Accessibility hook
3. ⏸️ `src/lib/animate-height.ts` — For Wave 2 (expand/collapse)
4. ⏸️ `src/hooks/useModalAnimation.ts` — For Wave 4 (modals)
5. ⏸️ `src/hooks/useDropdownAnimation.ts` — For Wave 6 (dropdowns)

**Wave 1 only needs items 1-2.** Create others when you reach those waves.

---

## 📊 How to Validate (Before Merging)

### Automated Checks
- [ ] Build succeeds: `npm run build`
- [ ] TypeScript: `npm run type-check`
- [ ] Linter: `npm run lint`

### Manual QA (5 minutes)
1. **Visual**: Animation looks smooth (no jank)
2. **Timing**: Chrome DevTools → Performance → Record interaction
   - Zero purple bars (layout) during animation
   - Green (paint) <5ms per frame
   - Yellow (JS) <10ms per frame
3. **Reduced Motion**: Toggle in DevTools → Rendering panel
   - Animation completes in <50ms (instant)
4. **Mobile**: Test on real iOS device OR BrowserStack

### Performance Budget
- Lighthouse Performance Score: >80 (no regression)
- Total Blocking Time: <200ms
- Bundle size increase: <10 KB

**Use `ANIMATION_PR_TEMPLATE.md` for full checklist before opening PR.**

---

## 🔥 Troubleshooting

### Problem: Animation feels janky
**Diagnosis**: Open DevTools → Performance → Record interaction → Look for purple bars (layout)  
**Fix**: You're animating `height`, `width`, or other layout-triggering property → Use CSS Grid trick or `transform: scaleY()` instead

### Problem: Animation doesn't respect reduced motion
**Diagnosis**: Missing `motion-reduce:` class or `useReducedMotion()` check  
**Fix**: Add `motion-reduce:transition-none` to Tailwind className OR wrap WAAPI code in:
```typescript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) return;
```

### Problem: Modal flashes on close
**Diagnosis**: Conditional render removes element before exit animation completes  
**Fix**: Use `shouldRender` state pattern from `useModalAnimation` (see templates)

### Problem: Bundle size increased by >50 KB
**Diagnosis**: Accidentally imported all of `framer-motion`  
**Fix**: Import only what you need:
```typescript
// ❌ BAD: Imports entire library
import { motion } from 'framer-motion';

// ✅ GOOD: Tree-shakable imports
import { motion } from 'framer-motion/dist/framer-motion';
// OR use motion/mini for smaller bundle
```

### Problem: Hover state too slow on mobile
**Diagnosis**: 150ms feels sluggish on touchscreens  
**Fix**: Reduce to 100ms for touch devices:
```typescript
const isTouchDevice = 'ontouchstart' in window;
const duration = isTouchDevice ? 100 : 150;
```

---

## 🎨 Design Tokens Reference

Quick lookup for common values:

### Durations
```typescript
DURATION.instant   // 100ms — Click feedback
DURATION.fast      // 150ms — Hover states
DURATION.normal    // 200ms — Expand/collapse
DURATION.moderate  // 300ms — Modal enter
DURATION.slow      // 500ms — Page transitions (rare)
```

### Easings
```typescript
EASING.default   // cubic-bezier(0.4, 0, 0.2, 1) — General purpose
EASING.in        // cubic-bezier(0.4, 0, 1, 1)   — Exits
EASING.out       // cubic-bezier(0, 0, 0.2, 1)   — Enters
EASING.inOut     // cubic-bezier(0.4, 0, 0.2, 1) — Two-way
```

### Tailwind Classes
```css
duration-instant   // 100ms
duration-fast      // 150ms
duration-normal    // 200ms
duration-moderate  // 300ms
duration-slow      // 500ms

ease-default       // Material standard curve
ease-in            // Exit/dismissal
ease-out           // Enter/reveal
ease-in-out        // Two-way
```

---

## 📦 Dependencies

### Already Installed
- ✅ `framer-motion` (v12.29.2) — Currently unused, will use in Wave 4+ if needed
- ✅ `tailwindcss` — For utility classes

### No New Dependencies Needed
Wave 1-3 are **100% CSS** — zero bundle cost!

Wave 4+ may use `framer-motion` for `AnimatePresence` only (adds ~18 KB gzip).

---

## 🔄 Rollback Plan

### Feature Flags (Set in `.env.local`)
```bash
NEXT_PUBLIC_ENABLE_ANIMATIONS=true           # Master kill switch
NEXT_PUBLIC_ENABLE_MODAL_ANIMATIONS=true     # Wave 4 only
NEXT_PUBLIC_ENABLE_LIST_ANIMATIONS=true      # Wave 5 only
NEXT_PUBLIC_ENABLE_DROPDOWN_ANIMATIONS=true  # Wave 6 only
```

### Emergency Rollback (Production Issue)
1. Set `NEXT_PUBLIC_ENABLE_ANIMATIONS=false`
2. Redeploy (Next.js inlines at build time)
3. All animations instant (0.01ms)

### Per-Wave Rollback (QA Failure)
1. Revert PR for that wave only
2. Keep Wave 1 (CSS-only, zero risk)
3. Re-plan failed wave

---

## ✅ Success Criteria (6 Weeks Post-Launch)

| Metric | Target |
|--------|--------|
| **User feedback** | "Feels smoother/faster" >60% in NPS survey |
| **Lighthouse Score** | >80 (no regression) |
| **Time to Interactive** | <2.5s (no regression) |
| **Long Animation Frames** | 0 events >50ms |
| **Accessibility Audit** | 0 errors (WAVE) |
| **Bundle Size** | <255 KB (+10 KB max) |

---

## 📚 Learning Resources

- **Web Animations API**: https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API
- **Framer Motion Performance**: https://motion.dev/docs/performance
- **Google web.dev Animations**: https://web.dev/articles/animations-guide
- **Reduced Motion**: https://web.dev/prefers-reduced-motion/

---

## 🤝 Questions?

Before starting:
1. Read `UI_ANIMATION_IMPLEMENTATION_PLAN.md` (comprehensive plan)
2. Check `ANIMATION_QUICK_REFERENCE.md` (copy-paste patterns)
3. Use `ANIMATION_CODE_TEMPLATES.md` (full source code)
4. Follow `ANIMATION_PR_TEMPLATE.md` (validation checklist)

**Ready to start?** → Begin with Wave 1 in the implementation plan.

---

**Last Updated**: 2026-02-25  
**Status**: Ready for implementation  
**Estimated Completion**: 4 weeks (18 days dev + 3 days QA)
