# Animation Implementation PR Template

## Wave Number
- [ ] Wave 1: Foundation
- [ ] Wave 2: Expand/Collapse
- [ ] Wave 3: Click Feedback
- [ ] Wave 4: Modals & Overlays
- [ ] Wave 5: List Selection & Hover
- [ ] Wave 6: Dropdown/Context Menu

---

## Changes Summary

### Files Modified
<!-- List all modified files with brief description -->
- `src/components/Sidebar.tsx`: Replaced inline transitions with Tailwind tokens
- `src/components/ui/Modal.tsx`: Added WAAPI enter/exit animations
- ...

### Animation Patterns Used
<!-- Check all that apply -->
- [ ] CSS Transitions (hover, focus, colors)
- [ ] CSS Grid `grid-template-rows` (expand/collapse)
- [ ] WAAPI `element.animate()` (multi-property, dynamic values)
- [ ] Framer Motion `AnimatePresence` (conditional render enter/exit)
- [ ] Other: ___________

### Duration & Easing
<!-- Specify tokens used -->
- Duration: `duration-fast` (150ms) | `duration-normal` (200ms) | `duration-moderate` (300ms)
- Easing: `ease-default` | `ease-in` | `ease-out` | `ease-in-out`

---

## Performance Validation

### Pre-Merge Checklist
- [ ] **Only compositor-friendly properties**: `transform`, `opacity`, `filter`, `clip-path` (no `height`, `width`, `top`, `left`)
- [ ] **Reduced motion support**: All animations include `motion-reduce:` variant OR use `useReducedMotion()` hook
- [ ] **Duration budget**: All UI animations ≤300ms (exceptions documented)
- [ ] **No always-on `will-change`**: Applied only during interaction (`:hover`, `:focus`, `.animating` class)
- [ ] **Chrome DevTools Performance check**: Recorded interaction, zero purple (layout) bars during animation
- [ ] **Mobile Safari test**: Tested on real iOS device OR used BrowserStack/Sauce Labs

### Performance Metrics (Before/After)

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Lighthouse Performance Score | ___ | ___ | ___ |
| Total Blocking Time (TBT) | ___ ms | ___ ms | ___ ms |
| Bundle size (gzip) | ___ KB | ___ KB | ___ KB |
| Animation frame time (p95) | ___ ms | ___ ms | ___ ms |

**How to measure**:
1. Lighthouse: `npm run build && npx lighthouse http://localhost:3000/dashboard --view`
2. Bundle: `npx next-bundle-analyzer` or check build output
3. Frame time: DevTools Performance → Record interaction → Check frame chart

---

## Accessibility Validation

- [ ] **Reduced motion toggle**: Tested with DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`
  - Expected: Animations complete in <50ms (0.01ms duration)
- [ ] **Keyboard navigation**: All interactive elements reachable via Tab, animations don't trap focus
- [ ] **Screen reader**: Tested with VoiceOver (macOS) or NVDA (Windows)
  - Expected: Focus announcements not interrupted by animations
- [ ] **WAVE audit**: No new accessibility errors introduced

---

## Visual Regression Testing

### Manual QA
<!-- Check each device tested -->
- [ ] **Chrome Desktop** (macOS/Windows)
- [ ] **Safari Desktop** (macOS)
- [ ] **Mobile Safari** (iOS 15+)
- [ ] **Chrome Mobile** (Android 11+)
- [ ] **Low-end device simulation**: Chrome DevTools CPU throttling 4x slowdown

### Playwright Tests (if applicable)
<!-- Paste test results or link to CI run -->
```bash
npm run test:e2e -- --grep "animation"
```

**Results**: ✅ All passed | ❌ X tests failed (documented below)

---

## Edge Cases & Browser Compatibility

### Known Issues
<!-- Document any quirks or workarounds -->
- **iOS Safari 15.x**: `backdrop-filter: blur()` causes compositing lag → replaced with `bg-white/95`
- **Firefox <100**: `clip-path` animations not hardware accelerated → fallback to opacity-only
- None

### Browser Support
<!-- Check all tested browsers -->
- [ ] Chrome 90+
- [ ] Safari 15+
- [ ] Firefox 90+
- [ ] Edge 90+
- [ ] Mobile Safari 15+
- [ ] Chrome Mobile 90+

---

## Rollback Plan

### Feature Flag
<!-- If using feature flags -->
- Env var: `NEXT_PUBLIC_ENABLE_MODAL_ANIMATIONS=true`
- Rollback command: Set to `false` and redeploy

### Manual Rollback
<!-- If no feature flag -->
1. Revert this PR: `git revert <commit-sha>`
2. Redeploy to production
3. Estimated rollback time: <10 minutes

### Affected Components
<!-- List components that will revert to instant/no animation -->
- `Modal.tsx`: Reverts to instant show/hide
- `Sidebar.tsx`: Reverts to instant hover state
- ...

---

## Screenshots/Videos

### Before
<!-- Paste screenshot or video URL -->

### After
<!-- Paste screenshot or video URL -->

### Reduced Motion
<!-- Paste screenshot showing instant transitions -->

---

## Additional Notes
<!-- Anything else reviewers should know -->

- Migration path for remaining components: (if partial rollout)
- Dependencies on other PRs: (if blocked)
- Future improvements: (if known limitations)

---

## Reviewer Checklist

### Code Review
- [ ] Animation tokens used consistently (no hardcoded durations/easings)
- [ ] No layout-triggering properties in transitions
- [ ] `useReducedMotion` hook imported correctly (if used)
- [ ] No `will-change` in static styles
- [ ] TypeScript errors resolved
- [ ] ESLint warnings addressed

### Functional Review
- [ ] Animations look smooth (no jank)
- [ ] Timing feels appropriate (not too fast/slow)
- [ ] Reduced motion works as expected
- [ ] No visual regressions in other components
- [ ] Mobile Safari tested (if applicable)

### Performance Review
- [ ] DevTools Performance recording reviewed (no layout thrashing)
- [ ] Bundle size increase acceptable (<10 KB)
- [ ] Lighthouse score no worse than baseline

---

**Merge Criteria**: All checkboxes ✅ + 1 approving review from core team

---

**Related Issues**: Closes #___
**Documentation**: Updated in `dev_plan/UI_ANIMATION_IMPLEMENTATION_PLAN.md`
