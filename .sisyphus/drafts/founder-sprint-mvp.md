# Draft: Founder Sprint MVP - Complete Implementation

## Requirements (confirmed)
- OAuth callback: Upsert User to Prisma after Supabase auth
- Middleware: Role-based route protection for /admin/*
- File upload: API route for Supabase Storage
- Google Calendar: Integration code (blocked on credentials)
- Prisma migration: Must run first

## Technical Decisions
- Prisma client: Already configured at `src/lib/prisma.ts` with pg adapter
- Supabase server client: Already at `src/lib/supabase/server.ts`
- Permissions library: Already exists at `src/lib/permissions.ts` with `isAdmin()`, `isStaff()`
- LinkedIn OAuth provider: `linkedin_oidc` (from auth.ts)

## Research Findings

### Codebase Structure (Confirmed)
- **Project root**: `./founder-sprint/`
- **Prisma schema**: 21 models including User, UserBatch, Batch
- **User model fields**: email (unique), name, linkedinId (unique, optional), profileImage (optional)
- **UserBatch model**: userId, batchId, role (enum), status (invited|active)
- **Role enum**: super_admin, admin, mentor, founder, co_founder
- **Existing server actions**: 11 files in `src/actions/`
- **Admin pages**: `/admin/users`, `/admin/batches`
- **No "no-batch" page exists** - needs to be created or handled differently

### Auth Flow (Current)
1. Login page calls `signInWithLinkedIn()` → Supabase OAuth → LinkedIn
2. LinkedIn redirects to `/auth/callback` with code
3. Callback exchanges code for session
4. Redirect to dashboard (NO user upsert, NO batch check)

### Middleware (Current)
- Checks Supabase auth
- Redirects unauthenticated users to /login
- NO role-based protection for /admin/* routes

### Storage Buckets (from request)
- `question-attachments`: max 5 files, 10MB each
- `post-images`: max 5 files, 5MB each

## Open Questions
1. What should happen for users who authenticate but have NO active batch?
   - Option A: Create a "no-batch" page that shows a friendly message
   - Option B: Redirect to login with error message
   - Option C: Show message in dashboard itself
2. Should file upload validation be strict (reject oversized) or return detailed error?
3. For admin route protection: redirect to /dashboard or show 403?

## Scope Boundaries
- INCLUDE: Auth callback, middleware, file upload API, Google Calendar stub
- EXCLUDE: UI changes to existing pages, new major pages
