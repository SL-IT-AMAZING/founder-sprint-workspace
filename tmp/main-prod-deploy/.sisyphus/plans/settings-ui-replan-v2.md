# Profile Settings UI Replan (Screenshot-Aligned)

## Intent
Replan the `/settings` experience so it feels like the screenshot style (Bookface profile-like layout) instead of a dense single-form admin screen.

## Screenshot Baseline Used
- Primary reference: `screenshots/clean/screenshot_30.png` (own profile-style layout with header, tabs, two-column content, right sidebar, per-section Edit/Add actions)
- Secondary reference: `screenshots/clean/screenshot_29.png` (lower section rhythm: Experience/Education/News/Photos card stack + action placement)

## Hard Constraints
- Keep existing product colors (no purple): primary `#1A1A1A`, border `#e0e0e0`, text `#2F2C26`, muted `#666666`
- New/updated UI must use existing color tokens/palette only; do not introduce a new brand accent
- Keep existing routes and data model (no schema changes)
- Preserve permissions and role behavior
- Use inline style for visual properties (match current repo convention)
- Keep current server actions (`updateExtendedProfile`, `add/update/deleteExperience`, `add/update/deleteEducation`)

## Assumptions Locked for This Replan
- Screenshot truth set for settings parity: `screenshot_30` (top shell + side rail behavior) + `screenshot_29` (lower section rhythm and action placement)
- Save behavior is explicit and **per-section** for this replan (no autosave, no global sticky save)
- Onboarding mode (`?onboarding=true`) and GroupSelector stay supported and must be fitted into the new shell (not removed)

## Verification Fixture (Locked)
- Use one deterministic fixture account for screenshot and QA comparison:
  - role: `founder`
  - email: `test-founder@example.com` (from `founder-sprint/e2e/global-setup.ts`)
  - authenticated state file: `founder-sprint/e2e/.auth/founder.json`
  - batch assigned
  - at least 2 Experience entries
  - at least 1 Education entry
  - has location + social links populated
- Use same fixture for desktop/mobile captures so section content does not drift between runs.

### Fixture Setup Procedure (Repeatable)
1. Refresh auth fixtures by running any Playwright spec once (this triggers `e2e/global-setup.ts` and regenerates `e2e/.auth/*.json`).
2. Run a deterministic fixture prep script (`founder-sprint/scripts/prepare-settings-fixture.mjs`) that:
   - upserts founder user by email `test-founder@example.com`
   - normalizes location/social fields
   - resets then inserts canonical Experience (2 rows)
   - resets then inserts canonical Education (1 row)
3. Verify fixture state before screenshot capture:
   - Experience count = 2
   - Education count = 1
4. Keep fixture data unchanged for all screenshot capture passes in this plan.

## Why Current UI Feels Weird
- `/settings` currently stacks many unrelated controls in one long form card (`ProfileForm.tsx`) without the profile-page hierarchy users expect.
- Experience/Education sections are functionally correct but visually disconnected from the screenshot pattern (section title/action hierarchy and row-level affordances).
- Right-rail context is missing in settings, while screenshot style relies on a two-column mental model (content + context).

## Target UX Blueprint (Must Match)
1. Two-column page body: main content + right sidebar.
2. Section cards with clear headers and right-aligned actions.
3. "Add Experience" and "Add Education" in section header row.
4. Row-level "Edit" affordance on each experience/education item.
5. Profile-related context in sidebar (batch/location/social) to mirror screenshot feel.
6. Explicit save behavior, no silent autosave.
7. Onboarding + GroupSelector placement remains coherent in the same visual system.

---

## Implementation Plan

### Phase 0 — Deterministic Fixture Prep
**Files**
- `founder-sprint/scripts/prepare-settings-fixture.mjs` (new)
- `founder-sprint/package.json` (add `prepare:settings-fixture` script)

**Changes**
- Add a deterministic prep script for `test-founder@example.com` to reset and seed canonical settings/profile data used for screenshot QA.
- Script command (locked): `npm run prepare:settings-fixture`

**Acceptance checks**
- Script runs without manual DB edits.
- Fixture verification output confirms Experience=2, Education=1 for the founder fixture user.

### Phase 1 — Page Shell Realignment
**Files**
- `founder-sprint/src/app/(dashboard)/settings/page.tsx`
- `founder-sprint/src/app/(dashboard)/settings/SettingsSidebar.tsx` (new)
- `founder-sprint/src/app/(dashboard)/settings/SettingsSectionCard.tsx` (new)

**Changes**
- Convert settings body to screenshot-like 2-column layout (`1fr + ~320px`) on desktop, single-column on mobile.
- Keep current top title, but move profile identity block into a dedicated top card that visually matches profile page sections.
- Add reusable section wrapper for consistent border, radius, padding, title, and action slot.
- Place onboarding banner and GroupSelector in predictable order:
  - onboarding banner (when present)
  - GroupSelector card (founder/co_founder only, when present)
  - profile/settings content sections

**Acceptance checks**
- At desktop `1536x960`, layout is 2-column and sidebar width is between `300px-340px`.
- At mobile `390x844`, layout is single-column with no horizontal overflow.
- Section card style is consistent: border `1px #e0e0e0`, radius `8px`, section padding between `20px-24px`.
- GroupSelector and onboarding state render correctly in both desktop and mobile flows.

### Phase 2 — Basic Info Editing Pattern
**Files**
- `founder-sprint/src/app/(dashboard)/settings/ProfileForm.tsx`

**Changes**
- Split the current giant form into grouped blocks:
  - Identity (name, headline)
  - Work (job title, company)
  - Bio
  - Location + links (linkedin/twitter/website)
  - Avatar/profile image URL
- Use section header + right-side action pattern (Edit/Save/Cancel) instead of one large bottom-only submit feel.
- Use explicit per-section save only (no global save bar in this phase).
- Preserve existing validation and message behavior.

**Acceptance checks**
- User can edit a subset (e.g., headline only) without scanning the entire long form.
- Save/Cancel visibility is obvious and consistent.
- No regression in `updateExtendedProfile` payload.
- Dirty state is visible before save and clears after successful save.

### Phase 3 — Experience/Education Visual Matching
**Files**
- `founder-sprint/src/app/(dashboard)/settings/ExperienceSection.tsx`
- `founder-sprint/src/app/(dashboard)/settings/EducationSection.tsx`

**Changes**
- Make section header/action row match screenshot rhythm.
- Keep Add action in top-right header.
- Render list rows with stronger screenshot alignment:
  - left icon block
  - title/company/date stack
  - right Edit action
- Keep existing CRUD logic; adjust only presentation and interaction polish.
- Replace browser `confirm()` delete with one standardized inline confirm pattern:
  - first click enters confirm state for that row
  - show inline "Confirm delete" and "Cancel"
  - second action commits/cancels

**Acceptance checks**
- Each row has a clear right-side edit affordance.
- Empty state copy and spacing match screenshot tone.
- CRUD still succeeds and revalidates profile path.
- Row visual hierarchy matches screenshot pattern: icon block -> content stack -> right action.

### Phase 4 — Sidebar Context Block
**Files**
- `founder-sprint/src/app/(dashboard)/settings/SettingsSidebar.tsx` (new)
- `founder-sprint/src/app/(dashboard)/settings/page.tsx`

**Changes**
- Add right sidebar sections inspired by screenshot profile side rail:
  - Batch
  - Location
  - Social links
- Keep sidebar informational-only for this scope (no new permissioned actions introduced in settings).
- Keep it lightweight (no heavy cards/shadows).

**Acceptance checks**
- Sidebar remains visible and aligned on desktop.
- Sidebar stacks below main content on mobile.
- No duplicated/conflicting actions with `/profile/[userId]` page.

### Phase 5 — Screenshot Fidelity QA Loop
**Files**
- `founder-sprint/src/app/(dashboard)/settings/page.tsx`
- `founder-sprint/src/app/(dashboard)/settings/ProfileForm.tsx`
- `founder-sprint/src/app/(dashboard)/settings/ExperienceSection.tsx`
- `founder-sprint/src/app/(dashboard)/settings/EducationSection.tsx`
- `founder-sprint/src/app/(dashboard)/settings/GroupSelector.tsx` (layout-only adjustments if needed)
- `founder-sprint/src/app/(dashboard)/settings/SettingsSidebar.tsx` (new)
- `founder-sprint/src/app/(dashboard)/settings/SettingsSectionCard.tsx` (new)
- `founder-sprint/e2e/settings-visual.spec.ts` (new, deterministic screenshot capture)

**Process**
1. Capture `/settings` screenshots at:
   - desktop: `1536x960`
   - mobile: `390x844`
   Save artifacts to `screenshots/settings-replan/`.
   Naming convention:
   - `settings-desktop-before.png`
   - `settings-mobile-before.png`
   - `settings-desktop-after.png`
   - `settings-mobile-after.png`
   Capture command (locked): `npm run test -- e2e/settings-visual.spec.ts --project=chromium`
2. Compare against `screenshots/clean/screenshot_30.png` and `screenshots/clean/screenshot_29.png` for:
   - section order
   - spacing rhythm
   - action placement
   - card style consistency
3. Record intentional deltas in a short notes file with rationale.
4. Iterate until checklist pass threshold is met.

**Acceptance checks**
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- No `#555AB9` usage.
- No broken nav routes introduced.
- Screenshot fidelity checklist: at least 10/10 checks pass (below).

## Screenshot Fidelity Checklist (Objective)
1. Desktop has 2-column shell with right sidebar at `300px-340px` width.
2. Mobile stacks to one column and keeps all actions reachable.
3. Section header row shows title left + action right on Experience/Education.
4. "Add Experience" and "Add Education" appear at section header level.
5. Experience/Education rows each show right-aligned "Edit" control.
6. Card border/radius/padding are consistent across all settings sections.
7. Major section spacing follows screenshot rhythm (`~16-24px` vertical cadence).
8. Sidebar presents contextual profile metadata (batch/location/social) and does not introduce new privileged actions.
9. Save affordance is explicit and visible whenever user edits data.
10. No color drift from existing system palette (especially no purple accents).

## Role/State Verification Matrix (Must Pass)
1. `founder` + onboarding=true + has available groups -> onboarding banner + GroupSelector + settings sections render in new shell.
2. `founder` + onboarding=false + has group -> no onboarding banner, GroupSelector still visible, settings sections unchanged.
3. `co_founder` + onboarding=true -> same behavior as founder.
4. `mentor`/`admin`/`super_admin` + onboarding=false -> no GroupSelector block, settings sections remain fully usable.
5. Non-authenticated user -> redirected to `/login` (existing behavior preserved).

## Scope Verification
- No changes to permissions logic in actions.
- No new role-only branches added outside existing settings conditions.
- Sidebar introduces no new privileged actions.

---

## Scope Guardrails
- In scope: settings UI structure/visual parity and interaction polish.
- Out of scope: messaging (M3), schema changes, cross-page major information architecture changes.

## Risks + Mitigations
- Risk: Overfitting to one screenshot crop.
  - Mitigation: enforce layout rules from both screenshot_30 (top + sidebar) and screenshot_29 (lower section rhythm).
- Risk: Regressing existing CRUD flows.
  - Mitigation: preserve action contracts and only refactor component presentation first.
- Risk: Mobile breakage from desktop-first layout.
  - Mitigation: define explicit mobile fallback in Phase 1 acceptance.

## Delivery Order (Execution-Ready)
1. Fixture prep script (deterministic state)
2. Page shell + section wrapper
3. ProfileForm regroup + save pattern
4. Experience/Education restyle + non-browser confirm
5. Sidebar context block
6. Screenshot-compare QA + build/typecheck verification

## Definition of Done
- All screenshot fidelity checklist items pass.
- Onboarding and GroupSelector flows still behave correctly.
- Existing settings data operations remain intact (no action contract changes).
- Typecheck and production build pass.
