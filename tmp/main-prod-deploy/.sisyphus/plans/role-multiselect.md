# Role Multi-Select: Downward Hierarchy Model

## TL;DR

> **Quick Summary**: Refactor role management from "primary role dropdown + free-text additionalRoles prompt" to a "downward multi-select" model where admins set a primary role and can only add roles LOWER in the hierarchy via checkboxes. No schema or permission logic changes — UI and server validation only.
> 
> **Deliverables**:
> - Shared role hierarchy utility (`src/lib/role-hierarchy.ts`)
> - Server-side validation: reject additionalRoles at or above primary role
> - Atomic cleanup: when primary role changes, auto-strip invalid additionalRoles
> - Checkbox UI replacing `window.prompt()` in UserManagement (both mobile + desktop layouts)
> - Equal badge display for all roles (no "+" prefix)
> - Super_admin rows rendered as display-only (no editable controls)
> - `currentUserRole` prop plumbed from server component
> 
> **Estimated Effort**: Short (3-4 hours)
> **Parallel Execution**: YES - 2 waves
> **Critical Path**: Task 1 → Task 3 → Task 4

---

## Context

### Original Request
PDF feedback items F2/F3 require users to hold multiple roles simultaneously (e.g., admin + founder). Previous implementation added `UserBatch.additionalRoles String[]` with a free-text `window.prompt()` UI and no hierarchy validation. User confirmed this was the wrong mental model — the correct approach is a "downward multi-select" where only roles BELOW the primary role can be added as additional.

### Interview Summary
**Key Discussions**:
- PDF says "Founder, Admin, Mentor등 중복 설정이 가능해야" — simultaneous role assignment
- Peter's real issue: changed role to Founder, lost admin access
- User confirmed: "상위 role이 처음 배정된 사람만 하위 role들을 가질 수 있게" — downward only
- Role hierarchy confirmed: `super_admin > admin > mentor > founder > co_founder`
- Schema stays the same (`UserBatch.role` + `UserBatch.additionalRoles`)

**Research Findings**:
- `permissions.ts:getPermissionContext()` already merges `role + additionalRoles` into a Set — no permission changes needed
- `BatchMembersSidebar.tsx:39-44` has existing `rolePriority` mapping — reuse as shared constant
- `UserManagement.tsx` has dual layouts: mobile (L405-523), desktop (L525-672) — BOTH need updates
- `updateAdditionalRoles` server action accepts ANY string with zero validation — security hole
- `page.tsx` doesn't pass current user's role — needed for hierarchy enforcement context

### Metis Review
**Identified Gaps** (addressed):
- Q1: `page.tsx` doesn't pass `currentUserRole` → Task 3 adds this prop
- Q2: Dirty existing data in additionalRoles → Task 2 adds validation that silently filters invalid values on save
- Q3: Non-atomic role change + cleanup → Task 2 handles cleanup inside `updateUserRole` atomically
- Q4: Super_admin rows can be accidentally downgraded → Task 4 makes them display-only
- Q5: Admin self-demotion risk → Documented as known limitation, out of scope
- Q6: Badge display equality → Task 4 uses same `variant="role"` for all, drops "+" prefix
- Q7: Invite modal hierarchy → Explicitly out of scope

---

## Work Objectives

### Core Objective
Replace the free-text `window.prompt()` additional roles UI with a validated checkbox multi-select that enforces downward-only role assignment hierarchy.

### Concrete Deliverables
- `src/lib/role-hierarchy.ts` — new shared utility
- `src/actions/user-management.ts` — validation + atomic cleanup in `updateUserRole` and `updateAdditionalRoles`
- `src/app/(dashboard)/admin/users/page.tsx` — pass `currentUserRole` prop
- `src/app/(dashboard)/admin/users/UserManagement.tsx` — checkbox UI, equal badges, super_admin display-only

### Definition of Done
- [ ] Checkbox UI renders only roles below primary — verified via Playwright
- [ ] Server rejects additionalRoles at or above primary — verified via curl
- [ ] Primary role change auto-strips invalid additionalRoles — verified via Playwright
- [ ] Super_admin rows show as display-only — verified visually
- [ ] Both mobile AND desktop layouts updated — verified at 375px and 1280px viewports
- [ ] `npm run build` passes with zero errors

### Must Have
- Downward-only hierarchy enforcement (server-validated)
- Checkbox multi-select replacing window.prompt()
- Atomic cleanup when primary role changes
- Super_admin rows are non-editable
- Both mobile + desktop layouts updated identically

### Must NOT Have (Guardrails)
- ❌ DO NOT modify `permissions.ts` or `permissions-client.ts` — permission logic is correct as-is
- ❌ DO NOT modify `prisma/schema.prisma` — no schema changes
- ❌ DO NOT modify `Badge.tsx` — only change how badges are USED in UserManagement
- ❌ DO NOT modify server actions in other files (`assignment.ts`, `office-hour.ts`, `feed.ts`, etc.)
- ❌ DO NOT change the invite modal's role selection behavior
- ❌ DO NOT refactor badge rendering in other pages (`dashboard/page.tsx`, `BatchMembersSidebar.tsx`)
- ❌ DO NOT add self-role-change prevention (separate concern)
- ❌ DO NOT add new npm dependencies

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Playwright in `e2e/` directory)
- **Automated tests**: None (user preference: "빠른 운영 검증 우선")
- **Framework**: N/A

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Server validation**: Use Bash (bun REPL or direct function call) — import, call, assert
- **UI behavior**: Use Playwright (playwright skill) — navigate, interact, assert DOM, screenshot
- **Build check**: Use Bash — `npm run build`

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — utility + server logic):
├── Task 1: Create shared role hierarchy utility [quick]
└── Task 2: Add server-side validation + atomic cleanup [quick]

Wave 2 (After Wave 1 — UI changes):
├── Task 3: Plumb currentUserRole prop from page.tsx [quick]
└── Task 4: Refactor UserManagement.tsx UI (both layouts) [unspecified-high]

Wave FINAL (After ALL tasks):
├── Task F1: Build verification + visual QA [quick]
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 2, 3, 4 | 1 |
| 2 | 1 | 4 | 1 |
| 3 | 1 | 4 | 2 |
| 4 | 1, 2, 3 | F1 | 2 |
| F1 | 4 | — | FINAL |

### Agent Dispatch Summary

- **Wave 1**: 2 tasks — T1 → `quick`, T2 → `quick`
- **Wave 2**: 2 tasks — T3 → `quick`, T4 → `unspecified-high`
- **FINAL**: 1 task — F1 → `quick`

---

## TODOs

- [ ] 1. Create Shared Role Hierarchy Utility

  **What to do**:
  - Create `src/lib/role-hierarchy.ts` with:
    - `ROLE_HIERARCHY` constant: `{ super_admin: 0, admin: 1, mentor: 2, founder: 3, co_founder: 4 }`
    - `ASSIGNABLE_ROLES` constant: `["admin", "mentor", "founder", "co_founder"]` (excludes super_admin — only assignable by system)
    - `getRolesBelow(role: UserRole): UserRole[]` — returns all roles with a HIGHER numeric value (lower rank). E.g., `getRolesBelow("admin")` → `["mentor", "founder", "co_founder"]`
    - `isRoleBelow(candidate: UserRole, ceiling: UserRole): boolean` — true if candidate is lower rank than ceiling
    - `getHighestRole(roles: UserRole[]): UserRole` — returns the role with lowest numeric value (highest rank)
    - `getRoleDisplayName(role: string): string` — move from `src/lib/utils.ts` (re-export from utils for backward compat)
  - Export all functions and constants
  - Follow the existing `rolePriority` pattern from `BatchMembersSidebar.tsx:39-44`

  **Must NOT do**:
  - Do NOT modify `BatchMembersSidebar.tsx` to import from new file (separate cleanup task)
  - Do NOT modify `permissions.ts`
  - Do NOT add npm dependencies

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single new file creation with pure utility functions, no complex logic
  - **Skills**: []
    - No special skills needed — straightforward TypeScript utility
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — no UI interaction
    - `git-master`: Not needed — no git operations

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 2 after both have clear spec)
  - **Parallel Group**: Wave 1 (with Task 2, but Task 2 depends on this)
  - **Blocks**: Tasks 2, 3, 4
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `src/components/feed/BatchMembersSidebar.tsx:39-44` — Existing `rolePriority` mapping to replicate as shared constant. Copy the exact numeric ordering.

  **API/Type References**:
  - `src/types/index.ts:2` — `UserRole` type definition: `"super_admin" | "admin" | "mentor" | "founder" | "co_founder"`. Use this as the type for all parameters and returns.
  - `src/lib/utils.ts` — Contains `getRoleDisplayName()` function. Check its current implementation, replicate in role-hierarchy.ts, and re-export from utils.ts for backward compat.

  **Acceptance Criteria**:
  - [ ] File `src/lib/role-hierarchy.ts` exists and exports: `ROLE_HIERARCHY`, `ASSIGNABLE_ROLES`, `getRolesBelow`, `isRoleBelow`, `getHighestRole`
  - [ ] `getRolesBelow("super_admin")` returns `["admin", "mentor", "founder", "co_founder"]`
  - [ ] `getRolesBelow("admin")` returns `["mentor", "founder", "co_founder"]`
  - [ ] `getRolesBelow("co_founder")` returns `[]`
  - [ ] `isRoleBelow("founder", "admin")` returns `true`
  - [ ] `isRoleBelow("admin", "founder")` returns `false`
  - [ ] `isRoleBelow("admin", "admin")` returns `false` (same level = NOT below)
  - [ ] `npm run build` passes

  **QA Scenarios**:

  ```
  Scenario: getRolesBelow returns correct roles for each level
    Tool: Bash (bun eval or node --eval)
    Preconditions: Task 1 file created
    Steps:
      1. Run: cd founder-sprint && npx tsx -e "import { getRolesBelow } from './src/lib/role-hierarchy'; console.log(JSON.stringify({ sa: getRolesBelow('super_admin'), admin: getRolesBelow('admin'), mentor: getRolesBelow('mentor'), founder: getRolesBelow('founder'), co: getRolesBelow('co_founder') }))"
      2. Assert output matches: {"sa":["admin","mentor","founder","co_founder"],"admin":["mentor","founder","co_founder"],"mentor":["founder","co_founder"],"founder":["co_founder"],"co":[]}
    Expected Result: All hierarchy levels produce correct downward-only role lists
    Failure Indicators: Missing role in output, wrong order, includes same-level or above-level roles
    Evidence: .sisyphus/evidence/task-1-hierarchy-output.txt

  Scenario: isRoleBelow correctly validates hierarchy boundaries
    Tool: Bash (npx tsx)
    Preconditions: Task 1 file created
    Steps:
      1. Run: cd founder-sprint && npx tsx -e "import { isRoleBelow } from './src/lib/role-hierarchy'; console.log(JSON.stringify({ below: isRoleBelow('founder','admin'), above: isRoleBelow('admin','founder'), same: isRoleBelow('admin','admin') }))"
      2. Assert output: {"below":true,"above":false,"same":false}
    Expected Result: true only when candidate is strictly below ceiling
    Failure Indicators: Same-level returning true, above-level returning true
    Evidence: .sisyphus/evidence/task-1-isrolebelow.txt
  ```

  **Commit**: YES
  - Message: `feat(roles): add shared role hierarchy utility with downward-only helpers`
  - Files: `src/lib/role-hierarchy.ts`
  - Pre-commit: `cd founder-sprint && npm run build`

- [ ] 2. Add Server-Side Validation + Atomic Cleanup to Role Actions

  **What to do**:
  - In `src/actions/user-management.ts`, modify `updateAdditionalRoles()` (L408-464):
    - Import `ASSIGNABLE_ROLES`, `isRoleBelow` from `src/lib/role-hierarchy.ts`
    - After normalizing roles (L435-441), ADD validation:
      1. Filter out any role not in `ASSIGNABLE_ROLES` (silently drop invalid strings like "lead mentor")
      2. Look up the user's current primary role from `existingMembership.role`
      3. For each remaining additional role, check `isRoleBelow(additionalRole, primaryRole)` — reject if ANY role is NOT below primary
      4. Return error: `"Additional roles must be below the primary role ({primaryRole})"`
    - The normalized+validated roles get saved as before
  - In `src/actions/user-management.ts`, modify `updateUserRole()` (L349-406):
    - Import `isRoleBelow` from `src/lib/role-hierarchy.ts`
    - AFTER the role update (L384-387), add atomic cleanup:
      1. Read current `additionalRoles` from `existingMembership` (already fetched at L368-375)
      2. Filter: keep only roles where `isRoleBelow(additionalRole, newRole)` is true
      3. If any roles were removed, update `additionalRoles` in the SAME Prisma call (use `prisma.$transaction` or combine into single update)
      4. Log removed roles in the audit entry details

  **Must NOT do**:
  - Do NOT change function signatures (keep backward compat)
  - Do NOT modify other server action files
  - Do NOT add new server actions
  - Do NOT modify the authorization checks (requireRole calls stay as-is)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Targeted modifications to two existing functions in one file, clear spec
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — server-side only

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Task 1 for imports)
  - **Parallel Group**: Wave 1 (sequential after Task 1)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/actions/user-management.ts:349-406` — Current `updateUserRole()` function. Add cleanup AFTER L387 (the prisma update), using `existingMembership.additionalRoles` already fetched at L368.
  - `src/actions/user-management.ts:408-464` — Current `updateAdditionalRoles()` function. Add validation AFTER the normalization at L435-441, BEFORE the prisma update at L443.
  - `src/actions/user-management.ts:435-441` — Current normalization logic (trim, filter empty, dedupe). Add hierarchy validation as additional step after this.

  **API/Type References**:
  - `src/lib/role-hierarchy.ts` (from Task 1) — `isRoleBelow(candidate, ceiling)`, `ASSIGNABLE_ROLES`
  - `src/types/index.ts:2` — `UserRole` type for casting

  **Acceptance Criteria**:
  - [ ] `updateAdditionalRoles("userId", "batchId", ["admin"])` when user's primary is "mentor" → returns error
  - [ ] `updateAdditionalRoles("userId", "batchId", ["lead_mentor"])` → silently filters invalid string, saves `[]`
  - [ ] `updateAdditionalRoles("userId", "batchId", ["founder"])` when user's primary is "admin" → succeeds
  - [ ] `updateUserRole` changing primary from "admin" → "founder" auto-strips `additionalRoles: ["mentor"]` to `[]`
  - [ ] Audit log records stripped additional roles when primary changes
  - [ ] `npm run build` passes

  **QA Scenarios**:

  ```
  Scenario: Server rejects additionalRoles above primary role
    Tool: Bash (npx tsx with direct function import)
    Preconditions: Dev server running or build passes
    Steps:
      1. Create a test user in batch with primary role "mentor" and additionalRoles []
      2. Call updateAdditionalRoles with additionalRoles: ["admin"]
      3. Assert response: { success: false, error: contains "below the primary role" }
    Expected Result: Server returns error, additionalRoles unchanged in DB
    Failure Indicators: success: true returned, or different error message
    Evidence: .sisyphus/evidence/task-2-reject-above.txt

  Scenario: Server accepts valid downward additionalRoles
    Tool: Bash (npx tsx)
    Preconditions: User with primary="admin" exists
    Steps:
      1. Call updateAdditionalRoles with additionalRoles: ["mentor", "founder"]
      2. Assert response: { success: true }
      3. Query DB to verify additionalRoles = ["mentor", "founder"]
    Expected Result: Valid roles saved successfully
    Failure Indicators: Error returned, or roles not saved
    Evidence: .sisyphus/evidence/task-2-accept-valid.txt

  Scenario: Primary role change atomically cleans invalid additionalRoles
    Tool: Bash (npx tsx)
    Preconditions: User with primary="admin", additionalRoles=["mentor", "founder"]
    Steps:
      1. Call updateUserRole to change primary from "admin" to "founder"
      2. Query DB: verify role="founder" AND additionalRoles=["co_founder"] or [] (mentor and founder stripped)
      3. Check audit log entry includes stripped roles info
    Expected Result: additionalRoles automatically cleaned to only include roles below new primary
    Failure Indicators: Old additionalRoles preserved, or no audit entry
    Evidence: .sisyphus/evidence/task-2-atomic-cleanup.txt
  ```

  **Commit**: YES
  - Message: `fix(roles): validate additionalRoles against hierarchy and auto-cleanup on primary change`
  - Files: `src/actions/user-management.ts`
  - Pre-commit: `cd founder-sprint && npm run build`

- [ ] 3. Plumb currentUserRole Prop from Server Component

  **What to do**:
  - In `src/app/(dashboard)/admin/users/page.tsx`:
    - Import `getCurrentUser` from `@/lib/permissions`
    - Call `const currentUser = await getCurrentUser()` at the top of the async function
    - Pass `currentUserRole={currentUser?.role ?? "admin"}` as prop to `<UserManagement>`
  - In `src/app/(dashboard)/admin/users/UserManagement.tsx`:
    - Add `currentUserRole: UserRole` to `UserManagementProps` interface (L39-41)
    - Destructure it in the component function signature (L92)
    - This prop will be used by Task 4 for hierarchy context

  **Must NOT do**:
  - Do NOT use this prop yet in any logic (Task 4 handles that)
  - Do NOT modify any other components or pages
  - Do NOT modify permissions.ts

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: 2-line change in page.tsx, 2-line change in UserManagement.tsx props
  - **Skills**: []
  - **Skills Evaluated but Omitted**:
    - `playwright`: Not needed — prop plumbing only

  **Parallelization**:
  - **Can Run In Parallel**: YES (can run parallel with Task 2 after Task 1)
  - **Parallel Group**: Wave 2 (parallel with Task 2 if needed, but depends on Task 1 for type awareness)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1

  **References**:

  **Pattern References**:
  - `src/app/(dashboard)/admin/users/page.tsx:1-15` — Current server component. Only fetches batches. Add `getCurrentUser()` call alongside.

  **API/Type References**:
  - `src/lib/permissions.ts:82` — `getCurrentUser()` returns `Promise<UserWithBatch | null>`
  - `src/types/index.ts:27` — `UserWithBatch.role: UserRole`
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:39-41` — `UserManagementProps` interface to extend

  **Acceptance Criteria**:
  - [ ] `page.tsx` imports and calls `getCurrentUser()`
  - [ ] `UserManagementProps` includes `currentUserRole: UserRole`
  - [ ] Component receives and destructures the prop
  - [ ] `npm run build` passes
  - [ ] Admin page loads without errors (no runtime regression)

  **QA Scenarios**:

  ```
  Scenario: Admin page renders with currentUserRole prop plumbed
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, admin user logged in
    Steps:
      1. Navigate to /admin/users
      2. Assert page loads without errors (no error boundary visible)
      3. Assert user list renders (at least one batch selectable)
    Expected Result: Page renders identically to before — no visible change, no errors
    Failure Indicators: Error boundary shown, blank page, or console errors about missing props
    Evidence: .sisyphus/evidence/task-3-page-loads.png
  ```

  **Commit**: NO (groups with Task 4, commit 3)

- [ ] 4. Refactor UserManagement.tsx: Checkbox UI + Equal Badges + Super_admin Display-Only

  **What to do**:
  This is the main UI refactor task. All changes are in `src/app/(dashboard)/admin/users/UserManagement.tsx`.

  **Step 1: Import role hierarchy utilities**
  - Import `getRolesBelow`, `isRoleBelow`, `ROLE_HIERARCHY` from `@/lib/role-hierarchy`
  - Import `UserRole` type if not already imported

  **Step 2: Remove `handleEditAdditionalRoles` function (L223-241)**
  - Delete the entire `handleEditAdditionalRoles` function that uses `window.prompt()`

  **Step 3: Add new `handleToggleAdditionalRole` function**
  - When a checkbox is toggled:
    1. Get the user's current `additionalRoles` array
    2. If checked: add the role to the array
    3. If unchecked: remove the role from the array
    4. Call `updateAdditionalRoles(userId, batchId, newRoles)` — server validates hierarchy
    5. Use `startTransition` for pending state
    6. On success: `loadUsers(selectedBatchId)` to refresh

  **Step 4: Modify `handleRoleChange` to trigger UI refresh**
  - When primary role changes via dropdown, the server (Task 2) atomically cleans additionalRoles
  - After successful role change, `loadUsers` already fires — this will reflect cleaned additionalRoles
  - No additional client-side logic needed (server handles cleanup)

  **Step 5: Refactor MOBILE layout (L405-523)**
  - Replace the role badge + additional role badges section (L429-436):
    - Show ALL roles (primary + additional) with `variant="role"` badge (no "+" prefix)
    - E.g., `[Admin] [Founder]` not `[Admin] +[Founder]`
  - Replace the actions section (L452-520):
    - Keep primary role `<select>` dropdown (L453-464)
    - REMOVE the "Additional Roles" `<Button>` (L465-472)
    - ADD checkbox section below dropdown:
      ```tsx
      {userBatch.role !== "super_admin" && getRolesBelow(userBatch.role as UserRole).length > 0 && (
        <div className="flex items-center gap-3 flex-wrap mt-2">
          <span className="text-xs" style={{ color: "var(--color-foreground-secondary)" }}>Also:</span>
          {getRolesBelow(userBatch.role as UserRole).map((r) => (
            <label key={r} className="flex items-center gap-1.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={(userBatch.additionalRoles || []).includes(r)}
                onChange={(e) => handleToggleAdditionalRole(userBatch, r, e.target.checked)}
                disabled={isPending}
              />
              {getRoleDisplayName(r)}
            </label>
          ))}
        </div>
      )}
      ```
    - For super_admin rows: hide the `<select>` dropdown entirely, show static `[Super Admin]` badge only, no checkboxes, no action buttons except view-only

  **Step 6: Refactor DESKTOP layout (L525-672)**
  - Same changes as mobile:
    - Badge display (L571-578): All roles with `variant="role"`, no "+" prefix
    - Actions column (L596-665):
      - Keep primary `<select>` dropdown (L598-609)
      - REMOVE "Additional Roles" button (L610-617)
      - ADD checkbox section after dropdown
      - Super_admin rows: display-only

  **Step 7: Handle super_admin edge case**
  - For rows where `userBatch.role === "super_admin"`:
    - Show `[Super Admin]` badge with `variant="role"`
    - NO dropdown, NO checkboxes, NO deactivate/remove buttons
    - Only display: name, email, "Super Admin" badge, status, joined date
    - This prevents accidental downgrade

  **Must NOT do**:
  - Do NOT modify `Badge.tsx` component itself
  - Do NOT add complex state management — use `additionalRoles` from server data directly
  - Do NOT debounce checkbox changes (use `isPending` + `startTransition` which is already the pattern)
  - Do NOT change invite modal behavior
  - Do NOT modify any other pages' badge display
  - Do NOT use `data-testid` attributes unless needed for QA scenarios

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Large file (1111 lines), dual layouts to update simultaneously, multiple interrelated changes, edge cases (super_admin). Not "visual-engineering" because no design work — just restructuring existing UI elements.
  - **Skills**: [`playwright`]
    - `playwright`: Needed for QA scenarios — verifying checkbox behavior, badge display, super_admin display-only at both viewports
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Not needed — no design decisions, just restructuring existing elements
    - `git-master`: Not needed — no git operations in this task

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Tasks 1, 2, 3)
  - **Parallel Group**: Wave 2 (after Wave 1 completes)
  - **Blocks**: F1
  - **Blocked By**: Tasks 1, 2, 3

  **References**:

  **Pattern References**:
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:213-221` — Current `handleRoleChange` function pattern (startTransition + updateUserRole + loadUsers). Follow same pattern for checkbox handler.
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:223-241` — Current `handleEditAdditionalRoles` — DELETE this entirely.
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:429-436` — Mobile badge section to refactor (remove "+" prefix, use same variant).
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:452-520` — Mobile actions section to refactor (replace button with checkboxes).
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:571-578` — Desktop badge section to refactor.
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:596-665` — Desktop actions section to refactor.
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:85-90` — `roleOptions` constant. Keep for dropdown, but checkboxes use `getRolesBelow()` dynamically.

  **API/Type References**:
  - `src/lib/role-hierarchy.ts` (from Task 1) — `getRolesBelow(role)` returns `UserRole[]`, `getRoleDisplayName(role)` for label text
  - `src/actions/user-management.ts:updateAdditionalRoles` — existing action, called with full role array on each checkbox change
  - `src/types/index.ts:2` — `UserRole` for casting `userBatch.role`

  **Acceptance Criteria**:
  - [ ] `window.prompt` is completely removed — no calls to `handleEditAdditionalRoles`
  - [ ] "Additional Roles" button is completely removed from both layouts
  - [ ] Checkboxes render below primary dropdown, showing only roles below primary
  - [ ] Checking a checkbox calls `updateAdditionalRoles` with updated array
  - [ ] All role badges use `variant="role"` — no "+" prefix anywhere
  - [ ] Super_admin rows: no dropdown, no checkboxes, no action buttons — display-only
  - [ ] Both mobile (L405-523) AND desktop (L525-672) layouts updated
  - [ ] Checkboxes disabled during `isPending` state
  - [ ] `npm run build` passes

  **QA Scenarios**:

  ```
  Scenario: Checkbox UI renders correct roles below primary
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, admin logged in, navigated to /admin/users, batch selected with at least one "admin" role user
    Steps:
      1. Navigate to /admin/users
      2. Select a batch from dropdown
      3. Find a user row with role="admin"
      4. Assert: checkboxes visible for "Mentor", "Founder", "Co-founder"
      5. Assert: NO checkbox for "Admin" or "Super Admin"
      6. Find a user row with role="founder"
      7. Assert: only "Co-founder" checkbox visible
      8. Screenshot both states
    Expected Result: Checkboxes match hierarchy — only lower roles shown
    Failure Indicators: Higher roles appear as checkboxes, or no checkboxes at all
    Evidence: .sisyphus/evidence/task-4-checkbox-hierarchy.png

  Scenario: Checking a checkbox saves the additional role
    Tool: Playwright (playwright skill)
    Preconditions: Admin user viewing user list, user with role="admin" and empty additionalRoles
    Steps:
      1. Find admin-role user row
      2. Check the "Founder" checkbox
      3. Wait for network request to complete (isPending clears)
      4. Reload page
      5. Assert: "Founder" checkbox is still checked
      6. Assert: badge display shows [Admin] [Founder] (both variant="role")
    Expected Result: Checkbox state persists after reload, badges show equally
    Failure Indicators: Checkbox unchecked after reload, or badge shows "+Founder"
    Evidence: .sisyphus/evidence/task-4-checkbox-save.png

  Scenario: Super_admin row is display-only
    Tool: Playwright (playwright skill)
    Preconditions: User list includes a super_admin user
    Steps:
      1. Find the super_admin user row
      2. Assert: "Super Admin" badge is visible
      3. Assert: NO <select> dropdown in this row
      4. Assert: NO checkboxes in this row
      5. Assert: NO Deactivate/Remove buttons in this row
      6. Screenshot the row
    Expected Result: Super_admin row shows info only, no editable controls
    Failure Indicators: Dropdown or buttons visible, or missing Super Admin badge
    Evidence: .sisyphus/evidence/task-4-superadmin-readonly.png

  Scenario: Primary role change clears invalid checkboxes
    Tool: Playwright (playwright skill)
    Preconditions: User with role="admin", additionalRoles=["mentor", "founder"]
    Steps:
      1. Verify "Mentor" and "Founder" checkboxes are checked
      2. Change primary dropdown from "Admin" to "Mentor"
      3. Wait for server response
      4. Assert: "Mentor" checkbox no longer appears (same level as new primary)
      5. Assert: only "Founder" and "Co-founder" checkboxes visible
      6. Assert: "Founder" may or may not be checked (depends on cleanup — server strips "mentor" but keeps "founder" which is below "mentor")
    Expected Result: Checkbox options update to match new primary, invalid roles removed
    Failure Indicators: Old checkboxes still shown, or error during transition
    Evidence: .sisyphus/evidence/task-4-primary-change-cleanup.png

  Scenario: Both viewports render correctly (mobile + desktop)
    Tool: Playwright (playwright skill)
    Preconditions: Dev server running, admin page accessible
    Steps:
      1. Set viewport to 1280x800 (desktop)
      2. Navigate to /admin/users, select batch
      3. Screenshot desktop layout
      4. Set viewport to 375x812 (mobile)
      5. Wait for layout reflow
      6. Screenshot mobile layout
      7. Assert: Both screenshots show checkboxes (not "Additional Roles" button)
      8. Assert: Both screenshots show equal badges (no "+" prefix)
    Expected Result: Consistent behavior across both viewport breakpoints
    Failure Indicators: One layout still shows old UI, or checkboxes missing in one viewport
    Evidence: .sisyphus/evidence/task-4-desktop.png, .sisyphus/evidence/task-4-mobile.png
  ```

  **Commit**: YES (includes Task 3 changes)
  - Message: `refactor(admin): replace free-text role prompt with checkbox multi-select UI`
  - Files: `src/app/(dashboard)/admin/users/page.tsx`, `src/app/(dashboard)/admin/users/UserManagement.tsx`
  - Pre-commit: `cd founder-sprint && npm run build`

---

## Final Verification Wave

- [ ] F1. **Build + Visual QA** — `quick` (+ `playwright` skill)
  Run `npm run build` in `founder-sprint/`. If build fails, fix TypeScript errors. Then use Playwright to open admin/users page, take screenshots of both mobile and desktop views showing the new checkbox UI. Verify:
  1. Checkboxes render correctly below primary role dropdown
  2. Badge display is equal (no "+" prefix)
  3. Super_admin rows are display-only
  4. Both viewports (375px, 1280px) look correct
  Output: `Build [PASS/FAIL] | Mobile [screenshot] | Desktop [screenshot] | VERDICT`

---

## Commit Strategy

| # | Type | Message | Files | Pre-commit |
|---|------|---------|-------|------------|
| 1 | feat | `feat(roles): add shared role hierarchy utility with downward-only helpers` | `src/lib/role-hierarchy.ts` | `npm run build` |
| 2 | fix | `fix(roles): validate additionalRoles against hierarchy and auto-cleanup on primary change` | `src/actions/user-management.ts` | `npm run build` |
| 3 | refactor | `refactor(admin): replace free-text role prompt with checkbox multi-select UI` | `src/app/(dashboard)/admin/users/page.tsx`, `src/app/(dashboard)/admin/users/UserManagement.tsx` | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
cd founder-sprint && npm run build  # Expected: Build succeeds with zero errors
```

### Final Checklist
- [ ] Checkbox UI shows only roles below primary
- [ ] Server rejects invalid/above-hierarchy additionalRoles
- [ ] Primary role change atomically cleans additionalRoles
- [ ] Super_admin rows are display-only
- [ ] Both mobile + desktop layouts match
- [ ] All badges display equally (no "+" prefix)
- [ ] `npm run build` passes
- [ ] No files outside scope modified
