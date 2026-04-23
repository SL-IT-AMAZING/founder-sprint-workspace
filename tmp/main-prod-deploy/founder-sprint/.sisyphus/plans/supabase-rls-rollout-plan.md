# Supabase RLS Rollout Plan (Founder Sprint)

## Goal

Enable RLS for the Supabase Security Advisor flagged tables in `public` without breaking current production behavior, while adding a repeatable verification and rollback process.

Flagged tables:

- `invitation_tokens`
- `user_batches`
- `batches`
- `questions`
- `question_attachments`
- `answers`
- `summaries`
- `office_hour_slots`
- `office_hour_requests`

## Current-State Findings

1. Schema/migrations currently create these tables without RLS/policies:
   - `prisma/migrations/0_init/migration.sql`
2. Runtime app data access is Prisma direct Postgres (not Supabase Data API queries):
   - `src/lib/prisma.ts`
   - `src/actions/question.ts`
   - `src/actions/office-hour.ts`
   - `src/actions/user-management.ts`
   - `src/app/(auth)/auth/callback/route.ts`
3. Supabase client usage in runtime is auth/storage focused (not DB `.from()` queries):
   - `src/actions/auth.ts`
   - `src/lib/supabase/middleware.ts`
   - `src/app/api/upload/route.ts`
4. Migration conventions in repo:
   - Prisma migrations path in `prisma.config.ts`
   - First-time setup uses `npx prisma db push` (`README.md`)
   - Manual SQL migration precedent exists under `prisma/migrations/manual/`

## Risk Model

### High Risk

1. Enabling RLS before policy coverage can block Data API access for `anon`/`authenticated` roles.
2. Hidden non-runtime scripts/tests that assume unrestricted table access can fail.
3. If runtime DB role changes later from owner/superuser semantics to restricted role, Prisma paths can start failing under RLS.
4. Policies that rely on JWT context (`auth.uid()` patterns) can block Prisma writes/reads when Prisma is subject to RLS.

### Medium Risk

1. Overly permissive “allow all” policies satisfy advisor but preserve weak row isolation.
2. Missing indexes on policy predicate columns can regress query performance.
3. Missing `WITH CHECK` for insert/update policies can cause confusing partial breakages.

### Low Risk

1. Existing Prisma runtime under typical owner/superuser connection should continue working immediately after RLS enable (without `FORCE RLS`).

## Critical Decision: Prisma Role Behavior

RLS impact on Prisma is role-dependent:

1. If Prisma connects as table owner/superuser or a role with `BYPASSRLS`, Prisma may bypass RLS.
2. If Prisma connects as non-owner/non-bypass role, Prisma becomes subject to RLS and policy gaps can break runtime.

Do not proceed past Phase 0 without recording this decision from real SQL outputs.

## Rollout Strategy (Phased)

### Phase 0 - Preflight and Baseline

1. Snapshot current behavior.
   - Run critical app smoke tests (Q&A, office hour request/approve, invite accept, batch switch).
2. Record current role context in target environment.
   - Determine active DB role used by app (`DATABASE_URL`) and whether it is owner/superuser/BYPASSRLS.
3. Confirm no hidden Supabase Data API consumers for these tables.
   - Re-scan for `.from()`, `.rpc()`, `/rest/v1` table usage.
4. Pre-check operational scripts/tests that touch flagged tables:
   - `e2e/global-setup.ts`
   - `scripts/add-super-admin.ts`
   - `scripts/check-user.ts`
   - `check-roles.mjs`
   - `fix-userbatch-role.mjs`

Exit criteria:

- Baseline smoke test passes.
- Role assumptions documented.

### Phase 0.1 - Mandatory SQL Gating Checks

Run these first in staging (and record outputs):

```sql
-- RLS status of flagged tables
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'invitation_tokens','user_batches','batches','questions','question_attachments',
    'answers','summaries','office_hour_slots','office_hour_requests'
  )
order by tablename;

-- Existing policies on flagged tables
select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in (
    'invitation_tokens','user_batches','batches','questions','question_attachments',
    'answers','summaries','office_hour_slots','office_hour_requests'
  )
order by tablename, policyname;

-- Confirm app execution role and whether it can bypass RLS
select current_user;
select rolname, rolsuper, rolbypassrls
from pg_roles
where rolname = current_user;
```

If `rolsuper=true` or `rolbypassrls=true`, Prisma runtime is less likely to break immediately, but policy rollout is still required for Data API security.

Additional gate (owner match check):

```sql
select tablename, tableowner,
       case when tableowner = current_user then 'owner_match' else 'owner_diff' end as owner_relation
from pg_tables
where schemaname='public'
  and tablename in (
    'invitation_tokens','user_batches','batches','questions','question_attachments',
    'answers','summaries','office_hour_slots','office_hour_requests'
  )
order by tablename;
```

### Phase 1 - Author Policies First (No RLS Yet)

Create a manual SQL migration file (new):

- `prisma/migrations/manual/enable_rls_public_core_tables.sql`

Policy approach for initial safe rollout:

1. Add explicit policies for `authenticated` (and `anon` only where intentionally public).
2. Use table-by-table minimal viable rules first, then tighten.
3. Add policy predicate indexes where needed.

Template policy skeletons (initial, explicit):

```sql
-- Example: deny anon by default, allow authenticated where required
create policy table_select_authenticated
on public.<table_name>
for select
to authenticated
using (true);

create policy table_insert_authenticated
on public.<table_name>
for insert
to authenticated
with check (true);

create policy table_update_authenticated
on public.<table_name>
for update
to authenticated
using (true)
with check (true);

create policy table_delete_authenticated
on public.<table_name>
for delete
to authenticated
using (true);
```

Replace `true` with real ownership/batch predicates during tightening.

Policy quality gates before enabling RLS:

1. Every table with writes has explicit `WITH CHECK` on insert/update.
2. Every table with reads has explicit select policy for intended roles.
3. Every policy has explicit role target (`to authenticated` etc.), avoid implicit global scope.

Important sequencing:

1. `CREATE POLICY ...`
2. Validate policy syntax/role mapping
3. `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`

Operational safeguard:

1. Enable on one table only.
2. Smoke-test impacted flow immediately.
3. Stop rollout on first permission regression.

### Phase 2 - Enable RLS Table-by-Table in Low-to-High Blast Order

Recommended order:

1. `invitation_tokens` (admin/internal flow)
2. `summaries`
3. `answers`
4. `question_attachments`
5. `questions`
6. `office_hour_requests`
7. `office_hour_slots`
8. `user_batches`
9. `batches`

After each table:

1. Run targeted smoke path.
2. Check errors/logs for denied access.
3. Continue only on green.

Per-table rollback command:

```sql
alter table public.<table_name> disable row level security;
```

Do not use `FORCE ROW LEVEL SECURITY` in initial rollout.
Add `FORCE RLS` only in a separate hardening phase after proving runtime compatibility.

### Phase 3 - Verification Matrix

For each table, verify both “expected allow” and “expected deny” paths.

Core flows to test:

1. Invitation flow
   - `src/app/api/invite/accept/route.ts`
   - `src/app/invite/[token]/page.tsx`
   - `src/app/(auth)/auth/callback/route.ts`
2. Q&A flow
   - `src/actions/question.ts`
   - `src/app/(dashboard)/questions/[id]/page.tsx`
3. Office hour flow
   - `src/actions/office-hour.ts`
   - `src/actions/schedule.ts`
4. Batch/user membership flow
   - `src/actions/user-management.ts`
   - `src/actions/batch-switcher.ts`
   - `src/lib/permissions.ts`

Test layers:

1. App manual smoke in dev/staging.
2. Existing E2E set:
   - `npm test`
3. Direct SQL policy checks with role switching where feasible.

Recommended SQL validation after each table:

```sql
-- Table RLS is on
select tablename, rowsecurity
from pg_tables
where schemaname='public' and tablename='<table_name>';

-- Policies exist
select policyname, cmd, roles
from pg_policies
where schemaname='public' and tablename='<table_name>';
```

Mandatory per-table gating checks:

1. Prisma read check for normal path (no unexpected empty result).
2. Prisma write check for normal path (no row-security write failure).
3. Role-intent check (`authenticated`/`anon`) against expected allow/deny behavior.
4. Error/log review for new permission-denied spikes.

### Phase 4 - Tightening Pass

After initial no-break rollout:

1. Replace broad transitional policies with stricter row-level conditions.
2. Re-run full smoke and E2E.
3. Keep Security Advisor clean and document rationale for each policy.

## Rollback Plan

If breakage appears mid-rollout:

1. Halt rollout immediately.
2. For affected table(s):
   - Option A: temporary permissive policy hotfix.
   - Option B: `ALTER TABLE ... DISABLE ROW LEVEL SECURITY` for the single affected table.
3. Re-run broken smoke path.
4. Root-cause and re-apply with corrected policy.

Emergency hotfix pattern:

```sql
-- Temporary permissive policy (short-lived emergency only)
create policy temp_allow_authenticated_all
on public.<table_name>
for all
to authenticated
using (true)
with check (true);
```

Remove this policy in the tightening phase.

Production rollback trigger conditions:

1. New permission-denied errors on critical user flows.
2. Unexpected empty data on previously non-empty screens.
3. E2E or manual smoke fail on Q&A/invite/office-hour core paths.

Do not continue to next table until the current table is green.

## Deliverables

1. `prisma/migrations/manual/enable_rls_public_core_tables.sql`
2. `dev_plan` verification note with:
   - policy intent per table
   - role assumptions
   - test evidence links/logs
3. Optional follow-up migration for tightened policies.

## Execution Checklist

- [ ] Preflight baseline recorded
- [ ] Role assumptions verified in target env
- [ ] Policy SQL drafted for all 9 tables
- [ ] RLS enabled in blast-order sequence
- [ ] Smoke tests pass after each table
- [ ] `npm test` passes
- [ ] Security Advisor warnings resolved
- [ ] Tightening pass complete
- [ ] Final docs updated
