# SLIT Feedback Partial-Closure Plan (Current Branch)

## Goal

Close only the remaining **defensible** partial items from `SLIT Bookface Feedback.pdf` against the **current founder-sprint branch**, while explicitly separating items that would require a scope expansion beyond the original MVP plan.

## Final Classification

### True partials that should be closed now

1. `F17` — active event UX still exposes `one_off`
2. `F34` — current implementation is batch structure cloning, not reusable templates

### Items that are only partial if scope is expanded beyond the original plan

1. `F12` — real waitlist system
2. `F26` — distinct dropout workflow with separate state/reasoning
3. `F36` — automated reminder cron flow
4. `F42` — founder activity timeline/history (current implementation is summary only)

### Already full enough on current branch

1. `F16` — unified calendar via `/schedule` plus explicit link from `/events`

## Why this split exists

Metis review confirmed that `F12`, `F26`, `F36`, and `F42` were explicitly reduced in the original implementation plan with `Must NOT` / MVP exclusions. Treating them as unfinished work would silently expand scope rather than close a real gap. This plan therefore separates:

- **Closure work**: finish what is genuinely still below the intended behavior on the current branch.
- **Expansion work**: optional follow-up if the product owner wants to go beyond the MVP boundaries already chosen.

---

## Track A — Close the real remaining partials

### A1. F17 — Restrict active event UX to the requested 4 types

Current state:
- `prisma/schema.prisma` keeps `one_off` for backward compatibility.
- Active create/filter surfaces still expose `one_off` in:
  - `founder-sprint/src/app/(dashboard)/events/EventsList.tsx`
  - `founder-sprint/src/app/(dashboard)/schedule/DayPanel.tsx`
- `src/actions/event.ts` still accepts `one_off` through Zod input validation.

Required delta:
- Hide `one_off` from all active creation/filter UI.
- Reject new `one_off` creation at the action layer.
- Keep legacy `one_off` records readable in existing views.

Files:
- `founder-sprint/src/app/(dashboard)/events/EventsList.tsx`
- `founder-sprint/src/app/(dashboard)/schedule/DayPanel.tsx`
- `founder-sprint/src/actions/event.ts`
- `founder-sprint/src/app/(dashboard)/dashboard/page.tsx` (legacy label mapping if needed)

Acceptance criteria:
- Event creation shows exactly 4 selectable types: `general_session`, `office_hour`, `virtual`, `in_person`
- Event filters show exactly 4 types plus `All`
- `createEvent()` rejects `one_off` input for new records
- Existing legacy `one_off` events still render without crashing

Verification:
- `npm run build`
- Playwright/manual QA: open `/events`, verify 4 create options and 4 filter chips

### A2. F34 — Add real reusable templates for assignments and sessions

Current state:
- `cloneBatchStructure()` in `founder-sprint/src/actions/batch.ts` duplicates assignments/sessions into a new batch.
- `founder-sprint/src/app/(dashboard)/admin/batches/BatchList.tsx` exposes this as “Clone Structure”.
- This is duplication, not a reusable template system.

Required delta:
- Introduce first-class templates for assignments and sessions.
- Support “save as template” and “create from template”.
- Keep batch cloning, but stop relying on it as the only answer to the template feedback item.

Minimum implementation shape:
- New Prisma models:
  - `AssignmentTemplate`
  - `SessionTemplate`
- New actions:
  - `saveAssignmentAsTemplate(assignmentId, name)`
  - `saveSessionAsTemplate(sessionId, name)`
  - `createAssignmentFromTemplate(templateId, batchId, overrides)`
  - `createSessionFromTemplate(templateId, batchId, overrides)`
- Lightweight admin UI entry points in assignments and sessions creation flows

Files:
- `founder-sprint/prisma/schema.prisma`
- `founder-sprint/src/actions/assignment.ts`
- `founder-sprint/src/actions/session.ts`
- `founder-sprint/src/app/(dashboard)/assignments/AssignmentsList.tsx`
- `founder-sprint/src/app/(dashboard)/sessions/*`

Acceptance criteria:
- Admin can save an assignment as template
- Admin can save a session as template
- New assignment can be created from a saved template
- New session can be created from a saved template
- Batch clone continues to work independently

Verification:
- `npm run build`
- Manual QA: save template -> create new item from template -> confirm fields are prefilled and editable

---

## Track B — Optional scope-expansion work (requires explicit product decision)

These items are not recommended as automatic closure work, because they go beyond the original MVP decisions already made.

### B1. F12 — Real office-hours waitlist system

Current state:
- Weekly limit, credits, agenda, cancellation, and no-show are implemented.
- There is no explicit user-facing waitlist model; the backend currently allows multiple pending requests and then rejects non-approved requests.

Why this is expansion:
- The original implementation plan explicitly excluded a waitlist for MVP.
- A true waitlist requires behavioral inversion in:
  - `respondToRequest()`
  - `cancelRequest()`
  - request/join UI

If approved later, minimum delta:
- Add waitlist status/position
- Add `Join Waitlist` UX
- Promote next waitlisted request when approved request is cancelled

### B2. F26 — Distinct dropout workflow

Current state:
- `User.status` + deactivate/reactivate already cover lifecycle handling.

Why this is expansion:
- The original plan intentionally combined deactivation/dropout.

If approved later, minimum delta:
- Add `dropped_out` state usage in practice
- Add optional `dropoutReason`
- Separate admin action from generic deactivate

### B3. F36 — Automated deadline reminders

Current state:
- Manual reminder button and email path are implemented.

Why this is expansion:
- The original plan explicitly chose manual reminders over cron automation.

If approved later, minimum delta:
- Add scheduled entrypoint
- Add duplicate-send suppression
- Trigger reminders automatically before due dates

### B4. F42 — Founder activity timeline/history

Current state:
- Founder activity summaries exist in admin UI.

Why this is expansion:
- The original plan explicitly scoped this as aggregate counts rather than timeline history.

If approved later, minimum delta:
- Add chronological activity timeline query
- Add detail/timeline admin UI
- Define exact event types to include

---

## Execution Order

### Execute now

1. `A1` F17 event UX cleanup
2. `A2` F34 reusable templates

### Do only with explicit scope expansion

3. `B1` F12 waitlist
4. `B2` F26 dropout workflow
5. `B3` F36 automated reminders
6. `B4` F42 activity history timeline

## Effort Estimate

- `A1` F17: 0.5-1 hour
- `A2` F34: 4-6 hours
- `B1` F12: 3-5 hours
- `B2` F26: 1-2 hours
- `B3` F36: 2-3 hours
- `B4` F42: 2-4 hours

## Final Recommendation

If the goal is to honestly close the remaining **real** PDF partials on the current branch, execute only:

- `F17`
- `F34`

If the goal is to go beyond the original MVP decisions and make the product more complete than originally scoped, then schedule the expansion track as a separate follow-up body of work.
