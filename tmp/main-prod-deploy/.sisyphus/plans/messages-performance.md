# Messages Page Performance Optimization

## TL;DR

> **Quick Summary**: Fix the messages page ~1.99s load delay, slow group creation, and 140kB JS chunk by optimizing server queries, replacing polling with Supabase Realtime subscriptions, and improving client-side rendering performance.
> 
> **Deliverables**:
> - Server query optimization (eliminate duplicate calls, reduce over-fetching, inline unread counts)
> - Supabase Realtime subscriptions replacing 3 polling mechanisms (conversations 5s, messages 3s, global unread 10s)
> - Client-side performance (message virtualization, component memoization, modal code-splitting, framer-motion removal)
> - Group creation flow optimization (optimistic UI, eliminate sequential re-fetches)
> 
> **Estimated Effort**: Large
> **Parallel Execution**: YES — 4 waves
> **Critical Path**: Task 1 → Task 4 → Task 7 → Task 10 → Task 13 → F1-F4

---

## Context

### Original Request
User reported ~1.99s delay loading chat messages on the messages page. Network tab showed `messaging.ts:624` taking 1.99s for a 0.3kB response. Also reported slow group creation and awareness of a 140kB JS chunk.

### Interview Summary
**Key Discussions**:
- Realtime strategy: User chose Supabase Realtime over optimized polling
- User scale: Under 100 users currently — pagination is good practice but not top priority
- Test strategy: No automated tests — agent-executed QA scenarios only
- 1.99s confirmed as server-side rendering time (SSR bottleneck in page.tsx)

**Research Findings**:
- `page.tsx` runs `Promise.all([getUserConversations(), getAllUsersForMessaging()])` during SSR — this is the 1.99s
- `getUserConversations()` over-fetches all participants for every conversation + runs separate raw SQL unread count query (2 DB round-trips)
- `getAllUsersForMessaging()` fetches ALL users without pagination — called twice (page.tsx SSR + MessagesClient useEffect line 44-52)
- 3 polling mechanisms: conversations (5s), messages (3s), global `useUnreadCount` (10s on every page)
- No message virtualization, no code-splitting, no component memoization
- framer-motion (~40KB) imported for one context menu animation in ConversationList.tsx
- Group creation flow takes 1.3-2.6s due to sequential operations

### Metis Review
**Identified Gaps** (addressed):
- RLS is a hard prerequisite for Supabase Realtime — added PoC task to verify/set up RLS before subscription code
- 3rd polling mechanism (`useUnreadCount` hook at 10s on every page) was missed — now included
- date-fns v4 tree-shakes natively — removed unnecessary tree-shaking task
- B-tree indexes on `groupName`/`message.content` are useless for ILIKE queries — dropped
- `getAllUsersForMessaging` is called twice not three times — fix simplified to one-line deletion
- Reconnection gap handling mandatory — added to realtime task
- Keep polling as fallback until realtime verified — structured as separate commits

---

## Work Objectives

### Core Objective
Reduce messages page load time from ~1.99s to <500ms and eliminate polling overhead by switching to Supabase Realtime, while reducing the JS bundle and improving rendering performance.

### Concrete Deliverables
- Optimized `getUserConversations()` with inline unread counts and participant limits
- Removed duplicate `getAllUsersForMessaging()` call
- Supabase Realtime subscriptions for messages and conversations (with RLS policies)
- Reconnection gap handler for background tab recovery
- `useUnreadCount` global hook converted to realtime
- Virtualized message list (react-virtuoso or similar)
- Memoized MessageBubble, ConversationList, BrowseGroupsModal
- Lazy-loaded CreateGroupModal and BrowseGroupsModal
- framer-motion context menu replaced with CSS transitions
- Optimistic UI for group creation and message sending

### Definition of Done
- [ ] Messages page loads in <500ms (measured in network tab)
- [ ] No polling intervals running (verified via React DevTools / console)
- [ ] New messages appear within 1s via Supabase Realtime (verified via Playwright two-tab test)
- [ ] Group creation completes in <1s perceived time (optimistic UI)
- [ ] JS chunk for messages page reduced by ≥30KB (verified via `npm run build` output)
- [ ] `npm run build` passes with zero errors
- [ ] ESLint passes on all modified files

### Must Have
- All existing messaging functionality preserved (send, receive, read, search, groups, DMs)
- Realtime works for both DM and group conversations
- Reconnection after tab background/network interruption
- Conversation unread counts still accurate
- Group creation still works for all participant counts

### Must NOT Have (Guardrails)
- DO NOT add new npm dependencies except `react-virtuoso` (if needed for virtualization)
- DO NOT change Prisma schema models (only add indexes via migration)
- DO NOT modify database data or run destructive migrations
- DO NOT add pagination for user lists (under 100 users, defer)
- DO NOT refactor message search (ILIKE performance is a separate concern)
- DO NOT add typing indicators, read receipts, or other new features
- DO NOT remove polling in the same commit as adding realtime — separate commits
- DO NOT over-engineer reconnection (simple: track last timestamp, fetch delta on reconnect)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed. No exceptions.

### Test Decision
- **Infrastructure exists**: YES (Playwright)
- **Automated tests**: NO (user decision — agent-executed QA only)
- **Framework**: Playwright for E2E verification

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Frontend/UI**: Use Playwright (playwright skill) — Navigate, interact, assert DOM, screenshot
- **API/Backend**: Use Bash (curl/node) — Time queries, verify response shapes
- **Build**: Use Bash — `npm run build`, ESLint, bundle size check

---

## Execution Strategy

### Parallel Execution Waves

```
Wave 1 (Start Immediately — server query optimization + RLS PoC):
├── Task 1: Optimize getUserConversations — inline unread counts, limit participants [deep]
├── Task 2: Remove duplicate getAllUsersForMessaging call [quick]
├── Task 3: Optimize getPublicGroups — limit participants to 5 [quick]
├── Task 4: PoC Supabase Realtime + verify/create RLS policies [deep]

Wave 2 (After Wave 1 — realtime + client foundation):
├── Task 5: Create useRealtimeMessages hook (subscribe to messages table) [deep]
├── Task 6: Create useRealtimeConversations hook (subscribe to conversations + participants) [deep]
├── Task 7: Convert global useUnreadCount to realtime [unspecified-high]
├── Task 8: Add reconnection gap handler [unspecified-high]

Wave 3 (After Wave 2 — integrate realtime + client perf):
├── Task 9: Integrate realtime hooks into MessagesClient, remove polling [deep]
├── Task 10: Add message list virtualization [unspecified-high]
├── Task 11: Memoize MessageBubble + ConversationList + BrowseGroupsModal [quick]
├── Task 12: Lazy-load modals + replace framer-motion with CSS [unspecified-high]

Wave 4 (After Wave 3 — group creation + final optimization):
├── Task 13: Optimize group creation flow — optimistic UI [unspecified-high]
├── Task 14: Add optimistic message sending [quick]
├── Task 15: Remove polling fallback (separate commit after realtime verified) [quick]

Wave FINAL (After ALL tasks — independent review, 4 parallel):
├── Task F1: Plan compliance audit (oracle)
├── Task F2: Code quality review (unspecified-high)
├── Task F3: Real manual QA (unspecified-high)
├── Task F4: Scope fidelity check (deep)

Critical Path: Task 1 → Task 4 → Task 5/6 → Task 9 → Task 15 → F1-F4
Parallel Speedup: ~65% faster than sequential
Max Concurrent: 4 (Waves 1, 2, 3)
```

### Dependency Matrix

| Task | Depends On | Blocks | Wave |
|------|-----------|--------|------|
| 1 | — | 9 | 1 |
| 2 | — | 9 | 1 |
| 3 | — | — | 1 |
| 4 | — | 5, 6, 7, 8 | 1 |
| 5 | 4 | 9 | 2 |
| 6 | 4 | 9 | 2 |
| 7 | 4 | 15 | 2 |
| 8 | 4 | 9 | 2 |
| 9 | 1, 2, 5, 6, 8 | 15 | 3 |
| 10 | — | — | 3 |
| 11 | — | — | 3 |
| 12 | — | — | 3 |
| 13 | 9 | — | 4 |
| 14 | 9 | — | 4 |
| 15 | 7, 9 | F1-F4 | 4 |

### Agent Dispatch Summary

- **Wave 1**: 4 tasks — T1 → `deep`, T2 → `quick`, T3 → `quick`, T4 → `deep`
- **Wave 2**: 4 tasks — T5 → `deep`, T6 → `deep`, T7 → `unspecified-high`, T8 → `unspecified-high`
- **Wave 3**: 4 tasks — T9 → `deep`, T10 → `unspecified-high`, T11 → `quick`, T12 → `unspecified-high`
- **Wave 4**: 3 tasks — T13 → `unspecified-high`, T14 → `quick`, T15 → `quick`
- **FINAL**: 4 tasks — F1 → `oracle`, F2 → `unspecified-high`, F3 → `unspecified-high`, F4 → `deep`

---

## TODOs

### Wave 1 — Server Query Optimization + RLS PoC

- [ ] 1. Optimize getUserConversations — inline unread counts, limit participants

  **What to do**:
  - In `founder-sprint/src/actions/messaging.ts`, refactor `getUserConversations()` (line 309-350) to:
    - Merge the separate `getUnreadCountsByConversation()` raw SQL query (lines 73-107) INTO the main Prisma query using `_count` on messages or a single combined raw SQL query. Goal: 1 DB round-trip instead of 2.
    - Add `take: 5` to the `participants` include — only fetch first 5 participants per conversation (the UI only shows a few avatars). Add a `_count: { select: { participants: true } }` to get the total count.
  - Update `mapConversationListItems()` (line 109+) to handle the new shape (inline unread count, participant count, limited participant array).
  - Update the `ConversationListItem` type to include `participantCount: number` alongside the limited `participants` array.
  - Verify `searchConversations()` (line 786-877) also calls `getUnreadCountsByConversation()` separately — apply the same inline pattern there.

  **Must NOT do**:
  - DO NOT change the Prisma schema
  - DO NOT add pagination to conversations list
  - DO NOT refactor the search query ILIKE patterns

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Complex query refactoring with multiple interdependent changes across server actions and type definitions
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2, 3, 4)
  - **Blocks**: Task 9 (realtime integration needs optimized queries)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `founder-sprint/src/actions/messaging.ts:309-350` — Current `getUserConversations()` with nested Prisma query
  - `founder-sprint/src/actions/messaging.ts:73-107` — `getUnreadCountsByConversation()` raw SQL to be inlined
  - `founder-sprint/src/actions/messaging.ts:109-140` — `mapConversationListItems()` mapping function to update
  - `founder-sprint/src/actions/messaging.ts:786-877` — `searchConversations()` with separate unread count call

  **API/Type References**:
  - `founder-sprint/src/actions/messaging.ts:50-71` — `ParticipantConversation` and `ConversationListItem` types to extend

  **WHY Each Reference Matters**:
  - Lines 73-107: This is the separate raw SQL unread query that adds a second DB round-trip. Must be eliminated by inlining into the main query.
  - Lines 309-350: The main Prisma query that over-fetches all participants. Must add `take: 5` and `_count`.
  - Lines 786-877: Has the same duplicate unread count pattern — must fix in parallel.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Conversations load with correct unread counts in single query
    Tool: Bash (node/bun REPL or curl against dev server)
    Preconditions: Dev server running, admin user authenticated
    Steps:
      1. Call getUserConversations() and time the execution
      2. Verify response includes unreadCount field on each conversation
      3. Verify participants array has at most 5 entries per conversation
      4. Verify participantCount field shows total count
    Expected Result: Single query execution < 200ms, unread counts accurate, participants limited to 5
    Evidence: .sisyphus/evidence/task-1-conversations-query-optimized.txt

  Scenario: Search conversations also returns inline unread counts
    Tool: Bash
    Preconditions: Dev server running, conversations with unread messages exist
    Steps:
      1. Call searchConversations("test") and verify unreadCount in response
      2. Verify no separate getUnreadCountsByConversation call in server logs
    Expected Result: Search returns conversations with correct unread counts, single DB round-trip
    Evidence: .sisyphus/evidence/task-1-search-unread-inline.txt
  ```

  **Commit**: YES
  - Message: `perf(messages): optimize getUserConversations — inline unread counts, limit participants`
  - Files: `src/actions/messaging.ts`
  - Pre-commit: `npm run build`

- [ ] 2. Remove duplicate getAllUsersForMessaging call

  **What to do**:
  - In `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx`, remove the `useEffect` at lines 44-52 that calls `getAllUsersForMessaging()` on mount. This is a duplicate — `page.tsx` already fetches and passes `allUsers` as a prop.
  - The `allUsers` prop is already received and used. The useEffect redundantly re-fetches and overwrites state with the same data.
  - Simply delete the useEffect block. Keep the `allUsers` state initialized from props.

  **Must NOT do**:
  - DO NOT add caching or deduplication layers — just remove the duplicate call
  - DO NOT change the page.tsx server-side fetch

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Single-line deletion, trivial change
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 3, 4)
  - **Blocks**: Task 9
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx:44-52` — The useEffect to DELETE (calls getAllUsersForMessaging on mount)
  - `founder-sprint/src/app/(dashboard)/messages/page.tsx:10-12` — Server-side fetch that already provides allUsers via props

  **WHY Each Reference Matters**:
  - Lines 44-52: This useEffect is the exact code to remove. It duplicates the server-side fetch done in page.tsx.
  - page.tsx lines 10-12: Confirms allUsers is already fetched server-side and passed as prop, making the client-side refetch unnecessary.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Messages page loads without duplicate user fetch
    Tool: Playwright (playwright skill)
    Preconditions: App running, authenticated as any user
    Steps:
      1. Navigate to /messages
      2. Open browser DevTools Network tab (or intercept via Playwright)
      3. Verify only ONE call to getAllUsersForMessaging (the SSR one), not two
      4. Verify allUsers data is available in the conversation list (user names render correctly)
    Expected Result: Single getAllUsersForMessaging call during SSR, conversation list shows user names
    Evidence: .sisyphus/evidence/task-2-no-duplicate-users-fetch.png

  Scenario: Create group modal still shows all users
    Tool: Playwright
    Preconditions: Authenticated as admin
    Steps:
      1. Navigate to /messages
      2. Click "New Group" or equivalent button
      3. Verify user list populates in the modal
    Expected Result: User list renders correctly in group creation modal without separate fetch
    Evidence: .sisyphus/evidence/task-2-group-modal-users.png
  ```

  **Commit**: YES
  - Message: `perf(messages): remove duplicate getAllUsersForMessaging call`
  - Files: `src/app/(dashboard)/messages/MessagesClient.tsx`
  - Pre-commit: `npm run build`

- [ ] 3. Optimize getPublicGroups — limit participants to 5

  **What to do**:
  - In `founder-sprint/src/actions/messaging.ts`, modify `getPublicGroups()` (line 645-729) to add `take: 5` on the `participants` select.
  - Currently fetches ALL participants per group but the UI only uses `.slice(0, 5)` for avatars (line 710).
  - Add `_count: { select: { participants: true } }` to get total member count without fetching all records.
  - Update the return mapping to use the count from `_count` instead of `participants.length`.

  **Must NOT do**:
  - DO NOT change the BrowseGroupsModal UI
  - DO NOT refactor the sort logic

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Small query modification, limited scope
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 4)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `founder-sprint/src/actions/messaging.ts:645-729` — `getPublicGroups()` function with over-fetching participants
  - `founder-sprint/src/app/(dashboard)/messages/BrowseGroupsModal.tsx:230` — UI only uses first 5 avatars via `.slice(0, 5)`

  **WHY Each Reference Matters**:
  - Lines 645-729: The query to modify — add `take: 5` on participants and `_count` for total
  - BrowseGroupsModal line 230: Confirms the UI only needs 5 participant records, validating the optimization

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Public groups display correctly with limited participants
    Tool: Playwright
    Preconditions: App running, public groups exist with >5 members
    Steps:
      1. Navigate to /messages
      2. Click "Browse Groups" button
      3. Verify groups render with avatar stack (up to 5 avatars)
      4. Verify member count displays correctly (shows total, not just 5)
    Expected Result: Groups show correct member count and up to 5 avatar images
    Evidence: .sisyphus/evidence/task-3-public-groups-limited-participants.png

  Scenario: Group with 1 member displays correctly
    Tool: Playwright
    Preconditions: At least one group with only 1 member exists
    Steps:
      1. Open Browse Groups modal
      2. Find the 1-member group
      3. Verify it shows 1 avatar and "1 member" count
    Expected Result: Single-member groups render without errors
    Evidence: .sisyphus/evidence/task-3-single-member-group.png
  ```

  **Commit**: YES
  - Message: `perf(messages): limit participant fetching in getPublicGroups`
  - Files: `src/actions/messaging.ts`
  - Pre-commit: `npm run build`

- [ ] 4. PoC Supabase Realtime + verify/create RLS policies

  **What to do**:
  - **Step 1: Check existing RLS policies**. Supabase Realtime requires Row Level Security (RLS) to be enabled on the tables you subscribe to. Check if `messages` and `conversation_participants` tables have RLS enabled and appropriate policies. If not, create them.
  - **Step 2: Create RLS policies** (if missing). Using Prisma migration or raw SQL:
    - `messages` table: Users can SELECT messages where they are a participant in the conversation (`EXISTS (SELECT 1 FROM conversation_participants WHERE conversation_id = messages.conversation_id AND user_id = auth.uid())`)
    - `conversation_participants` table: Users can SELECT rows where `user_id = auth.uid()` OR they share a conversation with the target user
    - `conversations` table: Users can SELECT conversations they participate in
  - **Step 3: PoC Realtime subscription**. Create a minimal test file or use the browser console to verify:
    - Connect to Supabase Realtime channel for `messages` table with filter on conversation_id
    - Insert a message via Prisma (server action)
    - Verify the realtime event fires on the client
  - **Step 4: Document findings** — whether RLS was needed, what policies were created, any Supabase project-level settings required (e.g., enabling Realtime for specific tables in Supabase dashboard)

  **Must NOT do**:
  - DO NOT modify existing Prisma models (only add RLS via SQL migration)
  - DO NOT build the full realtime hook — just verify the mechanism works
  - DO NOT change any application code — this is a PoC only

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Requires understanding Supabase Realtime architecture, RLS policy design, and verification across server/client boundary
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1, 2, 3)
  - **Blocks**: Tasks 5, 6, 7, 8 (all realtime work depends on verified RLS + realtime)
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `founder-sprint/prisma/schema.prisma:678-732` — Conversation, ConversationParticipant, Message models (table names and column names for RLS policies)
  - `founder-sprint/src/lib/supabase/` — Existing Supabase client setup (server and browser clients)

  **External References**:
  - Supabase Realtime docs: https://supabase.com/docs/guides/realtime/postgres-changes
  - Supabase RLS docs: https://supabase.com/docs/guides/auth/row-level-security

  **WHY Each Reference Matters**:
  - Schema lines 678-732: Need exact table names (they may be pluralized differently in Prisma vs Postgres) and column names for RLS WHERE clauses
  - Supabase client setup: Need to know how auth.uid() maps to the app's user system, and whether the existing client supports Realtime channels

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Verify RLS policies allow message reads for participants
    Tool: Bash (Supabase SQL editor or psql)
    Preconditions: RLS policies created and enabled
    Steps:
      1. Query messages table as an authenticated user who IS a conversation participant
      2. Query messages table as an authenticated user who IS NOT a conversation participant
    Expected Result: Participant sees messages, non-participant sees empty result (not error)
    Evidence: .sisyphus/evidence/task-4-rls-policy-verification.txt

  Scenario: Verify Supabase Realtime fires on new message insert
    Tool: Bash (node script or browser console)
    Preconditions: RLS enabled, Supabase Realtime enabled for messages table
    Steps:
      1. Subscribe to realtime channel for messages table filtered by a specific conversation_id
      2. Insert a message into that conversation via Prisma (sendMessage server action)
      3. Observe realtime event received by the subscription
    Expected Result: Realtime INSERT event received within 500ms of message creation
    Failure Indicators: No event received after 5s, or error in subscription
    Evidence: .sisyphus/evidence/task-4-realtime-poc-verified.txt

  Scenario: Supabase Realtime does NOT fire for non-participant conversations
    Tool: Bash
    Preconditions: RLS enabled
    Steps:
      1. Subscribe as User A to ALL messages (no conversation_id filter)
      2. Insert a message in a conversation User A is NOT part of
      3. Verify NO realtime event is received
    Expected Result: No event — RLS prevents realtime delivery to non-participants
    Evidence: .sisyphus/evidence/task-4-rls-blocks-non-participant.txt
  ```

  **Commit**: YES
  - Message: `feat(messages): add RLS policies for messaging tables`
  - Files: Prisma migration SQL file
  - Pre-commit: `npm run build`

### Wave 2 — Supabase Realtime Hooks

- [ ] 5. Create useRealtimeMessages hook

  **What to do**:
  - Create `founder-sprint/src/hooks/useRealtimeMessages.ts` — a React hook that subscribes to Supabase Realtime for the `messages` table filtered by `conversation_id`.
  - On `INSERT` event: append new message to local state (prepend to array since messages are ordered desc)
  - On `UPDATE` event: update the matching message in local state (for edits, if supported)
  - On `DELETE` event: remove the matching message from local state
  - Accept params: `conversationId: string | null`, `initialMessages: Message[]`
  - Return: `{ messages, isConnected, lastEventTimestamp }`
  - Use the existing Supabase browser client from `founder-sprint/src/lib/supabase/`
  - Track `lastEventTimestamp` for reconnection gap handling (Task 8 will use this)
  - Clean up subscription on unmount or when conversationId changes

  **Must NOT do**:
  - DO NOT integrate into MessagesClient yet (Task 9 does that)
  - DO NOT handle reconnection gaps (Task 8 does that)
  - DO NOT remove existing polling code

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Supabase Realtime API integration with proper subscription lifecycle management
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 6, 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 4 (RLS must be verified first)

  **References**:

  **Pattern References**:
  - `founder-sprint/src/hooks/usePollingMessages.ts` — Existing polling hook pattern (shows current hook API shape, to be replaced)
  - `founder-sprint/src/lib/supabase/` — Existing Supabase client setup for browser-side usage

  **External References**:
  - Supabase Realtime postgres changes: https://supabase.com/docs/guides/realtime/postgres-changes

  **WHY Each Reference Matters**:
  - usePollingMessages.ts: Shows the current hook interface that consumers expect. The new hook should provide a compatible API shape.
  - Supabase client: Must use the existing browser client (not create a new one) to ensure auth session is shared.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: New message appears via realtime without polling
    Tool: Bash (node test or Playwright two-tab test)
    Preconditions: RLS enabled, hook mounted with a conversation_id
    Steps:
      1. Mount the hook with a specific conversationId
      2. Send a message to that conversation via server action (from another session/tab)
      3. Verify the hook's messages array updates within 1 second
    Expected Result: Message appears in hook state without any manual refresh or polling
    Evidence: .sisyphus/evidence/task-5-realtime-message-received.txt

  Scenario: Subscription cleans up on conversationId change
    Tool: Bash (React test or manual verification)
    Preconditions: Hook mounted
    Steps:
      1. Mount with conversationId "A", verify subscription active
      2. Change conversationId to "B"
      3. Verify old subscription for "A" is unsubscribed
      4. Verify new subscription for "B" is active
    Expected Result: No memory leaks, only one active subscription at a time
    Evidence: .sisyphus/evidence/task-5-subscription-cleanup.txt
  ```

  **Commit**: YES (groups with Task 6)
  - Message: `feat(messages): add Supabase Realtime hooks for messages and conversations`
  - Files: `src/hooks/useRealtimeMessages.ts`
  - Pre-commit: `npm run build`

- [ ] 6. Create useRealtimeConversations hook

  **What to do**:
  - Create `founder-sprint/src/hooks/useRealtimeConversations.ts` — a React hook that subscribes to Supabase Realtime for:
    - `conversations` table changes (UPDATE on lastMessage, lastMessageAt)
    - `conversation_participants` table changes (INSERT for new conversations the user joins)
  - On conversation UPDATE: update the matching conversation in local state (new last message, timestamp)
  - On new participant INSERT (where userId = current user): trigger a full conversation fetch for that conversation and add it to the list
  - Accept params: `userId: string`, `initialConversations: ConversationListItem[]`
  - Return: `{ conversations, isConnected }`
  - Sort conversations by lastMessageAt after any update
  - Use existing Supabase browser client

  **Must NOT do**:
  - DO NOT integrate into MessagesClient yet (Task 9)
  - DO NOT handle unread counts here (Task 7 handles global unread)
  - DO NOT remove existing polling

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Multi-table Supabase Realtime subscription with coordinated state updates
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 7, 8)
  - **Blocks**: Task 9
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `founder-sprint/src/actions/messaging.ts:309-350` — `getUserConversations()` query shape (determines what fields the hook needs to update)
  - `founder-sprint/src/actions/messaging.ts:50-71` — `ConversationListItem` type definition

  **WHY Each Reference Matters**:
  - Lines 309-350: The hook must produce data compatible with what `getUserConversations()` returns. The realtime event only carries the changed row — the hook must merge it intelligently.
  - Type definition: Must match the existing type shape so the rest of the UI doesn't need changes.

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Conversation list updates when new message arrives in any conversation
    Tool: Bash (Playwright or node test)
    Preconditions: User has multiple conversations, hook mounted
    Steps:
      1. Send a message in one of the user's conversations (from another session)
      2. Verify the conversation moves to the top of the list (sorted by lastMessageAt)
      3. Verify lastMessage preview updates
    Expected Result: Conversation order and preview update within 1s without refresh
    Evidence: .sisyphus/evidence/task-6-conversation-reorder.txt

  Scenario: New conversation appears when user is added as participant
    Tool: Bash
    Preconditions: Hook mounted for User A
    Steps:
      1. Create a new group conversation including User A (from admin/another user)
      2. Verify the new conversation appears in User A's hook state
    Expected Result: New conversation appears within 2s
    Evidence: .sisyphus/evidence/task-6-new-conversation-appears.txt
  ```

  **Commit**: YES (groups with Task 5)
  - Message: `feat(messages): add Supabase Realtime hooks for messages and conversations`
  - Files: `src/hooks/useRealtimeConversations.ts`
  - Pre-commit: `npm run build`

- [ ] 7. Convert global useUnreadCount to realtime

  **What to do**:
  - Find `founder-sprint/src/hooks/useUnreadCount.ts` (or wherever the global unread count hook lives — Metis identified it as polling every 10 seconds on EVERY page).
  - Refactor it to use Supabase Realtime subscription on the `messages` table instead of polling.
  - Subscribe to INSERT events on messages where the sender is not the current user.
  - On new message event: increment the unread count.
  - On conversation read (markConversationRead): decrement appropriately.
  - Keep the initial count fetch (one-time server action call on mount), but remove the polling interval.
  - If the hook doesn't exist as a separate file, search for it in the layout or sidebar components.

  **Must NOT do**:
  - DO NOT change the UI that displays the unread badge
  - DO NOT modify the badge styling or position

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires finding the existing hook, understanding its consumers, and converting to realtime
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 8)
  - **Blocks**: Task 15 (polling removal)
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `founder-sprint/src/hooks/useUnreadCount.ts` — The existing polling hook (if it exists at this path)
  - `founder-sprint/src/actions/messaging.ts:624-643` — `getUnreadCount()` server action (the function being polled)

  **WHY Each Reference Matters**:
  - The hook file: Must find and modify the actual polling implementation
  - getUnreadCount action line 624: This raw SQL query runs every 10s globally — understanding what it returns helps design the realtime replacement

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Unread badge updates in realtime when new message arrives
    Tool: Playwright
    Preconditions: User on dashboard (not messages page), unread count visible in nav
    Steps:
      1. Note current unread count in nav badge
      2. Send a message to this user's conversation (from another session)
      3. Verify unread badge increments within 2 seconds
    Expected Result: Badge count increases without page refresh
    Evidence: .sisyphus/evidence/task-7-unread-badge-realtime.png

  Scenario: No polling requests for unread count
    Tool: Playwright (network interception)
    Preconditions: User on any page for 30 seconds
    Steps:
      1. Navigate to dashboard
      2. Wait 30 seconds
      3. Check network requests — verify NO repeated getUnreadCount calls
    Expected Result: Zero polling requests for unread count (only initial fetch + realtime)
    Evidence: .sisyphus/evidence/task-7-no-unread-polling.txt
  ```

  **Commit**: YES
  - Message: `feat(messages): convert global useUnreadCount to realtime`
  - Files: `src/hooks/useUnreadCount.ts` (or equivalent)
  - Pre-commit: `npm run build`

- [ ] 8. Add reconnection gap handler

  **What to do**:
  - Create a utility function or enhance the realtime hooks (Tasks 5, 6) with reconnection gap handling.
  - When the Supabase WebSocket disconnects (network issue, tab background, laptop sleep):
    1. Track `lastEventTimestamp` (the timestamp of the last realtime event received)
    2. On reconnect: fetch all messages/conversations since `lastEventTimestamp` using existing server actions (e.g., `getMessages()` with cursor, `getUserConversations()`)
    3. Merge the fetched data into local state
  - Use `visibilitychange` event to detect tab background/foreground transitions
  - Use the Supabase channel's `onError` and `onClose` callbacks to detect disconnection
  - This can be a wrapper hook like `useRealtimeWithRecovery(channel, onReconnect)` or integrated directly into the existing hooks

  **Must NOT do**:
  - DO NOT over-engineer — simple timestamp tracking + delta fetch is sufficient
  - DO NOT add offline message queue or retry logic for sending
  - DO NOT persist reconnection state to localStorage

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires understanding WebSocket lifecycle, visibility API, and coordinating with realtime hooks
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 5, 6, 7)
  - **Blocks**: Task 9
  - **Blocked By**: Task 4

  **References**:

  **Pattern References**:
  - `founder-sprint/src/hooks/useRealtimeMessages.ts` — (created in Task 5) the hook to enhance with recovery
  - `founder-sprint/src/actions/messaging.ts:417-486` — `getMessages()` with cursor support (use for delta fetch)

  **External References**:
  - Supabase Realtime channel events: https://supabase.com/docs/guides/realtime/concepts#channel-events

  **WHY Each Reference Matters**:
  - useRealtimeMessages: The hook that needs recovery behavior added
  - getMessages with cursor: Use `createdAt > lastEventTimestamp` to fetch messages missed during disconnection

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Messages caught up after tab goes to background and returns
    Tool: Playwright
    Preconditions: User viewing a conversation, realtime active
    Steps:
      1. Switch tab to background (trigger visibilitychange hidden)
      2. Send 3 messages to the conversation from another session
      3. Switch tab back to foreground (trigger visibilitychange visible)
      4. Verify all 3 messages appear within 2 seconds of returning
    Expected Result: Missed messages fetched and displayed on tab return
    Failure Indicators: Messages missing after return, or stale message list
    Evidence: .sisyphus/evidence/task-8-reconnection-recovery.txt

  Scenario: Connection status indicator updates correctly
    Tool: Playwright
    Preconditions: Realtime connected
    Steps:
      1. Verify isConnected = true when realtime is active
      2. Simulate disconnection (if possible) or just verify the hook exports isConnected
    Expected Result: isConnected reflects actual WebSocket state
    Evidence: .sisyphus/evidence/task-8-connection-status.txt
  ```

  **Commit**: YES
  - Message: `feat(messages): add realtime reconnection gap handler`
  - Files: `src/hooks/useRealtimeMessages.ts` (or new utility)
  - Pre-commit: `npm run build`

### Wave 3 — Integrate Realtime + Client Performance

- [ ] 9. Integrate realtime hooks into MessagesClient, keep polling as fallback

  **What to do**:
  - In `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx`:
    - Import and use `useRealtimeMessages` (Task 5) for the active conversation's messages
    - Import and use `useRealtimeConversations` (Task 6) for the conversation list
    - Keep the existing polling intervals but INCREASE them significantly as fallback:
      - Conversations: 5s → 60s (fallback only, realtime is primary)
      - Messages: 3s → 60s (fallback only)
    - When realtime `isConnected` is true, rely on realtime data. When disconnected, polling fallback kicks in.
    - Remove the separate `getMessages()` call on conversation select — instead, do an initial fetch + let realtime handle subsequent updates.
    - Remove the `getConversation()` call — the realtime conversations hook should provide conversation data.
  - Also update the `handleSendMessage` function to NOT call `getMessages()` after sending (line 135) — rely on realtime to deliver the sent message back.
  - Clean up any useEffect patterns that are now redundant.

  **Must NOT do**:
  - DO NOT fully remove polling yet (Task 15 does that after verification)
  - DO NOT change the UI layout or component structure
  - DO NOT modify server actions

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: Core integration task — wiring realtime hooks into existing complex state management while maintaining backward compatibility
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (depends on Wave 2 completing)
  - **Parallel Group**: Wave 3 (with Tasks 10, 11, 12 — those are independent)
  - **Blocks**: Tasks 13, 14, 15
  - **Blocked By**: Tasks 1, 2, 5, 6, 8

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx:55-63` — Conversation polling interval (change from 5s to 60s)
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx:83-93` — Message polling interval (change from 3s to 60s)
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx:100-130` — `handleSelectConversation` (simplify with realtime)
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx:135` — `getMessages()` call after send (remove, rely on realtime)
  - `founder-sprint/src/hooks/useRealtimeMessages.ts` — (from Task 5) hook to import
  - `founder-sprint/src/hooks/useRealtimeConversations.ts` — (from Task 6) hook to import

  **WHY Each Reference Matters**:
  - Lines 55-93: These are the polling intervals to increase as fallback
  - Lines 100-135: These are the manual fetch patterns that realtime replaces
  - Hooks: The new data sources that replace polling as primary

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Messages appear instantly via realtime (no 3s polling delay)
    Tool: Playwright (two-tab or two-user test)
    Preconditions: Two users in same conversation, both viewing it
    Steps:
      1. User A types and sends a message
      2. Measure time until message appears on User B's screen
    Expected Result: Message appears within 1 second (not waiting for 3s poll)
    Evidence: .sisyphus/evidence/task-9-realtime-message-delivery.png

  Scenario: Conversation list updates instantly when message received
    Tool: Playwright
    Preconditions: User viewing messages page with multiple conversations
    Steps:
      1. Send a message to a conversation that is NOT currently selected
      2. Verify the conversation moves to top of list with updated preview
    Expected Result: Conversation reorders within 1s
    Evidence: .sisyphus/evidence/task-9-conversation-list-realtime.png

  Scenario: Polling fallback still works (when realtime is unavailable)
    Tool: Playwright
    Preconditions: Realtime disabled or simulated disconnection
    Steps:
      1. Verify polling intervals exist (60s) as fallback
      2. Send a message during simulated realtime outage
      3. Wait up to 60s and verify message eventually appears via polling
    Expected Result: Messages still arrive via polling fallback (slower but functional)
    Evidence: .sisyphus/evidence/task-9-polling-fallback.txt
  ```

  **Commit**: YES
  - Message: `feat(messages): integrate realtime into MessagesClient, keep polling as fallback`
  - Files: `src/app/(dashboard)/messages/MessagesClient.tsx`
  - Pre-commit: `npm run build`

- [ ] 10. Add message list virtualization

  **What to do**:
  - In `founder-sprint/src/app/(dashboard)/messages/ConversationThread.tsx`, replace the flat `{messagesWithMetadata.map(...)}` rendering (lines 187-209) with a virtualized list.
  - Options (in preference order):
    1. `react-virtuoso` — best for chat UIs, supports reverse scrolling, prepend items, scroll-to-bottom
    2. CSS `content-visibility: auto` — zero-dependency approach, less control but might be sufficient
  - If using react-virtuoso:
    - Install: `npm install react-virtuoso`
    - Use `<Virtuoso>` component with `firstItemIndex` and `initialTopMostItemIndex` for reverse-scroll chat behavior
    - Each message row = `<MessageBubble>` + optional date separator
    - Maintain scroll position when new messages arrive (append at bottom)
  - If using CSS content-visibility (simpler, no dependency):
    - Wrap each message in a container with `content-visibility: auto; contain-intrinsic-size: auto 80px;`
    - Browser automatically virtualizes off-screen content
  - Preserve existing behavior: date separators between messages, auto-scroll to bottom on new message, scroll-to-bottom button

  **Must NOT do**:
  - DO NOT change message bubble styling or layout
  - DO NOT add infinite scroll / load-more (pagination is separate concern)
  - DO NOT add more than 1 new dependency

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires understanding chat UI patterns and choosing between virtualization approaches
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 11, 12 — independent of realtime work)
  - **Blocks**: None
  - **Blocked By**: None (can start any time, independent of realtime)

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/ConversationThread.tsx:187-209` — Current flat `.map()` rendering to replace
  - `founder-sprint/src/app/(dashboard)/messages/MessageBubble.tsx` — Individual message component (item renderer)

  **WHY Each Reference Matters**:
  - Lines 187-209: The exact code to replace with virtualized rendering. Need to understand the `messagesWithMetadata` shape (includes `showDateSeparator`, `showAvatar`, etc.)
  - MessageBubble: The item renderer — must be compatible with virtualization (no assumptions about being in a specific DOM context)

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Long conversation renders efficiently
    Tool: Playwright
    Preconditions: Conversation with 50+ messages
    Steps:
      1. Navigate to /messages, select the long conversation
      2. Count DOM nodes in the message list container
      3. Verify DOM node count is significantly less than total message count
      4. Scroll through the entire conversation
      5. Verify all messages are accessible via scrolling
    Expected Result: DOM contains fewer nodes than total messages, scrolling is smooth
    Evidence: .sisyphus/evidence/task-10-virtualization-dom-count.png

  Scenario: New messages still auto-scroll to bottom
    Tool: Playwright
    Preconditions: User at bottom of conversation
    Steps:
      1. Verify scroll position is at bottom
      2. Receive a new message (via realtime or polling)
      3. Verify auto-scroll to show new message
    Expected Result: New message visible without manual scrolling
    Evidence: .sisyphus/evidence/task-10-autoscroll-new-message.png
  ```

  **Commit**: YES
  - Message: `perf(messages): add message list virtualization`
  - Files: `src/app/(dashboard)/messages/ConversationThread.tsx`, `package.json` (if adding react-virtuoso)
  - Pre-commit: `npm run build`

- [ ] 11. Memoize MessageBubble, ConversationList, BrowseGroupsModal

  **What to do**:
  - Wrap `MessageBubble` component with `React.memo()` in `founder-sprint/src/app/(dashboard)/messages/MessageBubble.tsx`
    - MessageBubble receives props: message data, currentUserId, isGroup — all serializable. `React.memo` default comparison works.
  - Wrap the conversation item rendering in `ConversationList.tsx` with `React.memo()`:
    - Extract the per-conversation rendering (around lines 280-350) into a separate `ConversationItem` component wrapped in `React.memo`
    - Move the `getDirectMessageParticipant()` call inside the memoized component
  - Wrap `BrowseGroupsModal` with `React.memo()` in `founder-sprint/src/app/(dashboard)/messages/BrowseGroupsModal.tsx`
  - Add `useMemo` for the `filteredConversations` computation in ConversationList.tsx (lines 103-109) — currently runs on every render:
    ```tsx
    const filteredConversations = useMemo(() =>
      searchQuery ? conversations.filter(...) : conversations,
      [searchQuery, conversations]
    );
    ```

  **Must NOT do**:
  - DO NOT change any component's visual output
  - DO NOT add useCallback for event handlers unless profiling shows it's needed
  - DO NOT refactor component APIs

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Straightforward React.memo wrapping and useMemo addition — well-defined, small changes
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 12 — independent)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/MessageBubble.tsx` — Component to wrap in React.memo
  - `founder-sprint/src/app/(dashboard)/messages/ConversationList.tsx:103-109` — Unoptimized filter to wrap in useMemo
  - `founder-sprint/src/app/(dashboard)/messages/ConversationList.tsx:280-350` — Per-conversation rendering to extract into memoized component
  - `founder-sprint/src/app/(dashboard)/messages/BrowseGroupsModal.tsx` — Component to wrap in React.memo

  **WHY Each Reference Matters**:
  - MessageBubble: Called in a loop for every message — memoization prevents re-rendering unchanged messages on parent update
  - ConversationList lines 103-109: This filter runs on every render even when searchQuery hasn't changed
  - ConversationList lines 280-350: Per-item rendering re-runs for ALL items when any conversation updates

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Memoized components still render correctly
    Tool: Playwright
    Preconditions: App running, conversations and messages exist
    Steps:
      1. Navigate to /messages
      2. Select a conversation, verify messages render correctly
      3. Send a new message, verify it appears
      4. Search conversations, verify filter works
      5. Open Browse Groups, verify groups display
    Expected Result: All functionality preserved, no visual regressions
    Evidence: .sisyphus/evidence/task-11-memoization-no-regression.png

  Scenario: Build succeeds with memoized components
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Run `npm run lint`
    Expected Result: Zero errors
    Evidence: .sisyphus/evidence/task-11-build-passes.txt
  ```

  **Commit**: YES
  - Message: `perf(messages): memoize MessageBubble, ConversationList, BrowseGroupsModal`
  - Files: `MessageBubble.tsx`, `ConversationList.tsx`, `BrowseGroupsModal.tsx`
  - Pre-commit: `npm run build`

- [ ] 12. Lazy-load modals + replace framer-motion with CSS transitions

  **What to do**:
  - **Lazy-load modals**: In MessagesClient.tsx, replace static imports of `CreateGroupModal` and `BrowseGroupsModal` with `next/dynamic`:
    ```tsx
    const CreateGroupModal = dynamic(() => import('./CreateGroupModal'), { ssr: false });
    const BrowseGroupsModal = dynamic(() => import('./BrowseGroupsModal'), { ssr: false });
    ```
    This moves ~20KB out of the initial chunk (only loaded when user opens a modal).
  - **Replace framer-motion context menu** in ConversationList.tsx:
    - The context menu (lines 357-412) uses `AnimatePresence` + `motion.div` just for a fade/slide animation
    - Replace with CSS transitions: `opacity: 0 → 1`, `transform: scale(0.95) → scale(1)`, `transition: all 150ms ease-out`
    - Remove the `framer-motion` import from ConversationList.tsx
    - Also remove `useReducedMotion` import if it was only used for this
    - Check if framer-motion is used elsewhere in the messages directory — if not, this removes ~40KB from the chunk
  - **Verify**: After removal, check that framer-motion is still in package.json (it may be used elsewhere in the app). Only remove the import from messages files.

  **Must NOT do**:
  - DO NOT remove framer-motion from package.json (other pages may use it)
  - DO NOT change modal functionality or appearance (only loading strategy)
  - DO NOT add loading spinners for lazy modals (they load fast enough)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Requires careful framer-motion replacement that preserves animation behavior, plus dynamic import setup
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Tasks 9, 10, 11 — independent)
  - **Blocks**: None
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx` — Static imports of CreateGroupModal, BrowseGroupsModal to convert to dynamic
  - `founder-sprint/src/app/(dashboard)/messages/ConversationList.tsx:4` — `import { AnimatePresence, motion, useReducedMotion } from "framer-motion"` to remove
  - `founder-sprint/src/app/(dashboard)/messages/ConversationList.tsx:357-412` — Context menu with framer-motion animation to replace with CSS

  **WHY Each Reference Matters**:
  - MessagesClient imports: These are the static imports to convert to `dynamic()`
  - ConversationList line 4: The framer-motion import adding ~40KB to the chunk
  - Lines 357-412: The actual animation code to replace with CSS — must understand what animations are used to replicate in CSS

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Context menu animation works with CSS (no framer-motion)
    Tool: Playwright
    Preconditions: App running, conversations exist
    Steps:
      1. Navigate to /messages
      2. Right-click (or long-press) on a conversation to open context menu
      3. Verify menu appears with fade/slide animation
      4. Click outside to dismiss, verify menu animates out
    Expected Result: Smooth animation comparable to original framer-motion version
    Evidence: .sisyphus/evidence/task-12-css-context-menu.png

  Scenario: Modals load correctly when opened
    Tool: Playwright
    Preconditions: App running
    Steps:
      1. Navigate to /messages
      2. Click "New Group" button → verify CreateGroupModal appears and functions
      3. Click "Browse Groups" button → verify BrowseGroupsModal appears and functions
    Expected Result: Both modals load and render correctly despite being lazy-loaded
    Evidence: .sisyphus/evidence/task-12-lazy-modals-work.png

  Scenario: Bundle size reduced
    Tool: Bash
    Steps:
      1. Run `npm run build`
      2. Check build output for messages page chunk size
      3. Verify framer-motion is NOT in the messages chunk (may still be in other chunks)
    Expected Result: Messages chunk reduced by ≥30KB compared to baseline
    Evidence: .sisyphus/evidence/task-12-bundle-size-reduction.txt
  ```

  **Commit**: YES
  - Message: `perf(messages): lazy-load modals, replace framer-motion with CSS transitions`
  - Files: `MessagesClient.tsx`, `ConversationList.tsx`
  - Pre-commit: `npm run build`

### Wave 4 — Group Creation + Final Cleanup

- [ ] 13. Optimize group creation flow — optimistic UI

  **What to do**:
  - In `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx`, refactor the group creation handler (around lines 180-195):
    - **Before** (current): create group → wait → re-fetch all conversations → wait → select conversation → wait → fetch messages
    - **After** (optimistic): create group → immediately add placeholder conversation to state → select it → show empty thread → when server responds, update with real data
  - Steps:
    1. When `createGroupConversation` is called, immediately construct a placeholder `ConversationListItem` with: groupName, groupEmoji, participants, temporary ID, `lastMessage: null`
    2. Add it to the conversations list state at the top
    3. Auto-select it (show empty thread with a subtle loading indicator)
    4. When server responds with the real conversation ID, replace the placeholder with the real data
    5. If server fails, remove the placeholder and show an error toast
  - This eliminates the perceived 1.3-2.6s wait — user sees the group instantly.

  **Must NOT do**:
  - DO NOT change the server action `createGroupConversation` 
  - DO NOT add retry logic for failed creation
  - DO NOT change the CreateGroupModal UI

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: Optimistic UI requires careful state management with placeholder → real data replacement
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 14, 15)
  - **Blocks**: None
  - **Blocked By**: Task 9 (realtime must be integrated first)

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx:180-195` — Current group creation handler (sequential fetches)
  - `founder-sprint/src/app/(dashboard)/messages/CreateGroupModal.tsx:318-335` — `onCreateGroup` callback
  - `founder-sprint/src/actions/messaging.ts:262-307` — `createGroupConversation()` server action (return shape)

  **WHY Each Reference Matters**:
  - Lines 180-195: The code to refactor — currently waits for server then re-fetches everything
  - CreateGroupModal: The callback interface — must not change the API
  - Server action: Return shape `{ success: true, data: { id: string } }` — needed to replace placeholder with real ID

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Group appears instantly after creation (optimistic)
    Tool: Playwright
    Preconditions: App running, user has existing conversations
    Steps:
      1. Navigate to /messages
      2. Click "New Group", fill in name, select 2+ members
      3. Click "Create"
      4. Measure time until new group appears in conversation list
    Expected Result: Group appears in <200ms (before server responds)
    Evidence: .sisyphus/evidence/task-13-optimistic-group-creation.png

  Scenario: Failed group creation shows error and removes placeholder
    Tool: Playwright (with network throttling or intercepted failure)
    Preconditions: Simulate server action failure
    Steps:
      1. Attempt to create a group with invalid data (or intercept and force error)
      2. Verify placeholder is removed from conversation list
      3. Verify error message displayed to user
    Expected Result: Graceful error handling, no phantom groups in list
    Evidence: .sisyphus/evidence/task-13-optimistic-failure-handling.png
  ```

  **Commit**: YES
  - Message: `perf(messages): optimistic UI for group creation`
  - Files: `src/app/(dashboard)/messages/MessagesClient.tsx`
  - Pre-commit: `npm run build`

- [ ] 14. Add optimistic message sending

  **What to do**:
  - In `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx`, refactor `handleSendMessage` (around line 130-140):
    - **Before**: call sendMessage() → wait → call getMessages() → update state
    - **After**: immediately append message to local state with `status: "sending"` → call sendMessage() → on success, update status to "sent" → on failure, show "failed" indicator
  - Construct a placeholder message with: `id: crypto.randomUUID()`, `content`, `senderId: currentUserId`, `senderName: currentUserName`, `createdAt: new Date()`, `status: "sending"`
  - The realtime hook (Task 5) will eventually deliver the real message from the server — detect duplicates by content+senderId+timestamp proximity and merge.
  - Add a subtle visual indicator for "sending" state (slightly lower opacity) and "failed" state (red text or retry button).

  **Must NOT do**:
  - DO NOT change the sendMessage server action
  - DO NOT add message edit or delete functionality
  - DO NOT persist failed messages to localStorage

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Well-defined optimistic pattern, limited scope
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 13, 15)
  - **Blocks**: None
  - **Blocked By**: Task 9

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx:130-140` — Current handleSendMessage (calls getMessages after send)
  - `founder-sprint/src/app/(dashboard)/messages/MessageBubble.tsx` — Must handle optional `status` prop for visual indicator

  **WHY Each Reference Matters**:
  - Lines 130-140: The exact function to make optimistic
  - MessageBubble: Needs minor update to show sending/failed status visually

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Sent message appears instantly in thread
    Tool: Playwright
    Preconditions: User viewing a conversation
    Steps:
      1. Type a message and press Send
      2. Verify message appears in thread within 100ms (before server responds)
      3. Verify message transitions from "sending" to "sent" state
    Expected Result: Instant message appearance with status transition
    Evidence: .sisyphus/evidence/task-14-optimistic-send.png

  Scenario: Failed message shows error state
    Tool: Playwright (with network failure simulation)
    Preconditions: Simulate sendMessage server action failure
    Steps:
      1. Send a message while simulating server error
      2. Verify message shows "failed" visual state
    Expected Result: Clear visual indication of failed send
    Evidence: .sisyphus/evidence/task-14-send-failure.png
  ```

  **Commit**: YES
  - Message: `perf(messages): optimistic message sending`
  - Files: `MessagesClient.tsx`, `MessageBubble.tsx`
  - Pre-commit: `npm run build`

- [ ] 15. Remove polling fallback (separate commit after realtime verified)

  **What to do**:
  - This task is the FINAL cleanup — only execute after Tasks 5-9 are verified working.
  - In `MessagesClient.tsx`: remove the 60s fallback polling intervals for conversations and messages (set up in Task 9).
  - In `useUnreadCount.ts` (or equivalent): remove the polling fallback for global unread count (set up in Task 7).
  - Remove `usePollingMessages.ts` hook file if it's no longer imported anywhere.
  - Search for any remaining `setInterval` or `setTimeout` patterns related to messaging polling.
  - Verify NO polling requests in network tab after removal.

  **Must NOT do**:
  - DO NOT execute this task until realtime is fully verified via Task 9 QA
  - DO NOT remove any server actions (they're still used for initial data fetch and reconnection recovery)

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: Simple removal of polling code, well-defined scope
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (must be last before final verification)
  - **Parallel Group**: Wave 4 (sequential after Tasks 13, 14)
  - **Blocks**: F1-F4
  - **Blocked By**: Tasks 7, 9

  **References**:

  **Pattern References**:
  - `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx` — Polling intervals to remove (set to 60s in Task 9)
  - `founder-sprint/src/hooks/usePollingMessages.ts` — File to delete if unused
  - `founder-sprint/src/hooks/useUnreadCount.ts` — Polling fallback to remove

  **WHY Each Reference Matters**:
  - MessagesClient: Contains the fallback polling intervals added in Task 9
  - usePollingMessages.ts: The original polling hook — should be deletable after realtime replacement
  - useUnreadCount: Has polling fallback from Task 7 to remove

  **Acceptance Criteria**:

  **QA Scenarios (MANDATORY):**

  ```
  Scenario: Zero polling requests in network tab
    Tool: Playwright (network interception)
    Preconditions: App running, user on messages page for 2 minutes
    Steps:
      1. Navigate to /messages
      2. Wait 2 minutes
      3. Check network requests — filter for messaging-related server actions
      4. Verify NO periodic/repeated requests (only initial load + realtime events)
    Expected Result: Zero polling requests. Only initial SSR fetch and realtime WebSocket connection visible.
    Evidence: .sisyphus/evidence/task-15-no-polling.txt

  Scenario: Messages still work after polling removal
    Tool: Playwright
    Preconditions: Polling completely removed
    Steps:
      1. Navigate to /messages
      2. Select a conversation, verify messages load
      3. Send a message, verify it appears
      4. Receive a message (from another session), verify it appears via realtime
    Expected Result: Full messaging functionality preserved without any polling
    Evidence: .sisyphus/evidence/task-15-messaging-works-no-polling.png
  ```

  **Commit**: YES
  - Message: `perf(messages): remove polling fallback after realtime verified`
  - Files: `MessagesClient.tsx`, `useUnreadCount.ts`, delete `usePollingMessages.ts`
  - Pre-commit: `npm run build`

---

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Rejection → fix → re-run.

- [ ] F1. **Plan Compliance Audit** — `oracle`
  Read the plan end-to-end. For each "Must Have": verify implementation exists (read file, curl endpoint, run command). For each "Must NOT Have": search codebase for forbidden patterns — reject with file:line if found. Check evidence files exist in .sisyphus/evidence/. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | Tasks [N/N] | VERDICT: APPROVE/REJECT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `npm run build` + `npm run lint`. Review all changed files for: `as any`/`@ts-ignore`, empty catches, console.log in prod, commented-out code, unused imports. Check for polling intervals still running (search for `setInterval`, `setTimeout` with recurring patterns). Verify no framer-motion imports remain in messages directory.
  Output: `Build [PASS/FAIL] | Lint [PASS/FAIL] | Polling Removed [YES/NO] | Files [N clean/N issues] | VERDICT`

- [ ] F3. **Real Manual QA** — `unspecified-high` (+ `playwright` skill)
  Start from clean state. Test: send a DM and verify it appears instantly (no polling delay). Create a group, verify it appears in conversation list. Open a conversation with 50+ messages, verify virtualized rendering (DOM node count < total messages). Open network tab equivalent, verify no polling requests. Test tab background → foreground → verify messages caught up. Test message search still works.
  Output: `Scenarios [N/N pass] | Integration [N/N] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Scope Fidelity Check** — `deep`
  For each task: read "What to do", read actual diff (git log/diff). Verify 1:1 — everything in spec was built (no missing), nothing beyond spec was built (no creep). Check "Must NOT do" compliance. Detect cross-task contamination. Flag unaccounted changes.
  Output: `Tasks [N/N compliant] | Contamination [CLEAN/N issues] | Unaccounted [CLEAN/N files] | VERDICT`

---

## Commit Strategy

| Order | Message | Files | Pre-commit |
|-------|---------|-------|------------|
| 1 | `perf(messages): optimize server queries — inline unread counts, limit participants` | messaging.ts | `npm run build` |
| 2 | `perf(messages): remove duplicate getAllUsersForMessaging call` | MessagesClient.tsx | `npm run build` |
| 3 | `perf(messages): limit participant fetching in getPublicGroups` | messaging.ts | `npm run build` |
| 4 | `feat(messages): add RLS policies for messaging tables` | prisma migration / SQL | `npm run build` |
| 5 | `feat(messages): add Supabase Realtime hooks for messages and conversations` | useRealtimeMessages.ts, useRealtimeConversations.ts | `npm run build` |
| 6 | `feat(messages): convert global useUnreadCount to realtime` | useUnreadCount.ts | `npm run build` |
| 7 | `feat(messages): add realtime reconnection gap handler` | useRealtimeMessages.ts | `npm run build` |
| 8 | `feat(messages): integrate realtime into MessagesClient, keep polling as fallback` | MessagesClient.tsx | `npm run build` |
| 9 | `perf(messages): add message list virtualization` | ConversationThread.tsx | `npm run build` |
| 10 | `perf(messages): memoize MessageBubble, ConversationList, BrowseGroupsModal` | MessageBubble.tsx, ConversationList.tsx, BrowseGroupsModal.tsx | `npm run build` |
| 11 | `perf(messages): lazy-load modals, replace framer-motion with CSS transitions` | MessagesClient.tsx, ConversationList.tsx | `npm run build` |
| 12 | `perf(messages): optimistic UI for group creation and message sending` | MessagesClient.tsx, CreateGroupModal.tsx | `npm run build` |
| 13 | `perf(messages): remove polling fallback after realtime verified` | MessagesClient.tsx, useUnreadCount.ts | `npm run build` |

---

## Success Criteria

### Verification Commands
```bash
npm run build          # Expected: Build succeeds, no errors
npm run lint           # Expected: 0 errors on modified files
# Network tab: /messages page load < 500ms
# No setInterval/setTimeout polling in messages components
# Message delivery via realtime < 1s
# Group creation perceived time < 1s
```

### Final Checklist
- [ ] All "Must Have" present (send, receive, read, search, groups, DMs, unread counts)
- [ ] All "Must NOT Have" absent (no new deps except react-virtuoso, no schema changes, no feature creep)
- [ ] Build passes
- [ ] Page load < 500ms
- [ ] Zero polling intervals in messages code
- [ ] Realtime message delivery working
- [ ] Bundle size reduced ≥30KB
