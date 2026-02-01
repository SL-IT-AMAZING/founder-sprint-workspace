# Founder Sprint MVP - Complete Implementation

## TL;DR

> **Quick Summary**: Complete the critical MVP functionality by implementing OAuth user sync, role-based route protection, file upload API, and Google Calendar stub. Database migration is the blocking prerequisite.
> 
> **Deliverables**:
> - Prisma database tables created via migration
> - OAuth callback that syncs LinkedIn users to Prisma User table
> - `/no-batch` page for users without active batch membership
> - Middleware that protects `/admin/*` routes (admin/super_admin only)
> - File upload API route for Supabase Storage
> - Google Calendar integration stub (ready for credentials)
> 
> **Estimated Effort**: Medium (4-6 hours)
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Task 1 (migration) -> Task 2 (auth callback) -> Task 4 (middleware)

---

## Context

### Original Request
Complete the remaining MVP implementation for Founder Sprint batch workspace. The build passes with 25 routes and 0 errors, but critical auth flow and admin protection are incomplete.

### Interview Summary
**Key Discussions**:
- No-batch users: Create `/no-batch` page with friendly message (Option A)
- Admin route protection: Silent redirect to `/dashboard` (Option A)
- File upload errors: Detailed JSON responses for debugging (Option A)
- Google Calendar: Full stub implementation with warnings (Option A)

**Research Findings**:
- Project root is `./founder-sprint/` (not workspace root)
- Prisma schema has User.linkedinId field (unique, optional) for LinkedIn ID
- LinkedIn OAuth uses provider `linkedin_oidc`, metadata contains `sub` (LinkedIn ID), `email`, `name`/`full_name`, `picture`/`avatar_url`
- Existing permissions lib at `src/lib/permissions.ts` has `isAdmin()` helper
- googleapis package already installed (v170)

### Gap Analysis (Self-Review)

**Identified Gaps & Resolutions**:
1. **LinkedIn metadata field names**: Applied default based on Supabase OIDC standard (`sub`, `email`, `full_name`/`name`, `avatar_url`/`picture`)
2. **Supabase Storage bucket creation**: Storage buckets must exist in Supabase dashboard - will document as prerequisite
3. **Race condition in middleware Prisma query**: Will use lightweight caching pattern
4. **No-batch page design**: Will follow existing page patterns from dashboard

---

## Work Objectives

### Core Objective
Enable end-to-end user authentication with proper database persistence and role-based access control for the admin section.

### Concrete Deliverables
1. Database tables created via `npx prisma migrate dev`
2. Modified `src/app/auth/callback/route.ts` with user upsert logic
3. New page `src/app/(auth)/no-batch/page.tsx`
4. Modified `src/lib/supabase/middleware.ts` with role checking
5. New API route `src/app/api/upload/route.ts`
6. New library `src/lib/google-calendar.ts`

### Definition of Done
- [ ] `npx prisma migrate dev` completes without errors
- [ ] New user login creates User row in database
- [ ] Returning user login updates profileImage/name if changed
- [ ] User without active batch sees /no-batch page
- [ ] Non-admin accessing /admin/* is redirected to /dashboard
- [ ] File upload returns public URL on success
- [ ] Google Calendar functions log warnings when unconfigured

### Must Have
- User upsert by linkedinId first, then email fallback
- UserBatch status must be 'active' to grant access
- File size validation before upload attempt
- Graceful error handling (no 500 errors to user)

### Must NOT Have (Guardrails)
- DO NOT modify existing UI components
- DO NOT change Prisma schema (already defined)
- DO NOT create new database migrations beyond initial
- DO NOT add authentication to public paths (/, /login, /auth/*)
- DO NOT block users who have 'invited' status (they need to see /no-batch)
- DO NOT store sensitive data in client-accessible responses
- DO NOT make middleware Prisma queries on every static asset request

---

## Verification Strategy (MANDATORY)

### Test Decision
- **Infrastructure exists**: NO (no test framework configured)
- **User wants tests**: Manual-only (per project context - focused on getting MVP working)
- **Framework**: none
- **QA approach**: Automated verification via curl, Playwright browser, and command outputs

### Verification Tools by Deliverable

| Deliverable | Verification Method |
|-------------|---------------------|
| Prisma migration | `npx prisma migrate status` - shows applied |
| Auth callback | Playwright: full OAuth flow test |
| No-batch page | Playwright: navigate, verify content |
| Middleware | curl: access /admin as non-admin, verify redirect |
| File upload | curl: POST multipart, verify response JSON |
| Google Calendar | Node REPL: import and call, verify warning logged |

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately):
├── Task 1: Prisma migration (BLOCKING - must complete first)
└── Task 5: Google Calendar stub (independent)

Wave 2 (After Task 1 completes):
├── Task 2: Auth callback user upsert
├── Task 3: No-batch page
└── Task 6: File upload API

Wave 3 (After Task 2 completes):
└── Task 4: Middleware role checking (depends on auth working)

Critical Path: Task 1 -> Task 2 -> Task 4
Parallel Speedup: ~35% faster than sequential
```

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|------|------------|--------|---------------------|
| 1 (Migration) | None | 2, 3, 4, 6 | 5 |
| 2 (Auth Callback) | 1 | 4 | 3, 5, 6 |
| 3 (No-batch Page) | 1 | None | 2, 5, 6 |
| 4 (Middleware) | 1, 2 | None | None (final verification) |
| 5 (Google Calendar) | None | None | 1, 2, 3, 6 |
| 6 (File Upload) | 1 | None | 2, 3, 5 |

### Agent Dispatch Summary

| Wave | Tasks | Execution Mode |
|------|-------|----------------|
| 1 | 1, 5 | Parallel: Task 1 (blocking terminal), Task 5 (code edit) |
| 2 | 2, 3, 6 | Parallel after Wave 1 |
| 3 | 4 | Sequential after Task 2 verified |

---

## TODOs

### Prerequisites (Manual - Document Only)

**Supabase Storage Buckets** (must exist before Task 6):
1. Go to Supabase Dashboard -> Storage
2. Create bucket `question-attachments` (public: false or true based on needs)
3. Create bucket `post-images` (public: true for display)
4. Set appropriate RLS policies

---

- [ ] 1. Run Prisma Migration

  **What to do**:
  - Navigate to `founder-sprint/` directory
  - Run `npx prisma migrate dev --name init`
  - Verify all 21 tables are created
  - Verify no migration errors

  **Must NOT do**:
  - Do NOT modify schema.prisma
  - Do NOT use `--skip-seed` if seed file exists
  - Do NOT run in production mode

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single command execution, low complexity
  - **Skills**: none needed
  - **Skills Evaluated but Omitted**:
    - `git-master`: No git operations needed

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Task 5)
  - **Parallel Group**: Wave 1 (with Task 5)
  - **Blocks**: Tasks 2, 3, 4, 6
  - **Blocked By**: None (can start immediately)

  **References**:

  **Pattern References**:
  - `founder-sprint/prisma/schema.prisma` - Full schema definition (21 models)

  **Configuration References**:
  - `founder-sprint/.env.local:6` - DATABASE_URL connection string

  **Documentation References**:
  - Prisma migrate: https://www.prisma.io/docs/concepts/components/prisma-migrate

  **WHY Each Reference Matters**:
  - schema.prisma: Defines the exact tables to be created
  - .env.local: Contains the DATABASE_URL that Prisma uses

  **Acceptance Criteria**:

  ```bash
  # Agent runs in founder-sprint/ directory:
  cd founder-sprint && npx prisma migrate dev --name init
  # Assert: Output contains "Your database is now in sync with your schema"
  # Assert: Exit code 0

  # Verify migration applied:
  npx prisma migrate status
  # Assert: Output shows migration applied, no pending migrations
  ```

  **Evidence to Capture**:
  - [ ] Terminal output from migrate command
  - [ ] Migration status output

  **Commit**: YES
  - Message: `chore(db): run initial prisma migration`
  - Files: `founder-sprint/prisma/migrations/*`
  - Pre-commit: none

---

- [ ] 2. Implement OAuth Callback User Upsert

  **What to do**:
  - Modify `src/app/auth/callback/route.ts`
  - After `exchangeCodeForSession` succeeds:
    1. Call `supabase.auth.getUser()` to get user metadata
    2. Extract: email, name (from `full_name` or `name`), linkedinId (from `sub`), profileImage (from `avatar_url` or `picture`)
    3. Upsert User to Prisma: match by `linkedinId` first, then `email`
    4. Query for active UserBatch: `where: { userId, status: 'active' }`
    5. If no active batch: redirect to `/no-batch`
    6. If has active batch: redirect to `/dashboard` (or `next` param)
  - Handle edge cases: missing metadata fields, database errors

  **Must NOT do**:
  - Do NOT change the Supabase OAuth flow itself
  - Do NOT modify the login page or signInWithLinkedIn action
  - Do NOT create UserBatch records (admin does this via invite)
  - Do NOT store raw auth tokens in database

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file modification, clear logic
  - **Skills**: none
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: No UI work

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 3, 5, 6)
  - **Parallel Group**: Wave 2 (after Task 1)
  - **Blocks**: Task 4
  - **Blocked By**: Task 1 (needs database tables)

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/auth/callback/route.ts` - Current incomplete implementation (lines 1-20)
  - `founder-sprint/src/actions/user-management.ts:71-75` - User upsert pattern using Prisma

  **API/Type References**:
  - `founder-sprint/prisma/schema.prisma:67-97` - User model with linkedinId field
  - `founder-sprint/prisma/schema.prisma:123-139` - UserBatch model with status field
  - `founder-sprint/src/types/index.ts:4` - UserBatchStatus type

  **Library References**:
  - `founder-sprint/src/lib/prisma.ts` - Prisma client export
  - `founder-sprint/src/lib/supabase/server.ts` - createClient function

  **External References**:
  - Supabase getUser(): https://supabase.com/docs/reference/javascript/auth-getuser
  - LinkedIn OIDC claims: sub (user ID), email, name, picture

  **WHY Each Reference Matters**:
  - Current callback: Shows existing code structure to extend
  - user-management.ts upsert: Shows the established Prisma upsert pattern
  - User/UserBatch models: Exact field names and types to populate
  - createClient: How to get Supabase client in route handler

  **Acceptance Criteria**:

  ```
  # Agent executes via Playwright browser automation:
  1. Navigate to: http://localhost:3000/login
  2. Click: button containing "LinkedIn" text
  3. Complete LinkedIn OAuth (requires test account or mock)
  4. Wait for redirect to complete
  5. Assert: URL is either /dashboard OR /no-batch
  6. Screenshot: .sisyphus/evidence/task-2-oauth-redirect.png

  # Verify database record created:
  cd founder-sprint && npx prisma studio
  # OR via psql/database tool:
  # SELECT * FROM users WHERE email = '[test-email]';
  # Assert: Row exists with linkedinId populated
  ```

  **Alternate Verification** (if OAuth flow is complex):
  ```bash
  # Check code compiles:
  cd founder-sprint && npm run build
  # Assert: Exit code 0, no TypeScript errors in auth/callback/route.ts
  ```

  **Commit**: YES
  - Message: `feat(auth): sync linkedin user to database on oauth callback`
  - Files: `founder-sprint/src/app/auth/callback/route.ts`
  - Pre-commit: `npm run build`

---

- [ ] 3. Create No-Batch Page

  **What to do**:
  - Create `src/app/(auth)/no-batch/page.tsx`
  - Display friendly message: "You're not part of any active batch"
  - Include: explanation, contact admin guidance, sign out button
  - Follow existing page patterns (see login page for auth group styling)
  - Make the sign out button functional (use existing signOut action)

  **Must NOT do**:
  - Do NOT add complex logic or API calls
  - Do NOT create new components (use existing UI primitives)
  - Do NOT add this page to navigation (it's a dead-end for unauthorized users)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple static page, minimal logic
  - **Skills**: [`frontend-ui-ux`]
    - `frontend-ui-ux`: Clean, user-friendly messaging

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 5, 6)
  - **Parallel Group**: Wave 2 (after Task 1)
  - **Blocks**: None
  - **Blocked By**: Task 1 (migration, for consistency)

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(auth)/login/page.tsx` - Auth group page pattern and styling
  - `founder-sprint/src/actions/auth.ts:25-29` - signOut action to reuse

  **Documentation References**:
  - Next.js App Router pages: file-based routing in (auth) group

  **WHY Each Reference Matters**:
  - login page: Establishes visual style for auth pages
  - signOut action: Existing function to call for sign out button

  **Acceptance Criteria**:

  ```
  # Agent executes via Playwright browser automation:
  1. Navigate to: http://localhost:3000/no-batch
  2. Assert: Page renders without error (no 404, no 500)
  3. Assert: Text "not part of any active batch" (or similar) visible
  4. Assert: Sign out button/link visible
  5. Click: Sign out button
  6. Assert: Redirected to /login
  7. Screenshot: .sisyphus/evidence/task-3-no-batch-page.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add no-batch page for users without active membership`
  - Files: `founder-sprint/src/app/(auth)/no-batch/page.tsx`
  - Pre-commit: `npm run build`

---

- [ ] 4. Implement Role-Based Middleware

  **What to do**:
  - Modify `src/lib/supabase/middleware.ts`
  - After verifying user is authenticated:
    1. Check if path starts with `/admin`
    2. If admin path: query Prisma for user's role via email -> UserBatch
    3. If role is NOT `admin` or `super_admin`: redirect to `/dashboard`
    4. Allow request to continue if authorized
  - Optimize: only query database for admin paths (not every request)
  - Handle edge case: user has no UserBatch record (treat as non-admin)

  **Must NOT do**:
  - Do NOT query database for non-admin paths (performance)
  - Do NOT block access to public paths
  - Do NOT change the cookie handling logic
  - Do NOT use synchronous database calls

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single file modification, clear logic
  - **Skills**: none
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Backend logic only

  **Parallelization**:
  - **Can Run In Parallel**: NO (needs auth callback working first)
  - **Parallel Group**: Wave 3 (sequential)
  - **Blocks**: None (final task)
  - **Blocked By**: Tasks 1, 2 (needs migration and auth flow)

  **References**:

  **Pattern References**:
  - `founder-sprint/src/lib/supabase/middleware.ts` - Current middleware (lines 1-49)
  - `founder-sprint/src/lib/permissions.ts:43-45` - isAdmin() helper pattern

  **API/Type References**:
  - `founder-sprint/prisma/schema.prisma:123-139` - UserBatch model
  - `founder-sprint/src/types/index.ts:2` - UserRole type

  **Library References**:
  - `founder-sprint/src/lib/prisma.ts` - Prisma client

  **WHY Each Reference Matters**:
  - Current middleware: Shows existing structure to extend
  - isAdmin helper: Pattern for checking admin roles
  - UserBatch model: How to query user's role

  **Acceptance Criteria**:

  ```bash
  # Start dev server (assumes running):
  # cd founder-sprint && npm run dev

  # Test 1: Unauthenticated user cannot access admin
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}" http://localhost:3000/admin/users
  # Assert: 307 redirect to /login

  # Test 2: Authenticated non-admin user redirected to dashboard
  # (Requires valid session cookie for a founder user)
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}" \
    -H "Cookie: [session-cookie]" \
    http://localhost:3000/admin/users
  # Assert: 307 redirect to /dashboard

  # Test 3: Authenticated admin user can access
  # (Requires valid session cookie for an admin user)
  curl -s -o /dev/null -w "%{http_code}" \
    -H "Cookie: [session-cookie]" \
    http://localhost:3000/admin/users
  # Assert: 200 OK
  ```

  **Playwright Verification Alternative**:
  ```
  # Agent executes via Playwright browser automation:
  1. Login as founder user (non-admin)
  2. Navigate to: http://localhost:3000/admin/users
  3. Assert: URL is /dashboard (redirected)
  4. Screenshot: .sisyphus/evidence/task-4-admin-redirect.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add role-based protection for admin routes`
  - Files: `founder-sprint/src/lib/supabase/middleware.ts`
  - Pre-commit: `npm run build`

---

- [ ] 5. Create Google Calendar Integration Stub

  **What to do**:
  - Create `src/lib/google-calendar.ts`
  - Implement stub functions:
    - `createCalendarEvent(event: CalendarEventInput): Promise<CalendarEventResult>`
    - `generateMeetLink(): Promise<string>`
    - `deleteCalendarEvent(eventId: string): Promise<void>`
  - Each function should:
    1. Check if credentials are configured (env vars)
    2. If not configured: log warning, return mock/null
    3. If configured: implement actual Google Calendar API call
  - Define TypeScript interfaces for inputs/outputs
  - Use googleapis package (already installed)

  **Must NOT do**:
  - Do NOT throw errors when credentials missing (graceful degradation)
  - Do NOT hardcode any credentials
  - Do NOT make this a required dependency for other features

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: New file creation, stub implementation
  - **Skills**: none
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: Backend library

  **Parallelization**:
  - **Can Run In Parallel**: YES (completely independent)
  - **Parallel Group**: Wave 1 (with Task 1)
  - **Blocks**: None
  - **Blocked By**: None (can start immediately)

  **References**:

  **Configuration References**:
  - `founder-sprint/.env.local:8-11` - Google Calendar env vars (commented out)
  - `founder-sprint/prisma/schema.prisma:219` - googleMeetLink field on OfficeHourSlot
  - `founder-sprint/prisma/schema.prisma:332` - googleEventId field on Event

  **External References**:
  - googleapis npm: https://www.npmjs.com/package/googleapis
  - Google Calendar API: https://developers.google.com/calendar/api/v3/reference

  **WHY Each Reference Matters**:
  - .env.local: Shows expected env var names
  - Schema fields: Shows where calendar data will be stored
  - googleapis docs: API usage patterns

  **Acceptance Criteria**:

  ```bash
  # Verify file exists and exports functions:
  cd founder-sprint && node -e "
    const gc = require('./src/lib/google-calendar.ts');
    console.log('createCalendarEvent:', typeof gc.createCalendarEvent);
    console.log('generateMeetLink:', typeof gc.generateMeetLink);
    console.log('deleteCalendarEvent:', typeof gc.deleteCalendarEvent);
  "
  # Note: May need ts-node or build first

  # Better: Verify build succeeds with imports
  # Add temporary import to any existing file, run build

  # Verify warning logged when credentials missing:
  cd founder-sprint && npx tsx -e "
    import { createCalendarEvent } from './src/lib/google-calendar';
    createCalendarEvent({ title: 'Test', startTime: new Date(), endTime: new Date() });
  " 2>&1 | grep -i "warning\|not configured"
  # Assert: Output contains warning about missing credentials
  ```

  **Commit**: YES
  - Message: `feat(calendar): add google calendar integration stub`
  - Files: `founder-sprint/src/lib/google-calendar.ts`
  - Pre-commit: `npm run build`

---

- [ ] 6. Create File Upload API Route

  **What to do**:
  - Create `src/app/api/upload/route.ts`
  - Handle POST requests with multipart/form-data
  - Accept fields: `file` (the file), `bucket` (string: 'question-attachments' or 'post-images')
  - Validate:
    - Bucket must be one of allowed values
    - File size: question-attachments max 10MB, post-images max 5MB
    - File count per request: 1 (single file upload)
  - Upload to Supabase Storage
  - Return JSON: `{ success: true, url: string, fileName: string }` or `{ success: false, error: string, code: string }`
  - Error codes: `INVALID_BUCKET`, `FILE_TOO_LARGE`, `UPLOAD_FAILED`, `NO_FILE`

  **Must NOT do**:
  - Do NOT allow arbitrary bucket names
  - Do NOT skip file size validation
  - Do NOT return raw Supabase errors to client
  - Do NOT allow more than configured max files

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single API route, clear requirements
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES (with Tasks 2, 3, 5)
  - **Parallel Group**: Wave 2 (after Task 1)
  - **Blocks**: None
  - **Blocked By**: Task 1 (migration, though not strictly required)

  **References**:

  **Pattern References**:
  - `founder-sprint/src/lib/supabase/server.ts` - createClient for storage access

  **API/Type References**:
  - `founder-sprint/prisma/schema.prisma:163-176` - QuestionAttachment model (fileUrl, fileName, fileSize, fileType)
  - `founder-sprint/prisma/schema.prisma:400-411` - PostImage model (imageUrl)

  **External References**:
  - Supabase Storage upload: https://supabase.com/docs/reference/javascript/storage-from-upload
  - Next.js Route Handlers: https://nextjs.org/docs/app/building-your-application/routing/route-handlers

  **WHY Each Reference Matters**:
  - createClient: How to get Supabase client with storage access
  - Schema models: Shows expected file metadata fields
  - Supabase docs: Storage API usage

  **Acceptance Criteria**:

  ```bash
  # Test 1: Upload valid file to question-attachments
  curl -X POST http://localhost:3000/api/upload \
    -F "file=@test-file.pdf" \
    -F "bucket=question-attachments"
  # Assert: Response contains { "success": true, "url": "...", "fileName": "..." }

  # Test 2: Reject oversized file
  # Create 15MB test file: dd if=/dev/zero of=large.bin bs=1M count=15
  curl -X POST http://localhost:3000/api/upload \
    -F "file=@large.bin" \
    -F "bucket=question-attachments"
  # Assert: Response contains { "success": false, "error": "...", "code": "FILE_TOO_LARGE" }

  # Test 3: Reject invalid bucket
  curl -X POST http://localhost:3000/api/upload \
    -F "file=@test-file.pdf" \
    -F "bucket=invalid-bucket"
  # Assert: Response contains { "success": false, "code": "INVALID_BUCKET" }

  # Test 4: Reject missing file
  curl -X POST http://localhost:3000/api/upload \
    -F "bucket=post-images"
  # Assert: Response contains { "success": false, "code": "NO_FILE" }
  ```

  **Commit**: YES
  - Message: `feat(api): add file upload route for supabase storage`
  - Files: `founder-sprint/src/app/api/upload/route.ts`
  - Pre-commit: `npm run build`

---

## Commit Strategy

| After Task | Message | Files | Verification |
|------------|---------|-------|--------------|
| 1 | `chore(db): run initial prisma migration` | prisma/migrations/* | `prisma migrate status` |
| 2 | `feat(auth): sync linkedin user to database on oauth callback` | src/app/auth/callback/route.ts | `npm run build` |
| 3 | `feat(auth): add no-batch page for users without active membership` | src/app/(auth)/no-batch/page.tsx | `npm run build` |
| 4 | `feat(auth): add role-based protection for admin routes` | src/lib/supabase/middleware.ts | `npm run build` |
| 5 | `feat(calendar): add google calendar integration stub` | src/lib/google-calendar.ts | `npm run build` |
| 6 | `feat(api): add file upload route for supabase storage` | src/app/api/upload/route.ts | `npm run build` |

---

## Success Criteria

### Verification Commands

```bash
# 1. Database tables exist
cd founder-sprint && npx prisma migrate status
# Expected: Database is up to date

# 2. Build passes
cd founder-sprint && npm run build
# Expected: Exit 0, no errors

# 3. All new routes accessible
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/no-batch
# Expected: 200

curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/upload
# Expected: 405 (GET not allowed) or 400 (missing params)
```

### Final Checklist
- [ ] All "Must Have" present
- [ ] All "Must NOT Have" absent
- [ ] Build passes without errors
- [ ] OAuth flow works end-to-end
- [ ] Admin routes protected
- [ ] File upload validates and uploads

---

## Appendix: Environment Prerequisites

### Required Before Execution

1. **Supabase Storage Buckets** (manual setup):
   - Create `question-attachments` bucket
   - Create `post-images` bucket
   - Configure appropriate RLS policies

2. **Development Server**:
   - `cd founder-sprint && npm run dev` must be running for Playwright tests

3. **Test User Data** (for verification):
   - At least one user with `admin` role in UserBatch (for Task 4 verification)
   - At least one user with `founder` role (for non-admin redirect test)

### Google Calendar (Blocked - Document Only)

When credentials become available, add to `.env.local`:
```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=calendar-id@group.calendar.google.com
```
