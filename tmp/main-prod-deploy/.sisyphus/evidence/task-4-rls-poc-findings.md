# Task 4 - Messaging RLS + Realtime PoC Findings

Date: 2026-03-10
Workspace: `/Users/jsup/Development Files/Founder Sprint Batch/founder-sprint-workspace`

## Scope Checked

- Prisma migrations for existing RLS and policy SQL
- Supabase client setup in `founder-sprint/src/lib/supabase/`
- Prisma messaging model mappings in `founder-sprint/prisma/schema.prisma`
- Live DB status for RLS and `supabase_realtime` publication
- Basic realtime insert subscription behavior on `public.messages`

## 1) RLS Status Before Changes

### Migration history scan

- Searched `founder-sprint/prisma/migrations/**/*.sql` for:
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
  - `CREATE POLICY`
- Result: no existing RLS/policy SQL found for messaging tables.

### Live DB check (`pg_class.relrowsecurity`)

Query result for `public.messages`, `public.conversation_participants`, `public.conversations`:

- `messages`: `rls_enabled = false`
- `conversation_participants`: `rls_enabled = false`
- `conversations`: `rls_enabled = false`

Conclusion: RLS was not enabled on messaging tables.

## 2) Supabase Setup Findings

### Browser client (`founder-sprint/src/lib/supabase/client.ts`)

- Uses `createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)`.
- This is the anon-key client that relies on user auth session/JWT and is the relevant path for realtime subscriptions in UI.

### Server client (`founder-sprint/src/lib/supabase/server.ts`)

- Uses `createServerClient` with same anon key + cookie session bridging.
- Not using service role key.

### Middleware (`founder-sprint/src/lib/supabase/middleware.ts`)

- Refreshes session and enforces auth for non-public routes via `supabase.auth.getUser()`.

### Realtime usage in app code

- No existing `.channel(...)` / `postgres_changes` subscription code found in `founder-sprint/src`.

## 3) Prisma Messaging Table Names

From `founder-sprint/prisma/schema.prisma`:

- `model Conversation` -> `@@map("conversations")`
- `model ConversationParticipant` -> `@@map("conversation_participants")`
- `model Message` -> `@@map("messages")`

Policies/migration SQL target these physical table names.

## 4) Migration Created

Created new Prisma SQL migration file:

- `founder-sprint/prisma/migrations/20260310110000_add_messaging_rls/migration.sql`

Contents added:

- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on:
  - `messages`
  - `conversation_participants`
  - `conversations`
- `CREATE POLICY` statements:
  - `messages_select_for_participants` (SELECT if requester participates in same conversation)
  - `conversation_participants_select_own` (SELECT own participant rows)
  - `conversations_select_for_participants` (SELECT conversations where requester participates)
- Realtime publication additions (idempotent `DO $$ ... IF NOT EXISTS ... $$`):
  - add `messages` to `supabase_realtime`
  - add `conversation_participants` to `supabase_realtime`
  - add `conversations` to `supabase_realtime`

Note: `npx prisma migrate dev --name add_messaging_rls --create-only` was attempted but timed out against the remote DB in this environment; migration SQL file was created manually under `prisma/migrations/` for review/apply.

## 5) Realtime Prerequisite Check and PoC

### Publication status before applying migration

Live DB query (`pg_publication_tables`) for publication `supabase_realtime` returned no rows for:

- `messages`
- `conversation_participants`
- `conversations`

### Basic subscription test

PoC run:

- Subscribed to `postgres_changes` INSERT on `public.messages` using Supabase JS.
- Inserted a test conversation + participant + message row in DB.
- Subscription reached `SUBSCRIBED` status.
- Result: `EVENT_RECEIVED false`.

Interpretation:

- Realtime socket/channel works, but row change events are not emitted for `messages` in current state because table is not in `supabase_realtime` publication.
- After migration is applied (RLS + publication + policies), realtime delivery is expected to work for authenticated participants.

## 6) USER_ACTION_REQUIRED

None required for dashboard toggles if this migration is applied, because publication membership is handled by SQL (`ALTER PUBLICATION supabase_realtime ADD TABLE ...`).

If your Supabase role permissions block publication changes during migration apply, fallback manual action in Supabase SQL editor:

1. Run `ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;`
2. Run `ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_participants;`
3. Run `ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;`
4. Re-run realtime insert PoC and confirm event receipt.

## 7) Expected Behavior After Apply

- Server actions using Prisma continue working (service-role DB access bypasses RLS).
- Browser Supabase client queries/subscriptions are governed by RLS and user JWT.
- Authenticated user can receive message events only for conversations they participate in.
- Non-participants cannot read/select those rows via Supabase client.
