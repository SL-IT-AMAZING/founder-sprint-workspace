# Missing CRUD Operations Implementation

## TL;DR

> **Quick Summary**: Implement 8 missing CRUD operations (update/delete actions + UI) following existing Next.js server action patterns exactly. All backend actions can run in parallel; UI tasks depend on their corresponding actions.
> 
> **Deliverables**:
> - 8 new server actions across 4 action files
> - UI updates to 4 component files (BatchList, assignment detail, PostDetail, UserManagement)
> - All features follow existing patterns with minimal code changes
> 
> **Estimated Effort**: Medium (8 discrete features, each ~30-60 min)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Wave 1 (all actions) → Wave 2 (all UI) → Wave 3 (verification)

---

## Context

### Original Request
Implement 8 missing CRUD operations in the Founder Sprint workspace. Database schema is complete; business logic layer needs these additions.

### Interview Summary
**Key Discussions**:
- Edited indicator: Compare `createdAt !== updatedAt` (no schema change)
- restorePost: Separate explicit action (not toggle)
- Assignment UI: Detail page only (clean list view)
- Testing: Manual verification only

**Research Findings**:
- Existing patterns thoroughly documented in `src/actions/*.ts`
- UI patterns consistent across BatchList, UserManagement, PostDetail
- All required Prisma fields already exist
- Permission helpers: `getCurrentUser()`, `requireRole()`, `isStaff()`

---

## Work Objectives

### Core Objective
Add 8 missing CRUD operations to complete the business logic layer, enabling full management capabilities for batches, assignments, summaries, comments, posts, and user invites.

### Concrete Deliverables
| File | New Functions |
|------|--------------|
| `src/actions/batch.ts` | `updateBatch` |
| `src/actions/assignment.ts` | `updateAssignment`, `deleteAssignment` |
| `src/actions/question.ts` | `updateSummary` |
| `src/actions/feed.ts` | `updateComment`, `deleteComment`, `restorePost` |
| `src/actions/user-management.ts` | `cancelInvite` |
| `src/app/.../BatchList.tsx` | Edit button + modal |
| `src/app/.../assignments/[id]/page.tsx` | Edit/Delete buttons + modals |
| `src/app/.../feed/[id]/PostDetail.tsx` | Comment edit/delete + edited indicator |
| `src/app/.../admin/users/UserManagement.tsx` | Cancel invite button |

### Definition of Done
- [ ] All 8 server actions implemented and exported
- [ ] All UI components updated with edit/delete functionality
- [ ] `npm run build` passes with no errors
- [ ] Manual UI verification: each action works as expected

### Must Have
- Follow existing patterns exactly (zod validation, error handling, revalidation)
- Permission checks matching requirements
- Constraint enforcement (no submissions for assignment edit/delete, invited status for cancel)
- "Edited" indicator on comments when `updatedAt > createdAt`

### Must NOT Have (Guardrails)
- NO new database migrations (use existing schema)
- NO new component files (edit existing components only)
- NO changes to authentication/session logic
- NO new dependencies
- NO changes to existing API behavior
- NO tests (manual verification per requirements)

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no test files found)
- **User wants tests**: NO (Manual-only)
- **Framework**: N/A
- **QA approach**: Manual UI verification + build pass

### Manual Verification Procedures

Each TODO includes specific verification steps using:
- Browser navigation and form interaction
- Build command verification
- Console/Network tab inspection for errors

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (All Server Actions - Start Immediately):
├── Task 1: updateBatch action
├── Task 2: updateAssignment + deleteAssignment actions
├── Task 3: updateSummary action
├── Task 4: updateComment + deleteComment + restorePost actions
└── Task 5: cancelInvite action

Wave 2 (All UI Components - After Wave 1):
├── Task 6: BatchList.tsx edit UI [depends: 1]
├── Task 7: Assignment detail edit/delete UI [depends: 2]
├── Task 8: PostDetail comment edit/delete UI [depends: 4]
└── Task 9: UserManagement cancel invite UI [depends: 5]

Wave 3 (Final Verification - After Wave 2):
└── Task 10: Build verification + manual QA
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 | None | 6 | 2, 3, 4, 5 |
| 2 | None | 7 | 1, 3, 4, 5 |
| 3 | None | None | 1, 2, 4, 5 |
| 4 | None | 8 | 1, 2, 3, 5 |
| 5 | None | 9 | 1, 2, 3, 4 |
| 6 | 1 | 10 | 7, 8, 9 |
| 7 | 2 | 10 | 6, 8, 9 |
| 8 | 4 | 10 | 6, 7, 9 |
| 9 | 5 | 10 | 6, 7, 8 |
| 10 | 6, 7, 8, 9 | None | None (final) |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Dispatch |
|------|-------|---------------------|
| 1 | 1, 2, 3, 4, 5 | 5 parallel agents (quick category) |
| 2 | 6, 7, 8, 9 | 4 parallel agents (quick category) |
| 3 | 10 | 1 agent (verification) |

---

## TODOs

### Wave 1: Server Actions (Parallel)

- [ ] 1. Implement updateBatch action

  **What to do**:
  - Add `UpdateBatchSchema` (reuse CreateBatchSchema fields + id)
  - Add `updateBatch(batchId: string, formData: FormData)` function
  - Permission: requireRole for super_admin, admin
  - Prisma: `prisma.batch.update()` with name, description, startDate, endDate
  - Revalidate: `/admin/batches`

  **Must NOT do**:
  - Change existing createBatch or other functions
  - Add new fields not in schema

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, straightforward pattern replication
  - **Skills**: None required
    - Task is simple pattern following

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4, 5)
  - **Blocks**: Task 6 (UI)
  - **Blocked By**: None

  **References**:
  - `src/actions/batch.ts:9-14` - CreateBatchSchema pattern to follow
  - `src/actions/batch.ts:16-59` - createBatch function structure to mirror
  - `src/actions/batch.ts:61-78` - archiveBatch for simpler update pattern
  - `prisma/schema.prisma:99-121` - Batch model fields

  **Acceptance Criteria**:
  - [ ] `updateBatch` function exported from batch.ts
  - [ ] Returns `ActionResult<void>` on success
  - [ ] Returns error if user not super_admin/admin
  - [ ] Revalidates `/admin/batches`

  **Verification (Manual)**:
  ```bash
  # Build passes
  cd founder-sprint && npm run build
  # Verify function exists
  grep -n "export async function updateBatch" src/actions/batch.ts
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `feat(batch): add updateBatch server action`
  - Files: `src/actions/batch.ts`

---

- [ ] 2. Implement updateAssignment + deleteAssignment actions

  **What to do**:
  - Add `UpdateAssignmentSchema` (title, description, templateUrl, dueDate)
  - Add `updateAssignment(assignmentId: string, formData: FormData)` function
    - Permission: canCreateAssignment (staff check)
    - Constraint: Check `submissions.count === 0` before allowing
    - Return error "Cannot update assignment with existing submissions"
  - Add `deleteAssignment(assignmentId: string)` function
    - Same permission and constraint
    - Prisma: `prisma.assignment.delete()`
  - Revalidate: `/assignments`, `/assignments/${id}`

  **Must NOT do**:
  - Allow update/delete if submissions exist
  - Change existing createAssignment function

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Two related functions in one file, clear pattern
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4, 5)
  - **Blocks**: Task 7 (UI)
  - **Blocked By**: None

  **References**:
  - `src/actions/assignment.ts:9-14` - CreateAssignmentSchema pattern
  - `src/actions/assignment.ts:28-59` - createAssignment structure
  - `src/actions/assignment.ts:73-91` - getAssignment shows submission relation
  - `src/lib/permissions.ts` - canCreateAssignment helper
  - `prisma/schema.prisma:274-291` - Assignment model, submissions relation

  **Acceptance Criteria**:
  - [ ] `updateAssignment` and `deleteAssignment` functions exported
  - [ ] Both check for existing submissions before proceeding
  - [ ] Returns clear error if submissions exist
  - [ ] Revalidates correct paths

  **Verification (Manual)**:
  ```bash
  cd founder-sprint && npm run build
  grep -n "export async function updateAssignment\|export async function deleteAssignment" src/actions/assignment.ts
  ```

  **Commit**: YES
  - Message: `feat(assignment): add updateAssignment and deleteAssignment actions`
  - Files: `src/actions/assignment.ts`

---

- [ ] 3. Implement updateSummary action

  **What to do**:
  - Add `UpdateSummarySchema` with content field
  - Add `updateSummary(summaryId: string, formData: FormData)` function
  - Permission: super_admin, admin only
  - Prisma: `prisma.summary.update()` with content
  - Get questionId from summary for revalidation
  - Revalidate: `/questions/${questionId}`, `/questions`

  **Must NOT do**:
  - Change question status (summary already closed it)
  - Allow non-admin to update

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single function, follows createSummary pattern
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4, 5)
  - **Blocks**: None (no separate UI task - edit appears in existing question detail)
  - **Blocked By**: None

  **References**:
  - `src/actions/question.ts:75-104` - createSummary pattern
  - `src/actions/question.ts:197-239` - updateAnswer for similar update pattern
  - `prisma/schema.prisma:200-214` - Summary model

  **Acceptance Criteria**:
  - [ ] `updateSummary` function exported from question.ts
  - [ ] Only super_admin/admin can update
  - [ ] Revalidates question paths

  **Verification (Manual)**:
  ```bash
  cd founder-sprint && npm run build
  grep -n "export async function updateSummary" src/actions/question.ts
  ```

  **Commit**: YES
  - Message: `feat(question): add updateSummary server action`
  - Files: `src/actions/question.ts`

---

- [ ] 4. Implement updateComment + deleteComment + restorePost actions

  **What to do**:
  
  **updateComment**:
  - Add `UpdateCommentSchema` with content field (max 1000 chars)
  - Add `updateComment(commentId: string, formData: FormData)` function
  - Permission: Comment author only (`comment.authorId === user.id`)
  - Prisma: `prisma.comment.update()` - updatedAt auto-updates via @updatedAt
  - Get postId from comment for revalidation
  - Revalidate: `/feed`, `/feed/${postId}`

  **deleteComment**:
  - Add `deleteComment(commentId: string)` function
  - Permission: Comment author only
  - Prisma: `prisma.comment.delete()`
  - Revalidate: `/feed`, `/feed/${postId}`

  **restorePost**:
  - Add `restorePost(postId: string)` function
  - Permission: super_admin, admin only
  - Prisma: `prisma.post.update({ data: { isHidden: false } })`
  - Note: Separate from hidePost toggle for explicit restore intent
  - Revalidate: `/feed`, `/feed/${postId}`, group path if applicable

  **Must NOT do**:
  - Allow non-author to edit/delete comments
  - Allow non-admin to restore posts
  - Modify hidePost function

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Three related functions, clear patterns from existing feed.ts
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 5)
  - **Blocks**: Task 8 (PostDetail UI)
  - **Blocked By**: None

  **References**:
  - `src/actions/feed.ts:68-109` - createComment pattern
  - `src/actions/feed.ts:190-247` - updatePost pattern (similar auth check)
  - `src/actions/feed.ts:281-310` - hidePost pattern (inverse for restorePost)
  - `prisma/schema.prisma:426-445` - Comment model with updatedAt

  **Acceptance Criteria**:
  - [ ] `updateComment`, `deleteComment`, `restorePost` functions exported
  - [ ] Comment actions check author ownership
  - [ ] restorePost explicitly sets isHidden: false
  - [ ] All revalidate correct paths

  **Verification (Manual)**:
  ```bash
  cd founder-sprint && npm run build
  grep -n "export async function updateComment\|export async function deleteComment\|export async function restorePost" src/actions/feed.ts
  ```

  **Commit**: YES
  - Message: `feat(feed): add updateComment, deleteComment, and restorePost actions`
  - Files: `src/actions/feed.ts`

---

- [ ] 5. Implement cancelInvite action

  **What to do**:
  - Add `cancelInvite(userId: string, batchId: string)` function
  - Permission: super_admin, admin only
  - Constraint: Check `userBatch.status === 'invited'` before deleting
  - Return error "Can only cancel pending invites" if status is 'active'
  - Prisma: `prisma.userBatch.delete()` where userId_batchId
  - Revalidate: `/admin/users`, `/admin/batches`

  **Must NOT do**:
  - Allow canceling active users (use removeUserFromBatch for that)
  - Change existing removeUserFromBatch function

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single function, mirrors removeUserFromBatch pattern
  - **Skills**: None required

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3, 4)
  - **Blocks**: Task 9 (UserManagement UI)
  - **Blocked By**: None

  **References**:
  - `src/actions/user-management.ts:129-149` - removeUserFromBatch pattern
  - `src/actions/user-management.ts:16-24` - requireRole pattern
  - `prisma/schema.prisma:123-141` - UserBatch model with status enum

  **Acceptance Criteria**:
  - [ ] `cancelInvite` function exported from user-management.ts
  - [ ] Only allows canceling status='invited' users
  - [ ] Returns clear error for active users
  - [ ] Revalidates admin paths

  **Verification (Manual)**:
  ```bash
  cd founder-sprint && npm run build
  grep -n "export async function cancelInvite" src/actions/user-management.ts
  ```

  **Commit**: YES
  - Message: `feat(user-management): add cancelInvite server action`
  - Files: `src/actions/user-management.ts`

---

### Wave 2: UI Components (Parallel, after Wave 1)

- [ ] 6. Add Edit Batch UI to BatchList.tsx

  **What to do**:
  - Add state: `editingBatch` to store batch being edited (or null)
  - Add `handleUpdate` function similar to `handleCreate`
  - Add Edit button next to Archive button (only for active batches)
  - Add Edit Modal (copy Create modal structure, pre-fill with batch data)
  - Import `updateBatch` from actions
  - Form fields: name, description, startDate, endDate (same as create)

  **Must NOT do**:
  - Change existing create/archive/delete functionality
  - Add edit for archived batches

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: UI follows existing modal pattern exactly
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Ensures consistent UI/UX with existing patterns

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7, 8, 9)
  - **Blocks**: Task 10 (verification)
  - **Blocked By**: Task 1 (updateBatch action)

  **References**:
  - `src/app/(dashboard)/admin/batches/BatchList.tsx:31-52` - Create modal pattern to copy
  - `src/app/(dashboard)/admin/batches/BatchList.tsx:135-207` - Modal structure
  - `src/components/ui/Modal.tsx` - Modal component API

  **Acceptance Criteria**:
  - [ ] Edit button visible on active batch cards
  - [ ] Click opens modal with pre-filled data
  - [ ] Submit calls updateBatch action
  - [ ] Modal closes on success, shows error on failure

  **Verification (Manual)**:
  ```
  1. Navigate to /admin/batches
  2. Click Edit on an active batch
  3. Modal opens with current values
  4. Change name, submit
  5. Modal closes, list refreshes with new name
  ```

  **Commit**: YES
  - Message: `feat(batch): add edit batch UI with modal`
  - Files: `src/app/(dashboard)/admin/batches/BatchList.tsx`

---

- [ ] 7. Add Edit/Delete Assignment UI to assignment detail page

  **What to do**:
  - Read `src/app/(dashboard)/assignments/[id]/page.tsx` to understand structure
  - Create new client component `AssignmentActions.tsx` in same folder OR add to existing
  - Add states: `showEditModal`, `showDeleteConfirm`
  - Show Edit/Delete buttons only for staff AND only if `_count.submissions === 0`
  - Edit Modal: form with title, description, templateUrl, dueDate
  - Delete: Use confirm modal pattern from UserManagement.tsx
  - Import `updateAssignment`, `deleteAssignment` from actions
  - After delete: redirect to `/assignments`

  **Must NOT do**:
  - Show edit/delete if submissions exist
  - Add to AssignmentsList.tsx (detail page only per requirements)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Pattern exists in UserManagement for confirmation modals
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Modal and button placement consistency

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 8, 9)
  - **Blocks**: Task 10 (verification)
  - **Blocked By**: Task 2 (assignment actions)

  **References**:
  - `src/app/(dashboard)/assignments/[id]/page.tsx` - Current detail page structure
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:388-417` - Confirmation modal pattern
  - `src/app/(dashboard)/admin/batches/BatchList.tsx:135-207` - Edit modal pattern

  **Acceptance Criteria**:
  - [ ] Edit/Delete buttons visible when no submissions
  - [ ] Buttons hidden when submissions exist
  - [ ] Edit modal pre-fills current values
  - [ ] Delete shows confirmation, redirects on success

  **Verification (Manual)**:
  ```
  1. Create new assignment (no submissions)
  2. Navigate to /assignments/{id}
  3. Edit and Delete buttons visible
  4. Test edit: change title, verify update
  5. Test delete: confirm, verify redirect to /assignments
  6. Create assignment with submission - verify buttons hidden
  ```

  **Commit**: YES
  - Message: `feat(assignment): add edit/delete UI on detail page`
  - Files: `src/app/(dashboard)/assignments/[id]/page.tsx` (or new AssignmentActions.tsx)

---

- [ ] 8. Add Comment Edit/Delete UI to PostDetail.tsx

  **What to do**:
  - Add state: `editingCommentId`, `editContent`
  - For each comment where `comment.authorId === currentUser.id`:
    - Show Edit and Delete buttons
  - Edit mode: Replace comment text with Textarea, Save/Cancel buttons
  - Delete: Use simple `confirm()` (matches existing pattern in BatchList)
  - Import `updateComment`, `deleteComment` from actions
  - Show "Edited" indicator when `comment.updatedAt > comment.createdAt`
    - Small text like "(edited)" or "• Edited" next to timestamp

  **Must NOT do**:
  - Allow editing others' comments
  - Add complex confirmation modal (simple confirm() is fine)
  - Change existing reply functionality

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Inline edit pattern is common, follows existing component style
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Inline editing UX and edited indicator styling

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 9)
  - **Blocks**: Task 10 (verification)
  - **Blocked By**: Task 4 (comment actions)

  **References**:
  - `src/app/(dashboard)/feed/[id]/PostDetail.tsx:263-381` - Comment rendering
  - `src/app/(dashboard)/feed/[id]/PostDetail.tsx:69-78` - handleAddComment pattern
  - `src/actions/feed.ts` - Comment interface with createdAt/updatedAt

  **Acceptance Criteria**:
  - [ ] Edit/Delete buttons visible only on own comments
  - [ ] Edit mode shows inline textarea with current content
  - [ ] Save updates comment, Cancel reverts to view mode
  - [ ] Delete shows confirm(), removes comment on confirm
  - [ ] "Edited" indicator shows when updatedAt > createdAt

  **Verification (Manual)**:
  ```
  1. Navigate to a post with your comment at /feed/{id}
  2. Edit/Delete buttons visible on your comment
  3. Click Edit: textarea appears with current text
  4. Change text, Save: comment updates, shows "edited"
  5. Click Delete on another comment: confirm, comment removed
  6. Other users' comments: no Edit/Delete buttons
  ```

  **Commit**: YES
  - Message: `feat(feed): add comment edit/delete UI with edited indicator`
  - Files: `src/app/(dashboard)/feed/[id]/PostDetail.tsx`

---

- [ ] 9. Add Cancel Invite UI to UserManagement.tsx

  **What to do**:
  - Find where invited users are displayed (status badge shows "invited")
  - Add "Cancel Invite" button next to "Remove" button for users with `status === 'invited'`
  - OR: Replace "Remove" with "Cancel Invite" for invited users (clearer UX)
  - Use same confirmation modal pattern as existing Remove
  - Import `cancelInvite` from actions
  - On success: refresh user list (loadUsers already exists)

  **Must NOT do**:
  - Show Cancel Invite for active users
  - Change the Remove functionality for active users

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Minimal change, button already exists for remove
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Button labeling and conditional display

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Task 10 (verification)
  - **Blocked By**: Task 5 (cancelInvite action)

  **References**:
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:176-235` - User row with status badge
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:108-117` - handleRemoveUser pattern
  - `src/app/(dashboard)/admin/users/UserManagement.tsx:388-417` - Remove confirmation modal

  **Acceptance Criteria**:
  - [ ] "Cancel Invite" button visible for invited users
  - [ ] "Remove" button visible for active users
  - [ ] Cancel Invite shows confirmation modal
  - [ ] On confirm: user removed from list

  **Verification (Manual)**:
  ```
  1. Navigate to /admin/users
  2. Select a batch with invited users
  3. Invited users show "Cancel Invite" button
  4. Active users show "Remove" button
  5. Click Cancel Invite: confirm modal appears
  6. Confirm: user removed from list
  ```

  **Commit**: YES
  - Message: `feat(user-management): add cancel invite UI for pending users`
  - Files: `src/app/(dashboard)/admin/users/UserManagement.tsx`

---

### Wave 3: Verification (Sequential, after Wave 2)

- [ ] 10. Final build verification and manual QA

  **What to do**:
  - Run full build: `npm run build`
  - Fix any TypeScript errors
  - Manual QA checklist for all 8 features:
    1. Update batch via edit modal
    2. Update assignment (no submissions) via detail page
    3. Delete assignment (no submissions) via detail page
    4. Update summary on question detail
    5. Edit own comment, verify "Edited" indicator
    6. Delete own comment
    7. Restore hidden post (need to hide one first)
    8. Cancel pending invite

  **Must NOT do**:
  - Skip build step
  - Commit if build fails

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Verification only, no complex implementation
  - **Skills**: [`playwright`] (optional for browser automation)
    - `playwright`: Could automate manual QA steps

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (final task)
  - **Blocks**: None
  - **Blocked By**: Tasks 6, 7, 8, 9 (all UI tasks)

  **References**:
  - All files modified in previous tasks
  - `package.json` for build command

  **Acceptance Criteria**:
  - [ ] `npm run build` completes with no errors
  - [ ] All 8 features work in browser
  - [ ] No console errors during normal operation

  **Verification (Manual)**:
  ```bash
  cd founder-sprint && npm run build
  # Expected: Build successful, no TypeScript errors
  
  # Then start dev server and test each feature:
  npm run dev
  # Test each feature as described above
  ```

  **Commit**: YES (final commit if any fixes needed)
  - Message: `chore: fix build issues from CRUD implementation`
  - Files: Any files needing type fixes

---

## Commit Strategy

| After Task | Message | Files | Pre-commit |
|------------|---------|-------|------------|
| 1 | `feat(batch): add updateBatch server action` | batch.ts | npm run build |
| 2 | `feat(assignment): add updateAssignment and deleteAssignment actions` | assignment.ts | npm run build |
| 3 | `feat(question): add updateSummary server action` | question.ts | npm run build |
| 4 | `feat(feed): add updateComment, deleteComment, and restorePost actions` | feed.ts | npm run build |
| 5 | `feat(user-management): add cancelInvite server action` | user-management.ts | npm run build |
| 6 | `feat(batch): add edit batch UI with modal` | BatchList.tsx | npm run build |
| 7 | `feat(assignment): add edit/delete UI on detail page` | assignments/[id]/*.tsx | npm run build |
| 8 | `feat(feed): add comment edit/delete UI with edited indicator` | PostDetail.tsx | npm run build |
| 9 | `feat(user-management): add cancel invite UI for pending users` | UserManagement.tsx | npm run build |
| 10 | (only if fixes needed) | various | npm run build |

---

## Success Criteria

### Verification Commands
```bash
# Build passes
cd founder-sprint && npm run build
# Expected: Compiled successfully

# All new functions exist
grep -c "export async function" src/actions/batch.ts        # Should be 6 (was 5)
grep -c "export async function" src/actions/assignment.ts   # Should be 9 (was 7)
grep -c "export async function" src/actions/question.ts     # Should be 7 (was 6)
grep -c "export async function" src/actions/feed.ts         # Should be 12 (was 9)
grep -c "export async function" src/actions/user-management.ts # Should be 5 (was 4)
```

### Final Checklist
- [ ] All 8 server actions implemented
- [ ] All 4 UI components updated
- [ ] Build passes with no errors
- [ ] All "Must NOT Have" constraints respected
- [ ] Manual QA verifies all features work
