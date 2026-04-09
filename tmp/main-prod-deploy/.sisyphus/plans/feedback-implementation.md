# SLIT Bookface Feedback — Full Implementation Plan

## TL;DR

> **Quick Summary**: Implement 34 unimplemented feedback items from the SLIT Bookface Feedback PDF, sorted by urgency. Schema migration first, then features in dependency-safe parallel waves.
>
> **Deliverables**:
> - Fix critical admin access bug
> - Restructure navigation (tabs instead of dropdowns)
> - Add submission review states, multi-role support, mentor selection
> - Add user lifecycle management (soft delete, invite resend)
> - Add per-user timezone, OH credits, scoping, notifications, search/filter
>
> **Estimated Effort**: XL (16 tasks + verification wave)
> **Parallel Execution**: YES — 5 waves
> **Critical Path**: T1 (schema) → T2 (admin fix) → T3 (multi-role) → T4 (nav) → Final Verification

---

## Working Directory (CRITICAL)

> **ALL commands and file paths are relative to `founder-sprint/` subdirectory.**
> The workspace root is `founder-sprint-workspace/`, but `package.json`, `prisma/`, `src/` all live inside `founder-sprint/`.
>
> ```bash
> # Correct:
> cd founder-sprint && npm run build
> # Or use workdir parameter:
> workdir="/Users/jsup/Development Files/Founder Sprint Batch/founder-sprint-workspace/founder-sprint"
> ```
>
> When this plan says `src/lib/permissions.ts`, it means `founder-sprint/src/lib/permissions.ts`.
> When this plan says `npm run build`, run it inside `founder-sprint/`.

---

## Context

### Original Request
User provided a Korean-language PDF with 41 feedback items from SLIT. 5 explore agents cross-referenced every item against the current codebase. 7 items are already implemented, 34 remain. User wants urgency-based ordering with safety verification.

### Interview Summary
**Key Discussions**:
- Function over polish: "빠른 운영 검증 우선, 완성도보다 기능 동작 중심"
- May be rewritten in 6 months: "6개월 이내 폐기 또는 전면 재작성 가능성 전제"
- No automated tests (user preference from messages perf task)
- Sort by urgency, verify plan doesn't break existing functionality

**Research Findings** (5 explore agents):
- Current nav: 4 dropdown menus (Community, Advice, Tools, Contact) — feedback wants flat tabs
- Root redirect goes to `/dashboard` — feedback wants `/feed`
- Admin page has NO server-side permission check — critical security bug
- Roles: single enum per UserBatch — feedback wants simultaneous roles
- Submission status: binary (inferred from feedback count) — feedback wants 4 states
- OH mentor: hardcoded to `OFFICE_HOUR_TARGET_EMAIL` — feedback wants mentor selection
- No notification system (only 3 email functions for OH/invite)
- User deletion: hard delete only, no soft delete/deactivation

### Metis Review
**Identified Gaps** (addressed):
- Multi-role (F13): Use `additionalRoles String[]` approach to avoid touching 188 role references
- Admin fix (F14): Create `admin/layout.tsx` guard (protects ALL admin routes at once)
- Schema migration: ALL new fields must have defaults to prevent breaking existing rows
- EventType enum: Add values, never remove existing ones (`one_off` stays for backward compat)
- Submission backfill: Auto-set `reviewed` if feedbacks exist, `pending` otherwise
- Deactivate/Dropout (F24+F26): Treat as single feature with `User.status` field
- Notifications (F35-39): Email-only triggers (no in-app notification center for MVP)
- Clone batch (F34): Batch config + assignment structures only, never user data

**Breaking Change Guardrails** (from Metis):
- Keep `user.role` as primary role — `additionalRoles` is supplementary
- All new columns use DEFAULT values
- Don't change `UserBatch @@unique([userId, batchId])` constraint
- Don't change Supabase auth flow or middleware
- Don't remove/rename existing columns
- Use `prisma db push` (project pattern), not `prisma migrate`

---

## Work Objectives

### Core Objective
Implement all 34 unimplemented feedback items from the SLIT PDF in urgency order, with zero breakage to existing functionality.

### Concrete Deliverables
- Admin route protection (security bug fix)
- Restructured navigation with flat tabs
- Submission 4-state review workflow
- Multi-role support via additionalRoles
- Mentor selection for office hours
- User soft-delete/deactivation
- Per-user timezone settings
- OH credit system
- Email notifications for 5 trigger events
- Admin search/filter views (non-submitters, unreviewed, activity)
- Batch cloning, audit logging

### Definition of Done
- [ ] `npm run build` passes after every commit
- [ ] All 34 feedback items addressed
- [ ] No existing features broken (verified by final verification wave)
- [ ] All new schema fields have DEFAULT values

### Must Have
- Admin route server-side permission check
- Navigation restructure matching PDF specification
- Submission status field with 4 states
- User.status field for soft-delete
- Every new schema field has a DEFAULT value

### Must NOT Have (Guardrails)
- ❌ No automated tests (user directive)
- ❌ No WebSocket/SSE for notifications — email triggers only
- ❌ No new API routes — use server actions (existing pattern)
- ❌ No changes to Supabase auth flow or middleware
- ❌ No removal or renaming of existing database columns
- ❌ No credit refund/transfer/expiration logic
- ❌ No notification preferences UI
- ❌ No submission version diff visualization
- ❌ No full-text search indexes
- ❌ No responsive design improvements beyond nav sidebar
- ❌ No i18n/localization
- ❌ No changes to `UserBatch @@unique([userId, batchId])` constraint

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Playwright)
- **Automated tests**: NONE (user directive — "No tests, just fix the perf")
- **Primary verification**: `npm run build` + code structure checks + QA scenarios

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Schema changes**: `npx prisma db push --accept-data-loss` (dev only) + `npm run build`
- **Server actions**: Code structure verification (imports, permission checks, return types)
- **UI changes**: Playwright navigate + screenshot + DOM assertion
- **All tasks**: `npm run build` as final gate

---

## Execution Strategy

> **FILE OWNERSHIP RULE**: Each task has EXCLUSIVE ownership of its files within a wave.
> No two parallel tasks may edit the same file. Conflicts are resolved by wave ordering.

### Parallel Execution Waves

```
Wave 1 (Foundation — sequential):
├── T1: Schema migration [quick]
└── T2: Admin access fix F14 [quick]

Wave 2 (Core — 5 parallel, exclusive file ownership):
├── T3: Multi-role F13 [deep]
│   OWNS: permissions.ts, layout.tsx, groups/page.tsx
├── T4: Nav restructure F1-F8 [visual-engineering]
│   OWNS: page.tsx, BookfaceTopNav.tsx, DashboardSidebar.tsx
├── T5: Submission review F30-F31 [unspecified-high]
│   OWNS: submissions/*, assignments/[id]/SubmissionsList.tsx, schema(reviewCriteria+checklist)
├── T6: OH mentor + OH timezone display F9 [unspecified-high]
│   OWNS: office-hour.ts, OfficeHoursList.tsx
└── T7: Event types + Calendar + Event timezone display F17,F16,F19 [unspecified-high]
    OWNS: EventsList.tsx, Calendar.tsx

Wave 3 (Enhancements — 3 parallel, exclusive files):
├── T8: Timezone utility + settings F27,F29 [unspecified-high]
│   OWNS: timezone.ts, settings/*, ScheduleView.tsx
├── T9: User lifecycle F23-F24,F26 [deep]
│   OWNS: user-management.ts, deactivated/page.tsx, UserManagement.tsx
└── T10: OH credits + booking F10-F12 [deep]
    OWNS: office-hour.ts(after T6), OfficeHoursList.tsx(after T6), schema(agenda+credit)

Wave 4 (Scoping + Q&A — sequential, share assignment.ts):
├── T11: Scope management F20,F22 [unspecified-high]
│   OWNS: assignment.ts, session.ts, schema(targeting fields)
└── T12: Submission Q&A + versions F32-F33 [unspecified-high] (AFTER T11)
    OWNS: assignment.ts(after T11), submissions/[id]/page.tsx

Wave 5 (New systems — 3 parallel, exclusive files):
├── T13: Notification emails F35-F39 [quick]
│   OWNS: email.ts (wires triggers into assignment.ts AFTER T12)
├── T14: Search/filter admin views F40-F43 [unspecified-high]
│   OWNS: assignment.ts(query fns, after T12), admin UI
└── T15: Audit log + batch clone F25,F34 [unspecified-high]
    OWNS: batch.ts, BatchList.tsx, audit log UI

NOTE: T13 and T14 both touch assignment.ts — run T13 BEFORE T14,
or merge notification triggers into T14's work on that file.

Wave FINAL (Verification — 4 parallel):
├── F1: Plan compliance audit [deep]
├── F2: Code quality review [unspecified-high]
├── F3: Real QA — Playwright [unspecified-high]
└── F4: Scope fidelity check [deep]

Critical Path: T1 → T2 → T6 → T10 → T11 → T12 → T14 → Final
Max Concurrent: 5 (Wave 2)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave | Exclusive Files |
|------|-----------|--------|------|----------------|
| T1 | — | all | 1 | schema.prisma |
| T2 | T1 | T3 | 1 | admin/layout.tsx |
| T3 | T2 | T4 | 2 | permissions.ts, layout.tsx |
| T4 | T3 | — | 2 | BookfaceTopNav.tsx, page.tsx |
| T5 | T1 | T12 | 2 | submissions/*, SubmissionsList.tsx |
| T6 | T1 | T8, T10 | 2 | office-hour.ts, OfficeHoursList.tsx |
| T7 | T1 | T8 | 2 | EventsList.tsx, Calendar.tsx |
| T8 | T6, T7 | — | 3 | timezone.ts, settings/*, ScheduleView.tsx |
| T9 | T1 | T15 | 3 | user-management.ts, UserManagement.tsx |
| T10 | T6 | — | 3 | office-hour.ts, OfficeHoursList.tsx |
| T11 | T5 | T12 | 4 | assignment.ts, session.ts |
| T12 | T11 | T13, T14 | 4 | assignment.ts, submissions/[id] |
| T13 | T12 | — | 5 | email.ts |
| T14 | T12 | — | 5 | assignment.ts (queries) |
| T15 | T9 | — | 5 | batch.ts, BatchList.tsx |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks (seq) — T1 → `quick`, T2 → `quick`
- **Wave 2**: 5 tasks (parallel) — T3 → `deep`, T4 → `visual-engineering`, T5-T7 → `unspecified-high`
- **Wave 3**: 3 tasks (parallel) — T8 → `unspecified-high`, T9 → `deep`, T10 → `deep`
- **Wave 4**: 2 tasks (sequential) — T11 → `unspecified-high`, T12 → `unspecified-high`
- **Wave 5**: 3 tasks (T13→T14 seq, T15 parallel) — T13 → `quick`, T14-T15 → `unspecified-high`
- **FINAL**: 4 tasks (parallel) — F1,F4 → `deep`, F2-F3 → `unspecified-high`

---

## TODOs

> Implementation tasks sorted by urgency. EVERY task MUST pass `npm run build`.
> **A task WITHOUT QA Scenarios is INCOMPLETE. No exceptions.**

- [ ] 1. Schema Migration — All New Fields, Models, Enums (F14,F13,F30,F27,F24,F17,F32,F33,F25,F10,F35)

  **Feedback Items**: Foundation for ALL subsequent tasks — adds every new field/model/enum needed.

  **What to do**:
  - Open `prisma/schema.prisma` and apply ALL of the following changes in a single edit session:
  - **User model** (after `profileImage` field, ~line 86):
    - Add `timezone String? @map("timezone")` — per-user timezone (F27)
    - Add `status String @default("active") @map("status")` — values: active/inactive/dropped_out (F24/F26)
  - **UserBatch model** (after `role` field, ~line 150):
    - Add `additionalRoles String[] @default([]) @map("additional_roles")` — supplementary roles (F13)
  - **Submission model** (after `submittedAt` field, ~line 340):
    - Add `status String @default("pending") @map("status")` — values: pending/reviewed/approved/needs_revision (F30)
  - **Feedback model** (after `createdAt` field, ~line 363):
    - Add `parentId String? @map("parent_id") @db.Uuid` — for threaded Q&A (F32)
    - Add `parent Feedback? @relation("FeedbackThread", fields: [parentId], references: [id])` — self-relation
    - Add `replies Feedback[] @relation("FeedbackThread")` — child replies
  - **EventType enum** (~line 56):
    - Add `virtual` value
    - Add `general_session` value
    - Keep existing `one_off`, `office_hour`, `in_person` untouched
  - **New model — SubmissionVersion** (after Submission model):
    ```prisma
    model SubmissionVersion {
      id           String   @id @default(uuid()) @db.Uuid
      submissionId String   @map("submission_id") @db.Uuid
      version      Int
      content      String   @db.Text
      fileUrls     String[] @default([]) @map("file_urls")
      createdAt    DateTime @default(now()) @map("created_at")
      submission   Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
      @@index([submissionId])
      @@map("submission_versions")
    }
    ```
  - **New model — AuditLog** (at end of schema):
    ```prisma
    model AuditLog {
      id        String   @id @default(uuid()) @db.Uuid
      action    String   @db.VarChar(100)
      userId    String   @map("user_id") @db.Uuid
      userName  String   @map("user_name") @db.VarChar(200)
      targetId  String?  @map("target_id") @db.Uuid
      details   String?  @db.Text
      createdAt DateTime @default(now()) @map("created_at")
      @@index([userId])
      @@index([action])
      @@map("audit_logs")
    }
    ```
  - **New model — OfficeHourCredit** (after OfficeHourRequest model):
    ```prisma
    model OfficeHourCredit {
      id        String   @id @default(uuid()) @db.Uuid
      userId    String   @map("user_id") @db.Uuid
      batchId   String   @map("batch_id") @db.Uuid
      credits   Int      @default(1)
      grantedBy String?  @map("granted_by") @db.Uuid
      reason    String?  @db.VarChar(200)
      createdAt DateTime @default(now()) @map("created_at")
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      batch     Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
      @@index([userId, batchId])
      @@map("office_hour_credits")
    }
    ```
  - **New model — Notification** (at end of schema):
    ```prisma
    model Notification {
      id        String   @id @default(uuid()) @db.Uuid
      type      String   @db.VarChar(50)
      userId    String   @map("user_id") @db.Uuid
      entityId  String?  @map("entity_id") @db.Uuid
      title     String   @db.VarChar(200)
      message   String?  @db.Text
      read      Boolean  @default(false)
      createdAt DateTime @default(now()) @map("created_at")
      user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
      @@index([userId, read])
      @@map("notifications")
    }
    ```
  - Add corresponding relation fields on User, Batch, Submission models (e.g., `versions SubmissionVersion[]` on Submission)
  - Run `npx prisma db push --accept-data-loss` to apply
  - Create backfill SQL script at `prisma/backfill-submission-status.sql`:
    ```sql
    UPDATE submissions SET status = CASE
      WHEN (SELECT COUNT(*) FROM feedbacks WHERE feedbacks.submission_id = submissions.id) > 0
      THEN 'reviewed' ELSE 'pending' END
    WHERE status = 'pending';
    ```
  - Run `npm run build` to verify Prisma client generation and type compatibility

  **Must NOT do**:
  - ❌ Do NOT remove or rename any existing columns
  - ❌ Do NOT change `UserBatch @@unique([userId, batchId])` constraint
  - ❌ Do NOT change existing enum values (keep `one_off`)
  - ❌ Do NOT use `prisma migrate` — use `prisma db push`
  - ❌ Do NOT add any field without a DEFAULT value

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Purely additive schema changes with no logic — just field/model additions
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: No browser testing needed for schema changes

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (sequential with T2)
  - **Blocks**: T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15
  - **Blocked By**: None (can start immediately)

  **References**:
  - `founder-sprint/prisma/schema.prisma` — Full schema file; add fields/models here
  - `founder-sprint/prisma/schema.prisma:67-116` — User model (add timezone, status fields after profileImage)
  - `founder-sprint/prisma/schema.prisma:140-155` — UserBatch model (add additionalRoles after role)
  - `founder-sprint/prisma/schema.prisma:330-350` — Submission model (add status after submittedAt)
  - `founder-sprint/prisma/schema.prisma:352-365` — Feedback model (add parentId, self-relation for threading)
  - `founder-sprint/prisma/schema.prisma:471-489` — Comment model with parentId self-relation — COPY THIS PATTERN for Feedback threading
  - `founder-sprint/prisma/schema.prisma:56-60` — EventType enum (add virtual, general_session)

  **Acceptance Criteria**:
  - [ ] `npx prisma db push --accept-data-loss` completes without error
  - [ ] `npm run build` passes
  - [ ] `npx prisma generate` outputs updated client with new models and fields
  - [ ] Backfill SQL script exists at `prisma/backfill-submission-status.sql`

  **QA Scenarios**:
  ```
  Scenario: Schema push succeeds with all new fields
    Tool: Bash
    Preconditions: Database is accessible via DATABASE_URL
    Steps:
      1. Run `npx prisma db push --accept-data-loss`
      2. Check exit code is 0
      3. Run `npx prisma generate`
      4. Run `npm run build`
    Expected Result: All commands exit 0, no type errors
    Evidence: .sisyphus/evidence/task-1-schema-push.txt

  Scenario: Existing data survives migration
    Tool: Bash
    Preconditions: Existing users/submissions in database
    Steps:
      1. After db push, run: `npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM users WHERE status = 'active'"`
      2. Verify count matches total users (all default to 'active')
    Expected Result: All existing users have status='active', no data loss
    Evidence: .sisyphus/evidence/task-1-data-integrity.txt
  ```

  **Commit**: YES
  - Message: `chore(schema): add fields and models for feedback implementation`
  - Files: `prisma/schema.prisma`, `prisma/backfill-submission-status.sql`
  - Pre-commit: `npm run build`

- [ ] 2. Fix Admin Access Bug — Server-Side Permission Guard (F14)

  **Feedback Items**: F14 — BUG: Changing role to Founder removes Admin page access (no permission check exists)

  **What to do**:
  - Create `src/app/(dashboard)/admin/layout.tsx` as a server-side permission guard:
    ```tsx
    import { redirect } from "next/navigation";
    import { getCurrentUser } from "@/lib/permissions";

    export default async function AdminLayout({ children }: { children: React.ReactNode }) {
      const user = await getCurrentUser();
      if (!user || !(user.role === "admin" || user.role === "super_admin")) {
        redirect("/dashboard");
      }
      return <>{children}</>;
    }
    ```
  - **NOTE**: `getCurrentUser()` is in `src/lib/permissions.ts`, NOT in `src/actions/auth.ts`. The dashboard layout (`src/app/(dashboard)/layout.tsx:4`) already imports it from `@/lib/permissions`.
  - This single layout protects ALL routes under `/admin/*` — no per-page guards needed
  - Do NOT modify the existing admin page files — the layout guard is sufficient
  - `npm run build` to verify

  **Must NOT do**:
  - ❌ Do NOT add individual permission checks to every admin page — layout guard handles it
  - ❌ Do NOT import from `@/actions/auth` for getCurrentUser — use `@/lib/permissions`
  - ❌ Do NOT redirect to `/login` — redirect to `/dashboard` (user is authenticated, just not admin)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single new file creation with standard pattern
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (sequential after T1)
  - **Parallel Group**: Wave 1
  - **Blocks**: T3, T4
  - **Blocked By**: T1 (needs schema with status field)

  **References**:
  - `founder-sprint/src/app/(dashboard)/admin/page.tsx` — Current admin page with NO permission check (the bug)
  - `founder-sprint/src/lib/permissions.ts:40` — `getCurrentUser()` function — IMPORT FROM HERE, not from actions/auth
  - `founder-sprint/src/lib/permissions.ts` — `isAdmin()`, `isStaff()` permission helper functions
  - `founder-sprint/src/app/(dashboard)/layout.tsx:4` — Existing import of `getCurrentUser` from `@/lib/permissions` — follow this pattern
  - `founder-sprint/src/app/(dashboard)/admin/companies/page.tsx:8-11` — Example of existing permission check pattern

  **Acceptance Criteria**:
  - [ ] `src/app/(dashboard)/admin/layout.tsx` exists with `getCurrentUser()` from `@/lib/permissions` + admin role check
  - [ ] Non-admin users accessing `/admin` get redirected to `/dashboard`
  - [ ] Admin users can still access `/admin` normally
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Admin layout file exists with correct guard
    Tool: Bash
    Preconditions: T1 completed, schema pushed
    Steps:
      1. Read `src/app/(dashboard)/admin/layout.tsx`
      2. Verify it imports `getCurrentUser` from `@/lib/permissions` (NOT from @/actions/auth)
      3. Verify it checks `user.role === "admin" || user.role === "super_admin"`
      4. Verify it calls `redirect("/dashboard")` for non-admin users
      5. Run `npm run build`
    Expected Result: File exists with correct imports and guard logic, build passes
    Evidence: .sisyphus/evidence/task-2-admin-guard.txt

  Scenario: Build succeeds with new layout
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Check exit code
    Expected Result: Exit code 0, no errors related to admin layout
    Evidence: .sisyphus/evidence/task-2-build.txt
  ```

  **Commit**: YES
  - Message: `fix(admin): add server-side permission guard to admin routes`
  - Files: `src/app/(dashboard)/admin/layout.tsx`
  - Pre-commit: `npm run build`

- [ ] 3. Multi-Role Support via additionalRoles (F13)

  **Feedback Items**: F13 — Multiple roles simultaneously (Founder + Admin + Mentor)

  **What to do**:
  - **IMPORTANT**: Do NOT change `UserBatch.role` or the `UserRole` enum. The `additionalRoles String[]` field was added in T1.

  **Step 1 — Overload permission functions** in `src/lib/permissions.ts`:
  - Change `isAdmin()` to accept EITHER a string (backward compat) OR a user-like object:
    ```ts
    type RoleInput = string | { role: string; additionalRoles?: string[] };

    export function isAdmin(input: RoleInput): boolean {
      if (typeof input === "string") {
        return input === "admin" || input === "super_admin";
      }
      return input.role === "admin" || input.role === "super_admin" ||
             input.additionalRoles?.includes("admin") || input.additionalRoles?.includes("super_admin") || false;
    }
    ```
  - Apply same overload pattern to `isStaff()`, `isMentor()`
  - Existing calls like `isAdmin(user.role)` (passing a string) continue to work unchanged
  - New calls like `isAdmin(user)` (passing user object) check additionalRoles too

  **Step 2 — Update `getCurrentUser()`** in `src/lib/permissions.ts` (NOT src/actions/auth.ts):
  - Include `additionalRoles` in the Prisma select/return for UserBatch
  - Update the return type to include `additionalRoles: string[]`

  **Step 3 — Update critical call sites** (MUST DO — these are the ones that matter for access control):
  - `src/app/(dashboard)/layout.tsx:18` — Change `isAdmin(user.role)` → `isAdmin(user)` so admin tab visibility works for users with admin in additionalRoles
  - `src/app/(dashboard)/admin/layout.tsx` (from T2) — Use `isAdmin(user)` (already passes full user)
  - `src/app/(dashboard)/groups/page.tsx:14` — Change `isStaff(user.role)` → `isStaff(user)` for group access

  Use `ast_grep_search` to find ALL `isAdmin(`, `isStaff(`, `isMentor(` call sites. Update the 3 critical ones listed above. Other call sites remain as-is (they still work correctly for single-role users, which is the majority).

  **Step 4 — Admin UI for assigning additional roles**:
  - Add `updateAdditionalRoles(userId, batchId, roles: string[])` action in `src/actions/user-management.ts`
  - Update `UserManagement.tsx` — add checkbox UI for additional roles in user edit section

  **Step 5 — Update types**:
  - Find `UserWithBatch` type and add `additionalRoles: string[]`

  **Must NOT do**:
  - ❌ Do NOT change the `UserRole` enum
  - ❌ Do NOT change `UserBatch.role` column type or name
  - ❌ Do NOT create a separate junction table for roles
  - ❌ Do NOT blindly update ALL call sites — only update the 3 critical ones listed above

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Touches permission system, auth, admin UI, type definitions — needs careful analysis
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, but must wait for T2)
  - **Parallel Group**: Wave 2 (with T5, T6, T7, T8; but T4 depends on T3)
  - **Blocks**: T4 (nav needs to know admin visibility)
  - **Blocked By**: T1, T2

  **References**:
  - `founder-sprint/src/lib/permissions.ts:40` — `getCurrentUser()` — UPDATE HERE, not in actions/auth.ts
  - `founder-sprint/src/lib/permissions.ts` — `isAdmin()`, `isStaff()`, `isMentor()` — overload with RoleInput type
  - `founder-sprint/src/app/(dashboard)/layout.tsx:18` — CRITICAL call site: `isAdmin(user.role)` → change to `isAdmin(user)`
  - `founder-sprint/src/app/(dashboard)/groups/page.tsx:14` — CRITICAL call site: `isStaff(user.role)` → change to `isStaff(user)`
  - `founder-sprint/src/actions/user-management.ts:318-346` — `updateUserRole()` — add sister function for additionalRoles
  - `founder-sprint/src/app/(dashboard)/admin/users/UserManagement.tsx` — Admin user management UI — add additionalRoles editor

  **Acceptance Criteria**:
  - [ ] `isAdmin()`, `isStaff()`, `isMentor()` accept `string | { role, additionalRoles? }` via RoleInput type
  - [ ] `getCurrentUser()` in `src/lib/permissions.ts` returns `additionalRoles` field
  - [ ] 3 critical call sites updated to pass user object: layout.tsx, admin/layout.tsx, groups/page.tsx
  - [ ] Existing `isAdmin("admin")` string calls still work (backward compatible)
  - [ ] Admin can assign additional roles in user management UI
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Permission functions accept both string and object
    Tool: Bash
    Steps:
      1. Read `src/lib/permissions.ts`
      2. Verify `isAdmin` accepts `RoleInput` (string | object)
      3. Verify string path works: `isAdmin("admin")` returns true
      4. Verify object path works: `isAdmin({ role: "founder", additionalRoles: ["admin"] })` returns true
      5. Run `npm run build`
    Expected Result: Functions handle both input types, build passes
    Evidence: .sisyphus/evidence/task-3-permissions.txt

  Scenario: Critical call sites updated
    Tool: Bash
    Steps:
      1. Read `src/app/(dashboard)/layout.tsx`
      2. Verify `isAdmin(user)` is called (not `isAdmin(user.role)`)
      3. Read `src/app/(dashboard)/groups/page.tsx`
      4. Verify `isStaff(user)` is called (not `isStaff(user.role)`)
      5. Run `npm run build`
    Expected Result: Critical call sites pass full user object, build passes
    Evidence: .sisyphus/evidence/task-3-callsites.txt
  ```

  **Commit**: YES
  - Message: `feat(auth): add multi-role support via additionalRoles array`
  - Files: `src/lib/permissions.ts`, `src/actions/user-management.ts`, `src/types/*`, `src/app/(dashboard)/layout.tsx`, `src/app/(dashboard)/groups/page.tsx`, `src/app/(dashboard)/admin/users/UserManagement.tsx`
  - Pre-commit: `npm run build`

- [ ] 4. Navigation Restructure — Flat Tabs + Redirects (F1-F8)

  **Feedback Items**: F1 (landing→feed), F2 (logo→feed), F3 (tab order), F4 (batch hover dropdown), F5 (dashboard placement), F6 (admin separate tab), F7 (sidebar mobile-only), F8 (remove submissions from sidebar)

  **What to do**:
  - **F1 — Root redirect**: Edit `src/app/page.tsx` line 9: change `redirect("/dashboard")` → `redirect("/feed")`
  - **F2 — Logo link**: Edit `src/components/layout/BookfaceTopNav.tsx` line 229: change `href="/dashboard"` → `href="/feed"`
  - **F3+F4+F5+F6 — Tab structure**: Rewrite the `dropdownMenus` array (line 174-208) in BookfaceTopNav.tsx:
    Replace the 4 dropdown menus with this structure:
    ```ts
    const navItems = [
      { key: "feed", label: "Feed", href: "/feed" },
      { key: "dashboard", label: "Dashboard", href: "/dashboard" },
      {
        key: "batch",
        label: currentBatchName || "Batch",
        items: [
          { href: "/schedule", label: "Schedule" },
          { href: "/assignments", label: "Assignments" },
          { href: "/office-hours", label: "Office Hours" },
        ],
      },
      // Only show Admin tab for admin/super_admin users
      ...(isAdmin ? [{ key: "admin", label: "Admin", href: "/admin" }] : []),
    ];
    ```
    - Feed and Dashboard are direct links (no dropdown)
    - Batch is the ONLY dropdown with hover items
    - Admin is a standalone tab (only visible to admin users)
    - Additional links (Questions, Messages, Founders, Companies, Events, Sessions) go into a "More" dropdown or secondary nav area
  - **Render logic**: Update the nav rendering to handle both direct links and dropdown items:
    - Direct links render as `<Link>` with active state highlighting
    - Batch renders as dropdown on hover (use existing dropdown pattern)
    - Keep the existing `isActive()` logic for pathname matching
  - **F7 — Sidebar mobile-only**: Edit `src/components/layout/DashboardSidebar.tsx` to add `className="lg:hidden"` or equivalent — hide on desktop, show on mobile
  - **F8 — Remove submissions from sidebar**: Remove the `/submissions` link from DashboardSidebar if it exists there
  - **Mobile menu**: Update the mobile hamburger menu (`allMobileLinks` at line 210) to reflect the new structure
  - Ensure `/dashboard` route still works (don't delete the page, just change the default redirect)

  **Must NOT do**:
  - ❌ Do NOT delete `/dashboard` route or page — keep it accessible, just not the default
  - ❌ Do NOT change BookfaceTopNav prop interface (keep user, isAdmin, batches, currentBatchId)
  - ❌ Do NOT add new npm dependencies for navigation components
  - ❌ Do NOT change the nav bar height (48px), color (#2F2C26), or z-index

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
    - Reason: Navigation UI restructure with hover dropdowns, active states, responsive behavior
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES (Wave 2, after T3 completes)
  - **Parallel Group**: Wave 2 (with T5, T6, T7, T8)
  - **Blocks**: None
  - **Blocked By**: T3 (needs multi-role for admin tab visibility logic)

  **References**:
  - `founder-sprint/src/app/page.tsx` — Root redirect (line 9: `redirect("/dashboard")` → change to `/feed`)
  - `founder-sprint/src/components/layout/BookfaceTopNav.tsx:174-208` — Current `dropdownMenus` array — REPLACE with new tab structure
  - `founder-sprint/src/components/layout/BookfaceTopNav.tsx:228-245` — Logo link (line 229: `href="/dashboard"` → `/feed`)
  - `founder-sprint/src/components/layout/BookfaceTopNav.tsx:247-400` — Desktop nav rendering — restructure for flat tabs + single dropdown
  - `founder-sprint/src/components/layout/BookfaceTopNav.tsx:779-884` — Mobile menu — update to match new structure
  - `founder-sprint/src/components/layout/DashboardSidebar.tsx` — Sidebar component — make mobile-only

  **Acceptance Criteria**:
  - [ ] `src/app/page.tsx` contains `redirect("/feed")`
  - [ ] Logo `<Link>` href is `/feed`
  - [ ] Nav shows: Feed | Dashboard | Batch▼ | Admin* (not 4 dropdowns)
  - [ ] Batch dropdown contains Schedule, Assignments, Office Hours
  - [ ] Admin tab only visible when `isAdmin` is true
  - [ ] `/dashboard` route still works (returns 200)
  - [ ] Sidebar hidden on desktop (lg:hidden or display:none for large screens)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Root redirect goes to /feed
    Tool: Bash
    Steps:
      1. Read `src/app/page.tsx`
      2. Verify line contains `redirect("/feed")`
    Expected Result: Authenticated users redirected to /feed
    Evidence: .sisyphus/evidence/task-4-redirect.txt

  Scenario: Nav structure matches spec
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, logged in as admin
    Steps:
      1. Navigate to /feed
      2. Verify nav contains text "Feed" as direct link
      3. Verify nav contains text "Dashboard" as direct link
      4. Verify nav contains "Batch" or batch name with hover dropdown
      5. Hover over Batch tab, verify dropdown contains "Schedule", "Assignments", "Office Hours"
      6. Verify "Admin" tab is visible
      7. Take screenshot
    Expected Result: All nav items present in correct order
    Evidence: .sisyphus/evidence/task-4-nav-structure.png

  Scenario: Dashboard route still accessible
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /dashboard
      2. Verify page loads without 404
    Expected Result: Dashboard page renders normally
    Evidence: .sisyphus/evidence/task-4-dashboard-alive.png
  ```

  **Commit**: YES
  - Message: `feat(nav): restructure navigation to flat tabs per feedback`
  - Files: `src/app/page.tsx`, `src/components/layout/BookfaceTopNav.tsx`, `src/components/layout/DashboardSidebar.tsx`
  - Pre-commit: `npm run build`

- [ ] 5. Submission Review States + Status Workflow (F30-F31)

  **Feedback Items**: F30 (4 review states: Pending/Reviewed/Approved/Needs Revision), F31 (checklist-based review)

  **What to do**:
  - **F30 — Submission status display**: Update `src/app/(dashboard)/submissions/[id]/page.tsx`:
    - Replace the inferred status logic (line 41-42: `feedbacks.length > 0 → "Reviewed"`) with the explicit `status` field from T1
    - Add a status badge component showing 4 states with distinct colors:
      - `pending` → gray badge "Pending Review"
      - `reviewed` → blue badge "Reviewed"
      - `approved` → green badge "Approved"
      - `needs_revision` → orange badge "Needs Revision"
    - Add a status change dropdown (visible to staff only) to update submission status
  - **F30 — Status update action**: Add `updateSubmissionStatus(submissionId, status)` to `src/actions/assignment.ts`:
    - Permission check: only admin/mentor can update status
    - Update `prisma.submission.update({ where: { id }, data: { status } })`
    - Revalidate path after update
  - **F30 — Dashboard filter**: Update `src/app/(dashboard)/submissions/SubmissionsDashboard.tsx`:
    - Add a status filter dropdown alongside the existing assignment filter
    - Filter values: All, Pending, Reviewed, Approved, Needs Revision
  - **F31 — Checklist review (MVP approach)**: For MVP, implement as structured feedback:
    - When staff gives feedback, show a simple checklist UI (3-5 checkable criteria set by assignment creator)
    - Add `reviewCriteria String[] @default([])` to Assignment model in this task (edit schema)
    - Add `checklist Json? @map("checklist")` to Feedback model — stores `{criterion: string, passed: boolean}[]`
    - Assignment creation form gets optional "Review Criteria" text inputs
    - Feedback form shows checkboxes for each criterion + free text

  **Must NOT do**:
  - ❌ Do NOT remove the existing feedback system — checklist is an addition
  - ❌ Do NOT change Feedback model's `content` field behavior
  - ❌ Do NOT add automated status transitions (e.g., auto-approve on all checkmarks)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Server action + UI changes + schema addition — medium complexity
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T3, T4, T6, T7, T8)
  - **Blocks**: T12 (submission Q&A depends on review states)
  - **Blocked By**: T1

  **References**:
  - `founder-sprint/src/app/(dashboard)/submissions/[id]/page.tsx:41-42` — Current inferred status logic — REPLACE with explicit status field
  - `founder-sprint/src/actions/assignment.ts:288-309` — `submitAssignment()` — reference for permission patterns
  - `founder-sprint/src/app/(dashboard)/submissions/SubmissionsDashboard.tsx:43-53` — Current assignment filter — add status filter alongside
  - `founder-sprint/src/app/(dashboard)/assignments/[id]/SubmissionsList.tsx` — Submissions list showing feedback — add status badge
  - `founder-sprint/prisma/schema.prisma` — Submission model (status field added in T1), Assignment model (add reviewCriteria), Feedback model (add checklist)

  **Acceptance Criteria**:
  - [ ] Submission detail page shows status badge with 4 distinct states
  - [ ] Staff can change submission status via dropdown on detail page
  - [ ] `updateSubmissionStatus()` server action exists with permission check
  - [ ] SubmissionsDashboard has status filter dropdown
  - [ ] Assignment creation form has optional review criteria fields
  - [ ] Feedback form shows checklist when review criteria exist
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Status badge renders correctly
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, submission exists
    Steps:
      1. Navigate to /submissions/{id}
      2. Verify status badge element exists
      3. Verify badge shows one of: "Pending Review", "Reviewed", "Approved", "Needs Revision"
    Expected Result: Status badge visible with correct label
    Evidence: .sisyphus/evidence/task-5-status-badge.png

  Scenario: Status update action works
    Tool: Bash
    Steps:
      1. Read `src/actions/assignment.ts`
      2. Verify `updateSubmissionStatus` function exists
      3. Verify it includes permission check (getCurrentUser + isStaff)
      4. Run `npm run build`
    Expected Result: Action exists with correct guards, build passes
    Evidence: .sisyphus/evidence/task-5-action.txt
  ```

  **Commit**: YES
  - Message: `feat(submission): add explicit review states and checklist-based review`
  - Files: `prisma/schema.prisma`, `src/actions/assignment.ts`, `src/app/(dashboard)/submissions/[id]/page.tsx`, `src/app/(dashboard)/submissions/SubmissionsDashboard.tsx`, `src/app/(dashboard)/assignments/[id]/SubmissionsList.tsx`
  - Pre-commit: `npm run build`

- [ ] 6. Office Hour Mentor Selection (F9)

  **Feedback Items**: F9 — Tab to select WHO (which mentor) to request office hours with. Also applies user timezone display to OH times (F29 partial — shared with T8).

  **What to do**:
  - **Remove hardcoded mentor**: In `src/actions/office-hour.ts`, find all uses of `OFFICE_HOUR_TARGET_EMAIL` env var
    - Replace with dynamic mentor lookup: query users with role `mentor` or `admin` in the current batch
    - `proposeOfficeHour()` should accept a `mentorId` parameter instead of using env var
  - **Mentor list query**: Add `getAvailableMentors(batchId)` action:
    - Query `UserBatch` where role is `mentor` or `admin` (or additionalRoles includes these)
    - Return list of `{id, name, profileImage, role}` for UI
  - **UI — Mentor selector**: Update `src/app/(dashboard)/office-hours/OfficeHoursList.tsx`:
    - Before the booking flow, show available mentors as selectable cards/tabs
    - Each mentor card shows: name, profile image, role
    - Selecting a mentor passes `mentorId` to the propose/request action
  - **Email update**: Update `sendOfficeHourRequestEmail()` to send to the selected mentor's email (not env var)
  - Keep `OFFICE_HOUR_TARGET_EMAIL` as a FALLBACK only — if no mentors found in batch, use env var
  - **Timezone display (F29)**: When displaying OH slot times in OfficeHoursList.tsx, use `displayInUserTimezone()` from `src/lib/timezone.ts` (utility created by T8, but import can be added now — T8 creates the function in Wave 3). If T8 hasn't run yet, use a simple import that will resolve when T8 completes. Alternatively, format with event timezone as fallback until T8 creates the utility.

  **Must NOT do**:
  - ❌ Do NOT remove `OFFICE_HOUR_TARGET_EMAIL` from env — keep as fallback
  - ❌ Do NOT change the office hour slot/request data models
  - ❌ Do NOT change the existing scheduling workflows (admin-scheduled, individual)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Server action changes + new query + UI mentor selector
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T3, T4, T5, T7)
  - **Blocks**: T8 (timezone needs T6's files stable), T10 (OH credits)
  - **Blocked By**: T1

  **References**:
  - `founder-sprint/src/actions/office-hour.ts` — Full OH actions file; find `OFFICE_HOUR_TARGET_EMAIL` usage and replace
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx` — OH UI — add mentor selector before booking
  - `founder-sprint/src/lib/email.ts:117-175` — `sendOfficeHourRequestEmail()` — update recipient to selected mentor
  - `founder-sprint/src/actions/user-management.ts` — Reference for querying users by role

  **Acceptance Criteria**:
  - [ ] `getAvailableMentors(batchId)` action returns mentor/admin users for the batch
  - [ ] `proposeOfficeHour()` accepts `mentorId` parameter
  - [ ] OH page shows mentor cards/tabs before booking
  - [ ] Email goes to selected mentor (not just env var)
  - [ ] `OFFICE_HOUR_TARGET_EMAIL` still works as fallback
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Mentor list action returns data
    Tool: Bash
    Steps:
      1. Read `src/actions/office-hour.ts`
      2. Verify `getAvailableMentors` function exists
      3. Verify it queries UserBatch for mentor/admin roles
      4. Run `npm run build`
    Expected Result: Function exists with correct query, build passes
    Evidence: .sisyphus/evidence/task-6-mentor-action.txt

  Scenario: Mentor selector visible in OH page
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, logged in as founder
    Steps:
      1. Navigate to /office-hours
      2. Look for mentor selection UI elements
      3. Take screenshot
    Expected Result: Mentor cards or tabs visible
    Evidence: .sisyphus/evidence/task-6-mentor-ui.png
  ```

  **Commit**: YES
  - Message: `feat(oh): dynamic mentor selection replacing hardcoded email`
  - Files: `src/actions/office-hour.ts`, `src/app/(dashboard)/office-hours/OfficeHoursList.tsx`, `src/lib/email.ts`
  - Pre-commit: `npm run build`

- [ ] 7. Event Types + Calendar Improvements (F17, F16, F19)

  **Feedback Items**: F17 (4 event types), F16 (calendar unification), F19 (calendar square indicators). Also applies user timezone display to event times (F29 partial — shared with T8).

  **What to do**:
  - **F17 — Event type labels**: The `virtual` and `general_session` enum values were added in T1.
    - Update `src/app/(dashboard)/events/EventsList.tsx` event type selector (line 46-50):
      - Change options to: "In-person Event", "Virtual Event", "General Session", "Office Hour"
      - Map: `in_person` → "In-person Event", `virtual` → "Virtual Event", `general_session` → "General Session", `office_hour` → "Office Hour"
      - Keep `one_off` in DB but don't show as creation option (legacy compat)
    - Update event type display throughout the events UI to use new labels
  - **F16 — Calendar unification (MVP)**: Since Schedule page already has the unified calendar view:
    - Add a prominent link/button on the Events page pointing to `/schedule` saying "View in Calendar"
    - Optionally redirect `/events` → `/schedule` with a query param for events filter
    - Keep Events page functional for list-view management
  - **F19 — Calendar square indicators**: Update `src/components/ui/Calendar.tsx`:
    - When a type filter is active (not "All"), show a square border/outline around the date number instead of just dots
    - When "All" is selected, keep the current colored dots behavior
    - Implementation: check the `typeFilter` prop, if set and not "all", render the date number inside a square border `<div>` with the type's color

  **Must NOT do**:
  - ❌ Do NOT remove the Events page entirely
  - ❌ Do NOT remove `one_off` from the EventType enum
  - ❌ Do NOT change the calendar's layout/sizing

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Enum label mapping + calendar component visual change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with T3, T4, T5, T6)
  - **Blocks**: T8 (timezone needs T7's files stable)
  - **Blocked By**: T1

  **References**:
  - `founder-sprint/src/app/(dashboard)/events/EventsList.tsx:46-50` — Current event type options — update labels and add new types (T7 EXCLUSIVELY owns this file)
  - `founder-sprint/src/components/ui/Calendar.tsx:178-221` — Current dot indicators — add square border logic for filtered view (T7 EXCLUSIVELY owns this file)
  - `founder-sprint/src/app/(dashboard)/schedule/ScheduleView.tsx` — Unified calendar view — reference only (owned by T8)
  - `founder-sprint/prisma/schema.prisma:56-60` — EventType enum with new values from T1

  **Acceptance Criteria**:
  - [ ] Event creation shows 4 types: In-person, Virtual, General Session, Office Hour
  - [ ] Calendar shows square border on date when type filter is active
  - [ ] Events page has link to Schedule calendar view
  - [ ] `one_off` events still display correctly (legacy compat)
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Event creation shows 4 types
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, logged in as admin
    Steps:
      1. Navigate to /events
      2. Click create event button
      3. Open event type selector dropdown
      4. Verify 4 options visible
    Expected Result: In-person, Virtual, General Session, Office Hour all present
    Evidence: .sisyphus/evidence/task-7-event-types.png

  Scenario: Calendar square indicator on filter
    Tool: Playwright (playwright skill)
    Steps:
      1. Navigate to /schedule
      2. Select a specific type filter (e.g., "Events")
      3. Verify dates with events show square border instead of dots
      4. Switch to "All" filter
      5. Verify dots return
    Expected Result: Visual indicator changes between dots (all) and square (filtered)
    Evidence: .sisyphus/evidence/task-7-calendar-indicator.png
  ```

  **Commit**: YES
  - Message: `feat(events): add virtual/general_session types and calendar square indicators`
  - Files: `src/app/(dashboard)/events/EventsList.tsx`, `src/components/ui/Calendar.tsx`
  - Pre-commit: `npm run build`

- [ ] 8. Per-User Timezone Setting and Display (F27, F29)

  **Feedback Items**: F27 (per-user default timezone setting), F29 (user-based timezone display)

  **What to do**:
  - **F27 — Timezone selector in settings**: Update `src/app/(dashboard)/settings/` page:
    - Add a timezone selector dropdown using the existing `TIMEZONE_MAP` from `src/lib/timezone.ts`
    - Options: UTC, KST (Asia/Seoul), PST (America/Los_Angeles), EST (America/New_York)
    - Save to `user.timezone` field (added in T1)
    - Add `updateUserTimezone(timezone)` server action
  - **F29 — Display in user's timezone**: Create a utility function in `src/lib/timezone.ts`:
    - `displayInUserTimezone(date: Date, userTimezone: string | null): string`
    - If `userTimezone` is null, fall back to event/session's own timezone (existing behavior)
    - If `userTimezone` is set, convert UTC date to user's timezone for display
  - **Apply to ScheduleView only** (T8's scope):
    - `src/app/(dashboard)/schedule/ScheduleView.tsx` — Format times in user's timezone
    - Pass `user.timezone` to ScheduleView from its parent page
    - **NOTE**: OH time formatting is handled by T6 (owns OfficeHoursList.tsx)
    - **NOTE**: Event time formatting is handled by T7 (owns EventsList.tsx)
    - T6 and T7 should use the `displayInUserTimezone()` utility created here
  - Do NOT change how dates are STORED — still UTC. Only change DISPLAY.

  **Must NOT do**:
  - ❌ Do NOT change internal date storage (stays UTC)
  - ❌ Do NOT modify `fromZonedTime`/`toZonedTime` in creation flows
  - ❌ Do NOT add timezone to email content (out of scope)
  - ❌ Do NOT edit OfficeHoursList.tsx or EventsList.tsx — those are owned by T6 and T7

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Settings UI change + utility function + multiple display point updates
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T10)
  - **Blocks**: None
  - **Blocked By**: T6, T7 (must complete first — T8 depends on their files being stable)

  **References**:
  - `founder-sprint/src/lib/timezone.ts` — Existing `TIMEZONE_MAP` and `toIanaTimezone()` — add `displayInUserTimezone()` here
  - `founder-sprint/src/app/(dashboard)/settings/` — Settings page — add timezone selector
  - `founder-sprint/src/app/(dashboard)/schedule/ScheduleView.tsx` — Schedule time display — apply user timezone (T8's exclusive file)

  **Acceptance Criteria**:
  - [ ] Settings page has timezone selector dropdown
  - [ ] `updateUserTimezone()` server action saves timezone to user record
  - [ ] `displayInUserTimezone()` utility exists in timezone.ts
  - [ ] ScheduleView displays times in user's preferred timezone when set
  - [ ] Falls back to event timezone when user timezone is null
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Timezone selector in settings
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, logged in
    Steps:
      1. Navigate to /settings
      2. Look for timezone selector element
      3. Verify dropdown contains UTC, KST, PST, EST options
    Expected Result: Timezone selector visible with correct options
    Evidence: .sisyphus/evidence/task-8-tz-settings.png

  Scenario: Build passes with timezone changes
    Tool: Bash
    Steps:
      1. Run `npm run build`
    Expected Result: Build succeeds, no type errors
    Evidence: .sisyphus/evidence/task-8-build.txt
  ```

  **Commit**: YES
  - Message: `feat(timezone): per-user timezone setting and display conversion`
  - Files: `src/lib/timezone.ts`, `src/app/(dashboard)/settings/*`, `src/app/(dashboard)/schedule/ScheduleView.tsx`
  - Pre-commit: `npm run build`

- [ ] 9. User Lifecycle — Soft Delete, Invite Resend, Dropout (F23, F24, F26)

  **Feedback Items**: F23 (invite resend), F24 (user deactivate/soft delete), F26 (dropout handling)

  **What to do**:
  - **F24+F26 — User deactivation** (combined — same mechanism):
    - Update `src/actions/user-management.ts`:
      - Add `deactivateUser(userId)` action: sets `User.status = "inactive"` instead of deleting
      - Add `reactivateUser(userId)` action: sets `User.status = "active"`
      - Modify `removeUserFromBatch()`: Instead of `prisma.user.delete()`, set `User.status = "dropped_out"` (the String field added in T1 on the User model, NOT the `UserBatch.status` enum which only has `invited`/`active`)
      - Do NOT change `UserBatch.status` — leave it as-is. Deactivation is tracked on the `User.status` String field only.
      - Keep Submission, Feedback, Post records intact (no cascade delete)
    - Update `src/lib/permissions.ts` — in `getCurrentUser()` (NOTE: getCurrentUser is in permissions.ts, NOT actions/auth.ts):
      - After fetching user, check `user.status === "active"` (this is the `User.status` String field added in T1, NOT the `UserBatch.status` enum) — if not active, redirect to a "deactivated" page
    - Create `src/app/deactivated/page.tsx`:
      - Simple page: "Your account has been deactivated. Contact your administrator."
      - Include sign-out button
    - Update admin UI in `UserManagement.tsx`:
      - Replace "Remove" button with "Deactivate" button
      - Add "Reactivate" button for inactive users
      - Show user status badge (active/inactive/dropped_out)
  - **F23 — Invite resend**:
    - Add `resendInvite(userId, batchId)` action to `user-management.ts`:
      - Delete existing InvitationToken for this user/batch
      - Create new InvitationToken with fresh 7-day expiry
      - Call `sendInvitationEmail()` with new token
    - Add "Resend Invite" button in UserManagement.tsx for users with status "invited"

  **Must NOT do**:
  - ❌ Do NOT hard-delete users anymore (except for test data cleanup)
  - ❌ Do NOT change Supabase auth — deactivation is at app level, not auth provider
  - ❌ Do NOT delete Submission/Feedback/Post records on deactivation
  - ❌ Do NOT add "reason for deactivation" field (out of scope)
  - ❌ Do NOT modify `UserBatch.status` enum (`UserBatchStatus`) — deactivation uses the `User.status` String field only

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Touches auth flow, deletion logic, admin UI, new page — needs careful analysis of cascading effects
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T10, T11, T12)
  - **Blocks**: T15 (audit log needs user records preserved)
  - **Blocked By**: T1

  **References**:
  - `founder-sprint/src/actions/user-management.ts:348-393` — Current `removeUserFromBatch()` with hard delete — CHANGE to soft delete
  - `founder-sprint/src/actions/user-management.ts:395-430` — `cancelInvite()` — reference pattern for invite management
  - `founder-sprint/src/actions/user-management.ts:128-130` — `inviteUserCore()` with 7-day expiry — reuse pattern for resend
  - `founder-sprint/src/lib/permissions.ts:40` — `getCurrentUser()` — add status check (NOT in actions/auth.ts)
  - `founder-sprint/src/app/(dashboard)/admin/users/UserManagement.tsx:295-303` — "Cancel Invite" button — add "Resend" alongside
  - `founder-sprint/src/lib/email.ts:27-105` — `sendInvitationEmail()` — reuse for resend

  **Acceptance Criteria**:
  - [ ] `deactivateUser()` sets user.status to "inactive" (not delete)
  - [ ] `reactivateUser()` sets user.status back to "active"
  - [ ] `removeUserFromBatch()` no longer hard-deletes users
  - [ ] Deactivated users see `/deactivated` page when trying to access app
  - [ ] `resendInvite()` generates new token and sends email
  - [ ] Admin UI shows Deactivate/Reactivate buttons instead of Remove
  - [ ] Submissions/feedback/posts preserved after deactivation
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Deactivation preserves records
    Tool: Bash
    Steps:
      1. Read `src/actions/user-management.ts`
      2. Verify `removeUserFromBatch` does NOT call `prisma.user.delete()`
      3. Verify it sets `User.status = "dropped_out"` or "inactive" (NOT UserBatch.status)
      4. Run `npm run build`
    Expected Result: No delete calls, status update instead, build passes
    Evidence: .sisyphus/evidence/task-9-soft-delete.txt

  Scenario: Deactivated page exists
    Tool: Bash
    Steps:
      1. Verify file exists: `src/app/deactivated/page.tsx`
      2. Read file and verify it shows deactivation message
      3. Run `npm run build`
    Expected Result: Page exists with correct content, build passes
    Evidence: .sisyphus/evidence/task-9-deactivated-page.txt
  ```

  **Commit**: YES
  - Message: `feat(user): soft delete, invite resend, and deactivated user page`
  - Files: `src/actions/user-management.ts`, `src/lib/permissions.ts`, `src/app/deactivated/page.tsx`, `src/app/(dashboard)/admin/users/UserManagement.tsx`
  - Pre-commit: `npm run build`

- [ ] 10. Office Hour Credits + Booking Workflow + Limits (F10, F11, F12)

  **Feedback Items**: F10 (credit system), F11 (full booking workflow), F12 (waitlist, no-show, weekly limits)

  **What to do**:
  - **F10 — Credit system (MVP)**:
    - `OfficeHourCredit` model was added in T1. Add server actions in `src/actions/office-hour.ts`:
      - `getUserCredits(userId, batchId)` — sum credits from OfficeHourCredit table
      - `grantCredits(userId, batchId, amount, reason)` — admin grants credits
      - `consumeCredit(userId, batchId)` — decrement 1 credit on booking (use transaction with WHERE credits check)
    - Auto-grant: After batch creation/activation, auto-create 1 credit per founder (can be triggered from batch admin)
    - Add `grantCredits` button in admin user management or OH admin panel
    - Show credit count on OH page for founders
  - **F11 — Booking workflow enhancement (MVP)**:
    - Current flow: founder proposes → admin approves → calendar event created
    - Enhanced flow: founder selects mentor (T6) → enters agenda/topic → submits request → admin sees with agenda → approves → calendar event
    - Add `agenda` text field to `OfficeHourRequest` (edit schema in this task: add `agenda String? @db.Text`)
    - Update propose flow to include agenda input
    - Show agenda in admin approval view
  - **F12 — Weekly booking limits (MVP)**:
    - Add `weeklyBookingLimit` config: hardcode to 2 per week per founder
    - In `proposeOfficeHour()`, before creating request:
      ```ts
      const thisWeekRequests = await prisma.officeHourRequest.count({
        where: { requesterId, createdAt: { gte: startOfWeek } }
      });
      if (thisWeekRequests >= 2) throw new Error("Weekly booking limit reached");
      ```
    - Show remaining bookings count on OH page
    - Skip waitlist and no-show tracking for MVP (too complex, low ROI for 6-month product)

  **Must NOT do**:
  - ❌ Do NOT implement waitlist system (out of MVP scope)
  - ❌ Do NOT implement no-show tracking (out of MVP scope)
  - ❌ Do NOT add credit refund/transfer/expiration logic
  - ❌ Do NOT make weekly limit configurable per batch (hardcode to 2)

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Transaction-based credit consumption, workflow enhancement, multiple action changes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T11, T12)
  - **Blocks**: None
  - **Blocked By**: T1, T6 (mentor selection must exist first)

  **References**:
  - `founder-sprint/src/actions/office-hour.ts` — All OH actions; add credit/limit checks here
  - `founder-sprint/src/app/(dashboard)/office-hours/OfficeHoursList.tsx` — OH UI; add credit display, agenda input
  - `founder-sprint/prisma/schema.prisma` — OfficeHourCredit model from T1; add `agenda` field to OfficeHourRequest

  **Acceptance Criteria**:
  - [ ] `getUserCredits()`, `grantCredits()`, `consumeCredit()` actions exist
  - [ ] OH page shows founder's remaining credits
  - [ ] Booking blocked when credits = 0 (with user-friendly error)
  - [ ] Admin can grant credits in admin panel
  - [ ] `agenda` field on OfficeHourRequest, visible in booking form and admin approval
  - [ ] Weekly limit (2/week) enforced in proposeOfficeHour()
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Credit system actions exist
    Tool: Bash
    Steps:
      1. Read `src/actions/office-hour.ts`
      2. Verify `getUserCredits`, `grantCredits`, `consumeCredit` functions exist
      3. Verify `consumeCredit` uses Prisma transaction
      4. Run `npm run build`
    Expected Result: All 3 functions present with correct logic, build passes
    Evidence: .sisyphus/evidence/task-10-credits.txt

  Scenario: Weekly limit enforced
    Tool: Bash
    Steps:
      1. Read `src/actions/office-hour.ts`
      2. Find `proposeOfficeHour` or equivalent
      3. Verify it counts this week's requests and blocks at limit
    Expected Result: Weekly limit check exists before request creation
    Evidence: .sisyphus/evidence/task-10-weekly-limit.txt
  ```

  **Commit**: YES
  - Message: `feat(oh): credit system, agenda field, and weekly booking limits`
  - Files: `prisma/schema.prisma`, `src/actions/office-hour.ts`, `src/app/(dashboard)/office-hours/OfficeHoursList.tsx`
  - Pre-commit: `npm run build`

- [ ] 11. Scope Management — Assignment + Session Targeting (F20, F22)

  **Feedback Items**: F20 (assignment scoping to groups/founders), F22 (session scoping to tracks)

  **What to do**:
  - **F20 — Assignment targeting (MVP)**:
    - Current: assignments are batch-wide via `batchId`
    - Enhancement: add optional `targetGroupId` and `targetUserIds` to filter who sees the assignment
    - Edit `prisma/schema.prisma` — add to Assignment model:
      - `targetGroupId String? @map("target_group_id") @db.Uuid` — target specific group
      - `targetUserIds String[] @default([]) @map("target_user_ids")` — target specific users
    - Update `createAssignment()` in `src/actions/assignment.ts`:
      - Accept optional `targetGroupId` and `targetUserIds` parameters
    - Update assignment fetching queries:
      - When founder views assignments, filter: `WHERE (targetUserIds IS EMPTY OR founderId IN targetUserIds) AND (targetGroupId IS NULL OR founderId IN group members)`
      - When admin views, show all with scope indicators
    - Update assignment creation form to show optional "Target" selector:
      - "All founders" (default) / "Specific group" / "Specific founders"
  - **F22 — Session scoping (MVP)**:
    - Sessions already have multi-batch via `SessionBatch` junction table
    - For "track" scoping: reuse groups as tracks (Group model already exists)
    - Add `targetGroupId String? @map("target_group_id") @db.Uuid` to Session model
    - Update session visibility queries to filter by group membership
    - Update session creation form to show optional group selector

  **Must NOT do**:
  - ❌ Do NOT create a new "Track" model — reuse Group model
  - ❌ Do NOT change existing batch-wide assignment behavior (targeting is optional)
  - ❌ Do NOT add complex visibility rules — simple inclusion filter only

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Schema addition + query filter updates + form UI changes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T10, T12)
  - **Blocks**: None
  - **Blocked By**: T1

  **References**:
  - `founder-sprint/src/actions/assignment.ts:31-94` — `createAssignment()` — add targeting params
  - `founder-sprint/src/actions/session.ts:86-230` — `createSession()` — add group targeting
  - `founder-sprint/prisma/schema.prisma:312-328` — Assignment model — add targeting fields
  - `founder-sprint/prisma/schema.prisma:289-309` — Session model — add targetGroupId
  - `.sisyphus/plans/batch-targeted-assignments.md` — Previous plan for batch-level targeting (already executed as commit `8e3d15f`) — this extends to group/founder level

  **Acceptance Criteria**:
  - [ ] Assignment model has `targetGroupId` and `targetUserIds` fields
  - [ ] Session model has `targetGroupId` field
  - [ ] Assignment creation form shows optional targeting selector
  - [ ] Founders only see assignments targeted to them (or all-founders)
  - [ ] Admins see all assignments with scope indicators
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Assignment targeting fields exist in schema
    Tool: Bash
    Steps:
      1. Read `prisma/schema.prisma`
      2. Verify Assignment model has `targetGroupId` and `targetUserIds`
      3. Verify Session model has `targetGroupId`
      4. Run `npx prisma db push --accept-data-loss && npm run build`
    Expected Result: Fields present, push and build succeed
    Evidence: .sisyphus/evidence/task-11-schema.txt
  ```

  **Commit**: YES
  - Message: `feat(scope): add group/founder targeting for assignments and sessions`
  - Files: `prisma/schema.prisma`, `src/actions/assignment.ts`, `src/actions/session.ts`, assignment creation UI
  - Pre-commit: `npm run build`

- [ ] 12. Submission Q&A Threading + Version History (F32, F33)

  **Feedback Items**: F32 (threaded Q&A on submissions), F33 (submission version management)

  **What to do**:
  - **F32 — Threaded feedback/Q&A**:
    - `Feedback.parentId` self-relation was added in T1 (following Comment model pattern)
    - Update `src/actions/assignment.ts`:
      - Add `replyToFeedback(feedbackId, content)` action — creates Feedback with `parentId` set
      - Update `getSubmission()` or equivalent query to include `replies` relation
    - Update submission detail UI (`src/app/(dashboard)/submissions/[id]/page.tsx`):
      - Display feedback as threaded: top-level feedbacks with indented replies
      - Add "Reply" button on each feedback item
      - Reply form appears inline below the feedback
    - Both staff and founders can reply (Q&A is bidirectional)
  - **F33 — Version management**:
    - `SubmissionVersion` model was added in T1
    - Update `submitAssignment()` in `src/actions/assignment.ts`:
      - Before upserting submission, if submission exists:
        - Create a `SubmissionVersion` record with current content + version number
        - Then update submission with new content
      - Version numbering: auto-increment (count existing versions + 1)
    - Update submission detail page:
      - Show "Version History" section (collapsible)
      - List versions with timestamps: "v1 — Mar 10", "v2 — Mar 12"
      - Click version to view its content (read-only)
    - Current submission is always the latest; versions are historical snapshots

  **Must NOT do**:
  - ❌ Do NOT add diff visualization between versions
  - ❌ Do NOT allow restoring old versions (view-only)
  - ❌ Do NOT add version limits (keep all versions)
  - ❌ Do NOT change the existing feedback display for non-threaded feedback

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Server action changes + UI threading logic + version snapshot creation
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with T9, T10, T11)
  - **Blocks**: None
  - **Blocked By**: T1, T5 (review states should exist first)

  **References**:
  - `founder-sprint/prisma/schema.prisma:352-365` — Feedback model with parentId from T1
  - `founder-sprint/prisma/schema.prisma:471-489` — Comment model with threading — EXACT PATTERN to follow for Feedback display
  - `founder-sprint/src/actions/assignment.ts:288-309` — `submitAssignment()` upsert — add version snapshot before update
  - `founder-sprint/src/app/(dashboard)/submissions/[id]/page.tsx` — Submission detail — add threading + version history

  **Acceptance Criteria**:
  - [ ] `replyToFeedback()` action creates threaded feedback with parentId
  - [ ] Submission detail shows threaded feedback (indent replies under parent)
  - [ ] Reply button appears on each feedback item
  - [ ] `submitAssignment()` creates SubmissionVersion snapshot before update
  - [ ] Version history visible on submission detail page
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Threading action exists
    Tool: Bash
    Steps:
      1. Read `src/actions/assignment.ts`
      2. Verify `replyToFeedback` function exists
      3. Verify it sets `parentId` on new Feedback record
      4. Run `npm run build`
    Expected Result: Function exists with correct parentId usage, build passes
    Evidence: .sisyphus/evidence/task-12-threading.txt

  Scenario: Version snapshot created on resubmit
    Tool: Bash
    Steps:
      1. Read `src/actions/assignment.ts`
      2. Find `submitAssignment` function
      3. Verify it creates SubmissionVersion before upsert when submission exists
    Expected Result: Version snapshot logic present
    Evidence: .sisyphus/evidence/task-12-versions.txt
  ```

  **Commit**: YES
  - Message: `feat(submission): threaded Q&A feedback and version history`
  - Files: `src/actions/assignment.ts`, `src/app/(dashboard)/submissions/[id]/page.tsx`
  - Pre-commit: `npm run build`

- [ ] 13. Notification Emails — 5 Trigger Events (F35-F39)

  **Feedback Items**: F35 (assignment creation), F36 (deadline reminder), F37 (submission completion), F38 (feedback registered), F39 (OH booking)

  **What to do**:
  - Add 5 new email functions to `src/lib/email.ts` following the existing `sendInvitationEmail()` pattern:
    - `sendAssignmentCreatedEmail(founderEmails[], assignmentTitle, dueDate, batchName)` — F35
    - `sendDeadlineReminderEmail(founderEmail, assignmentTitle, dueDate, hoursRemaining)` — F36
    - `sendSubmissionCompletedEmail(adminEmails[], founderName, assignmentTitle)` — F37
    - `sendFeedbackNotificationEmail(founderEmail, mentorName, assignmentTitle)` — F38
    - `sendOfficeHourBookingConfirmEmail(founderEmail, mentorName, dateTime, meetLink)` — F39
  - Wire triggers into existing server actions:
    - `createAssignment()` in assignment.ts → call `sendAssignmentCreatedEmail()` to all batch founders
    - `submitAssignment()` in assignment.ts → call `sendSubmissionCompletedEmail()` to admins
    - `createFeedback()` in assignment.ts → call `sendFeedbackNotificationEmail()` to submission author
    - `approveOfficeHourRequest()` in office-hour.ts → call `sendOfficeHourBookingConfirmEmail()` (F39 — supplement existing approval email)
  - For F36 (deadline reminders): This needs a cron/scheduled job which is complex. MVP approach:
    - Add a "Send Reminder" button on assignment admin view
    - When admin clicks, sends reminder email to all founders who haven't submitted
    - Skip automatic cron-based reminders for MVP
  - All emails: use `nodemailer` via existing `transporter` in email.ts, plain HTML templates matching existing style

  **Must NOT do**:
  - ❌ Do NOT create in-app notification center or Notification model UI
  - ❌ Do NOT add notification preferences/settings
  - ❌ Do NOT implement automated cron-based deadline reminders
  - ❌ Do NOT add WebSocket/SSE real-time notifications

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 5 email functions following exact existing pattern + wiring into existing actions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T14, T15)
  - **Blocks**: None
  - **Blocked By**: T1

  **References**:
  - `founder-sprint/src/lib/email.ts:27-105` — `sendInvitationEmail()` — EXACT pattern to follow for all 5 new functions
  - `founder-sprint/src/lib/email.ts:117-175` — `sendOfficeHourRequestEmail()` — another email pattern reference
  - `founder-sprint/src/actions/assignment.ts:31-94` — `createAssignment()` — wire F35 trigger here
  - `founder-sprint/src/actions/assignment.ts:288-309` — `submitAssignment()` — wire F37 trigger here
  - `founder-sprint/src/actions/office-hour.ts` — approval action — wire F39 trigger here

  **Acceptance Criteria**:
  - [ ] 5 new email functions exist in email.ts
  - [ ] Assignment creation triggers email to batch founders
  - [ ] Submission triggers email to admins
  - [ ] Feedback triggers email to submission author
  - [ ] OH approval triggers confirmation email
  - [ ] "Send Reminder" button exists on assignment admin view
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Email functions exist with correct signatures
    Tool: Bash
    Steps:
      1. Read `src/lib/email.ts`
      2. Verify 5 new functions exist: sendAssignmentCreatedEmail, sendDeadlineReminderEmail, sendSubmissionCompletedEmail, sendFeedbackNotificationEmail, sendOfficeHourBookingConfirmEmail
      3. Run `npm run build`
    Expected Result: All 5 functions present, build passes
    Evidence: .sisyphus/evidence/task-13-emails.txt
  ```

  **Commit**: YES
  - Message: `feat(notify): email notifications for assignments, submissions, feedback, OH`
  - Files: `src/lib/email.ts`, `src/actions/assignment.ts`, `src/actions/office-hour.ts`, assignment admin UI
  - Pre-commit: `npm run build`

- [ ] 14. Admin Search/Filter Views (F40-F43)

  **Feedback Items**: F40 (non-submitter list), F41 (unreviewed submissions filter), F42 (founder activity history), F43 (this week's deadline assignments)

  **What to do**:
  - **F40 — Non-submitter list**: In `src/actions/assignment.ts`:
    - Add `getNonSubmitters(assignmentId)` action:
      - Query all founders in the assignment's batch
      - LEFT JOIN submissions WHERE assignmentId — filter WHERE submission IS NULL
      - Return list of `{name, email, company}` who haven't submitted
    - Show in assignment detail page (admin view) as "Not Yet Submitted" section with count
  - **F41 — Unreviewed submissions filter**: In `src/app/(dashboard)/submissions/SubmissionsDashboard.tsx`:
    - Add "Status" filter dropdown (if not already done in T5): Pending, Reviewed, Approved, Needs Revision
    - This may already be partially done by T5 — verify and complete
  - **F42 — Founder activity history (MVP)**: Add simple activity view:
    - In `src/app/(dashboard)/admin/users/` or profile page:
      - Show "Activity" tab listing: submission count, feedback received count, OH requests, posts count
      - Simple aggregate queries, no detailed timeline
    - Add `getFounderActivity(userId)` action with counts
  - **F43 — This week's deadline assignments**: In `src/app/(dashboard)/assignments/` (admin view):
    - Add "This Week" filter or section at top showing assignments with dueDate in current week
    - Add `getThisWeekAssignments(batchId)` action:
      ```ts
      prisma.assignment.findMany({
        where: { batchId, dueDate: { gte: startOfWeek(), lte: endOfWeek() } }
      })
      ```

  **Must NOT do**:
  - ❌ Do NOT add full-text search
  - ❌ Do NOT create new database indexes beyond Prisma defaults
  - ❌ Do NOT build a detailed activity timeline (just aggregate counts)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Multiple queries + UI sections across different pages
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T13, T15)
  - **Blocks**: None
  - **Blocked By**: T1

  **References**:
  - `founder-sprint/src/actions/assignment.ts` — Add `getNonSubmitters()`, `getThisWeekAssignments()` queries
  - `founder-sprint/src/app/(dashboard)/assignments/[id]/SubmissionsList.tsx` — Add non-submitter section
  - `founder-sprint/src/app/(dashboard)/submissions/SubmissionsDashboard.tsx` — Status filter (may overlap with T5)
  - `founder-sprint/src/app/(dashboard)/admin/users/UserManagement.tsx` — Activity summary per user

  **Acceptance Criteria**:
  - [ ] `getNonSubmitters(assignmentId)` returns list of founders without submissions
  - [ ] Assignment detail shows "Not Yet Submitted" count and list (admin only)
  - [ ] Submission dashboard has status filter (coordinated with T5)
  - [ ] `getFounderActivity(userId)` returns aggregate counts
  - [ ] "This Week" assignments section/filter exists on assignments page
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Non-submitter query exists
    Tool: Bash
    Steps:
      1. Read `src/actions/assignment.ts`
      2. Verify `getNonSubmitters` function exists
      3. Verify it uses LEFT JOIN or equivalent Prisma query
      4. Run `npm run build`
    Expected Result: Function exists with correct query pattern, build passes
    Evidence: .sisyphus/evidence/task-14-non-submitters.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): non-submitter list, activity history, deadline filter views`
  - Files: `src/actions/assignment.ts`, `src/app/(dashboard)/assignments/*`, `src/app/(dashboard)/submissions/SubmissionsDashboard.tsx`, `src/app/(dashboard)/admin/users/*`
  - Pre-commit: `npm run build`

- [ ] 15. Audit Log + Batch Clone (F25, F34)

  **Feedback Items**: F25 (role change audit log), F34 (clone batch assignments/sessions as templates)

  **What to do**:
  - **F25 — Role change audit log**:
    - `AuditLog` model was added in T1. Add logging to existing role-change actions:
    - In `src/actions/user-management.ts`:
      - After `updateUserRole()`: create AuditLog entry `{ action: "role_change", userId: adminId, userName, targetId: affectedUserId, details: JSON.stringify({ from: oldRole, to: newRole }) }`
      - After `deactivateUser()` (from T9): log `{ action: "user_deactivated", ... }`
      - After `reactivateUser()` (from T9): log `{ action: "user_reactivated", ... }`
    - Store admin's name in `userName` (denormalized) so log survives even if admin is later deleted
    - Add `getAuditLog(limit?)` action — returns recent audit entries
    - Add simple audit log view in admin panel:
      - New tab or section in admin page showing recent actions
      - Table: Date | Admin | Action | Target | Details
  - **F34 — Batch clone (MVP)**:
    - Add `cloneBatch(sourceBatchId, newBatchName, newStartDate, newEndDate)` action in `src/actions/batch.ts`:
      - Create new Batch with given name/dates
      - Copy Assignment structures: title, description, templateUrl (NOT submissions or feedback)
      - Copy Session structures: title, description, slidesUrl (NOT attendees)
      - Do NOT copy users, groups, submissions, or any user-generated content
      - Return new batch ID
    - Add "Clone Batch" button in admin batch management (`BatchList.tsx`)
    - Show modal: enter new batch name, start date, end date → clone

  **Must NOT do**:
  - ❌ Do NOT add search/filter on audit log (just recent list)
  - ❌ Do NOT clone users, groups, submissions, or feedback
  - ❌ Do NOT add audit logging for every action (only role changes and user lifecycle)
  - ❌ Do NOT make templates editable before cloning

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Two independent features — audit logging + batch cloning
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with T13, T14)
  - **Blocks**: None
  - **Blocked By**: T1, T9 (audit log for deactivation actions needs T9's functions)

  **References**:
  - `founder-sprint/src/actions/user-management.ts:318-346` — `updateUserRole()` — add audit log entry after role change
  - `founder-sprint/src/actions/batch.ts` — Batch CRUD — add `cloneBatch()` function
  - `founder-sprint/src/app/(dashboard)/admin/batches/BatchList.tsx` — Batch management UI — add "Clone" button
  - `founder-sprint/prisma/schema.prisma` — AuditLog model from T1

  **Acceptance Criteria**:
  - [ ] Role changes create AuditLog entries with old/new role
  - [ ] `getAuditLog()` action returns recent entries
  - [ ] Admin panel shows audit log table
  - [ ] `cloneBatch()` creates new batch with copied assignments and sessions
  - [ ] Cloned batch has NO users, submissions, or user content
  - [ ] "Clone Batch" button in admin batch list with modal
  - [ ] `npm run build` passes

  **QA Scenarios**:
  ```
  Scenario: Audit log function exists
    Tool: Bash
    Steps:
      1. Read `src/actions/user-management.ts`
      2. Verify AuditLog entry is created inside `updateUserRole`
      3. Verify `getAuditLog` function exists
      4. Run `npm run build`
    Expected Result: Audit logging wired into role change, build passes
    Evidence: .sisyphus/evidence/task-15-audit.txt

  Scenario: Clone batch function exists
    Tool: Bash
    Steps:
      1. Read `src/actions/batch.ts`
      2. Verify `cloneBatch` function exists
      3. Verify it copies assignments and sessions but NOT users/submissions
      4. Run `npm run build`
    Expected Result: Clone function present with correct scope, build passes
    Evidence: .sisyphus/evidence/task-15-clone.txt
  ```

  **Commit**: YES
  - Message: `feat(admin): role change audit log and batch cloning`
  - Files: `src/actions/user-management.ts`, `src/actions/batch.ts`, `src/app/(dashboard)/admin/batches/BatchList.tsx`, admin audit log UI
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `deep`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, check schema, grep for functions). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan. Verify all 34 feedback items (F1-F43 excluding implemented ones) are addressed.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [15/15] | Feedback Items [34/34] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check AI slop: excessive comments, over-abstraction, generic names. Verify all new server actions have permission checks. Verify all new schema fields have defaults.
  Output: `Build [PASS/FAIL] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real QA — Playwright** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Navigate every changed page: /feed, /dashboard, /admin, /settings, /office-hours, /assignments, /submissions, /schedule, /events. Verify nav structure, status badges, timezone selector, mentor cards, credit display. Take screenshots of each. Test mobile viewport nav. Test admin vs non-admin visibility.
  Output: `Pages [N/N pass] | Mobile [PASS/FAIL] | Admin Visibility [PASS/FAIL] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination: Task N touching Task M's files. Flag unaccounted changes.
  Output: `Tasks [15/15 compliant] | Contamination [CLEAN/N issues] | VERDICT`

---

## Commit Strategy

| # | Message | Files | Pre-commit |
|---|---------|-------|-----------|
| 1 | `chore(schema): add fields and models for feedback implementation` | prisma/schema.prisma, prisma/backfill-submission-status.sql | npm run build |
| 2 | `fix(admin): add server-side permission guard to admin routes` | src/app/(dashboard)/admin/layout.tsx | npm run build |
| 3 | `feat(auth): add multi-role support via additionalRoles array` | permissions.ts, user-management.ts, types, layout.tsx, groups/page.tsx, UserManagement.tsx | npm run build |
| 4 | `feat(nav): restructure navigation to flat tabs per feedback` | page.tsx, BookfaceTopNav.tsx, DashboardSidebar.tsx | npm run build |
| 5 | `feat(submission): add explicit review states and checklist-based review` | schema, assignment.ts, submissions UI | npm run build |
| 6 | `feat(oh): dynamic mentor selection replacing hardcoded email` | office-hour.ts, OfficeHoursList.tsx, email.ts | npm run build |
| 7 | `feat(events): add virtual/general_session types and calendar indicators` | EventsList.tsx, Calendar.tsx | npm run build |
| 8 | `feat(timezone): per-user timezone setting and display conversion` | timezone.ts, settings, ScheduleView, EventsList, OfficeHoursList | npm run build |
| 9 | `feat(user): soft delete, invite resend, and deactivated user page` | user-management.ts, permissions.ts, deactivated/page.tsx, UserManagement.tsx | npm run build |
| 10 | `feat(oh): credit system, agenda field, and weekly booking limits` | schema, office-hour.ts, OfficeHoursList.tsx | npm run build |
| 11 | `feat(scope): add group/founder targeting for assignments and sessions` | schema, assignment.ts, session.ts | npm run build |
| 12 | `feat(submission): threaded Q&A feedback and version history` | assignment.ts, submissions/[id]/page.tsx | npm run build |
| 13 | `feat(notify): email notifications for assignments, submissions, feedback, OH` | email.ts, assignment.ts, office-hour.ts | npm run build |
| 14 | `feat(admin): non-submitter list, activity history, deadline filter views` | assignment.ts, assignments UI, submissions UI, admin users | npm run build |
| 15 | `feat(admin): role change audit log and batch cloning` | user-management.ts, batch.ts, BatchList.tsx | npm run build |

---

## Success Criteria

### Verification Commands
```bash
npm run build                    # Expected: exit 0, no errors
npx prisma db push --dry-run     # Expected: shows planned changes, no conflicts
npx prisma generate              # Expected: generates client with new models
```

### Final Checklist
- [ ] All 34 feedback items addressed (F1-F43 minus 7 already implemented)
- [ ] All "Must Have" items present
- [ ] All "Must NOT Have" items absent
- [ ] `npm run build` passes after every commit
- [ ] No existing features broken
- [ ] All new schema fields have DEFAULT values
- [ ] Admin route protected by server-side guard
- [ ] Navigation shows flat tabs (not dropdowns)
- [ ] Submission status shows 4 states
- [ ] Multi-role works via additionalRoles without breaking existing role checks
- [ ] User deactivation preserves records (no hard delete)
- [ ] OH mentor selection replaces hardcoded email
- [ ] 5 notification email functions exist and are wired
