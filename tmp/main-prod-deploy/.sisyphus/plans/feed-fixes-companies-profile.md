# Plan: Feed Feature Fixes + Companies Global + Profile Linking

**Created**: 2026-03-03
**Status**: Ready for implementation
**Decisions**: Comment navigates to detail (YC Bookface style), remove bookmark batch gate

---

## Task 1: Fix 6 Broken Feed Features

### 1A. Like State + Bookmark State + Bookmark Toggle (issues #1, #2, #3)

**Root Cause**: getPaginatedPosts uses unstable_cache (shared across users) - cannot include user-specific data. FeedView hardcodes isLiked=false, isBookmarked=false, onBookmark always passes false.

**Reference**: PostDetailClient.tsx correctly handles this with optimistic state.

#### Step 1: New function getUserLikedPostIds in src/actions/feed.ts
- Query: like.findMany where userId + targetType "post" + postId in [postIds]
- Returns string[] of liked postIds

#### Step 2: New function getUserBookmarkedPostIds in src/actions/bookmark.ts
- Query: bookmark.findMany where userId + postId in [postIds]
- Returns string[] of bookmarked postIds

#### Step 3: Remove requireActiveBatch from bookmark.ts
- Remove from bookmarkPost and unbookmarkPost
- Remove import if unused

#### Step 4: Fetch user state in feed/page.tsx
- Extract postIds from paginatedPosts.items
- Parallel fetch getUserLikedPostIds + getUserBookmarkedPostIds
- Pass as likedPostIds and bookmarkedPostIds props to FeedView

#### Step 5: Optimistic state in FeedView.tsx
- New props: likedPostIds: string[], bookmarkedPostIds: string[]
- State: likedIds Set, bookmarkedIds Set, likeDelta Record
- handleToggleLike: optimistic Set toggle + delta count update
- handleBookmark: optimistic Set toggle, call bookmark/unbookmark based on previous state
- PostCard: isLiked={likedIds.has(post.id)}, isBookmarked={bookmarkedIds.has(post.id)}, likes={_count.likes + delta}

### 1B. Share Button (issue #4)
- In FeedView.tsx: handleShare copies window.location.origin/feed/postId to clipboard, toast success
- Pass onShare={() => handleShare(post.id)} to PostCard

### 1C. Post Navigation (issue #5) - YC Bookface Style
- Change onComment from toggleCommentsView to router.push(/feed/postId)
- Remove: showComments state, toggleCommentsView, commentContent state, handleAddComment
- Remove: entire inline comments JSX section
- Remove: unused imports (Avatar, Textarea if only used by inline comments)

### 1D. Author Profile Click (issue #6)
- Pass onAuthorClick={() => router.push(/profile/post.author.id)} to PostCard

---

## Task 2: Companies Page Global

**File**: src/app/(dashboard)/companies/page.tsx

1. Remove batchId: user.batchId from getCompaniesDirectory call
2. Change subtitle from "companies in your batch" to "companies"

---

## Task 3: Profile to Company Linking

**File**: src/app/(dashboard)/profile/[userId]/ProfileClient.tsx

1. Add companyMemberships to Profile interface (id, role, title, isCurrent, company: {id, name, slug, logoUrl})
2. Render Companies section with company logo/initials, name as link to /companies/slug, role/title
3. Use inline CSS matching existing profile styling
4. Only show if companyMemberships.length > 0

---

## Files Changed: 6 total

| File | Task | Change |
|------|------|--------|
| src/actions/feed.ts | 1A | Add getUserLikedPostIds() |
| src/actions/bookmark.ts | 1A | Add getUserBookmarkedPostIds(), remove requireActiveBatch |
| src/app/(dashboard)/feed/page.tsx | 1A | Fetch and pass liked/bookmarked IDs |
| src/app/(dashboard)/feed/FeedView.tsx | 1A-D | Optimistic state, share, navigation, author click, remove inline comments |
| src/app/(dashboard)/companies/page.tsx | 2 | Remove batchId filter, update subtitle |
| src/app/(dashboard)/profile/[userId]/ProfileClient.tsx | 3 | Add companyMemberships to interface and render |

## Verification
- tsc --noEmit - zero errors
- npm run build - clean build
