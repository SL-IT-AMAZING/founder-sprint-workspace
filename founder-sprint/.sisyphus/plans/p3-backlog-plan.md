# P3 Backlog Plan — Founder Sprint

7 remaining issues grouped into 3 sprints by theme and dependency.

---

## Sprint A — Quick Security Wins (est. ~1hr total)

### #35: Upload route batch membership check
- **Effort**: ~20min
- **File**: `src/app/api/upload/route.ts`
- **What**: Add `getCurrentUser()` + batch membership check before allowing upload
- **Pattern**: Same guard pattern used in #23 (read functions already fixed)
- **Risk if skipped**: Low — Supabase Storage quota limits abuse. But trivial to fix.

### #33: Header spoofing — remove x-auth headers
- **Effort**: ~30min
- **Files**: `src/lib/supabase/middleware.ts`, `src/lib/auth.ts`
- **What**: Remove `x-auth-user-id` / `x-auth-user-email` header injection from middleware. Update any code that reads these headers to use Supabase session directly via `getCurrentUser()`.
- **Verification**: Grep for `x-auth-user` across codebase, ensure zero references remain.
- **Risk if skipped**: Low (middleware overwrites headers anyway), but it's a bad pattern that could break on framework upgrade.

### #42: Date/time client-side validation
- **Effort**: ~30min
- **Files**: `src/app/(dashboard)/events/EventsList.tsx`, `src/app/(dashboard)/office-hours/OfficeHoursList.tsx`
- **What**: Add `endTime > startTime` validation before form submission with `toast.error()` feedback.
- **Risk if skipped**: Users can create events with end before start. Data integrity issue.

---

## Sprint B — UX Polish (est. ~2hr total)

### #39: Modal focus trap (accessibility)
- **Effort**: ~1hr
- **File**: `src/components/ui/Modal.tsx`
- **Options**:
  - **Option A**: Install `focus-trap-react` (~5KB) — wrap modal content with `<FocusTrap>`. Simplest.
  - **Option B**: Implement manually — track first/last focusable elements, cycle on Tab/Shift+Tab.
- **Recommendation**: Option A. It's a well-tested library used by major design systems.
- **Also add**: `aria-modal="true"`, `role="dialog"`, auto-focus on open, return focus on close.
- **Risk if skipped**: Accessibility compliance gap. Minor for current user base, important if product scales.

### #40: ~~Feed images~~ ✅ DONE (moved to this session)

---

## Sprint C — Architecture Debt (est. ~5hr total, can be deferred)

### #34: Rate limiting
- **Effort**: ~2hr
- **Approach**: Use `@upstash/ratelimit` with Vercel KV (or in-memory for dev)
- **Priority targets** (in order):
  1. `inviteUser` — prevents email spam (most important)
  2. `/api/upload` — prevents storage abuse
  3. `createPost` / `createComment` — prevents content spam
- **Pattern**: Create `src/lib/rate-limit.ts` helper, apply as first check in target actions
- **Prerequisite**: Upstash Redis account (free tier: 10K requests/day) OR use in-memory Map with TTL for small scale
- **Risk if skipped**: Low at ~30 users. Medium+ when product is public-facing.

### #37: Pagination
- **Effort**: ~4hr
- **Priority targets**:
  1. Feed posts (`getPosts`) — most data growth expected
  2. Q&A (`getQuestions`) — moderate growth
  3. Submissions (`getSubmissions`) — per-assignment, limited
- **Approach**: Cursor-based pagination using `createdAt` + `id` for feed, offset-based for admin lists
- **Backend**: Add `cursor`/`limit` params to action functions, return `{ items, nextCursor }`
- **Frontend**: Add "Load more" button or infinite scroll (intersection observer)
- **Risk if skipped**: No impact at current scale. Performance degrades at 1000+ posts.

### #36: `unstable_cache` documentation
- **Effort**: ~10min
- **What**: Add a comment to a shared file noting that `unstable_cache` is used across 12+ functions and will need migration when Next.js provides a stable API
- **This is documentation only, no code change needed.**
- **Risk if skipped**: None immediate. Tech debt awareness issue.

---

## Recommended Execution Order

| Priority | Sprint | When |
|----------|--------|------|
| 1 | Sprint A (#35, #33, #42) | Next session — all quick wins |
| 2 | Sprint B (#39) | When doing UX pass |
| 3 | Sprint C (#34, #37) | Before scaling beyond beta |
| 4 | Sprint C (#36) | Anytime — just a comment |

---

## Issues NOT in this plan (already resolved)

- #25 Sentry — ✅ Implemented this session
- #29 Prisma Migrate — ✅ Baseline migration created this session
- #40 Feed images — ✅ Fixed this session
