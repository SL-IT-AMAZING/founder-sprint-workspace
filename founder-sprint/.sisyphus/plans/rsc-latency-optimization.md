# RSC Navigation Latency Optimization

## TL;DR

> **Quick Summary**: Reduce RSC navigation delays from 400-750ms to ~150-300ms by eliminating redundant Supabase auth calls, caching expensive Prisma queries with `unstable_cache`, and parallelizing sequential data fetches across 11 dashboard pages.
> 
> **Deliverables**:
> - Middleware passes auth state to server components via request headers (eliminates ~150ms per navigation)
> - Admin role cached in middleware header (eliminates 2 extra DB queries on admin paths)
> - `unstable_cache` wrappers on all page data-fetching functions (serves cached data on repeat navigations)
> - Parallel data fetching where currently sequential
> - Missing `revalidate` config added to all pages
> 
> **Estimated Effort**: Medium (6-8 tasks, ~3-4 hours)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 → Task 3 → Task 5

---

## Context

### Original Request
Reduce RSC navigation delays from 400-750ms in a Next.js 16.1.4 app with Supabase + Prisma. Root cause analysis already completed by user identifying 3 stacking latency layers.

### Root Cause Summary

Three latency layers stack on EVERY client-side navigation (`_rsc` request):

| Layer | Source | Latency | Root Cause |
|-------|--------|---------|------------|
| 1. Middleware | `src/lib/supabase/middleware.ts:34` | ~150ms | `supabase.auth.getUser()` network round-trip to Supabase Auth API |
| 2. Layout | `src/lib/permissions.ts:10` | ~200ms | SECOND `supabase.auth.getUser()` call + `prisma.user.findUnique` with nested include |
| 3. Page Data | Various page.tsx files | ~100-300ms | Sequential `getCurrentUser()` → `getData()` pattern |

**Admin paths are worst** (~750ms): Middleware makes 2 ADDITIONAL Supabase queries (users table + user_batches table) on top of the base auth call.

### Key Technical Facts
- Middleware runs in Edge Runtime; layout/pages run in Node.js Runtime — **separate execution contexts**
- React `cache()` only dedupes WITHIN a single request lifecycle — it does NOT help across middleware→layout boundary
- `unstable_cache` persists to Next.js Data Cache and survives across requests
- `supabase.auth.getUser()` validates JWT with Supabase Auth API (network round-trip, ~100-150ms)
- `supabase.auth.getSession()` only checks local JWT (no network call) — less secure but instant
- In Next.js middleware, you can set custom request headers that server components read via `headers()` from `next/headers`

### Gap Analysis (Self-Review)
**Addressed in plan:**
- Security: Keep `getUser()` in middleware (validates JWT), pass validated user ID downstream
- Cache invalidation: `unstable_cache` uses `revalidateTag()` tied to mutation actions
- User isolation: All cache keys include userId/batchId to prevent cross-user data leakage
- Admin role changes: Admin header is set per-request from middleware's getUser result, not persisted in cookie

---

## Work Objectives

### Core Objective
Reduce median RSC navigation time from ~500ms to ~200-300ms by eliminating redundant auth calls and adding data caching.

### Concrete Deliverables
- Modified `src/lib/supabase/middleware.ts` — passes auth user ID via request header
- New `src/lib/auth.ts` — lightweight `getAuthUser()` that reads header, falls back to `getUser()`
- Modified `src/lib/permissions.ts` — `getCurrentUser()` uses header-based auth when available
- `unstable_cache` wrappers on data-fetching functions in `src/actions/*.ts`
- Parallelized data fetches in 7 page files
- `revalidate` config on all 11 pages

### Definition of Done
- [ ] All dashboard pages load in <300ms on RSC navigation (measured via DevTools Network tab)
- [ ] Admin page loads in <400ms (down from 750ms)
- [ ] All existing functionality works (auth, redirects, role checks, data display)
- [ ] `npm run build` succeeds with zero errors

### Must Have
- Auth validation still happens (getUser() in middleware on every request)
- Role-based access control works identically
- Data freshness within revalidation windows
- No cross-user data leakage from caching

### Must NOT Have (Guardrails)
- DO NOT use `getSession()` as the sole auth check anywhere (security risk — JWT could be revoked)
- DO NOT cache user auth data across requests (only pass within a single request via headers)
- DO NOT add new npm packages
- DO NOT change the middleware matcher pattern
- DO NOT touch Prisma schema or database structure
- DO NOT over-abstract — no "CacheManager" classes, no generic caching frameworks
- DO NOT cache mutations (server actions) — only cache read operations
- DO NOT remove existing React `cache()` wrapper from `getCurrentUser` — it still helps for within-request deduplication

---

## Verification Strategy

### Test Decision
- **Infrastructure exists**: YES (Playwright)
- **User wants tests**: Manual verification (performance measurement, not unit tests)
- **Framework**: Playwright exists but this is a performance optimization — verification is via timing measurement

### Verification Approach (Automated)

Each task includes automated verification via:
1. `npm run build` — must succeed (catches type errors, import issues)
2. Browser DevTools Network tab measurement — compare before/after `_rsc` response times
3. Functional smoke test — navigate through all dashboard pages, verify data renders correctly

**Baseline Measurement (capture BEFORE any changes):**
```bash
# Start dev server, then in browser:
# 1. Open DevTools → Network tab
# 2. Login and navigate to dashboard
# 3. Click through: dashboard → questions → assignments → feed → admin → settings → office-hours → sessions → submissions → events → groups
# 4. Record _rsc response times for each navigation
# 5. Save screenshot to .sisyphus/evidence/baseline-rsc-times.png
```

---

## Task Dependency Graph

| Task | Depends On | Reason | Blocks |
|------|------------|--------|--------|
| Task 1 | None | Foundation: passes auth from middleware to server components | Tasks 3, 5 |
| Task 2 | None | Independent: optimizes middleware admin path | None (improves admin speed) |
| Task 3 | Task 1 | Needs auth header to build getCurrentUser optimization | Task 5 |
| Task 4 | None | Independent: adds unstable_cache to data functions | Task 5 |
| Task 5 | Tasks 3, 4 | Needs cached getCurrentUser + cached data functions to parallelize | Task 6 |
| Task 6 | Task 5 | Final: adds revalidate config after all other changes | None |

## Parallel Execution Graph

```
Wave 1 (Start immediately - independent foundations):
├── Task 1: Pass auth state from middleware to layout via headers (~150ms saved)
├── Task 2: Optimize middleware admin role check (~100ms saved on admin paths)
└── Task 4: Add unstable_cache to data-fetching functions (~100-200ms saved on repeat nav)

Wave 2 (After Wave 1 completes):
└── Task 3: Optimize getCurrentUser() to skip second getUser() (~150ms saved)

Wave 3 (After Wave 2 completes):
├── Task 5: Parallelize sequential data fetches in page.tsx files (~50-100ms saved)
└── Task 6: Add missing revalidate config + build verification

Critical Path: Task 1 → Task 3 → Task 5
Estimated Parallel Speedup: ~50% faster than sequential execution
```

---

## TODOs

- [ ] 1. Pass Auth State from Middleware to Server Components via Request Headers

  **What to do**:
  1. In `src/lib/supabase/middleware.ts`, after the existing `getUser()` call on line 34, set a custom request header with the authenticated user's ID:
     ```typescript
     // After line 34: const { data: { user } } = await supabase.auth.getUser();
     if (user) {
       request.headers.set('x-auth-user-id', user.id);
       request.headers.set('x-auth-user-email', user.email || '');
     }
     ```
  2. Ensure the `NextResponse.next({ request })` on lines 5-7 and 21-23 passes the modified request headers through. The existing code already does `NextResponse.next({ request })` which forwards headers.
  3. Create `src/lib/auth.ts` with a helper function:
     ```typescript
     import { headers } from 'next/headers';
     
     export async function getAuthUserFromHeaders(): Promise<{ id: string; email: string } | null> {
       const headerStore = await headers();
       const userId = headerStore.get('x-auth-user-id');
       const userEmail = headerStore.get('x-auth-user-email');
       if (!userId || !userEmail) return null;
       return { id: userId, email: userEmail };
     }
     ```

  **Must NOT do**:
  - DO NOT pass the full user object or JWT token in headers (only ID + email)
  - DO NOT use cookies for this (headers are request-scoped, cookies persist)
  - DO NOT remove the existing `getUser()` call from middleware (it's the security check)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small, focused change to 2 files. No complex logic.
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: TypeScript types for Next.js middleware and headers API
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI changes
    - `git-master`: Will be grouped in commit strategy

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 4)
  - **Blocks**: Task 3
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/lib/supabase/middleware.ts:4-34` — updateSession function where getUser() is called and request is constructed. The header must be set AFTER line 34 (getUser) and BEFORE the supabaseResponse is created on line 5/21
  - `src/lib/supabase/middleware.ts:5-7` and `21-23` — Where `NextResponse.next({ request })` is called. The request object carries modified headers.

  **API/Type References**:
  - `next/headers` — `headers()` async function returns `ReadonlyHeaders` which has `.get(name)` method

  **Documentation References**:
  - Next.js Middleware docs: Setting request headers pattern via `NextResponse.next({ request: { headers: request.headers } })`

  **Acceptance Criteria**:
  
  ```bash
  # Build verification
  cd /Users/jsup/Development\ Files/Founder\ Sprint\ Batch/founder-sprint-workspace/founder-sprint
  npm run build
  # Assert: Exit code 0, no type errors
  ```

  ```bash
  # Functional verification: Start dev server, check headers are set
  # In browser DevTools → Network tab, navigate to any dashboard page
  # Check the _rsc request — the x-auth-user-id header should be present on the request
  ```

  **Commit**: YES (groups with Task 3)
  - Message: `perf(auth): pass auth state from middleware to layout via request headers`
  - Files: `src/lib/supabase/middleware.ts`, `src/lib/auth.ts`
  - Pre-commit: `npm run build`

---

- [ ] 2. Optimize Middleware Admin Role Check

  **What to do**:
  1. In `src/lib/supabase/middleware.ts`, replace the TWO sequential Supabase queries for admin path authorization (lines 61-89) with a SINGLE query using a join:
     ```typescript
     // Replace lines 52-89 with:
     if (user && isAdminPath) {
       const userEmail = user.email;
       if (!userEmail) {
         const url = request.nextUrl.clone();
         url.pathname = "/dashboard";
         return NextResponse.redirect(url);
       }
       
       // Single query instead of two sequential queries
       const { data: adminCheck } = await supabase
         .from("user_batches")
         .select("role, users!inner(email)")
         .eq("users.email", userEmail)
         .eq("status", "active")
         .in("role", ["admin", "super_admin"])
         .limit(1)
         .maybeSingle();
       
       if (!adminCheck) {
         const url = request.nextUrl.clone();
         url.pathname = "/dashboard";
         return NextResponse.redirect(url);
       }
     }
     ```
  2. **IMPORTANT**: Verify the Supabase schema supports this join. The `user_batches` table likely has a `user_id` FK to `users.id`. The `users!inner(email)` join filters by the users table's email. If the FK relationship name differs, check the Supabase schema and adjust the join syntax.

  **Must NOT do**:
  - DO NOT cache admin role in cookies (stale data = security risk)
  - DO NOT skip admin check entirely (security requirement)
  - DO NOT change the admin path matching logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file, straightforward SQL optimization
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: Supabase query builder TypeScript API
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/lib/supabase/middleware.ts:50-89` — Current admin check implementation: 2 sequential queries (users → user_batches)

  **API/Type References**:
  - Supabase PostgREST join syntax: `select("role, users!inner(email)")` uses `!inner` for INNER JOIN

  **WHY Each Reference Matters**:
  - The current code does: (1) find user by email → get id, (2) find user_batches by id → check role. This is 2 round-trips. A single join-based query eliminates one round-trip (~50-75ms saved on admin paths).

  **Acceptance Criteria**:
  
  ```bash
  npm run build
  # Assert: Exit code 0
  ```

  ```
  # Functional verification via browser:
  # 1. Login as admin user
  # 2. Navigate to /admin
  # 3. Verify page loads correctly with admin content
  # 4. Check Network tab: admin _rsc response time should be ~400-500ms (down from 750ms)
  ```

  **Commit**: YES
  - Message: `perf(middleware): optimize admin role check to single DB query`
  - Files: `src/lib/supabase/middleware.ts`
  - Pre-commit: `npm run build`

---

- [ ] 3. Optimize getCurrentUser() to Skip Redundant getUser() Call

  **What to do**:
  1. Modify `src/lib/permissions.ts` to use the auth header from middleware instead of making a second `supabase.auth.getUser()` call:
     ```typescript
     import { cache } from "react";
     import { createClient } from "@/lib/supabase/server";
     import { prisma } from "@/lib/prisma";
     import { getAuthUserFromHeaders } from "@/lib/auth";
     import type { UserRole, UserWithBatch } from "@/types";

     export const getCurrentUser = cache(async (batchId?: string): Promise<UserWithBatch | null> => {
       // Try to get auth user from middleware-set headers first (no network call)
       let authEmail: string | null = null;
       
       const headerAuth = await getAuthUserFromHeaders();
       if (headerAuth) {
         authEmail = headerAuth.email;
       } else {
         // Fallback: direct Supabase call (for cases outside middleware, e.g., server actions)
         const supabase = await createClient();
         const { data: { user: authUser } } = await supabase.auth.getUser();
         if (!authUser) return null;
         authEmail = authUser.email!;
       }
       
       if (!authEmail) return null;

       const user = await prisma.user.findUnique({
         where: { email: authEmail },
         include: {
           userBatches: {
             where: batchId ? { batchId, status: "active" } : { status: "active" },
             include: { batch: true },
             take: 1,
             orderBy: { batch: { createdAt: "desc" } },
           },
         },
       });
       // ... rest of function unchanged
     });
     ```
  2. Keep the React `cache()` wrapper — it still prevents redundant calls within a single request (layout + page call getCurrentUser but only one Prisma query executes).

  **Must NOT do**:
  - DO NOT remove the Supabase fallback — server actions call getCurrentUser() outside of middleware context
  - DO NOT remove React `cache()` wrapper
  - DO NOT change the Prisma query or its include structure
  - DO NOT change the return type or shape of UserWithBatch

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Moderate complexity — must handle fallback correctly and maintain type safety
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: TypeScript types, async patterns, Next.js headers API

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 2 (sequential)
  - **Blocks**: Task 5
  - **Blocked By**: Task 1 (needs auth.ts helper)

  **References**:

  **Pattern References**:
  - `src/lib/permissions.ts:8-62` — Current getCurrentUser implementation (full function)
  - `src/lib/auth.ts` — New file from Task 1 with getAuthUserFromHeaders()

  **API/Type References**:
  - `src/types/index.ts` or wherever `UserWithBatch` is defined — Return type contract must not change

  **Test References**:
  - Server actions in `src/actions/*.ts` — These call getCurrentUser() outside middleware context, so the Supabase fallback must work

  **Acceptance Criteria**:
  
  ```bash
  npm run build
  # Assert: Exit code 0
  ```

  ```
  # Functional verification:
  # 1. Navigate to any dashboard page — verify user name appears in navbar
  # 2. Navigate to settings — verify profile data loads
  # 3. Submit a form (e.g., create a question) — verify server action still works (uses fallback path)
  # 4. Check Network tab: dashboard _rsc should be ~300-350ms (down from ~486ms)
  ```

  **Commit**: YES (groups with Task 1)
  - Message: `perf(auth): eliminate redundant getUser() call in getCurrentUser by reading middleware headers`
  - Files: `src/lib/permissions.ts`
  - Pre-commit: `npm run build`

---

- [ ] 4. Add `unstable_cache` to Data-Fetching Functions

  **What to do**:
  1. Wrap the following data-fetching functions with `unstable_cache` from `next/cache`:
  
     **In `src/actions/question.ts`** — wrap `getQuestions()`:
     ```typescript
     import { unstable_cache } from "next/cache";
     
     const getCachedQuestions = (batchId: string) => 
       unstable_cache(
         () => prisma.question.findMany({
           where: { batchId },
           include: {
             author: { select: { id: true, name: true, profileImage: true } },
             _count: { select: { answers: true } },
             summary: { select: { id: true } },
           },
           orderBy: { createdAt: "desc" },
         }),
         [`questions-${batchId}`],
         { revalidate: 60, tags: [`questions-${batchId}`] }
       )();
     
     // Update getQuestions to use cached version
     export async function getQuestions(batchId: string) {
       return getCachedQuestions(batchId);
     }
     ```

  2. Apply same pattern to these action files (identify the read functions in each):
     - `src/actions/assignment.ts` — `getAssignments()`, `getSubmissions()`
     - `src/actions/event.ts` — `getEvents()`
     - `src/actions/session.ts` — `getSessions()`
     - `src/actions/office-hour.ts` — `getOfficeHourSlots()`
     - `src/actions/feed.ts` — `getPosts()`, `getArchivedPosts()`
     - `src/actions/batch.ts` — `getBatches()`
     - `src/actions/group.ts` — `getGroups()`
     - `src/actions/user-management.ts` — `getBatchUsers()`

  3. **CRITICAL**: In each action file's mutation functions (create/update/delete), add `revalidateTag()` calls to invalidate the corresponding cache:
     ```typescript
     import { revalidateTag } from "next/cache";
     
     // In createQuestion, after prisma.question.create:
     revalidateTag(`questions-${user.batchId}`);
     ```

  4. For the dashboard page's inline Prisma queries (`src/app/(dashboard)/dashboard/page.tsx` lines 31-79), extract them into a cached helper function in a new file `src/lib/dashboard-data.ts` or wrap inline with `unstable_cache`.

  **Must NOT do**:
  - DO NOT cache mutation functions (create, update, delete actions)
  - DO NOT forget revalidateTag in mutations — stale data is worse than slow data
  - DO NOT use user-specific data in cache keys for SHARED data (questions, events belong to batch, not user)
  - DO NOT set revalidate times shorter than the page-level revalidate (would be pointless)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: Moderate effort — repetitive pattern across ~10 files but needs careful cache key design
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: Next.js caching API, TypeScript generics for wrapper functions
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI changes

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2)
  - **Blocks**: Task 5
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `src/actions/question.ts:106-116` — Example data fetch function to wrap (getQuestions)
  - `src/actions/question.ts:14-48` — Example mutation that needs revalidateTag (createQuestion)
  - `src/app/(dashboard)/dashboard/page.tsx:30-79` — Inline Prisma queries to cache

  **API/Type References**:
  - `next/cache` — `unstable_cache(fn, keyParts, options)` and `revalidateTag(tag)`
  - unstable_cache signature: `unstable_cache(fn: Function, keyParts: string[], options: { revalidate?: number, tags?: string[] })`

  **Files to modify** (complete list of action files):
  - `src/actions/question.ts`
  - `src/actions/assignment.ts`
  - `src/actions/event.ts`
  - `src/actions/session.ts`
  - `src/actions/office-hour.ts`
  - `src/actions/feed.ts`
  - `src/actions/batch.ts`
  - `src/actions/group.ts`
  - `src/actions/user-management.ts`
  - `src/app/(dashboard)/dashboard/page.tsx` (inline queries)

  **Acceptance Criteria**:
  
  ```bash
  npm run build
  # Assert: Exit code 0
  ```

  ```
  # Functional verification:
  # 1. Navigate to questions page — verify questions list renders
  # 2. Create a new question — verify it appears in the list (revalidateTag working)
  # 3. Navigate away and back to questions — verify faster load (cached)
  # 4. Repeat for assignments, events pages
  # 5. Network tab: Second navigation to same page should be noticeably faster (~100-200ms vs ~400ms)
  ```

  **Commit**: YES
  - Message: `perf(cache): add unstable_cache to all data-fetching functions with revalidateTag invalidation`
  - Files: All action files listed above + dashboard page
  - Pre-commit: `npm run build`

---

- [ ] 5. Parallelize Sequential Data Fetches in Page Components

  **What to do**:
  1. In pages that do sequential `await getCurrentUser()` → `await getData()`, restructure to parallel where possible.
  
  **The key insight**: After Task 3, `getCurrentUser()` no longer needs to call `getUser()` (it reads from headers). And after Task 4, data functions use `unstable_cache`. So for pages where the data fetch doesn't depend on the user's batchId, we can parallelize. But most pages DO need `user.batchId` for the data query.
  
  **However**, we CAN still optimize: Since `getCurrentUser` now skips the ~150ms `getUser()` call (reads header), the sequential pattern is already much faster. The remaining optimization is for pages that can partially parallelize.

  2. **Specific optimizations by page**:

  **settings/page.tsx** — Already optimal (only needs getCurrentUser, no separate data fetch)
  
  **submissions/page.tsx** — Already optimal (needs user.role check before data fetch)
  
  **questions/page.tsx, assignments/page.tsx, sessions/page.tsx, events/page.tsx, office-hours/page.tsx, groups/page.tsx** — These all follow the pattern:
  ```typescript
  const user = await getCurrentUser();
  const data = await getData(user.batchId);
  ```
  These CANNOT be parallelized because `getData` needs `user.batchId`. BUT with the header optimization (Task 3), `getCurrentUser` is now just a single Prisma query (~30-50ms) instead of Prisma + Supabase API call (~200ms). So the sequential overhead is minimal.

  **admin/page.tsx** — Calls `getBatches()` with no user dependency. Already parallel-safe (doesn't call getCurrentUser at all).

  **dashboard/page.tsx** — Already uses Promise.all after getCurrentUser. Optimize: extract the 9 inline Prisma queries into a single cached function (from Task 4).

  **feed/page.tsx** — Already uses Promise.all after getCurrentUser. No change needed.

  3. **The REAL optimization here**: For pages where we can, extract the batchId from middleware headers too (middleware has access to user data, and after Task 1 we pass user info via headers). Add `x-auth-user-batch-id` header from middleware:
  
     In `src/lib/supabase/middleware.ts`, after getting user, do a lightweight batch lookup and pass batchId in headers. BUT this requires an additional DB query in middleware which defeats the purpose.
  
     **Decision**: Skip batchId-in-header approach. The getCurrentUser optimization from Task 3 already removes the ~150ms getUser() overhead. The remaining ~30-50ms for Prisma findUnique is acceptable.

  4. **What we CAN do**: Ensure all pages that are still sequential but don't strictly need to be are optimized. Verify each page and add Promise.all where applicable.

  **Must NOT do**:
  - DO NOT add batchId to middleware headers (would require extra DB query in middleware)
  - DO NOT change the data returned by any page (functional equivalence)
  - DO NOT parallelize where there's a data dependency

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Most pages are already optimal or can't be parallelized. Light review + minor changes.
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: Async patterns, Promise.all usage

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 6)
  - **Blocks**: None
  - **Blocked By**: Tasks 3, 4

  **References**:

  **Pattern References**:
  - `src/app/(dashboard)/dashboard/page.tsx:20-79` — Good example of Promise.all pattern
  - `src/app/(dashboard)/feed/page.tsx:15-19` — Good example of Promise.all pattern
  - `src/app/(dashboard)/questions/page.tsx:11-17` — Typical sequential pattern (getCurrentUser → getQuestions)

  **Files to review and potentially modify**:
  - `src/app/(dashboard)/questions/page.tsx`
  - `src/app/(dashboard)/assignments/page.tsx`
  - `src/app/(dashboard)/sessions/page.tsx`
  - `src/app/(dashboard)/events/page.tsx`
  - `src/app/(dashboard)/office-hours/page.tsx`
  - `src/app/(dashboard)/groups/page.tsx`
  - `src/app/(dashboard)/submissions/page.tsx`

  **Acceptance Criteria**:
  
  ```bash
  npm run build
  # Assert: Exit code 0
  ```

  ```
  # All pages render correctly with no missing data
  # Navigation between pages is smooth
  ```

  **Commit**: YES
  - Message: `perf(pages): review and optimize data fetching patterns across dashboard pages`
  - Files: Any modified page.tsx files
  - Pre-commit: `npm run build`

---

- [ ] 6. Add Missing Revalidate Config and Final Build Verification

  **What to do**:
  1. Add `revalidate` to pages that are missing it:
     - `src/app/(dashboard)/settings/page.tsx` — Add `export const revalidate = 60;`
     - `src/app/(dashboard)/submissions/page.tsx` — Add `export const revalidate = 60;`
     - `src/app/(dashboard)/admin/page.tsx` — Add `export const revalidate = 30;`
  
  2. Review all existing revalidate values for consistency:
     | Page | Current | Recommended |
     |------|---------|-------------|
     | dashboard | 30 | 30 (keep) |
     | feed | 30 | 30 (keep) |
     | questions | 60 | 60 (keep) |
     | assignments | 60 | 60 (keep) |
     | events | 60 | 60 (keep) |
     | office-hours | 60 | 60 (keep) |
     | groups | 120 | 120 (keep) |
     | sessions | 300 | 300 (keep) |
     | settings | MISSING | 60 |
     | submissions | MISSING | 60 |
     | admin | MISSING | 30 |

  3. Run full build and verify:
     ```bash
     npm run build
     ```

  **Must NOT do**:
  - DO NOT change existing revalidate values (they were intentionally chosen)
  - DO NOT add `revalidate = 0` (forces dynamic, defeats caching)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Trivial 3-line additions to 3 files
  - **Skills**: [`typescript-programmer`]
    - `typescript-programmer`: Next.js route segment config

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: None
  - **Blocked By**: Task 5 (do this last to catch all build issues)

  **References**:

  **Pattern References**:
  - `src/app/(dashboard)/questions/page.tsx:8` — Example of revalidate config: `export const revalidate = 60;`
  - `src/app/(dashboard)/dashboard/page.tsx:10` — Example: `export const revalidate = 30;`

  **Acceptance Criteria**:
  
  ```bash
  npm run build
  # Assert: Exit code 0, zero errors
  # Assert: All pages compile correctly (check build output for route listing)
  ```

  **Commit**: YES
  - Message: `perf(config): add missing revalidate config to settings, submissions, and admin pages`
  - Files: 3 page.tsx files
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task(s) | Message | Files | Verification |
|---------------|---------|-------|--------------|
| 1 + 3 | `perf(auth): eliminate redundant getUser() by passing auth state via middleware headers` | middleware.ts, auth.ts, permissions.ts | `npm run build` |
| 2 | `perf(middleware): optimize admin role check to single DB query` | middleware.ts | `npm run build` |
| 4 | `perf(cache): add unstable_cache to all data-fetching functions with revalidateTag invalidation` | ~10 action files + dashboard page | `npm run build` |
| 5 | `perf(pages): review and optimize data fetching patterns across dashboard pages` | page.tsx files | `npm run build` |
| 6 | `perf(config): add missing revalidate config to settings, submissions, and admin pages` | 3 page.tsx files | `npm run build` |

---

## Success Criteria

### Expected Performance Improvement

| Page | Before (ms) | After (ms) | Savings |
|------|-------------|------------|---------|
| dashboard | 486 | ~200-250 | ~50% |
| questions | 484 | ~150-200 | ~60% |
| assignments | 485 | ~150-200 | ~60% |
| feed | 549 | ~200-250 | ~55% |
| admin | 752 | ~300-400 | ~50% |
| settings | 570 | ~150-200 | ~65% |
| office-hours | 569 | ~150-200 | ~72% |
| sessions | 531 | ~150-200 | ~62% |
| submissions | 462 | ~150-200 | ~57% |

**Improvement breakdown**:
- Header auth optimization: -150ms (no second getUser)
- unstable_cache on repeat navigations: -100-200ms (cached data)
- Admin single query: -50-75ms on admin paths
- revalidate config: Enables ISR caching for previously uncached pages

### Verification Commands
```bash
# Build succeeds
npm run build  # Expected: Exit code 0

# Dev server starts
npm run dev    # Expected: Ready on http://localhost:3000
```

### Final Checklist
- [ ] All 11 dashboard pages load correctly with user data
- [ ] Admin path still requires admin role
- [ ] Server actions (create/edit/delete) still work and data refreshes
- [ ] No cross-user data leakage (test with different user accounts)
- [ ] Build succeeds with zero errors
- [ ] Median RSC navigation time < 300ms (measured in DevTools Network tab)
