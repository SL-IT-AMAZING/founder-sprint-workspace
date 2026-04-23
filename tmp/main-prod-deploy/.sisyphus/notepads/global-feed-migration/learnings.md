## 2026-03-03

- Refactoring `src/actions/feed.ts` to global-cache tags is isolated and safe when limited to feed actions.
- Replacing mutator cache invalidation with `posts-global` works cleanly; `getPosts` and `getPostsForBatches` can remain batch-scoped without conflict.
- Removing `requireActiveBatch` from `createPost` requires an explicit `user.batchId` guard to preserve the non-null `batchId` write on post creation.
- `npx tsc --noEmit` now fails in `src/app/(dashboard)/feed/page.tsx` because consumers still call old signatures (`getPaginatedPosts(batchId, page)` and `getArchivedPosts(batchId)`).
- Next coordinated step is updating feed page consumers to new zero/one-arg action signatures.
