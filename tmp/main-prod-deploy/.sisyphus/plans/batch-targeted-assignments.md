# Work Plan: Batch-Targeted Assignments

**Status**: Ready for implementation
**Branch**: `newdesign`
**Created**: 2026-02-26

---

## Summary

Add a batch selector to the assignment creation form, show assignments from all batches (with batch labels) in the admin view, and show submissions from all batches in the submissions dashboard. Founders see no changes. No schema migration needed — Assignment already has `batchId`.

## Requirements

| # | Requirement | Source |
|---|---|---|
| 1 | Batch selector in Create Assignment form — admin picks which active batch to target | User request |
| 2 | Assignments list shows all batches — admin sees every batch's assignments with batch name label | User: "show all batches' assignments with a label" |
| 3 | Submissions dashboard shows all batches — admin sees submissions from all batches with labels | User: "Yes, show all batches' submissions too" |
| 4 | Founders see nothing different — only their own batch's assignments, no batch label | User: "Founders see nothing different" |
| 5 | Only active batches in the selector | User: "Active batches only" |
| 6 | No global batch switcher — batch selection only in the Create Assignment form | User: "Yes, pick batch in form only" |
| 7 | No batch filter on list — just show all with labels | User: "No filter needed" |

## Current State Analysis

### Assignment Model (prisma/schema.prisma:305)
```prisma
model Assignment {
  id          String   @id @default(uuid()) @db.Uuid
  batchId     String   @map("batch_id") @db.Uuid
  title       String   @db.VarChar(200)
  description String   @db.Text
  templateUrl String?  @map("template_url")
  dueDate     DateTime @map("due_date")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  batch       Batch    @relation(fields: [batchId], references: [id], onDelete: Cascade)
  submissions Submission[]
  @@index([batchId, dueDate])
}
```

**Key insight**: `batchId` is already a required field. Currently auto-set to `user.batchId` in `createAssignment()`. We just need to let the admin override it via form input.

### Current Data Flow
1. `createAssignment()` → hardcodes `batchId: user.batchId` (line 67 of assignment.ts)
2. `getAssignments(batchId)` → filters `where: { batchId }` — single batch
3. `getSubmissions(batchId)` → filters `where: { assignment: { batchId } }` — single batch
4. `assignments/page.tsx` → calls `getAssignments(user.batchId)` — user's current batch only
5. `submissions/page.tsx` → calls `getSubmissions(user.batchId)` — user's current batch only

### Batch Context
- `getCurrentUser()` returns `batchId` from `selected_batch_id` cookie or most recent active batch
- `getBatches()` already exists in `src/actions/batch.ts`
- No global batch switcher UI currently exists (was removed)

---

## Phase 1: Data Layer Changes

### 1A. `src/actions/assignment.ts` — `createAssignment()`

**Change**: Accept optional `batchId` from FormData. If admin provides it, use that instead of `user.batchId`.

```typescript
// Current (line 67):
batchId: user.batchId,

// New:
const targetBatchId = formData.get("batchId") as string;
// If admin provides a batchId, validate it exists and is active, then use it
// If not provided, fall back to user.batchId
batchId: validatedBatchId,
```

**Validation**:
- If `targetBatchId` provided, verify batch exists with `status: "active"` via Prisma lookup
- Only admins can target a different batch (mentors fall back to `user.batchId`)

### 1B. `src/actions/assignment.ts` — `getAssignments()`

**Change**: Support "all batches" mode for admins.

```typescript
// New signature concept:
export async function getAssignments(batchId?: string)
// If batchId provided → filter by that batch (founder path)
// If batchId omitted → return all assignments (admin path)
// Always include batch name: include: { batch: { select: { id: true, name: true } } }
```

### 1C. `src/actions/assignment.ts` — `getSubmissions()`

**Change**: Same pattern — support all-batches mode for admins.

```typescript
// If batchId omitted → return submissions from all batches
// Include assignment.batch.name in the response
```

### 1D. `src/actions/batch.ts` — Verify `getBatches()` or add `getActiveBatches()`

**Check**: Does `getBatches()` already return active batches? If not, add a filter.
Need: `{ id, name, status }` for each batch, filtered to `status: "active"`.

---

## Phase 2: Assignments Page (Admin Cross-Batch View)

### 2A. `src/app/(dashboard)/assignments/page.tsx`

**Changes**:
- For admins: call `getAssignments()` (no batchId → all batches) + fetch active batches list
- For founders: keep `getAssignments(user.batchId)` (single batch)
- Pass `isAdmin`, `batches` (active batches list), and `currentBatchId` to `AssignmentsList`

```typescript
const isAdmin = isStaff(user.role); // or isAdmin(user.role) specifically
const assignments = isAdmin
  ? await getAssignments()           // all batches
  : await getAssignments(user.batchId); // user's batch only
const batches = isAdmin ? await getActiveBatches() : [];
```

### 2B. `src/app/(dashboard)/assignments/AssignmentsList.tsx`

**Changes**:

1. **Assignment card**: Add batch name badge (admin only)
   - Small `<Badge>` or styled `<span>` showing batch name next to due date
   - Only rendered when `isAdmin` prop is true
   - Uses the `batch.name` field from the enriched query

2. **Create Assignment modal**: Add batch selector (admin only)
   - `SearchableSelect` component (already built) with active batches
   - Pre-select the admin's current batch (`currentBatchId` prop)
   - Hidden input `name="batchId"` for FormData submission
   - Only shown to admins; founders/mentors don't see it

**New props**:
```typescript
interface AssignmentsListProps {
  assignments: Assignment[];
  canCreate: boolean;
  isAdmin?: boolean;              // NEW
  batches?: BatchOption[];         // NEW — active batches for selector
  currentBatchId?: string;         // NEW — pre-select current batch
}
```

**Assignment type enrichment**:
```typescript
interface Assignment {
  // existing fields...
  batch?: { id: string; name: string }; // NEW
}
```

---

## Phase 3: Submissions Page (Admin Cross-Batch View)

### 3A. `src/app/(dashboard)/submissions/page.tsx`

**Change**: For admins, call `getSubmissions()` without batchId.

```typescript
const submissions = await getSubmissions(); // all batches for admin
```

### 3B. `src/app/(dashboard)/submissions/SubmissionsDashboard.tsx`

**Change**: Add batch name label on each submission entry.
- Show which batch the submission's assignment belongs to
- Uses `assignment.batch.name` from enriched query

---

## Phase 4: Verification

1. `tsc --noEmit` — must be clean
2. `npm run build` — must be clean
3. Manual check: admin creates assignment for a specific batch
4. Manual check: admin sees all batches' assignments with labels
5. Manual check: admin sees all batches' submissions with labels
6. Manual check: founder only sees their batch's assignments (no batch label)

---

## Files Changed

| File | Change Type | Description |
|------|------------|-------------|
| `src/actions/assignment.ts` | MODIFY | `createAssignment` accepts batchId, `getAssignments` + `getSubmissions` support all-batches mode, include batch name |
| `src/actions/batch.ts` | MODIFY/VERIFY | Ensure `getActiveBatches()` available |
| `src/app/(dashboard)/assignments/page.tsx` | MODIFY | Admin gets all-batch assignments + batches list |
| `src/app/(dashboard)/assignments/AssignmentsList.tsx` | MODIFY | Batch badge on cards + batch selector in create modal |
| `src/app/(dashboard)/submissions/page.tsx` | MODIFY | Admin gets all-batch submissions |
| `src/app/(dashboard)/submissions/SubmissionsDashboard.tsx` | MODIFY | Batch label on submissions |

## What Does NOT Change

- `prisma/schema.prisma` — No migration needed (Assignment already has batchId)
- `src/app/(dashboard)/assignments/[id]/page.tsx` — Detail page stays the same
- `src/app/(dashboard)/assignments/[id]/SubmissionForm.tsx` — No changes
- Founder-facing UI — No changes
- URL paths — No changes

## Risk Assessment

| Risk | Level | Mitigation |
|------|-------|-----------|
| Admin creates assignment for batch they're not in | Low | Admin role = authorized for all batches; validate batch exists + active |
| Cache invalidation across batches | Low | Admin all-batches query uses broader cache key |
| Performance with many batches | Very Low | Small number of batches expected in accelerator context |
| Breaking existing single-batch behavior | Low | Founder path unchanged; admin path is additive |

## Design Constraints

- Use INLINE CSS styles, NOT Tailwind for visual properties
- Use existing color system (#1A1A1A, #2F2C26, #666666, etc.)
- Use existing font system (BDO Grotesk, Libre Caslon Condensed, Roboto Mono)
- Use existing `SearchableSelect` component for batch dropdown
- Do NOT use `#555AB9` purple
