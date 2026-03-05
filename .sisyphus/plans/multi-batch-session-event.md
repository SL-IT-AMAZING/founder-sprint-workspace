# Plan: Multi-Batch Selection for Sessions & Events (v2 — Revised)

**Created**: 2026-03-04
**Status**: Revised (post-Momus review)
**Estimated Effort**: 3-4 days

---

## Overview

Change Sessions and Events from single-batch (FK `batchId`) to multi-batch (junction tables) so admins can assign content to multiple batches simultaneously. Content remains **context-scoped** to the user's currently selected batch, but sessions/events assigned to that batch via junction tables are now visible regardless of which batch originally "owned" them.

---

## Confirmed Requirements

| # | Decision | Value |
|---|----------|-------|
| 1 | Scope | All batches (active + archived) selectable by admins |
| 2 | "Select All" | Static snapshot — expands to all batch IDs at **submit time** (server resolves current list) |
| 3 | Data Model | Junction tables (`SessionBatch`, `EventBatch`) |
| 4 | Visibility | Context-scoped: user sees sessions/events assigned to their **currently selected batch** |
| 5 | Migration | Auto-migrate existing single-batch records to junction tables |
| 6 | Calendar | ONE calendar event with union of all batch member emails |

## Design Decisions

| # | Decision | Value | Rationale |
|---|----------|-------|-----------|
| A | Authorization | super_admin can assign to ANY batch; batch-level admin can assign to batches where they are admin | Matches existing role model |
| B | Min Selection | At least 1 batch required | Prevents orphaned content |
| C | Batch Deletion | CASCADE junction entries only; block batch deletion if it's the ONLY batch for any session/event | Prevents data loss |
| D | Archived Batches | Show all (active + archived) in selection UI | Per user's explicit choice |
| E | Batch Indicators | Max 3 batch names + "+N more" tooltip in list views | Keeps UI clean |
| F | Visibility Scope | Context-scoped: pages filter by `user.batchId` (current selected batch) | Preserves current UX; multi-batch just means same content appears in multiple batch contexts |
| G | Calendar Strategy | Union attendees in single event | Avoids duplicate calendar entries |
| H | Active-only Creation | At least 1 selected batch must be active to create new content; assigning to additional archived batches is allowed | Prevents creating content only visible to archived batches |
| I | Event Rate Limit | Count events per-batch in junction table (max 20 per batch) | Preserves existing limit semantics |

---

## Critical Architecture: Visibility Model

**How multi-batch works with the existing context-scoped UI:**

```
Current:  Session has batchId=A  →  User viewing Batch A sees it
                                    User viewing Batch B does NOT see it

New:      Session has batches=[A, B, C]  →  User viewing Batch A sees it
                                            User viewing Batch B sees it
                                            User viewing Batch C sees it
                                            User viewing Batch D does NOT see it
```

**Key principle**: The page-level `getSessions(batchId)` / `getEvents(batchId)` / `getScheduleItems(batchId)` signature stays the same. Only the WHERE clause changes:

```
Before:  WHERE session.batch_id = :batchId
After:   WHERE EXISTS (SELECT 1 FROM session_batches sb WHERE sb.session_id = session.id AND sb.batch_id = :batchId)
```

This means:
- No changes needed to page components, route params, or cache key structure
- Batch switching continues to work as-is
- Multi-batch = "this content appears when viewing any of its assigned batches"

---

## Implementation Steps

### Step 0: Update Authorization Model
**Files**: `founder-sprint/src/lib/permissions.ts`, `founder-sprint/src/types/index.ts`

**Problem**: Current `getCurrentUser()` returns a single `batchId`. Update/delete checks compare `existing.batchId === user.batchId`. This must change for multi-batch ownership.

**Changes**:
1. Add `userBatchIds: string[]` to `UserWithBatch` type (all batches user belongs to)
   ```typescript
   // In types/index.ts, add to UserWithBatch:
   userBatchIds: string[];  // All batch IDs user is member of
   ```

2. In `getCurrentUser()`, also fetch all user batch memberships:
   ```typescript
   // After getting primary batchId, also get all:
   const allBatches = await prisma.userBatch.findMany({
     where: { userId: user.id, status: "active" },
     select: { batchId: true }
   });
   return { ...user, batchId, userBatchIds: allBatches.map(b => b.batchId) };
   ```

3. Update ownership checks in session.ts and event.ts:
   ```typescript
   // Before (session.ts:239-241, event.ts:223-225):
   if (existing.batchId !== user.batchId) return { error: "Unauthorized" };

   // After:
   const sessionBatchIds = existing.batches.map(b => b.batchId);
   const hasAccess = isAdmin(user.role) && sessionBatchIds.some(id => user.userBatchIds.includes(id));
   if (!hasAccess) return { error: "Unauthorized" };
   ```

4. Update detail page access checks:
   ```typescript
   // Before (sessions/[id]/page.tsx:14-16, events/[id]/page.tsx:15-17):
   if (session.batchId !== user.batchId) redirect("/sessions");

   // After:
   const sessionBatchIds = session.batches.map(b => b.batchId);
   if (!sessionBatchIds.includes(user.batchId)) redirect("/sessions");
   ```

### Step 1: Schema Changes (Expand Phase)
**Files**: `founder-sprint/prisma/schema.prisma`

**Phase 1 — Add junction tables + relations (keep legacy `batchId` as REQUIRED):**

```prisma
// NEW: Junction table for Session <-> Batch
model SessionBatch {
  id        String   @id @default(uuid()) @db.Uuid
  sessionId String   @map("session_id") @db.Uuid
  batchId   String   @map("batch_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  session Session @relation(fields: [sessionId], references: [id], onDelete: Cascade)
  batch   Batch   @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@unique([sessionId, batchId])
  @@index([batchId])
  @@index([sessionId])
  @@map("session_batches")
}

// NEW: Junction table for Event <-> Batch
model EventBatch {
  id      String   @id @default(uuid()) @db.Uuid
  eventId String   @map("event_id") @db.Uuid
  batchId String   @map("batch_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  batch Batch @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@unique([eventId, batchId])
  @@index([batchId])
  @@index([eventId])
  @@map("event_batches")
}
```

Add to existing models:
```prisma
// Session model — ADD:
batches SessionBatch[]

// Event model — ADD:
batches EventBatch[]

// Batch model — ADD:
sessionBatches SessionBatch[]
eventBatches   EventBatch[]
```

**DO NOT remove or make `batchId` nullable yet.** Keep it as-is during expand phase.

**Phase 2 — Contract (after full verification, separate PR):**
- Make `batchId` nullable on Session and Event
- Remove `onDelete: Cascade` from the legacy batch FK
- Eventually drop `batchId` column

### Step 2: Database Migration
**Method**: `prisma migrate dev --create-only` to generate SQL, then manually add backfill SQL before applying.

**Migration SQL (after Prisma generates table creation):**

```sql
-- Step 2a: Backfill SessionBatch from existing batchId
INSERT INTO session_batches (id, session_id, batch_id, created_at)
SELECT gen_random_uuid(), id, batch_id, created_at
FROM sessions
WHERE batch_id IS NOT NULL
ON CONFLICT (session_id, batch_id) DO NOTHING;

-- Step 2b: Backfill EventBatch from existing batchId
INSERT INTO event_batches (id, event_id, batch_id, created_at)
SELECT gen_random_uuid(), id, batch_id, created_at
FROM events
WHERE batch_id IS NOT NULL
ON CONFLICT (event_id, batch_id) DO NOTHING;
```

Note: `gen_random_uuid()` is available in Supabase by default (pgcrypto extension enabled).

**Verification queries (run after migration):**

```sql
-- Check 1: Every session has at least one junction entry
SELECT COUNT(*) AS orphaned_sessions
FROM sessions s
LEFT JOIN session_batches sb ON sb.session_id = s.id
WHERE sb.id IS NULL;
-- Expected: 0

-- Check 2: Every event has at least one junction entry
SELECT COUNT(*) AS orphaned_events
FROM events e
LEFT JOIN event_batches eb ON eb.event_id = e.id
WHERE eb.id IS NULL;
-- Expected: 0

-- Check 3: No duplicate junction entries
SELECT session_id, batch_id, COUNT(*)
FROM session_batches
GROUP BY session_id, batch_id
HAVING COUNT(*) > 1;
-- Expected: 0 rows

-- Check 4: All junction FKs reference valid records
SELECT COUNT(*) FROM session_batches sb
LEFT JOIN sessions s ON s.id = sb.session_id
WHERE s.id IS NULL;
-- Expected: 0
```

### Step 3: BatchSelect Component
**Files**: `founder-sprint/src/components/ui/BatchSelect.tsx` (NEW)

Clone `CompanySelect.tsx` and adapt:

**Props:**
```typescript
interface BatchOption {
  id: string;
  name: string;
  status: "active" | "archived";
  memberCount: number; // from _count.userBatches on Batch model
}

interface BatchSelectProps {
  batches: BatchOption[];
  selectedBatchIds?: string[]; // for edit mode pre-fill
  required?: boolean; // default true — at least 1 batch
}
```

**Behavior:**
- Two modes: "All Batches" / "Specific Batches"
- "All Batches" mode: submits ALL batch IDs as hidden inputs (not a special flag)
- "Specific Batches" mode: multi-select with search, checkboxes, Select All
- Show status badge (active/archived) next to each batch name
- Summary: "N batches selected (X total members)"
- Hidden inputs: `<input name="batchIds" value={id} />` for each selected
- Validation: if `required`, prevent form submit with 0 selections
- "Select All" in specific mode: snapshot of all currently rendered batch IDs (client-side)

**Data source**: Server component fetches via `getAllBatches()` (new action, see Step 4) that returns all batches with `_count.userBatches`. Passed as prop to `<BatchSelect>`.

### Step 4: Update Server Actions — Session
**Files**: `founder-sprint/src/actions/session.ts`

#### New: `getAllBatchesForSelect()`
```typescript
export async function getAllBatchesForSelect() {
  return prisma.batch.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      _count: { select: { userBatches: true } }
    },
    orderBy: [{ status: "asc" }, { name: "asc" }], // active first
  });
}
```

#### `createSession(formData)` — Changes:
1. Extract `batchIds`: `formData.getAll("batchIds") as string[]`
2. Validate: `batchIds.length >= 1`
3. Validate all IDs exist: `prisma.batch.findMany({ where: { id: { in: batchIds } } })`
4. Validate at least 1 is active: `validBatches.some(b => b.status === "active")`
5. Keep `requireActiveBatch` for the FIRST active batch (legacy compat)
6. Create in transaction:
   ```typescript
   await prisma.$transaction(async (tx) => {
     const session = await tx.session.create({
       data: { batchId: batchIds[0], title, description, ... }
     });
     await tx.sessionBatch.createMany({
       data: batchIds.map(batchId => ({ sessionId: session.id, batchId }))
     });
     return session;
   });
   ```
7. Calendar: collect attendees from ALL selected batches (union, deduplicate via `Set`)
8. Cache invalidation: revalidate for EVERY affected batchId:
   ```typescript
   for (const batchId of batchIds) {
     revalidateTag(`sessions-${batchId}`);
     revalidateTag(`schedule-${batchId}`);
   }
   ```

#### `updateSession(id, formData)` — Changes:
1. Extract `batchIds` from FormData
2. Fetch existing session WITH `batches` relation
3. Authorization: check user has access via `userBatchIds` (not legacy `batchId`)
4. Update in transaction:
   ```typescript
   await prisma.$transaction(async (tx) => {
     await tx.sessionBatch.deleteMany({ where: { sessionId: id } });
     await tx.sessionBatch.createMany({
       data: batchIds.map(batchId => ({ sessionId: id, batchId }))
     });
     // Update legacy batchId to first in list
     await tx.session.update({ where: { id }, data: { batchId: batchIds[0], ...otherFields } });
   });
   ```
5. Cache invalidation: revalidate OLD + NEW batchIds
6. Calendar: recalculate attendees if batches changed

#### `deleteSession(id)` — Changes:
1. Fetch existing session WITH `batches` relation
2. Authorization: check user has access via `userBatchIds`
3. Delete (CASCADE will remove junction entries)
4. Cache invalidation: revalidate ALL previously assigned batchIds

#### `getSessions(batchId)` — Changes:
- **Signature stays the same**: `getSessions(batchId: string)`
- Change WHERE clause only:
  ```typescript
  // Before:
  where: { batchId }
  // After:
  where: { batches: { some: { batchId } } }
  ```
- Add include: `batches: { include: { batch: { select: { id: true, name: true } } } }`

### Step 5: Update Server Actions — Event
**Files**: `founder-sprint/src/actions/event.ts`

Apply identical pattern from Step 4 to:
- `createEvent(formData)` — same transaction + junction pattern
- `updateEvent(eventId, formData)` — same update pattern
- `deleteEvent(eventId)` — same authorization change
- `getEvents(batchId)` — same WHERE clause change
- Event rate limit: count per-batch via junction: `prisma.eventBatch.count({ where: { batchId } })` (per selected batch, max 20)
- Cache invalidation: revalidate all affected batchIds

### Step 6: Update Session UI
**Files**: `founder-sprint/src/app/(dashboard)/sessions/SessionsList.tsx`

#### Create/Edit Modal:
- Add `<BatchSelect batches={allBatches} selectedBatchIds={editSession?.batches?.map(b => b.batch.id)} />`
- `allBatches` passed from server component page

#### List View:
- Add batch indicator badges to each session row:
  ```tsx
  <div className="flex gap-1">
    {session.batches.slice(0, 3).map(b => (
      <span key={b.batch.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded">
        {b.batch.name}
      </span>
    ))}
    {session.batches.length > 3 && (
      <span className="text-xs text-gray-500">+{session.batches.length - 3} more</span>
    )}
  </div>
  ```

#### Page component (`sessions/page.tsx`):
- Fetch `allBatches` and pass to `SessionsList` as prop
- `getSessions(user.batchId)` call stays the same (context-scoped)

### Step 7: Update Event UI
**Files**: `founder-sprint/src/app/(dashboard)/events/EventsList.tsx`

Same pattern as Step 6. Apply identical changes.

### Step 8: Update Schedule View
**Files**:
- `founder-sprint/src/actions/schedule.ts` — update `getScheduleItems()`
- `founder-sprint/src/app/(dashboard)/schedule/page.tsx` — no changes needed (already passes `user.batchId`)

**Changes to `getScheduleItems(batchId)`:**
- Session query: `where: { batches: { some: { batchId } } }` (replace `where: { batchId }`)
- Event query: same pattern
- Include batch data for indicators
- Cache tags stay the same (`schedule-${batchId}`)

### Step 9: Update Detail Pages
**Files**:
- `founder-sprint/src/app/(dashboard)/sessions/[id]/page.tsx`
- `founder-sprint/src/app/(dashboard)/events/[id]/page.tsx`

**Changes:**
- Fetch session/event WITH `batches` relation
- Replace access check:
  ```typescript
  // Before:
  if (session.batchId !== user.batchId) redirect("/sessions");

  // After:
  const assignedBatchIds = session.batches.map(b => b.batchId);
  if (!assignedBatchIds.includes(user.batchId)) redirect("/sessions");
  ```
- Show batch indicators on detail page

### Step 10: Update Calendar Integration
**Files**: `founder-sprint/src/lib/google-calendar.ts`, session.ts, event.ts

When creating/updating calendar events with multi-batch:
1. Collect attendees from ALL selected batches:
   ```typescript
   const batchMembers = await prisma.userBatch.findMany({
     where: { batchId: { in: batchIds }, status: "active" },
     include: { user: { select: { email: true } } }
   });
   const attendeeEmails = [...new Set(batchMembers.map(m => m.user.email))];
   ```
2. Create single calendar event with deduplicated attendees
3. On batch change: recalculate attendees, update calendar event via `updateCalendarEvent()`
4. Skip calendar sync for past events (no-op if `endTime < now()`)

### Step 11: Update Batch Deletion Safety
**Files**: `founder-sprint/src/actions/batch.ts`

**Changes to `deleteBatch(batchId)`:**
```typescript
// Before deleting, check if this is the ONLY batch for any content
const exclusiveSessions = await prisma.session.findMany({
  where: {
    batches: { some: { batchId } },
    // Only one batch entry total
  },
  include: { batches: true }
});
const blockers = exclusiveSessions.filter(s => s.batches.length === 1);

if (blockers.length > 0) {
  return {
    success: false,
    error: `Cannot delete: ${blockers.length} sessions are only assigned to this batch. Reassign them first.`
  };
}
// Same check for events
```

### Step 12: Verification & Acceptance Tests

**Manual test cases (all must pass):**

| # | Test | Setup | Action | Expected |
|---|------|-------|--------|----------|
| 1 | Create multi-batch session | Admin in Batch A | Create session, select Batch A + B | Session visible in Batch A and B contexts |
| 2 | View in other batch | User in Batch B | Navigate to sessions | Session from test 1 visible with batch indicators |
| 3 | Not visible to unassigned | User in Batch C only | Navigate to sessions | Session from test 1 NOT visible |
| 4 | Edit batches | Admin | Edit session, remove Batch B, add Batch C | Session now visible in A+C, NOT B |
| 5 | Detail page access | User in Batch A | Click session assigned to [A, B] | Session detail loads correctly |
| 6 | Detail page denied | User in Batch D | Direct URL to session [A, B] | Redirected to /sessions |
| 7 | Delete batch (safe) | Admin | Delete Batch B (sessions have other batches) | Batch deleted, junction entries removed, sessions survive |
| 8 | Delete batch (blocked) | Admin | Delete Batch A (some sessions ONLY in A) | Error message, batch not deleted |
| 9 | Schedule view | User in Batch A | View schedule | Multi-batch sessions/events appear on correct dates |
| 10 | Calendar attendees | Admin | Create session for [A, B] | Calendar event has union of A+B member emails |
| 11 | Cache invalidation | Admin in Batch A | Create session for [A, B] | Both Batch A and B users see new session without refresh |
| 12 | Select All | Admin | Click "All Batches" in create modal, submit | All current batch IDs stored in junction table |

**Automated checks:**
```bash
# Type check
npx tsc --noEmit

# Prisma validation
npx prisma validate

# Lint
npm run lint

# Migration verification (SQL queries from Step 2)
```

---

## Files Affected (Complete)

| File | Change Type | Step |
|------|-------------|------|
| `founder-sprint/src/types/index.ts` | Modify — add `userBatchIds` to UserWithBatch | 0 |
| `founder-sprint/src/lib/permissions.ts` | Modify — fetch all user batch memberships | 0 |
| `founder-sprint/prisma/schema.prisma` | Add 2 junction models + relations | 1 |
| Migration SQL | NEW — create tables + backfill | 2 |
| `founder-sprint/src/components/ui/BatchSelect.tsx` | NEW — multi-select batch component | 3 |
| `founder-sprint/src/actions/session.ts` | Modify — multi-batch create/update/delete/query | 4 |
| `founder-sprint/src/actions/event.ts` | Modify — multi-batch create/update/delete/query | 5 |
| `founder-sprint/src/app/(dashboard)/sessions/SessionsList.tsx` | Modify — add BatchSelect + indicators | 6 |
| `founder-sprint/src/app/(dashboard)/sessions/page.tsx` | Modify — pass allBatches prop | 6 |
| `founder-sprint/src/app/(dashboard)/events/EventsList.tsx` | Modify — add BatchSelect + indicators | 7 |
| `founder-sprint/src/app/(dashboard)/events/page.tsx` | Modify — pass allBatches prop | 7 |
| `founder-sprint/src/actions/schedule.ts` | Modify — junction WHERE clause | 8 |
| `founder-sprint/src/app/(dashboard)/sessions/[id]/page.tsx` | Modify — junction-based access check | 9 |
| `founder-sprint/src/app/(dashboard)/events/[id]/page.tsx` | Modify — junction-based access check | 9 |
| `founder-sprint/src/lib/google-calendar.ts` | Modify — union attendees from multiple batches | 10 |
| `founder-sprint/src/actions/batch.ts` | Modify — deletion safety check | 11 |
| `founder-sprint/src/lib/batch-gate.ts` | Modify — support multi-batch validation | 4 |
| `founder-sprint/src/lib/cache-helpers.ts` | Modify — multi-batch cache invalidation | 4 |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Legacy `batchId` cascade deletes shared sessions | CRITICAL | Expand/contract: keep `batchId` required during Phase 1, block batch deletion for exclusive content (Step 11) |
| Stale cache across batches after mutation | High | Invalidate ALL affected batchIds in every create/update/delete (Step 4) |
| Detail pages reject valid multi-batch users | High | Update access checks in sessions/[id] and events/[id] (Step 9) |
| N+1 queries in list views | Medium | Use Prisma `include` with nested relations; composite indexes on both junction tables |
| Calendar duplicate attendees | Medium | Deduplicate emails with `Set` before sending |
| Orphaned content (0 batches) | High | Validate min 1 batch in all create/update; block last-batch deletion |

---

## Execution Order

```
Step 0 (Auth Model) → Step 1 (Schema) → Step 2 (Migration + Verify)
  → Step 3 (BatchSelect Component)
  → Step 4 + 5 (Server Actions — parallel)
  → Step 6 + 7 (UI — parallel)
  → Step 8 (Schedule) → Step 9 (Detail Pages)
  → Step 10 (Calendar) → Step 11 (Batch Deletion Safety)
  → Step 12 (Verification)
```

## Open Decision: Contract Phase (Future PR)

After all verification passes and feature is stable in production:
1. Make `batchId` nullable on Session and Event models
2. Remove `onDelete: Cascade` from legacy batch FK on Session/Event
3. Update all remaining code that reads legacy `batchId`
4. Eventually drop `batchId` column entirely

This is a **separate PR** and NOT part of this implementation.
