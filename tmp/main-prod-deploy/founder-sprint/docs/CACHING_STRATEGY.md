# Caching Strategy

## Overview

This project uses Next.js `unstable_cache` for server-side data caching across all read functions. Each cached query uses a stale-while-revalidate pattern with a configurable TTL (typically 60 seconds, 30 seconds for auth). Mutations invalidate relevant caches via `revalidateTag()` for targeted cache busting and `revalidatePath()` for full page revalidation.

## Cache Inventory

| File | Function | Cache Key | Tags | TTL |
|------|----------|-----------|------|-----|
| `lib/permissions.ts` | `getCachedUserByEmail` | `current-user-${email}-${batchId\|"default"}` | `current-user` | 30s |
| `actions/feed.ts` | `getPostsForBatches` | `posts-multi-${batchIds.sort().join("-")}` | `posts-${id}` (per batch) | 60s |
| `actions/feed.ts` | `getPosts` | `posts-${batchId}` or `posts-${batchId}-group-${groupId}` | `posts-${batchId}` | 60s |
| `actions/feed.ts` | `getArchivedPosts` | `archived-posts-${batchId}` | `archived-posts-${batchId}` | 60s |
| `actions/feed.ts` | `getPost` | `post-${id}` | `post-${id}` | 60s |
| `actions/event.ts` | `getEvents` | `events-${batchId}` | `events-${batchId}` | 60s |
| `actions/event.ts` | `getEvent` | `event-${eventId}` | `event-${eventId}` | 60s |
| `actions/question.ts` | `getQuestions` | `questions-${batchId}` | `questions-${batchId}` | 60s |
| `actions/question.ts` | `getQuestion` | `question-${id}` | `question-${id}` | 60s |
| `actions/session.ts` | `getSessions` | `sessions-${batchId}` | `sessions-${batchId}` | 60s |
| `actions/session.ts` | `getSession` | `session-${id}` | `session-${id}` | 60s |
| `actions/assignment.ts` | `getAssignments` | `assignments-${batchId}` | `assignments-${batchId}` | 60s |
| `actions/assignment.ts` | `getAssignment` | `assignment-${id}` | `assignment-${id}` | 60s |
| `actions/assignment.ts` | `getSubmissions` | `submissions-${batchId}` | `submissions-${batchId}` | 60s |
| `actions/group.ts` | `getGroups` | `groups-${batchId}` | `groups-${batchId}` | 60s |
| `actions/group.ts` | `getUserGroups` | `user-groups-${batchId}-${userId}` | `groups-${batchId}` | 60s |
| `actions/group.ts` | `getGroup` | `group-${id}` | `group-${id}` | 60s |
| `actions/office-hour.ts` | `getOfficeHourSlots` | `office-hours-${batchId}` | `office-hours-${batchId}` | 60s |
| `actions/batch.ts` | `getBatches` | `batches` | `batches` | 60s |
| `actions/user-management.ts` | `getBatchUsers` | `batch-users-${batchId}` | `batch-users-${batchId}` | 60s |
| `actions/schedule.ts` | `getScheduleItems` | `schedule-${batchId}-${viewerId}-${viewerRole}-${rangeStart}-${rangeEnd}` | `schedule-${batchId}` | 60s |

**Total: 21 cached queries across 11 files.**

## Revalidation Pattern

Mutations follow a consistent pattern:

1. **`revalidateTag(tag)`** -- Invalidates all cache entries with the matching tag. For example, `createPost` calls `revalidateTag(\`posts-\${batchId}\`)`, which invalidates `getPosts`, `getPostsForBatches`, and any other cache tagged with that batch's posts.

2. **`revalidatePath(path)`** -- Forces full page revalidation for the affected route. Used as a belt-and-suspenders approach alongside tag invalidation.

3. **Schedule helper** -- `revalidateSchedule(batchId)` in `cache-helpers.ts` invalidates `schedule-${batchId}` whenever events, sessions, or office hours change.

### Tag Hierarchy

Tags follow a two-level convention:
- **List tags**: `posts-${batchId}`, `events-${batchId}` -- invalidated when any item in the list changes
- **Item tags**: `post-${id}`, `event-${eventId}` -- invalidated when a specific item is updated or deleted

When an item is created or deleted, both the item tag and the parent list tag are invalidated.

## Migration Plan

`unstable_cache` is a Next.js API that may change in future versions:

1. **When it becomes stable**: Search-and-replace `unstable_cache` with the stable API name (likely `cache` from `next/cache`). The function signature is expected to remain identical: `cache(fn, keyParts, options)`.

2. **If the API changes**: All 21 call sites follow the same pattern, so migration can be done with a find-and-replace plus any argument adjustments.

3. **Monitoring**: Check Next.js release notes when upgrading. The `unstable_` prefix indicates the API is functional but its interface may evolve.

4. **Risk**: Low. The API has been stable in practice since Next.js 14. The `unstable_` prefix is a formality at this point.
