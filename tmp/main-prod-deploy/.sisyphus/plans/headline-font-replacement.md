# Headline Font Replacement Plan

## TL;DR

> **Quick Summary**: Replace 6 inline `fontFamily: "Georgia, serif"` overrides in dashboard/page.tsx with design system token `var(--font-serif)` to align headlines with Libre Caslon Condensed (curvy serif).
> 
> **Deliverables**:
> - Updated `dashboard/page.tsx` with consistent typography
> - All headlines using design system `--font-serif` token
> 
> **Estimated Effort**: Quick (< 30 min)
> **Parallel Execution**: NO - single file, sequential edits
> **Critical Path**: Edit file → Verify visually

---

## Context

### Original Request
Replace headline fonts to match settings page curvy serif, aligned with dev_plan typography tokens.

### Interview Summary
**Key Discussions**:
- Settings page uses `<h1>` tags without inline styles → relies on global heading rule → shows Libre Caslon Condensed
- Dashboard page has 6 inline `fontFamily: "Georgia, serif"` overrides that bypass global rule
- User confirmed StatCard count numbers should also use curvy serif (`--font-serif`)

**Research Findings**:
- `globals.css` lines 120-124: Global rule applies `--font-serif` to all h1-h6 elements
- `--font-serif: "Libre Caslon Condensed"` defined in globals.css line 75
- Other files (Badge.tsx, login/page.tsx, no-batch/page.tsx) already use tokens correctly
- `dev_plan/05_DESIGN_SYSTEM.md` confirms: headings = Libre Caslon Condensed

---

## Work Objectives

### Core Objective
Remove hardcoded Georgia font overrides and leverage existing design system typography for visual consistency.

### Concrete Deliverables
- `founder-sprint/src/app/(dashboard)/dashboard/page.tsx` updated with 6 font changes

### Definition of Done
- [ ] No inline `fontFamily: "Georgia, serif"` in dashboard/page.tsx
- [ ] All headings render with Libre Caslon Condensed (verified in browser dev tools)

### Must Have
- All 6 identified overrides corrected
- Visual consistency with settings page headings

### Must NOT Have (Guardrails)
- Do NOT modify globals.css or any CSS variable definitions
- Do NOT change font files or font-face declarations
- Do NOT modify other pages (login, settings, no-batch, etc.)
- Do NOT change font sizes, weights, or other typography properties
- Do NOT add new CSS classes - use existing infrastructure

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: N/A (visual/styling change)
- **User wants tests**: Manual visual verification
- **Framework**: Browser dev tools inspection

### Automated Verification (Agent-Executable)

Each change will be verified via browser dev tools:

```
# Agent executes via playwright browser automation:
1. Navigate to: http://localhost:3000/dashboard
2. Open browser dev tools → Inspect heading elements
3. For each heading (h1, h2):
   - Select element
   - Check Computed tab → font-family
   - Assert: Shows "Libre Caslon Condensed" (not "Georgia")
4. Screenshot: .sisyphus/evidence/headline-font-verification.png
```

---

## Execution Strategy

### Sequential Execution (Single File)

This is a simple refactoring task confined to one file. No parallel execution needed.

```
Task 1: Edit dashboard/page.tsx
  └── Remove/replace 6 inline fontFamily declarations
  └── Verify in browser
```

---

## TODOs

- [ ] 1. Replace inline fontFamily overrides in dashboard/page.tsx

  **What to do**:
  
  **For heading elements (h1, h2) - REMOVE inline fontFamily entirely:**
  
  | Line | Current | Action |
  |------|---------|--------|
  | 95 | `style={{ fontFamily: "Georgia, serif" }}` | Remove `fontFamily` from style object |
  | 113 | `style={{ fontFamily: "Georgia, serif", color: "var(--color-foreground)" }}` | Keep only `color`, remove `fontFamily` |
  | 163 | `style={{ fontFamily: "Georgia, serif" }}` | Remove entire `style` prop |
  | 209 | `style={{ fontFamily: "Georgia, serif" }}` | Remove entire `style` prop |
  | 250 | `style={{ fontFamily: "Georgia, serif", color: "var(--color-foreground)" }}` | Keep only `color`, remove `fontFamily` |

  **For non-heading element (p) - CHANGE to CSS variable:**
  
  | Line | Current | New |
  |------|---------|-----|
  | 299 | `fontFamily: "Georgia, serif"` | `fontFamily: "var(--font-serif)"` |

  **Must NOT do**:
  - Do not change any other style properties (color, fontSize, etc.)
  - Do not modify any other files
  - Do not add new CSS classes

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple string replacement task, single file, low complexity
  - **Skills**: None required
    - This is basic text editing with no special domain knowledge needed

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (single task)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **File to Edit**:
  - `founder-sprint/src/app/(dashboard)/dashboard/page.tsx` - All 6 lines requiring changes

  **Pattern References** (how typography should work):
  - `founder-sprint/src/app/globals.css:120-124` - Global heading rule that applies `--font-serif` to h1-h6
  - `founder-sprint/src/app/globals.css:75` - `--font-serif` variable definition
  - `founder-sprint/src/app/(dashboard)/settings/page.tsx:23,29` - Example of correct approach: plain `<h1>` tags without inline font styles

  **Design System Reference**:
  - `dev_plan/05_DESIGN_SYSTEM.md:32-77` - Typography tokens specification

  **WHY Each Reference Matters**:
  - `globals.css:120-124`: Proves that removing inline fontFamily from headings will automatically apply correct font
  - `settings/page.tsx`: Shows the target behavior - headings without inline font overrides
  - `dev_plan/05_DESIGN_SYSTEM.md`: Authoritative source confirming Libre Caslon Condensed for headings

  **Acceptance Criteria**:

  **Code verification (grep check):**
  ```bash
  # Agent runs after edits:
  grep -n "Georgia" founder-sprint/src/app/\(dashboard\)/dashboard/page.tsx
  # Assert: No output (zero matches)
  ```

  **Visual verification (using playwright skill):**
  ```
  # Agent executes via playwright browser automation:
  1. Ensure dev server running: `bun run dev` in founder-sprint/
  2. Navigate to: http://localhost:3000/dashboard
  3. Wait for page to fully load
  4. Inspect <h1> element with text "Welcome back, [name]"
  5. Assert: Computed font-family includes "Libre Caslon Condensed"
  6. Inspect <h2> elements (Recent Questions, Upcoming Events, etc.)
  7. Assert: Computed font-family includes "Libre Caslon Condensed"
  8. Screenshot: .sisyphus/evidence/headline-font-after.png
  ```

  **Evidence to Capture:**
  - [ ] Terminal output from grep command showing zero Georgia matches
  - [ ] Screenshot of dashboard with dev tools showing font-family

  **Commit**: YES
  - Message: `fix(dashboard): replace Georgia font overrides with design system tokens`
  - Files: `src/app/(dashboard)/dashboard/page.tsx`
  - Pre-commit: `bun run build` (ensures no TypeScript errors)

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `fix(dashboard): replace Georgia font overrides with design system tokens` | `src/app/(dashboard)/dashboard/page.tsx` | `grep Georgia` returns empty |

---

## Success Criteria

### Verification Commands
```bash
# Check no Georgia font references remain
grep -c "Georgia" founder-sprint/src/app/\(dashboard\)/dashboard/page.tsx
# Expected: 0

# Build succeeds
cd founder-sprint && bun run build
# Expected: Build successful
```

### Final Checklist
- [ ] Zero inline `fontFamily: "Georgia, serif"` in dashboard/page.tsx
- [ ] All headings use Libre Caslon Condensed (visually verified)
- [ ] Build passes without errors
- [ ] StatCard numbers display in curvy serif
