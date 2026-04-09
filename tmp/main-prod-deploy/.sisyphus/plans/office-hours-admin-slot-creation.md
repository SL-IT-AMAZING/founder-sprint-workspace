# Office Hours Admin-Scheduled Flow

## TL;DR

> **Quick Summary**: Remove the generic `Create Slot` office-hours entrypoint and make admin-scheduled sessions for a specific founder the primary workflow.
>
> **Deliverables**:
> - Remove the black `Create Slot` CTA/modal from the office-hours UI
> - Route scheduling through admin-owned company/founder scheduling flows
> - Align permissions, tests, and planning docs with the admin-scheduled model
>
> **Estimated Effort**: Short
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: 1 -> 2 -> 3 -> 6 -> 7

---

## Context

### Original Request
Remove `Create slot` in the office-hours area because founders should not manually create the slot; admins should create it for the main founder/contact using the founder's existing account/email identity.

### Interview Summary
**Key Discussions**:
- The black `Create Slot` action should go away from the primary office-hours experience.
- The desired behavior is admin-driven scheduling for the main founder/contact, not a founder self-service slot-creation step.

**Research Findings**:
- `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx` already has an admin/staff scheduling modal for company or individual founder scheduling.
- `founder-sprint/src/actions/office-hour.ts` contains both direct scheduling flows and the older generic slot-creation flow, which overlap.
- `founder-sprint/e2e/office-hours.spec.ts` and several planning docs still describe the older slot-registration model.

### Gap Review
**Identified Gaps** (addressed in this plan):
- The product request talks about admin-created sessions, but code/docs still expose generic slot creation.
- Existing tests anchor on mentor slot creation instead of admin scheduling.
- Founder selection should use the current founder/email identity already available in the UI instead of introducing a new data model.

---

## Work Objectives

### Core Objective
Make office hours feel admin-curated: admins create the actual session for a specific founder/company, while the generic `Create Slot` path is removed from the main UI and supporting artifacts.

### Concrete Deliverables
- `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx` no longer shows `Create Slot` CTAs/modals.
- `founder-sprint/src/actions/office-hour.ts` reflects admin-scheduled office hours as the primary creation flow.
- `founder-sprint/src/lib/permissions.ts` and `founder-sprint/src/lib/permissions-client.ts` align slot-creation/scheduling permissions with admins.
- `founder-sprint/e2e/office-hours.spec.ts` validates the new admin-scheduled behavior and founder non-exposure.
- Product/planning docs stop describing office hours as founder-facing or mentor-led slot registration where that conflicts with the new intent.

### Definition of Done
- [ ] Office-hours toolbar and empty state contain no `Create Slot` CTA in the main flow.
- [ ] Admin can schedule an individual founder session from office hours using the existing founder record/email identity.
- [ ] Founder-facing experience does not imply founders create slots themselves.
- [ ] Playwright office-hours coverage exercises the new admin scheduling path and the absence of the removed CTA.

### Must Have
- Admin/super-admin is the canonical creator for direct founder office-hour sessions.
- Existing founder/email identity is used for selection; no new connection entity is introduced.
- Docs, tests, and UI copy all tell the same story.

### Must NOT Have (Guardrails)
- Do not add a raw "external attendee email" flow in this pass.
- Do not leave dead `Create Slot` copy, modal code, or tests behind.
- Do not silently broaden scope into Google Calendar or notification redesign.
- Do not break founder request/proposal behavior unless required to remove the misleading slot-creation path.

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** - all verification is agent-executed.

### Test Decision
- **Infrastructure exists**: YES
- **Automated tests**: Tests-after
- **Framework**: Playwright
- **If TDD**: N/A for this plan

### QA Policy
- **Frontend/UI**: Use Playwright for CTA visibility, modal behavior, and role-specific flows.
- **Source verification**: Use `grep`/`read` to confirm removed strings and aligned permissions/docs.
- **Build validation**: Run `npm run build` and targeted `npm test -- office-hours.spec.ts` (or equivalent Playwright file selection).
- Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately - policy + core flow):
- Task 1: Lock permission and workflow policy [quick]
- Task 2: Retire generic slot-creation backend path [quick]
- Task 3: Remove `Create Slot` UI and center admin scheduling [visual-engineering]
- Task 4: Make founder/email targeting explicit in individual scheduling [visual-engineering]
- Task 5: Update office-hours product/docs language [writing]

Wave 2 (After Wave 1 - tests + cleanup):
- Task 6: Update role helpers and route/document consistency [quick]
- Task 7: Replace office-hours Playwright coverage [quick]
- Task 8: Run build, targeted QA, and dead-code cleanup [unspecified-high]

Wave FINAL (After ALL tasks - independent review, 4 parallel):
- Task F1: Plan compliance audit (oracle)
- Task F2: Code quality review (unspecified-high)
- Task F3: Real QA replay (unspecified-high)
- Task F4: Scope fidelity check (deep)

Critical Path: Task 1 -> Task 2 -> Task 3 -> Task 6 -> Task 7 -> Task 8
Parallel Speedup: ~45% faster than sequential
Max Concurrent: 5

### Dependency Matrix
- **1**: None -> 2, 3, 5, 6
- **2**: 1 -> 3, 6, 7, 8
- **3**: 1, 2 -> 7, 8
- **4**: 1 -> 3, 7, 8
- **5**: 1 -> 8
- **6**: 1, 2, 5 -> 7, 8
- **7**: 2, 3, 4, 6 -> 8
- **8**: 2, 3, 4, 5, 6, 7 -> FINAL

### Agent Dispatch Summary
- **Wave 1**: T1 `quick`, T2 `quick`, T3 `visual-engineering`, T4 `visual-engineering`, T5 `writing`
- **Wave 2**: T6 `quick`, T7 `quick`, T8 `unspecified-high`
- **FINAL**: F1 `oracle`, F2 `unspecified-high`, F3 `unspecified-high`, F4 `deep`

---

## TODOs

- [ ] 1. Lock the office-hours creation policy around admins

  **What to do**:
  - Decide the canonical creation path: `super_admin`/`admin` schedule actual sessions; founders do not create slots.
  - Record this policy in the permission helpers and any inline code comments/config names that still imply generic staff slot creation.

  **Must NOT do**:
  - Do not introduce a brand-new role or connection model.
  - Do not remove founder request capability unless the code path directly depends on the retired generic slot flow.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: small, cross-file policy alignment.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: not needed until verification tasks.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 2, 3, 5, 6
  - **Blocked By**: None

  **References**:
  - `founder-sprint/src/lib/permissions.ts:117` - Current admin/staff/founder permission helpers that define who can create office hours.
  - `founder-sprint/src/lib/permissions-client.ts:4` - Client-side mirror of the same role logic; must stay consistent with server checks.
  - `dev_plan/10_PERMISSIONS.md:157` - Existing route/action spec still says mentors can create slots.
  - `dev_plan/11_USER_FLOWS.md:190` - Office-hours flow narrative still frames slot registration as Mentor/Admin work.

  **Acceptance Criteria**:
  - [ ] A single documented rule exists for who may create direct office-hour sessions.
  - [ ] Server/client permission helpers no longer contradict the requested admin-owned flow.

  **QA Scenarios**:
  ```
  Scenario: Permission source matches the new workflow
    Tool: Bash (grep)
    Preconditions: Updated permission files saved
    Steps:
      1. Run `grep -n "canCreateOfficeHourSlot\|canScheduleOfficeHour\|isStaff\|isAdmin" founder-sprint/src/lib/permissions.ts founder-sprint/src/lib/permissions-client.ts`
      2. Read the matching lines and confirm admin-only creation logic is present.
      3. Confirm no remaining helper text says founders create slots.
    Expected Result: Permission helpers clearly reflect admin-owned scheduling.
    Failure Indicators: Mixed `isStaff`/`isAdmin` creation rules or founder creation wording remains.
    Evidence: .sisyphus/evidence/task-1-permission-policy.txt

  Scenario: Product docs do not contradict the policy
    Tool: Bash (grep)
    Preconditions: Permission docs updated
    Steps:
      1. Run `grep -n "slot registration\|슬롯 등록" dev_plan/10_PERMISSIONS.md dev_plan/11_USER_FLOWS.md dev_plan/08_ROUTES.md`
      2. Verify matches describe admin-owned scheduling or have been removed where obsolete.
    Expected Result: No contradictory founder-led or mentor-led creation language remains in targeted specs.
    Failure Indicators: Old role matrix still grants creation to the wrong actor.
    Evidence: .sisyphus/evidence/task-1-doc-permission-check.txt
  ```

  **Commit**: YES
  - Message: `refactor(office-hours): lock creation flow to admins`
  - Files: `founder-sprint/src/lib/permissions.ts`, `founder-sprint/src/lib/permissions-client.ts`
  - Pre-commit: `npm run build`

- [ ] 2. Retire the generic open-slot creation path

  **What to do**:
  - De-emphasize or remove `createOfficeHourSlot(formData)` as the primary UI-backed creation flow.
  - Keep scheduling centered on `scheduleIndividualOfficeHour(formData)` and `scheduleGroupOfficeHour(formData)`.

  **Must NOT do**:
  - Do not break existing request approval, Meet creation, or slot completion behavior.
  - Do not leave orphan imports or unused server actions behind.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: action-layer cleanup with limited files.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 3, 6, 7, 8
  - **Blocked By**: 1

  **References**:
  - `founder-sprint/src/actions/office-hour.ts:53` - Old generic slot creation action.
  - `founder-sprint/src/actions/office-hour.ts:214` - Existing individual founder scheduling path to preserve and prefer.
  - `founder-sprint/src/actions/office-hour.ts:310` - Founder proposal flow that may still coexist with admin scheduling.
  - `founder-sprint/src/actions/office-hour.ts:503` - Available/requested slot request flow; handle carefully if still used.

  **Acceptance Criteria**:
  - [ ] The main creation path in actions matches the admin-scheduled model.
  - [ ] No dead exported action remains wired only to the removed `Create Slot` UI.

  **QA Scenarios**:
  ```
  Scenario: Primary office-hour actions are direct schedule flows
    Tool: Bash (grep)
    Preconditions: Action file updated
    Steps:
      1. Run `grep -n "export async function createOfficeHourSlot\|scheduleIndividualOfficeHour\|scheduleGroupOfficeHour" founder-sprint/src/actions/office-hour.ts`
      2. Verify the retained exported flow matches the intended admin scheduling model.
      3. Confirm removed/deprecated actions are not still imported by the office-hours page.
    Expected Result: Action layer favors direct scheduling, not generic open-slot creation.
    Failure Indicators: Removed UI still depends on `createOfficeHourSlot` or dangling exports remain.
    Evidence: .sisyphus/evidence/task-2-action-scan.txt

  Scenario: No broken imports after action cleanup
    Tool: Bash
    Preconditions: Application compiles locally
    Steps:
      1. Run `npm run build` in `founder-sprint`.
      2. Inspect build output for office-hours import/export errors.
    Expected Result: Build completes without unresolved office-hours symbols.
    Failure Indicators: TypeScript/module errors referencing removed action names.
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: NO

- [ ] 3. Remove the black `Create Slot` CTA and modal from the office-hours UI

  **What to do**:
  - Delete the top-right `Create Slot` button, empty-state `Create Slot` action, and associated modal/state.
  - Keep a single scheduling entrypoint for admins, with copy that matches the admin-owned workflow.

  **Must NOT do**:
  - Do not remove founder `Request Office Hour` affordances unless they are explicitly obsolete.
  - Do not leave hidden `prefillDate` auto-open behavior pointing to a deleted modal.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: UI CTA simplification and copy cleanup.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 7, 8
  - **Blocked By**: 1, 2

  **References**:
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx:351` - Top toolbar currently renders the black `Create Slot` CTA.
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx:373` - Empty state still offers `Create Slot`.
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx:551` - Modal to remove or replace.
  - `founder-sprint/src/app/(dashboard)/office-hours/page.tsx:40` - Parent page context feeding the list.

  **Acceptance Criteria**:
  - [ ] No visible `Create Slot` CTA remains on `/office-hours`.
  - [ ] Admin scheduling remains accessible through a clear single entrypoint.
  - [ ] Removed modal state/imports are fully cleaned up.

  **QA Scenarios**:
  ```
  Scenario: Admin sees only the intended scheduling entrypoint
    Tool: Playwright
    Preconditions: Admin fixture account exists
    Steps:
      1. Open `/office-hours` as admin.
      2. Assert there is no button named `Create Slot`.
      3. Assert the remaining schedule CTA is visible and clickable.
    Expected Result: Black generic create CTA is gone; admin still has a schedule entrypoint.
    Failure Indicators: `Create Slot` still visible or no scheduling CTA remains.
    Evidence: .sisyphus/evidence/task-3-admin-toolbar.png

  Scenario: Empty state does not regress to old create copy
    Tool: Playwright
    Preconditions: Office-hours list is empty or filtered to empty
    Steps:
      1. Open `/office-hours` in a state with no visible slots.
      2. Assert empty state text does not include `Create Slot`.
      3. Assert any remaining action text matches admin scheduling language.
    Expected Result: Empty state copy is aligned with the new workflow.
    Failure Indicators: Old `Create Slot` action or dead click target remains.
    Evidence: .sisyphus/evidence/task-3-empty-state.png
  ```

  **Commit**: YES
  - Message: `feat(office-hours): remove generic create-slot entrypoint`
  - Files: `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx`
  - Pre-commit: `npm run build`

- [ ] 4. Make individual founder scheduling explicitly email-driven

  **What to do**:
  - Ensure the individual founder scheduler makes the founder email obvious/searchable when admins choose the main person.
  - Prefer relabeling copy around "Founder" / "Individual Founder" so it reads as selecting the primary founder/contact.

  **Must NOT do**:
  - Do not replace the existing founder identity with freeform email entry in this pass.
  - Do not change calendar attendee generation semantics.

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: mostly presentation/copy in an existing modal.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 7, 8
  - **Blocked By**: 1

  **References**:
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx:720` - Existing `SearchableSelect` already shows name/email/company and is the best base for the requested email-driven targeting.
  - `founder-sprint/src/actions/office-hour.ts:222` - Individual scheduling currently accepts `founderId`, not raw email.
  - `founder-sprint/src/app/(dashboard)/office-hours/page.tsx:31` - Founder options are already built from active batch members and include email.

  **Acceptance Criteria**:
  - [ ] Admin can identify the founder by name and email in the scheduler.
  - [ ] Individual scheduling copy makes it clear the session is created for the primary founder/contact.

  **QA Scenarios**:
  ```
  Scenario: Founder chooser surfaces email clearly
    Tool: Playwright
    Preconditions: Admin account with at least one founder in batch
    Steps:
      1. Open the admin scheduling modal on `/office-hours`.
      2. Switch to individual founder mode.
      3. Type part of a founder email into the searchable select.
      4. Assert matching founder option appears with name + email/company context.
    Expected Result: Admin can find the target founder via email.
    Failure Indicators: Search only works by name or email is hidden/ambiguous.
    Evidence: .sisyphus/evidence/task-4-founder-select.png

  Scenario: Individual schedule submit still succeeds
    Tool: Playwright
    Preconditions: Valid founder and future times available
    Steps:
      1. Select a founder via the chooser.
      2. Fill future start/end times.
      3. Submit the form.
      4. Assert the modal closes and a confirmed office-hour card appears.
    Expected Result: Individual admin scheduling still creates the session successfully.
    Failure Indicators: Submit error, stale form, or missing scheduled card.
    Evidence: .sisyphus/evidence/task-4-individual-schedule.png
  ```

  **Commit**: NO

- [ ] 5. Align product and planning docs with the admin-scheduled story

  **What to do**:
  - Replace "slot registration" language where it conflicts with the new admin-scheduled model.
  - Update actor labels so docs describe admins creating sessions for founders rather than founders creating slots.

  **Must NOT do**:
  - Do not rewrite unrelated office-hours rules.
  - Do not leave README and `dev_plan` disagreeing with each other.

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: documentation synchronization across several markdown sources.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 6, 8
  - **Blocked By**: 1

  **References**:
  - `founder-sprint/README.md:27` - High-level feature description still says mentors create slots.
  - `dev_plan/01_DEVELOPMENT_PLAN.md:374` - Phase 6 task naming still centers slot registration.
  - `dev_plan/08_ROUTES.md:126` - Route table still exposes `/office-hours/new` as slot registration.
  - `dev_plan/11_USER_FLOWS.md:248` - User flow A still describes Mentor-driven slot registration.
  - `dev_plan/12_COMPONENT_SPECS.md:873` - Component naming/copy still says `SlotRegistrationForm`.

  **Acceptance Criteria**:
  - [ ] All targeted docs describe the same admin-created office-hours flow.
  - [ ] Any remaining legacy terminology is deliberate and documented.

  **QA Scenarios**:
  ```
  Scenario: Targeted docs no longer advertise the old flow
    Tool: Bash (grep)
    Preconditions: Markdown files updated
    Steps:
      1. Run `grep -n "Create Slot\|slot registration\|슬롯 등록" founder-sprint/README.md dev_plan/01_DEVELOPMENT_PLAN.md dev_plan/08_ROUTES.md dev_plan/11_USER_FLOWS.md dev_plan/12_COMPONENT_SPECS.md`
      2. Verify remaining matches are intentional or removed.
    Expected Result: Docs no longer misdescribe the office-hours UX.
    Failure Indicators: Old generic slot-creation story remains in key docs.
    Evidence: .sisyphus/evidence/task-5-doc-sync.txt

  Scenario: Readme and route docs agree on admin ownership
    Tool: Bash (grep)
    Preconditions: README and route docs updated
    Steps:
      1. Run `grep -n "admin\|mentor\|founder" founder-sprint/README.md dev_plan/08_ROUTES.md dev_plan/10_PERMISSIONS.md`
      2. Compare role wording for office-hours creation.
    Expected Result: Admin-owned creation language is consistent across docs.
    Failure Indicators: README says one thing while routes/permissions say another.
    Evidence: .sisyphus/evidence/task-5-role-language.txt
  ```

  **Commit**: YES
  - Message: `docs(office-hours): align copy with admin scheduling flow`
  - Files: `founder-sprint/README.md`, `dev_plan/*.md`
  - Pre-commit: `grep -n "office-hours" founder-sprint/README.md dev_plan/08_ROUTES.md`

- [ ] 6. Clean up route names, helpers, and dead references

  **What to do**:
  - Remove or rename route/helper references that only exist for the deprecated `/office-hours/new` create-slot path.
  - Ensure code, docs, and tests all reference the same surviving entrypoints.

  **Must NOT do**:
  - Do not leave stale navigation links.
  - Do not break any existing route still intentionally used elsewhere.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: targeted cleanup across a few files.
  - **Skills**: `[]`

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: 7, 8
  - **Blocked By**: 1, 2, 5

  **References**:
  - `dev_plan/08_ROUTES.md:127` - `/office-hours/new` route spec to retire or repurpose.
  - `dev_plan/10_PERMISSIONS.md:158` - Old route permission entry for slot creation.
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx:144` - `prefillDate` auto-open behavior tied to the old create modal.
  - `dev_plan/07_INTEGRATION_CHECKLIST.md:159` - Integration checklist entries referencing old office-hours files/flow.

  **Acceptance Criteria**:
  - [ ] No dead route/helper reference remains for removed `Create Slot` UX.
  - [ ] Surviving route names and entrypoints are documented consistently.

  **QA Scenarios**:
  ```
  Scenario: Dead route references are removed
    Tool: Bash (grep)
    Preconditions: Cleanup complete
    Steps:
      1. Run `grep -R -n "/office-hours/new\|Create Slot" founder-sprint/src founder-sprint/e2e dev_plan founder-sprint/README.md`
      2. Review every match and confirm it is still valid under the new flow.
    Expected Result: No stale route/copy references remain.
    Failure Indicators: Removed path still appears in nav/test/docs unexpectedly.
    Evidence: .sisyphus/evidence/task-6-route-cleanup.txt

  Scenario: Office-hours page still opens without legacy modal wiring
    Tool: Playwright
    Preconditions: App runs locally
    Steps:
      1. Open `/office-hours` as admin.
      2. Verify page loads with no auto-open ghost modal from `prefillDate` or removed state.
    Expected Result: Page renders cleanly without console/modal errors.
    Failure Indicators: Blank screen, runtime error, or phantom modal.
    Evidence: .sisyphus/evidence/task-6-page-load.png
  ```

  **Commit**: NO

- [ ] 7. Replace Playwright coverage for the new office-hours workflow

  **What to do**:
  - Replace mentor `create slot` tests with admin scheduling coverage.
  - Add a negative assertion that `Create Slot` is absent from the office-hours page.

  **Must NOT do**:
  - Do not keep tests that rely on the removed button text.
  - Do not skip role-specific assertions for founder/admin differences.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: single test file update with existing patterns.
  - **Skills**: [`playwright`]
    - `playwright`: needed for precise browser validation steps and selectors.
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: test-only change.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: 8
  - **Blocked By**: 2, 3, 4, 6

  **References**:
  - `founder-sprint/e2e/office-hours.spec.ts:12` - Existing test still opens the old create flow.
  - `founder-sprint/e2e/office-hours.spec.ts:75` - Existing founder request test pattern to preserve where still valid.
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx:357` - Toolbar visibility logic to assert against.

  **Acceptance Criteria**:
  - [ ] Playwright suite tests admin scheduling instead of generic slot creation.
  - [ ] Suite includes a negative assertion for removed `Create Slot` UI.

  **QA Scenarios**:
  ```
  Scenario: Admin scheduling test passes
    Tool: Bash
    Preconditions: Playwright fixtures configured
    Steps:
      1. Run `npm test -- office-hours.spec.ts` in `founder-sprint`.
      2. Confirm the admin scheduling test completes successfully.
    Expected Result: Updated office-hours spec passes with the new workflow.
    Failure Indicators: Test still searches for `Create Slot` or fails on old selectors.
    Evidence: .sisyphus/evidence/task-7-playwright.txt

  Scenario: Founder never sees a create-slot affordance
    Tool: Playwright
    Preconditions: Founder fixture account exists
    Steps:
      1. Open `/office-hours` as founder.
      2. Assert `getByRole("button", { name: /create slot/i })` has count 0.
      3. Assert founder still sees the request/proposal action if that flow remains.
    Expected Result: Founder does not see create-slot affordance.
    Failure Indicators: Founder can still access the removed CTA or request CTA disappears unexpectedly.
    Evidence: .sisyphus/evidence/task-7-founder-visibility.png
  ```

  **Commit**: YES
  - Message: `test(office-hours): cover admin-scheduled flow`
  - Files: `founder-sprint/e2e/office-hours.spec.ts`
  - Pre-commit: `npm test -- office-hours.spec.ts`

- [ ] 8. Run build, targeted QA, and final dead-code cleanup

  **What to do**:
  - Run final build/test passes and remove any unused imports, state, or stale strings left by the workflow change.
  - Validate that office-hours still supports scheduling, founder requests, approvals, and Meet-link visibility.

  **Must NOT do**:
  - Do not ship unused React state or unreachable modal code.
  - Do not mark complete without evidence from build plus role-specific QA.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: integration verification across code, tests, and runtime behavior.
  - **Skills**: [`playwright`]
    - `playwright`: needed for role-based office-hours replay.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2
  - **Blocks**: FINAL
  - **Blocked By**: 2, 3, 4, 5, 6, 7

  **References**:
  - `founder-sprint/package.json:5` - Build and Playwright commands.
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx:351` - Main runtime surface to verify.
  - `founder-sprint/src/actions/office-hour.ts:599` - Approval flow to sanity-check after scheduling changes.

  **Acceptance Criteria**:
  - [ ] `npm run build` passes.
  - [ ] Targeted Playwright office-hours run passes.
  - [ ] No unused office-hours imports/state remain.

  **QA Scenarios**:
  ```
  Scenario: Full office-hours regression passes
    Tool: Bash
    Preconditions: All implementation tasks complete
    Steps:
      1. Run `npm run build` in `founder-sprint`.
      2. Run `npm test -- office-hours.spec.ts`.
      3. Save both outputs.
    Expected Result: Build and targeted office-hours Playwright tests both pass.
    Failure Indicators: Type errors, runtime build failures, or test regressions.
    Evidence: .sisyphus/evidence/task-8-build-and-test.txt

  Scenario: End-to-end role replay still works
    Tool: Playwright
    Preconditions: Admin + founder fixtures available
    Steps:
      1. As admin, schedule an individual office hour for a founder.
      2. As founder, open `/office-hours` and confirm the scheduled/confirmed session appears appropriately.
      3. If applicable, verify approved session still exposes a Meet link.
    Expected Result: New admin-created session is visible and functional end-to-end.
    Failure Indicators: Scheduled session missing, wrong role visibility, or lost Meet-link display.
    Evidence: .sisyphus/evidence/task-8-role-replay.png
  ```

  **Commit**: YES
  - Message: `chore(office-hours): finalize admin scheduling cleanup`
  - Files: `founder-sprint/src/app/(dashboard)/office-hours/*`, `founder-sprint/src/actions/office-hour.ts`, `founder-sprint/e2e/office-hours.spec.ts`
  - Pre-commit: `npm run build && npm test -- office-hours.spec.ts`

---

## Final Verification Wave

- [ ] F1. **Plan Compliance Audit** - `oracle`
  Verify the removed `Create Slot` path is absent, admin scheduling exists, and docs/tests align with the new story.

- [ ] F2. **Code Quality Review** - `unspecified-high`
  Run build/tests and inspect for dead imports, stale state, or mismatched permission logic.

- [ ] F3. **Real QA Replay** - `unspecified-high`
  Replay admin scheduling and founder visibility on `/office-hours`; save screenshots and command output.

- [ ] F4. **Scope Fidelity Check** - `deep`
  Confirm only office-hours creation UX/permissions/docs/tests changed; no unrelated calendar or messaging behavior drifted.

---

## Commit Strategy

- **1**: `refactor(office-hours): lock creation flow to admins` - permission helpers and action policy
- **2**: `feat(office-hours): remove generic create-slot entrypoint` - UI cleanup and modal removal
- **3**: `docs(office-hours): align copy with admin scheduling flow` - README and dev-plan sync
- **4**: `test(office-hours): cover admin-scheduled flow` - Playwright updates
- **5**: `chore(office-hours): finalize admin scheduling cleanup` - final integration/build cleanup

---

## Success Criteria

### Verification Commands
```bash
cd founder-sprint && npm run build
cd founder-sprint && npm test -- office-hours.spec.ts
grep -R -n "Create Slot" founder-sprint/src founder-sprint/e2e dev_plan founder-sprint/README.md
```

### Final Checklist
- [ ] `Create Slot` no longer appears in the main office-hours experience
- [ ] Admin can schedule a founder session using the existing founder/email identity
- [ ] Founder experience no longer implies founder slot creation
- [ ] Docs, permissions, and tests all describe the same workflow
- [ ] Build and targeted office-hours tests pass
