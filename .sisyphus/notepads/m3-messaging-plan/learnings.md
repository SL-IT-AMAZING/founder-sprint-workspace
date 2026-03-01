## M3.2 messaging.ts learnings (2026-02-25)

- What worked well: Reusing the `follow.ts` auth + `requireActiveBatch` guard pattern kept behavior consistent with existing actions and avoided permission drift.
- What worked well: A shared unread-count raw SQL helper made both conversation list unread badges and total unread count efficient in a single-pass query approach.
- What did not work as expected: Returning `batchCheck` directly caused generic `ActionResult<T>` type mismatch in functions that return payload data.
- Fix applied: Explicitly narrowed `batchCheck` to failure shape and returned `{ success: false, error }` to satisfy `ActionResult<{ ... }>` signatures.
- Gotcha: `senderId` is nullable in schema (`onDelete: SetNull`), so unread predicates must allow `sender_id IS NULL` while excluding current-user messages.
- What I would do differently: Centralize auth/batch guard into a typed helper (e.g. `requireAuthenticatedUserWithActiveBatch`) to reduce repeated narrowing boilerplate across actions.

## M3.3 messages type-alignment learnings (2026-02-25)

- What worked well: Deriving DM display metadata from `participants` + `currentUserId` removed reliance on non-existent UI-only fields and matched server action contracts cleanly.
- What worked well: Treating `getMessages` response as `{ messages, nextCursor }` everywhere fixed all state-shape mismatches with minimal code changes.
- What did not work as expected: UI components assumed legacy flat fields (`senderId`, `senderName`, `otherParticipantName`) that no longer exist after action type refactor.
- Fix applied: Updated message and conversation rendering to use nested `sender` and `participants` data with null-safe access for system messages.
- Gotcha: `user.name` is nullable, so passing it through page props requires `string | null` in client prop types to keep `page.tsx` type-safe.
