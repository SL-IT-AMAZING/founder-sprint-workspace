# Subtle Motion Rollout Plan (Low-Latency)

## Goal

Add small, smooth, almost-unnoticeable UI animations for expand/collapse, open/close, hover/select, and click/press interactions with minimal delay and no jank.

---

## Inputs Verified

- Codebase currently uses scattered inline CSS transitions, mostly `0.15s-0.2s`.
- `framer-motion` is installed (`founder-sprint/package.json`) but mostly unused in app code.
- Interaction-heavy surfaces already identified:
  - `src/app/(dashboard)/messages/ConversationList.tsx`
  - `src/components/layout/DashboardSidebar.tsx`
  - `src/components/ui/DropdownMenu.tsx`
  - `src/components/ui/Modal.tsx`
  - `src/app/(dashboard)/messages/BrowseGroupsModal.tsx`
  - `src/app/(dashboard)/messages/CreateGroupModal.tsx`
  - `src/components/bookface/DirectoryFilters.tsx`

---

## External Guidance Used

- MDN `prefers-reduced-motion` guidance
- web.dev high-performance animation guidance (transform/opacity-first)
- Motion docs (React) for `AnimatePresence`, layout/exit transitions, and reduced-motion support

---

## Motion Principles (Product-Safe)

1. **Fast by default**: interactive feedback in `100-200ms`.
2. **Subtle amplitude**: tiny movement/scale only (no flashy motion).
3. **Transform + opacity first**: avoid layout-thrashing properties where possible.
4. **No added wait time**: animations should never delay click handling.
5. **Respect reduced motion**: motion reduced/disabled via media query and runtime hook.

---

## Motion Tokens (Single Source of Truth)

Add global tokens in `src/app/globals.css` (or equivalent):

- `--motion-fast: 120ms` (press feedback)
- `--motion-base: 180ms` (hover/select)
- `--motion-slow: 240ms` (menus/modals/collapse)
- `--ease-standard: cubic-bezier(0.2, 0, 0, 1)`
- `--ease-emphasized: cubic-bezier(0.4, 0, 0.2, 1)`

Use defaults:

- Hover/select: `180ms var(--ease-standard)`
- Press/tap: `120ms var(--ease-standard)`
- Open/close: `220-240ms var(--ease-emphasized)`

---

## Technology Decision Rule

- **CSS transitions** (default): hover, press, color/opacity, simple dropdown reveal.
- **Framer Motion** (targeted): enter/exit coordination (`AnimatePresence`) for modal/context menu/panel where mount/unmount timing matters.
- **WAAPI**: not needed in phase 1 (adds complexity for little gain in this app).

---

## Rollout Waves (Low Risk)

### Wave 1 - Core feel upgrades (quick wins)

1. `src/components/ui/DropdownMenu.tsx`
   - Add subtle scale+fade on open/close.
   - Keep click latency immediate.
2. `src/app/(dashboard)/messages/ConversationList.tsx`
   - Smooth menu open/close for three-dot/context menu.
   - Add slight list-row select transition consistency.

**Explicit exclusion**
- Do **not** modify buttons that already have text-slide animation (`.btn-text-wrap`, `.btn-text-initial`, `.btn-text-reveal`, `.hover-slide`).
- Keep existing animated button behavior unchanged.

### Wave 2 - Expand/collapse and panel smoothness

1. `src/components/layout/DashboardSidebar.tsx`
   - Replace abrupt `max-height` behavior with smoother collapse pattern.
   - Keep chevron rotation synced with panel state.
2. `src/components/bookface/DirectoryFilters.tsx`
   - Smooth section expand/collapse and icon rotation.

### Wave 3 - Modal and dialog polish

1. `src/components/ui/Modal.tsx`
2. `src/app/(dashboard)/messages/BrowseGroupsModal.tsx`
3. `src/app/(dashboard)/messages/CreateGroupModal.tsx`
   - Add subtle backdrop fade and content scale/fade in/out.
   - Ensure focus behavior remains correct while animating.

---

## Performance Guardrails

- Prefer animating: `transform`, `opacity`.
- Avoid animating large-layout props unless necessary: `height`, `width`, `top`, `left`.
- If height animation is needed, use bounded collapse strategy and clip overflow.
- Do not use long durations (`>300ms`) for primary interactions.
- Avoid broad `transition: all`; transition only specific properties.
- Use `will-change` sparingly and only on hot elements.

---

## Accessibility Requirements

Add reduced-motion behavior globally:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 1ms !important;
  }
}
```

For Framer Motion paths, check reduced motion and switch to instant state changes.

---

## Validation Plan (Proof, Not Vibes)

For each wave:

1. **Functional**
   - Interactions still trigger immediately (no blocked click/send/open).
2. **Performance**
   - No visible frame drops on key surfaces.
   - No extra network or async delay introduced.
3. **Accessibility**
   - Reduced-motion mode disables/reduces movement.
   - Keyboard and focus behavior unchanged.
4. **Regression**
   - `npx tsc --noEmit`
   - `npm run build`

---

## Risks and Mitigation

- **Risk**: Over-animating makes UI feel slower.
  - **Mitigation**: keep durations <= 240ms and scope to key interactions only.
- **Risk**: Expand/collapse jank.
  - **Mitigation**: avoid expensive layout animations; keep content clipping simple.
- **Risk**: Test flakiness due to animated timing.
  - **Mitigation**: reduced-motion mode for automated tests where needed.

---

## Implementation Checklist

- [ ] Add motion tokens to global styles
- [ ] Add reduced-motion global guard
- [ ] Wave 1 components updated + verified
- [ ] Wave 2 components updated + verified
- [ ] Wave 3 components updated + verified
- [ ] Full typecheck/build pass
- [ ] Short before/after UX review on messages + sidebar + modal flows

---

## Suggested Execution Order

1. Ship Wave 1 first (highest UX impact, lowest risk).
2. Validate for one full day of normal use.
3. Ship Wave 2.
4. Ship Wave 3 last (modal/focus-sensitive).
