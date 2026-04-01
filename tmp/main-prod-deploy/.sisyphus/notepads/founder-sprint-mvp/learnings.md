## Learnings

- What worked well: Wrapping Prisma reads with unstable_cache and adding revalidateTag alongside existing revalidatePath updates was straightforward once cache keys were standardized.
- What didn't work as expected: Next.js revalidateTag in this project requires a second argument (profile); calls with one argument failed TypeScript.
- What would I do differently: Check Next cache type signatures up front to avoid bulk edits when the API shape differs.
- Gotchas: TypeScript LSP server is not installed, so lsp_diagnostics cannot run; rely on tsc for verification.
- What worked well: Applying a uniform pre-cache auth guard (`getCurrentUser` + `isAdmin` + batchId match) across read actions prevented cross-batch leakage without touching Prisma queries or cache options.
- What didn't work as expected: `getPosts` had an existing nested auth call for group membership, so adding the new guard required a small restructure to avoid duplicate user fetch logic.
- What would I do differently: Start by grepping for all `unstable_cache` read functions that accept `batchId` to baseline coverage before patching.
- Gotchas: For read actions wrapped in try/catch, guard checks must live inside the `try` block to preserve existing error handling and still return `[]` on unauthorized access.
- What worked well: A small in-memory `Map` limiter with `windowMs` and `max` fit Edge middleware usage without external dependencies and was easy to scope by route prefix.
- What didn't work as expected: None in implementation, but Edge timer availability is environment-sensitive, so cleanup needs a `typeof setInterval` guard.
- What would I do differently: If this needs to scale beyond a single instance, move counters to shared storage (Upstash/Redis) and preserve the same `check()` API.
- Gotchas: Keep route checks limited to `/api/upload` and `/api/invite` in middleware to avoid accidentally throttling page navigations and server actions.
- What worked well: Keeping new M2 directory/profile actions aligned to existing `ActionResult` and auth guard patterns made multi-file additions predictable and fast to verify.
- What didn't work as expected: Dynamic `OR` array construction in Prisma `findMany` widened types and caused `CompanyWhereInput` and `_count` inference issues until conditions were built as a typed array.
- What would I do differently: Start related-company queries with a typed `Prisma.CompanyWhereInput[]` builder from the beginning to avoid late-stage TypeScript fixes.
- Gotchas: TypeScript LSP diagnostics still cannot run in this environment because `typescript-language-server` is not installed; use `npx tsc --noEmit` as the compile gate.
