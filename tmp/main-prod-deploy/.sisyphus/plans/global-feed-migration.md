# Global Feed Migration - Implementation Plan

## Context

**Objective**: Transform batch-scoped feed into global feed where all users from all batches see ALL posts. Users can post/comment after batch expiration. Group feed stays separate.

**Research Complete**: Oracle architectural review, Explore consumer mapping, codebase analysis verified.

**Constraints**:
- `Post.batchId` remains NON-NULLABLE
- Group feed unchanged
- INLINE CSS only, NO Tailwind, NO #555AB9
- Fonts: BDO Grotesk, Libre Caslon, Roboto Mono
- Colors: #1A1A1A, #fefaf3, #FFFFFF, #2F2C26

---

## Task Dependencies

| Task | Depends On | Reason |
|------|------------|--------|
| 1 | None | Merge conflict blocker |
| 2 | 1 | Needs clean FeedView.tsx |
| 3 | None | Independent backend |
| 4 | 3 | Needs new signature |
| 5 | 3 | Needs cache strategy |
| 6 | 3,5 | Needs data+cache ready |
| 7 | ALL | Final verification |

---

## Parallel Execution

```
Wave 1: Task 1
Wave 2: Task 2, Task 3 (parallel)
Wave 3: Task 4, Task 5 (parallel)
Wave 4: Task 6
Wave 5: Task 7
```

---

## Tasks

### Task 1: Resolve Merge Conflict

**File**: `src/app/(dashboard)/feed/FeedView.tsx`

**Actions**:
- Find `<<<<<<< newdesign`, `=======`, `>>>>>>> dev`
- Keep newdesign, remove dev version
- Remove markers

**Category**: `quick` | **Skills**: []
**QA**: No markers, tsc passes

---

### Task 2: Update FeedView UI

**File**: `src/app/(dashboard)/feed/FeedView.tsx`

**Actions**:
```typescript
// Remove readOnly prop from interface
// Remove read-only banner JSX
// Change: batchName={post.batch?.name || 'Unknown'}
```

**Category**: `quick` | **Skills**: [`frontend-ui-ux`]
**Depends**: Task 1
**QA**: No readOnly, uses post.batch?.name

---

### Task 3: Refactor feed.ts

**File**: `src/actions/feed.ts`

**Actions**:
```typescript
// getPaginatedPosts: remove batchId param
// Add: groupId: null, batch: {select: {name: true}}
// Tags: posts-global

// getArchivedPosts: same pattern
// Tags: archived-posts-global
```

**Category**: `unspecified-high` | **Skills**: []
**QA**: No batchId param, global tags, batch included

---

### Task 4: Update page.tsx

**File**: `src/app/(dashboard)/feed/page.tsx`

**Actions**:
```typescript
// Change: getPaginatedPosts(page)
// Remove: readOnly prop
```

**Category**: `quick` | **Skills**: []
**Depends**: Task 3
**QA**: Build passes

---

### Task 5: Fix Cache (11 mutators)

**File**: `src/actions/feed.ts`

**Functions** (~lines):
- createPost (52)
- createComment (270)
- updateComment (315)
- deleteComment (347)
- toggleLike (410)
- updatePost (495)
- deletePost (529)
- hidePost (562)
- pinPost (609)
- archivePost (642) + add archived tag
- restorePost (679) + add archived tag

**Pattern**:
```typescript
// Find: revalidateTag(`posts-${...}`)
// Replace: revalidateTag('posts-global')
```

**Category**: `quick` | **Skills**: []
**Depends**: Task 3
**QA**: Zero `` `posts-${` `` in mutators

---

### Task 6: Remove Guards

**File**: `src/actions/feed.ts`

**Actions**:
```typescript
// createPost: remove requireActiveBatch
// Add: if (!user.batchId) throw error

// createComment: remove requireActiveBatch
```

**Category**: `quick` | **Skills**: []
**Depends**: Task 3, 5
**QA**: Zero requireActiveBatch

---

### Task 7: Verification

**Checks**:
- `tsc --noEmit`
- `npm run build`
- No Tailwind/purple
- Consumer mapping verified

**Category**: `quick` | **Skills**: []
**Depends**: ALL
**QA**: All pass

---

## Commit Strategy

```
feat: migrate feed to global scope

- Remove batch filtering (now global)
- Allow post/comment after batch expiry
- Fix batch badge (show post's batch)
- Update cache to posts-global
- Fix archive/restore bug
- Resolve merge conflict

BREAKING: getPaginatedPosts no longer takes batchId
```

Use `git-master` skill.

---

## Success Criteria

- ✅ tsc passes
- ✅ Build succeeds
- ✅ Feed shows all batches
- ✅ Correct batch badges
- ✅ Post after expiry works
- ✅ Admin guard works

---

## TODO List

**Wave 1**:
- [ ] Task 1: Resolve conflict (quick, [])

**Wave 2**:
- [ ] Task 2: UI update (quick, [frontend-ui-ux])
- [ ] Task 3: Refactor data (unspecified-high, [])

**Wave 3**:
- [ ] Task 4: Update page (quick, [])
- [ ] Task 5: Fix cache (quick, [])

**Wave 4**:
- [ ] Task 6: Remove guards (quick, [])

**Wave 5**:
- [ ] Task 7: Verify (quick, [])

**Final**:
- [ ] Commit (quick, [git-master])

---

**Status**: ✅ READY
**Time**: 45-60min
**Risk**: 🟢 LOW
