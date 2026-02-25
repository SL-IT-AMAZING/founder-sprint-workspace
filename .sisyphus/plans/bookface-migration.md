# 🎯 BOOKFACE-STYLE UI MIGRATION — COMPREHENSIVE WORK PLAN

## Executive Summary

**Goal**: Transform founder-sprint from sidebar navigation to YC Bookface-style horizontal top nav with enhanced feed, directory, profiles, and messaging system.

**Strategy**: Big-bang migration with per-milestone schema deployments. Force update navigation for all users once M1 is complete.

**Timeline Estimate**: 18-22 days for all 3 milestones

**Technology Decisions**:
- Use inline CSS styles (matching outsome-react) — NO Tailwind conversion
- Supabase Realtime for messaging (WebSocket subscriptions)
- PostgreSQL full-text search with tsvector + GIN indexes
- TanStack Query for infinite scroll feeds
- Direct component copy from outsome-react to `src/components/bookface/`

---

## 📋 MILESTONE 1: Navigation Overhaul + Feed Enhancement
**Goal**: "Does it look and feel like Bookface?"
**Duration**: 7-9 days
**Checkpoint Deliverable**: New top nav + enhanced feed working in dev, ready for user review

### Schema Changes for M1

```prisma
// New Models
model UserFollow {
  id          String   @id @default(uuid()) @db.Uuid
  followerId  String   @map("follower_id") @db.Uuid
  followingId String   @map("following_id") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at")

  follower  User @relation("Following", fields: [followerId], references: [id], onDelete: Cascade)
  following User @relation("Followers", fields: [followingId], references: [id], onDelete: Cascade)

  @@unique([followerId, followingId])
  @@index([followerId])
  @@index([followingId])
  @@map("user_follows")
}

model Bookmark {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  postId    String   @map("post_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@index([userId])
  @@index([postId])
  @@map("bookmarks")
}

model PostView {
  id        String   @id @default(uuid()) @db.Uuid
  postId    String   @map("post_id") @db.Uuid
  viewerId  String   @map("viewer_id") @db.Uuid
  viewedAt  DateTime @default(now()) @map("viewed_at") @db.Date

  post   Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  viewer User @relation(fields: [viewerId], references: [id], onDelete: Cascade)

  @@unique([postId, viewerId, viewedAt]) // One view per user per post per day
  @@index([postId])
  @@index([viewerId])
  @@map("post_views")
}

// Modified Models
model User {
  // Add new fields
  headline       String? @db.VarChar(200)  // Professional headline
  followerCount  Int     @default(0) @map("follower_count")
  followingCount Int     @default(0) @map("following_count")
  
  // Add new relations
  following User Follow[] @relation("Following")
  followers UserFollow[] @relation("Followers")
  bookmarks Bookmark[]
  postViews PostView[]
}

model Post {
  // Add new fields
  category     String? @db.VarChar(50)      // general, launch, classifieds, recruiting, etc.
  viewCount    Int     @default(0) @map("view_count")
  linkPreview  Json?   @map("link_preview") // {title, description, image, url, siteName}
  
  // Add new relations
  bookmarks Bookmark[]
  views     PostView[]
  
  // Update indexes
  @@index([batchId, category, isPinned, createdAt])
}
```

### M1 Task Breakdown

#### **M1.1: Schema Migration** (Category: `database`, Skills: `deep`)
**Effort**: 0.5 days
**Parallel**: None (blocking for all M1 tasks)

**Tasks**:
- M1.1.1: Create migration file for M1 schema changes
- M1.1.2: Add UserFollow, Bookmark, PostView models
- M1.1.3: Modify User model (add headline, followerCount, followingCount + relations)
- M1.1.4: Modify Post model (add category, viewCount, linkPreview + relations)
- M1.1.5: Run `prisma generate` and validate types
- M1.1.6: Apply migration to dev database

**Success Criteria**:
- ✅ All new tables exist in database
- ✅ No Prisma type errors
- ✅ Foreign key constraints properly set

**Risks**:
- ⚠️ Migration conflicts if applied to database with existing data
- **Mitigation**: Test on clean dev database first

---

#### **M1.2: Component Library Setup** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: Can run parallel with M1.1 after schema is done

**Tasks**:
- M1.2.1: Create `src/components/bookface/` directory structure
- M1.2.2: Copy 19 components from outsome-react:
  - Avatar, BatchBadge, TagBadge, PostCard, CommentThread
  - FeedTabs, PersonCard, CompanyCard, InlineComposer
  - MessageList, DirectoryFilters, GroupBrowseModal
  - ExperienceItem, EducationItem, NewsSection, PhotosGallery
  - VideoCard, ArticleContent, OfficeHoursForm
- M1.2.3: Copy layout components (BookfaceHeader, LeftSidebar, ProfileSidebar, ConversationSidebar)
- M1.2.4: Add bookface.css to app/globals.css (CSS custom properties)
- M1.2.5: Create barrel exports `src/components/bookface/index.ts`
- M1.2.6: Audit and remove any react-router-dom imports (replace with next/link, next/navigation)

**Success Criteria**:
- ✅ All 23 components compile without errors
- ✅ No react-router-dom dependencies
- ✅ TypeScript types resolve correctly

**Risks**:
- ⚠️ Components may have hardcoded outsome-specific data
- **Mitigation**: Search for "outsome", "bookface.com" and replace with founder-sprint URLs

---

#### **M1.3: Top Navigation Implementation** (Category: `visual-engineering`, Skills: `deep`)
**Effort**: 2 days
**Parallel**: Depends on M1.2

**Tasks**:
- M1.3.1: Create new `BookfaceTopNav.tsx` component (72px height, #2F2C26 bg)
  - Logo (reuse from current Navbar)
  - Global search input (UI only, wire up in M1.8)
  - 4 dropdown menus: Community, Advice, Tools, Contact
  - Right side: Notifications icon, User avatar dropdown
- M1.3.2: Implement dropdown menu components using W3C Disclosure pattern:
  - CommunityDropdown (Feed, Founders, Companies)
  - AdviceDropdown (Office Hours, Knowledge Base)
  - ToolsDropdown (Deals [placeholder], Schedule)
  - ContactDropdown (Messages [M3], Settings)
- M1.3.3: Implement user profile dropdown:
  - Profile link (`/profile/${user.id}`)
  - Notifications (`/notifications` - placeholder)
  - Bookmarks (`/bookmarks`)
  - Sign Out (server action)
- M1.3.4: Add BatchSwitcher to top nav (reuse existing component)
- M1.3.5: Implement active state highlighting (detect pathname)
- M1.3.6: Add keyboard navigation (Tab, Escape, Arrow keys)
- M1.3.7: Implement click-outside-to-close for dropdowns

**Success Criteria**:
- ✅ All dropdowns open/close correctly
- ✅ Keyboard navigation works (Tab, Escape)
- ✅ Active route highlights correctly
- ✅ Mobile: dropdowns become full-screen sheets
- ✅ BatchSwitcher visible when user has >1 batch

**Risks**:
- ⚠️ Dropdown positioning on small screens
- **Mitigation**: Use absolute positioning with viewport detection

---

#### **M1.4: Layout Shell Refactor** (Category: `visual-engineering`, Skills: `deep`)
**Effort**: 1 day
**Parallel**: Depends on M1.3

**Tasks**:
- M1.4.1: Create new `DashboardShell` component:
  - Max width: 1200px, centered
  - Sticky top nav (72px)
  - 3-column grid: left sidebar (200px), main content (1fr), right sidebar (280px)
  - Responsive: collapse sidebars below lg breakpoint
- M1.4.2: Update `(dashboard)/layout.tsx`:
  - Replace current Navbar + DashboardSidebar with BookfaceTopNav + DashboardShell
  - Remove old grid layout (`lg:grid-cols-[240px_1fr]`)
- M1.4.3: Add left sidebar placeholder (empty for M1, populate in M2)
- M1.4.4: Add right sidebar slot (for feed widgets)
- M1.4.5: Test all existing pages render correctly in new layout
- M1.4.6: Verify mobile: sidebars hidden, only main content shows

**Success Criteria**:
- ✅ All existing pages still work (no 404s, no layout breaks)
- ✅ Top nav sticky on scroll
- ✅ Main content doesn't overflow (min-w-0 on flex child)
- ✅ Mobile: single-column layout

**Risks**:
- ⚠️ Existing pages may have hardcoded padding/margins assuming sidebar
- **Mitigation**: Test every route after layout swap

---

#### **M1.5: Feed Category Tabs** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Can run parallel with M1.4

**Tasks**:
- M1.5.1: Use outsome-react `FeedTabs` component
- M1.5.2: Define category schema (general, launch, classifieds, recruiting)
- M1.5.3: Add tab state management via URL searchParams (`/feed?tab=launch`)
- M1.5.4: Wire up tab changes to feed filter queries
- M1.5.5: Add "Top" and "Recent" meta-tabs (sort by likes vs createdAt)

**Success Criteria**:
- ✅ Tabs render with correct active state
- ✅ URL updates on tab change
- ✅ Direct URL navigation works (`/feed?tab=launch`)
- ✅ Tab state persists on page reload

**Risks**:
- ⚠️ Low risk

---

#### **M1.6: Enhanced Post Composer** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: Can run parallel with M1.4, M1.5

**Tasks**:
- M1.6.1: Use outsome-react `InlineComposer` component
- M1.6.2: Add category selector dropdown (match FeedTabs categories)
- M1.6.3: Detect URLs in post content (regex: `https?://[^\s]+`)
- M1.6.4: Call link preview API on URL detection (async, non-blocking)
- M1.6.5: Display link preview card below composer (title, description, image)
- M1.6.6: Store linkPreview JSON in Post.linkPreview on submit
- M1.6.7: Wire up to existing `createPost` server action (add category, linkPreview params)

**Success Criteria**:
- ✅ Composer expands on focus ("Write a post…" placeholder)
- ✅ Category selector works
- ✅ Link preview loads asynchronously
- ✅ Post submits with category + linkPreview

**Risks**:
- ⚠️ Link preview API may be slow (5s timeout)
- **Mitigation**: Show loading spinner, allow post without preview if timeout

---

#### **M1.7: PostCard with View Counts** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: Can run parallel with M1.6

**Tasks**:
- M1.7.1: Use outsome-react `PostCard` component
- M1.7.2: Add viewCount prop (display as "👁 42 views")
- M1.7.3: Add bookmark button (wire to server action)
- M1.7.4: Render linkPreview if exists (title, description, image, site name)
- M1.7.5: Render category tags if exists
- M1.7.6: Implement view tracking:
  - Client-side: IntersectionObserver with 2s dwell time
  - On view: call `trackPostView(postId)` server action
  - Server action: upsert PostView (unique constraint prevents duplicates)
  - Increment Post.viewCount transactionally
- M1.7.7: Update existing `FeedView.tsx` to use new PostCard

**Success Criteria**:
- ✅ Post cards render with all new fields
- ✅ View count increments once per user per post per day
- ✅ Bookmark/unbookmark works
- ✅ Link previews render correctly

**Risks**:
- ⚠️ View tracking may cause DB load with many users
- **Mitigation**: Debounce view events client-side (max 1 per post per session)

---

#### **M1.8: Global Search (PostgreSQL FTS)** (Category: `deep`, Skills: `deep`)
**Effort**: 1.5 days
**Parallel**: Can run parallel with M1.6, M1.7

**Tasks**:
- M1.8.1: Add tsvector column to Post model:
  ```sql
  ALTER TABLE posts ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(content, '')), 'A')
    ) STORED;
  CREATE INDEX posts_search_idx ON posts USING gin(search_vector);
  ```
- M1.8.2: Create `searchService.ts` abstraction:
  - `searchPosts(query: string, batchId: string, limit: number)`
  - Uses Prisma `$queryRaw` with `plainto_tsquery`
  - Returns post IDs + rank + headline
- M1.8.3: Create `/api/search/route.ts` API endpoint
- M1.8.4: Implement search UI in BookfaceTopNav:
  - Debounced input (300ms)
  - Dropdown results panel (max 10 results)
  - Highlight matches with `<mark>` tags
  - Click result → navigate to `/feed/${postId}`
- M1.8.5: Add keyboard navigation (Arrow up/down, Enter to select)

**Success Criteria**:
- ✅ Search returns relevant posts ranked by relevance
- ✅ Search scoped to current batch
- ✅ Results appear within 300ms of typing
- ✅ Keyboard navigation works

**Risks**:
- ⚠️ GIN index build may be slow on large tables
- **Mitigation**: Build index during off-peak (not blocking)
- ⚠️ Prisma may try to remove tsvector column on next migration
- **Mitigation**: Use `Unsupported("tsvector")?` type in schema

---

#### **M1.9: Follow System** (Category: `deep`, Skills: `deep`)
**Effort**: 1 day
**Parallel**: Can run parallel with M1.8

**Tasks**:
- M1.9.1: Create `followUser` server action:
  - Insert UserFollow record (with unique constraint check)
  - Increment User.followingCount for follower (transactional)
  - Increment User.followerCount for following (transactional)
- M1.9.2: Create `unfollowUser` server action (inverse of above)
- M1.9.3: Create `getUserFollowers(userId)` query
- M1.9.4: Create `getUserFollowing(userId)` query
- M1.9.5: Create `checkIsFollowing(followerId, followingId)` query (for button state)
- M1.9.6: Add permission checks (can't follow yourself, must be in same batch)

**Success Criteria**:
- ✅ Follow/unfollow actions are atomic (counts stay in sync)
- ✅ Duplicate follows prevented by unique constraint
- ✅ Counts update correctly on follow/unfollow

**Risks**:
- ⚠️ Race conditions on follower counts
- **Mitigation**: Use database transactions for all mutations

---

#### **M1.10: "People To Follow" Widget** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Depends on M1.9

**Tasks**:
- M1.10.1: Create `PeopleToFollowWidget.tsx` component for right sidebar
- M1.10.2: Query logic: fetch users in current batch, exclude already following, limit 5
- M1.10.3: Use outsome-react `PersonCard` component
- M1.10.4: Add "Follow" button (wire to followUser action)
- M1.10.5: Add to right sidebar slot in DashboardShell

**Success Criteria**:
- ✅ Widget shows 5 relevant users
- ✅ Follow button works inline (no page refresh)
- ✅ Widget updates after follow action

**Risks**:
- ⚠️ Low risk

---

#### **M1.11: Bookmark System** (Category: `quick`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Can run parallel with M1.10

**Tasks**:
- M1.11.1: Create `bookmarkPost` server action (upsert Bookmark)
- M1.11.2: Create `unbookmarkPost` server action (delete Bookmark)
- M1.11.3: Create `/bookmarks` page (list user's bookmarked posts)
- M1.11.4: Wire bookmark button in PostCard to server actions
- M1.11.5: Add bookmark icon to user dropdown in top nav

**Success Criteria**:
- ✅ Bookmark/unbookmark works
- ✅ `/bookmarks` page shows user's bookmarked posts
- ✅ Bookmark state persists across sessions

**Risks**:
- ⚠️ Low risk

---

#### **M1.12: Post Detail View + "In This Conversation"** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: Depends on M1.7

**Tasks**:
- M1.12.1: Create new layout for `/feed/[id]` page:
  - Main content: Post + full comment thread
  - Right sidebar: "In This Conversation" panel
- M1.12.2: Use outsome-react `ConversationSidebar` component
- M1.12.3: Populate sidebar with:
  - Post author
  - All comment authors (unique)
  - Follow buttons for each user
- M1.12.4: Update existing `CommentThread` to use outsome-react version:
  - Add upvote indicator (Like count)
  - Add "Reply" button (collapse/expand reply form)
  - Max depth: 3 levels

**Success Criteria**:
- ✅ Post detail page has 2-column layout
- ✅ Sidebar shows all participants
- ✅ Comment thread supports nested replies (max 3 levels)
- ✅ Reply form works inline

**Risks**:
- ⚠️ Low risk

---

#### **M1.13: Link Preview API** (Category: `quick`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Can run parallel with M1.6

**Tasks**:
- M1.13.1: Create `/api/link-preview/route.ts`:
  - Install `open-graph-scraper` package
  - Extract URL from query param
  - Fetch OpenGraph metadata (title, description, image, siteName)
  - 5s timeout with AbortSignal
  - Cache in database (LinkPreview table with url unique constraint)
  - Return JSON: `{title, description, image, siteName, url}`
- M1.13.2: Create LinkPreview model in schema (optional, can skip if using Post.linkPreview JSON)
- M1.13.3: Add rate limiting (10 requests/min per user)

**Success Criteria**:
- ✅ API returns OG metadata for valid URLs
- ✅ Graceful fallback if scraping fails (return URL only)
- ✅ Timeout prevents hanging requests

**Risks**:
- ⚠️ Some sites block scrapers
- **Mitigation**: Use `user-agent: Googlebot` header

---

#### **M1.14: Testing + Bug Fixes** (Category: `qa`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: After all M1 tasks complete

**Tasks**:
- M1.14.1: Manual QA checklist:
  - [ ] All dropdowns open/close correctly
  - [ ] Feed tabs filter posts correctly
  - [ ] Post composer creates posts with category + link preview
  - [ ] View counts increment correctly
  - [ ] Follow/unfollow works
  - [ ] Bookmark/unbookmark works
  - [ ] Search returns relevant results
  - [ ] Post detail view renders correctly
  - [ ] Mobile: layout doesn't break
- M1.14.2: Fix any bugs found
- M1.14.3: Update E2E tests (feed creation, navigation)

**Success Criteria**:
- ✅ All checklist items pass
- ✅ Zero console errors
- ✅ E2E tests pass

**Risks**:
- ⚠️ May uncover layout issues on edge cases
- **Mitigation**: Budget extra 0.5 days for bug fixes

---

### M1 Parallel Execution Graph

```
M1.1 (Schema) [DAY 1]
  ↓
M1.2 (Components) [DAY 1-2] ────────────┐
  ↓                                     │
M1.3 (TopNav) [DAY 2-4] ────┐          │
  ↓                          ↓          ↓
M1.4 (Layout) [DAY 4-5]    M1.5 [DAY 3] │
                           M1.6 [DAY 3-4]│
  ↓                        M1.7 [DAY 3-4]│
                           M1.8 [DAY 3-5]│
M1.9 (Follow) [DAY 5-6] ──→ M1.10 [DAY 6]
M1.11 (Bookmark) [DAY 6]               │
M1.12 (Post Detail) [DAY 6-7]          │
M1.13 (Link Preview) [DAY 3] ──────────┘
  ↓
M1.14 (QA) [DAY 7-8]
```

**Critical Path**: M1.1 → M1.2 → M1.3 → M1.4 → M1.14 (7 days minimum)
**With Parallelization**: 7-9 days total

---

### M1 Success Criteria

- [ ] New top navigation with 4 dropdowns functional
- [ ] Global search returns relevant posts
- [ ] Feed has category tabs (Top/Recent + categories)
- [ ] Post composer supports categories + link previews
- [ ] Post cards show view counts, bookmarks, link previews
- [ ] Follow/unfollow system works
- [ ] "People To Follow" widget populates
- [ ] Post detail page has "In This Conversation" sidebar
- [ ] Comments support nested replies with upvotes
- [ ] Bookmarks page shows user's saved posts
- [ ] All existing functionality still works (no regressions)
- [ ] Mobile: responsive layout (single column)

### M1 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Layout breaks existing pages | HIGH | Test every route after M1.4 |
| PostgreSQL FTS migration drift | MEDIUM | Use `Unsupported("tsvector")?` in schema |
| Link preview scraping blocked | LOW | Fallback to URL-only display |
| View tracking DB load | MEDIUM | Debounce client-side, add batch insert later |
| Component import errors | LOW | Thorough testing in M1.2 |

---

## 📋 MILESTONE 2: Directory + Profiles + Company Profiles
**Goal**: "Is discovery and networking working?"
**Duration**: 6-8 days
**Checkpoint Deliverable**: Founders & Companies directories + enhanced profiles working in dev

### Schema Changes for M2

```prisma
// New Models
model Company {
  id          String   @id @default(uuid()) @db.Uuid
  name        String   @db.VarChar(200)
  slug        String   @unique @db.VarChar(200) // URL-friendly
  description String?  @db.Text
  website     String?  @db.VarChar(500)
  industry    String?  @db.VarChar(100)
  hqLocation  String?  @map("hq_location") @db.VarChar(200)
  foundedYear Int?     @map("founded_year")
  logoUrl     String?  @map("logo_url")
  tags        String[] @default([]) // Array of tags for filtering
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  members     CompanyMember[]
  
  @@index([industry])
  @@index([hqLocation])
  @@map("companies")
}

model CompanyMember {
  id         String    @id @default(uuid()) @db.Uuid
  companyId  String    @map("company_id") @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  role       String?   @db.VarChar(100)  // "Co-Founder", "CEO", etc.
  title      String?   @db.VarChar(100)  // Job title
  startDate  DateTime? @map("start_date") @db.Date
  endDate    DateTime? @map("end_date") @db.Date
  isCurrent  Boolean   @default(true) @map("is_current")
  createdAt  DateTime  @default(now()) @map("created_at")

  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([companyId, userId, startDate]) // Allow multiple stints at same company
  @@index([userId])
  @@index([companyId])
  @@map("company_members")
}

model Experience {
  id         String    @id @default(uuid()) @db.Uuid
  userId     String    @map("user_id") @db.Uuid
  company    String    @db.VarChar(200)
  title      String    @db.VarChar(200)
  startDate  DateTime  @map("start_date") @db.Date
  endDate    DateTime? @map("end_date") @db.Date
  isCurrent  Boolean   @default(false) @map("is_current")
  description String?  @db.Text
  location   String?   @db.VarChar(200)
  createdAt  DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("experiences")
}

model Education {
  id          String    @id @default(uuid()) @db.Uuid
  userId      String    @map("user_id") @db.Uuid
  institution String    @db.VarChar(200)
  degree      String?   @db.VarChar(200)
  fieldOfStudy String?  @map("field_of_study") @db.VarChar(200)
  startYear   Int?      @map("start_year")
  endYear     Int?      @map("end_year")
  createdAt   DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@map("education")
}

// Modified Models
model User {
  // Add new fields
  location      String? @db.VarChar(200)
  linkedinUrl   String? @map("linkedin_url") @db.VarChar(500)
  twitterUrl    String? @map("twitter_url") @db.VarChar(500)
  websiteUrl    String? @map("website_url") @db.VarChar(500)
  
  // Add new relations
  companyMemberships CompanyMember[]
  experiences        Experience[]
  education          Education[]
}
```

### M2 Task Breakdown

#### **M2.1: Schema Migration** (Category: `database`, Skills: `deep`)
**Effort**: 0.5 days
**Parallel**: None (blocking for all M2 tasks)

**Tasks**:
- M2.1.1: Create migration file for M2 schema changes
- M2.1.2: Add Company, CompanyMember, Experience, Education models
- M2.1.3: Modify User model (add location, social URLs + relations)
- M2.1.4: Run `prisma generate` and validate types
- M2.1.5: Apply migration to dev database
- M2.1.6: Create seed data for 5-10 sample companies

**Success Criteria**:
- ✅ All new tables exist
- ✅ Sample companies seeded
- ✅ No type errors

**Risks**:
- ⚠️ Low risk

---

#### **M2.2: Founders Directory Page** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1.5 days
**Parallel**: Depends on M2.1

**Tasks**:
- M2.2.1: Create `/directory/founders/page.tsx`
- M2.2.2: Use outsome-react `PeopleDirectoryPage` as template
- M2.2.3: Implement faceted filters (left sidebar):
  - Batch (multi-select checkboxes)
  - Role (Founder, Co-Founder, Mentor, Admin)
  - Company (search-select)
  - Location (search-select)
- M2.2.4: Use outsome-react `DirectoryFilters` component
- M2.2.5: Implement URL-driven filter state (`/directory/founders?batch=W24&role=founder`)
- M2.2.6: Create `getFoundersDirectory(filters, page)` server function:
  - Query Users with filters
  - Include company info (via CompanyMember relation)
  - Paginate (20 per page)
  - Order by: followerCount DESC, name ASC
- M2.2.7: Use outsome-react `PersonListItem` component for results
- M2.2.8: Add pagination (use existing Pagination component)
- M2.2.9: Add search input (filter by name, company, bio)

**Success Criteria**:
- ✅ Filters work and update URL
- ✅ Search returns relevant users
- ✅ Pagination works
- ✅ Results show user avatar, name, company, role, batch

**Risks**:
- ⚠️ Performance with large user counts
- **Mitigation**: Add indexes on filtered columns

---

#### **M2.3: Companies Directory Page** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1.5 days
**Parallel**: Can run parallel with M2.2

**Tasks**:
- M2.3.1: Create `/directory/companies/page.tsx`
- M2.3.2: Use outsome-react `CompaniesDirectoryPage` as template
- M2.3.3: Implement faceted filters:
  - Batch (via company members)
  - Industry (select)
  - HQ Region (select)
  - Tags (multi-select)
- M2.3.4: Create `getCompaniesDirectory(filters, page)` server function:
  - Query Companies with filters
  - Include member count, founder names/avatars
  - Paginate (20 per page)
  - Order by: foundedYear DESC, name ASC
- M2.3.5: Use outsome-react `CompanyCard` component for results
- M2.3.6: Add pagination + search

**Success Criteria**:
- ✅ Filters work
- ✅ Companies display with logos, tags, team avatars
- ✅ Click company → navigate to company profile

**Risks**:
- ⚠️ Low risk

---

#### **M2.4: Enhanced User Profile Page** (Category: `visual-engineering`, Skills: `deep`)
**Effort**: 2 days
**Parallel**: Depends on M2.1

**Tasks**:
- M2.4.1: Update `/profile/[userId]/page.tsx`
- M2.4.2: Use outsome-react `UserProfilePage` as template
- M2.4.3: Implement profile header:
  - Avatar, name, headline, batch badge
  - Follow/Message buttons
  - Follower/Following counts
- M2.4.4: Implement tabbed content:
  - **Profile tab**: Bio, Experience, Education
  - **Posts tab**: User's posts (reuse PostCard)
  - **Followers tab**: List of followers
  - **Following tab**: List of users they follow
- M2.4.5: Create right sidebar (ProfileSidebar):
  - Founded year
  - Batches (badges)
  - Location
  - Social links (LinkedIn, Twitter, Website)
  - Contact info (email - only show if viewer is in same batch)
- M2.4.6: Use outsome-react `ExperienceItem` component for experience section
- M2.4.7: Use outsome-react `EducationItem` component for education section
- M2.4.8: Wire up "Message" button (navigate to `/messages/new?userId=...` - placeholder for M3)
- M2.4.9: Wire up "Follow" button (use followUser action from M1)

**Success Criteria**:
- ✅ Profile shows all user data
- ✅ Tabs switch correctly
- ✅ Experience/Education sections render
- ✅ Follow button works
- ✅ Sidebar shows metadata
- ✅ Contact info only visible to batch members

**Risks**:
- ⚠️ Profile data may be sparse for existing users
- **Mitigation**: Show "Add experience" CTA if empty

---

#### **M2.5: Company Profile Page** (Category: `visual-engineering`, Skills: `deep`)
**Effort**: 1.5 days
**Parallel**: Can run parallel with M2.4

**Tasks**:
- M2.5.1: Create `/companies/[slug]/page.tsx`
- M2.5.2: Use outsome-react `CompanyProfilePage` as template
- M2.5.3: Implement company header:
  - Logo, name, industry tag
  - Website link, HQ location
  - Batch badges (from members)
- M2.5.4: Implement sections:
  - **About**: Description
  - **Team**: Grid of company members (founder, employees)
  - **Related Companies**: Other companies in same industry/batch
- M2.5.5: Create right sidebar:
  - Founded year
  - Batches
  - HQ location
  - Website
  - Team size
- M2.5.6: Use outsome-react `PersonCard` for team members
- M2.5.7: Add "Visit Website" button
- M2.5.8: Query `getRelatedCompanies(companyId)` (same industry or batch)

**Success Criteria**:
- ✅ Company profile displays all metadata
- ✅ Team section shows all members
- ✅ Related companies populate
- ✅ Click team member → navigate to user profile

**Risks**:
- ⚠️ Companies may not have logos/descriptions
- **Mitigation**: Show placeholder logo, "No description" state

---

#### **M2.6: Profile Editing** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: Depends on M2.4

**Tasks**:
- M2.6.1: Update `/settings/page.tsx` to include new fields:
  - Headline
  - Location
  - LinkedIn URL
  - Twitter URL
  - Website URL
- M2.6.2: Add "Experience" section:
  - List existing experiences
  - Add/Edit/Delete forms (modal or inline)
- M2.6.3: Add "Education" section:
  - List existing education entries
  - Add/Edit/Delete forms
- M2.6.4: Create server actions:
  - `updateUserProfile(data)`
  - `addExperience(data)`, `updateExperience(id, data)`, `deleteExperience(id)`
  - `addEducation(data)`, `updateEducation(id, data)`, `deleteEducation(id)`
- M2.6.5: Add validation (Zod schemas)

**Success Criteria**:
- ✅ Users can edit all new profile fields
- ✅ Experience/Education CRUD works
- ✅ Changes reflect immediately on profile page

**Risks**:
- ⚠️ Low risk

---

#### **M2.7: Company Management (Admin)** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: Can run parallel with M2.6

**Tasks**:
- M2.7.1: Create `/admin/companies/page.tsx`:
  - List all companies
  - Add/Edit/Delete buttons
- M2.7.2: Create `/admin/companies/new/page.tsx`:
  - Form for creating companies (name, slug, description, industry, HQ, logo, tags)
- M2.7.3: Create `/admin/companies/[id]/edit/page.tsx`:
  - Form for editing companies
- M2.7.4: Create server actions:
  - `createCompany(data)`
  - `updateCompany(id, data)`
  - `deleteCompany(id)`
- M2.7.5: Add admin-only permission checks
- M2.7.6: Create UI for assigning company members:
  - Search users
  - Add member with role/title/dates

**Success Criteria**:
- ✅ Admins can create/edit/delete companies
- ✅ Admins can assign users to companies
- ✅ Non-admins cannot access

**Risks**:
- ⚠️ Low risk

---

#### **M2.8: Search Extensions (Users + Companies)** (Category: `deep`, Skills: `deep`)
**Effort**: 1 day
**Parallel**: Can run parallel with M2.7

**Tasks**:
- M2.8.1: Add tsvector columns to User and Company:
  ```sql
  -- User search
  ALTER TABLE users ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(headline, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(bio, '')), 'C') ||
      setweight(to_tsvector('english', coalesce(company, '')), 'B')
    ) STORED;
  CREATE INDEX users_search_idx ON users USING gin(search_vector);
  
  -- Company search
  ALTER TABLE companies ADD COLUMN search_vector tsvector
    GENERATED ALWAYS AS (
      setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
      setweight(to_tsvector('english', array_to_string(tags, ' ')), 'C')
    ) STORED;
  CREATE INDEX companies_search_idx ON companies USING gin(search_vector);
  ```
- M2.8.2: Update `searchService.ts` to include `searchUsers()` and `searchCompanies()`
- M2.8.3: Update global search UI to show multi-category results:
  - Posts (limit 5)
  - Users (limit 3)
  - Companies (limit 2)
- M2.8.4: Add "See all results" link for each category

**Success Criteria**:
- ✅ Global search returns posts, users, and companies
- ✅ Results ranked by relevance
- ✅ Click user → navigate to profile
- ✅ Click company → navigate to company page

**Risks**:
- ⚠️ Same migration drift risk as M1.8
- **Mitigation**: Use `Unsupported("tsvector")?`

---

#### **M2.9: Testing + Bug Fixes** (Category: `qa`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: After all M2 tasks complete

**Tasks**:
- M2.9.1: Manual QA checklist:
  - [ ] Founders directory filters work
  - [ ] Companies directory filters work
  - [ ] User profiles display all sections
  - [ ] Company profiles display all sections
  - [ ] Profile editing works (all fields)
  - [ ] Experience/Education CRUD works
  - [ ] Admin can create/edit companies
  - [ ] Search returns users + companies + posts
  - [ ] Follow from profile works
  - [ ] Mobile: directories responsive
- M2.9.2: Fix any bugs found
- M2.9.3: Update E2E tests

**Success Criteria**:
- ✅ All checklist items pass
- ✅ Zero console errors

**Risks**:
- ⚠️ Directory filters may have edge cases
- **Mitigation**: Budget extra 0.5 days

---

### M2 Parallel Execution Graph

```
M2.1 (Schema) [DAY 1]
  ↓
M2.2 (Founders Dir) [DAY 1-3] ──────┐
M2.3 (Companies Dir) [DAY 1-3] ─────┤
M2.4 (User Profile) [DAY 1-3] ──┐   │
M2.5 (Company Profile) [DAY 2-4] ┤  │
  ↓                              ↓   ↓
M2.6 (Profile Edit) [DAY 4-5] ──┘   │
M2.7 (Admin Companies) [DAY 4-5] ───┤
M2.8 (Search Ext) [DAY 4-5] ────────┘
  ↓
M2.9 (QA) [DAY 6]
```

**Critical Path**: M2.1 → M2.4 → M2.6 → M2.9 (6 days minimum)
**With Parallelization**: 6-8 days total

---

### M2 Success Criteria

- [ ] Founders directory with faceted filters functional
- [ ] Companies directory with faceted filters functional
- [ ] User profiles enhanced with Experience/Education sections
- [ ] User profiles have Profile/Posts/Followers/Following tabs
- [ ] Company profiles show team, description, related companies
- [ ] Profile editing works for all new fields
- [ ] Admins can create/manage companies
- [ ] Global search returns users + companies + posts
- [ ] Mobile: directories responsive

### M2 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Sparse profile data for existing users | LOW | Show "Add info" CTAs |
| Directory performance with large datasets | MEDIUM | Add database indexes |
| Company data entry burden | LOW | Provide CSV import tool (future) |

---

## 📋 MILESTONE 3: Messaging System
**Goal**: "Is communication complete?"
**Duration**: 5-6 days
**Checkpoint Deliverable**: Full 1-on-1 and group messaging functional in dev

### Schema Changes for M3

```prisma
// New Models
model Conversation {
  id          String   @id @default(uuid()) @db.Uuid
  isGroup     Boolean  @default(false) @map("is_group")
  groupName   String?  @map("group_name") @db.VarChar(200)
  lastMessage String?  @map("last_message") @db.Text
  lastMessageAt DateTime? @map("last_message_at")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  participants ConversationParticipant[]
  messages     Message[]

  @@index([lastMessageAt])
  @@map("conversations")
}

model ConversationParticipant {
  id             String   @id @default(uuid()) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  joinedAt       DateTime @default(now()) @map("joined_at")
  lastReadAt     DateTime @default(now()) @map("last_read_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([conversationId, userId])
  @@index([userId])
  @@index([conversationId])
  @@map("conversation_participants")
}

model Message {
  id             String   @id @default(uuid()) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  senderId       String   @map("sender_id") @db.Uuid
  content        String   @db.Text
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User         @relation(fields: [senderId], references: [id], onDelete: Cascade)

  @@index([conversationId, createdAt])
  @@index([senderId])
  @@map("messages")
}

// Modified Models
model User {
  conversations ConversationParticipant[]
  messages      Message[]
}

model Group {
  // Add new fields
  isPublic     Boolean @default(false) @map("is_public")
  memberCount  Int     @default(0) @map("member_count")
  
  // Note: Group.members already exists for GroupMember relation
}
```

### M3 Task Breakdown

#### **M3.1: Schema Migration** (Category: `database`, Skills: `deep`)
**Effort**: 0.5 days
**Parallel**: None (blocking)

**Tasks**:
- M3.1.1: Create migration for M3 schema changes
- M3.1.2: Add Conversation, ConversationParticipant, Message models
- M3.1.3: Modify User model (add relations)
- M3.1.4: Modify Group model (add isPublic, memberCount)
- M3.1.5: Run `prisma generate` and validate
- M3.1.6: Apply migration to dev database

**Success Criteria**:
- ✅ All tables exist
- ✅ Indexes created

**Risks**:
- ⚠️ Low risk

---

#### **M3.2: Conversation Infrastructure** (Category: `deep`, Skills: `deep`)
**Effort**: 1 day
**Parallel**: Depends on M3.1

**Tasks**:
- M3.2.1: Create server actions:
  - `getOrCreateConversation(participantIds: string[])` — returns existing or creates new
  - `getUserConversations(userId: string)` — list inbox
  - `getConversationMessages(conversationId: string, limit: number, cursor?: string)` — paginated
  - `sendMessage(conversationId: string, content: string)` — create message
  - `markConversationRead(conversationId: string, userId: string)` — update lastReadAt
- M3.2.2: Add permission checks:
  - User must be participant to access conversation
  - Participants must be in same batch
- M3.2.3: Add transactional updates:
  - When message sent → update Conversation.lastMessage, lastMessageAt
- M3.2.4: Calculate unread count:
  - Create `getUnreadCount(userId)` helper (count messages where createdAt > lastReadAt)

**Success Criteria**:
- ✅ 1-on-1 conversations can be created
- ✅ Messages can be sent/retrieved
- ✅ Unread counts calculated correctly
- ✅ Permission checks work

**Risks**:
- ⚠️ Race conditions on conversation creation
- **Mitigation**: Use unique constraint on sorted participant IDs (or check existence before insert)

---

#### **M3.3: Messages Page (Inbox UI)** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1.5 days
**Parallel**: Depends on M3.2

**Tasks**:
- M3.3.1: Create `/messages/page.tsx` (default view: conversation list)
- M3.3.2: Create `/messages/[conversationId]/page.tsx` (thread view)
- M3.3.3: Use split-pane layout:
  - Left pane (320px): Conversation list
  - Right pane (1fr): Active conversation thread
- M3.3.4: Use outsome-react `MessageList` component for left pane:
  - Search conversations
  - Show last message preview
  - Unread indicator (dot)
  - Group indicator (if isGroup)
- M3.3.5: Create `ConversationThread` component for right pane:
  - Message bubbles (sender vs receiver styles)
  - Timestamps
  - Input composer at bottom
  - Send button
- M3.3.6: Load messages with pagination (load more on scroll up)
- M3.3.7: Auto-scroll to bottom on new message
- M3.3.8: Mark as read on open (call markConversationRead)

**Success Criteria**:
- ✅ Conversation list displays correctly
- ✅ Click conversation → thread opens
- ✅ Messages display in chronological order
- ✅ Unread indicators work
- ✅ Composer sends messages
- ✅ Auto-scroll to bottom

**Risks**:
- ⚠️ Scroll position tricky with pagination
- **Mitigation**: Use `scrollIntoView()` with `behavior: 'smooth'`

---

#### **M3.4: Supabase Realtime Integration** (Category: `deep`, Skills: `deep`)
**Effort**: 1.5 days
**Parallel**: Depends on M3.3

**Tasks**:
- M3.4.1: Create `useRealtimeMessages(conversationId)` hook:
  - Subscribe to Supabase channel `conversation:${conversationId}`
  - Use **Postgres Changes** listener on `messages` table:
    ```ts
    supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        // Fetch full message with sender info
        // Append to local state
      })
      .subscribe()
    ```
  - On new message event → fetch message by ID (authorized query)
  - Append to local messages array
  - Auto-scroll to bottom
- M3.4.2: Add cleanup (unsubscribe on unmount)
- M3.4.3: Add reconnection handling (Supabase auto-reconnects)
- M3.4.4: Update unread count in real-time (listen to all user's conversations)

**Success Criteria**:
- ✅ New messages appear instantly without refresh
- ✅ Messages only visible to authorized participants
- ✅ Unread count updates in real-time
- ✅ No memory leaks (proper cleanup)

**Risks**:
- ⚠️ RLS policies must be correct to prevent unauthorized access
- **Mitigation**: Test with multiple users in different batches
- ⚠️ Realtime may fail to reconnect
- **Mitigation**: Show "Reconnecting..." indicator

---

#### **M3.5: "Start Conversation" Flow** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Can run parallel with M3.4

**Tasks**:
- M3.5.1: Add "Message" button to user profiles (M2.4)
- M3.5.2: Create `/messages/new` route with `userId` query param
- M3.5.3: On load:
  - Call `getOrCreateConversation([currentUser.id, targetUserId])`
  - Redirect to `/messages/${conversationId}`
- M3.5.4: If conversation exists → open existing thread
- M3.5.5: If new → open empty thread with composer focused

**Success Criteria**:
- ✅ Click "Message" from profile → opens conversation
- ✅ Existing conversations don't duplicate
- ✅ New conversations created correctly

**Risks**:
- ⚠️ Low risk

---

#### **M3.6: Group Chat Creation** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: Can run parallel with M3.4

**Tasks**:
- M3.6.1: Add "New Group" button to `/messages` page
- M3.6.2: Create modal for group creation:
  - Group name input
  - Multi-select user picker (search batch members)
  - Create button
- M3.6.3: Create `createGroupConversation(name, participantIds)` server action:
  - Create Conversation (isGroup: true, groupName)
  - Create ConversationParticipant records for all participants
- M3.6.4: After creation → redirect to `/messages/${conversationId}`
- M3.6.5: Group thread UI:
  - Show group name in header
  - Show participant count
  - Message bubbles show sender name/avatar

**Success Criteria**:
- ✅ Users can create group chats
- ✅ All participants see the conversation
- ✅ Group name displays correctly
- ✅ Messages show sender info

**Risks**:
- ⚠️ Low risk

---

#### **M3.7: Public Group Browsing** (Category: `visual-engineering`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Depends on M3.6

**Tasks**:
- M3.7.1: Use outsome-react `GroupBrowseModal` component
- M3.7.2: Trigger from "Browse Groups" button in Messages page
- M3.7.3: Query `getPublicGroups(batchId)`:
  - Filter Groups where isPublic = true
  - Include memberCount, creator info, lastActive
- M3.7.4: Add search/sort (by memberCount, lastActive, name)
- M3.7.5: Add "Join" button → creates ConversationParticipant + increments Group.memberCount
- M3.7.6: Navigate to group's conversation after join

**Success Criteria**:
- ✅ Modal shows public groups
- ✅ Search/sort works
- ✅ Join button works
- ✅ User redirected to group chat

**Risks**:
- ⚠️ Low risk

---

#### **M3.8: Message Search** (Category: `quick`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Can run parallel with M3.7

**Tasks**:
- M3.8.1: Add search input to Messages page (top of left pane)
- M3.8.2: Create `searchMessages(userId, query)` server function:
  - Filter messages by userId (participant in conversation)
  - Use ILIKE on content (`WHERE content ILIKE %${query}%`)
  - Return conversation + matching message snippet
- M3.8.3: Display search results (replace conversation list)
- M3.8.4: Click result → navigate to conversation + scroll to message

**Success Criteria**:
- ✅ Search returns relevant conversations
- ✅ Click result opens conversation
- ✅ Search clears on input clear

**Risks**:
- ⚠️ ILIKE may be slow on large message tables
- **Mitigation**: Add GIN index on Message.content (optional, defer if not needed)

---

#### **M3.9: Unread Indicators + Notifications Badge** (Category: `quick`, Skills: `quick`)
**Effort**: 0.5 days
**Parallel**: Can run parallel with M3.8

**Tasks**:
- M3.9.1: Add unread count to top nav "Messages" link (badge with count)
- M3.9.2: Query unread count on page load (use `getUnreadCount(userId)`)
- M3.9.3: Update count in real-time:
  - Subscribe to all user's conversations
  - Increment count when new message arrives in other conversation
  - Decrement count when conversation marked read
- M3.9.4: Show unread dot in conversation list (MessageList component)

**Success Criteria**:
- ✅ Badge shows correct unread count
- ✅ Badge updates in real-time
- ✅ Count clears when conversation opened

**Risks**:
- ⚠️ Low risk

---

#### **M3.10: Testing + Bug Fixes** (Category: `qa`, Skills: `quick`)
**Effort**: 1 day
**Parallel**: After all M3 tasks complete

**Tasks**:
- M3.10.1: Manual QA checklist:
  - [ ] 1-on-1 conversations work
  - [ ] Group chats work
  - [ ] Messages arrive in real-time
  - [ ] Unread counts correct
  - [ ] Search finds messages
  - [ ] Public group browsing works
  - [ ] Join group works
  - [ ] "Message" button from profile works
  - [ ] Mobile: split-pane responsive
  - [ ] Supabase Realtime reconnects after disconnect
- M3.10.2: Test with multiple users in different batches (isolation)
- M3.10.3: Fix any bugs
- M3.10.4: Update E2E tests

**Success Criteria**:
- ✅ All checklist items pass
- ✅ No message leaks across batches

**Risks**:
- ⚠️ Realtime may have edge cases
- **Mitigation**: Budget extra 0.5 days

---

### M3 Parallel Execution Graph

```
M3.1 (Schema) [DAY 1]
  ↓
M3.2 (Infrastructure) [DAY 1-2]
  ↓
M3.3 (Messages UI) [DAY 2-4] ──┐
  ↓                            ↓
M3.4 (Realtime) [DAY 3-5] ─────┤
M3.5 (Start Conv) [DAY 3] ─────┤
M3.6 (Group Chat) [DAY 3-4] ───┤
  ↓                            ↓
M3.7 (Browse Groups) [DAY 4] ──┤
M3.8 (Search) [DAY 4] ─────────┤
M3.9 (Unread Badge) [DAY 4-5] ─┘
  ↓
M3.10 (QA) [DAY 5-6]
```

**Critical Path**: M3.1 → M3.2 → M3.3 → M3.4 → M3.10 (5 days minimum)
**With Parallelization**: 5-6 days total

---

### M3 Success Criteria

- [ ] 1-on-1 messaging functional
- [ ] Group chat creation/management works
- [ ] Messages arrive in real-time (Supabase Realtime)
- [ ] Unread message indicators work
- [ ] Message search functional
- [ ] Public group browsing + joining works
- [ ] "Message" button from profiles opens conversation
- [ ] Mobile: messages page responsive
- [ ] Batch isolation maintained (no cross-batch messages)

### M3 Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase Realtime RLS misconfiguration | HIGH | Thorough testing with multi-batch users |
| Message pagination breaks scroll | MEDIUM | Test with long conversations (100+ messages) |
| Unread count race conditions | LOW | Use database transactions |

---

## 🎯 OVERALL TIMELINE

| Milestone | Duration | Cumulative |
|-----------|----------|------------|
| **M1: Navigation + Feed** | 7-9 days | 7-9 days |
| **M2: Directory + Profiles** | 6-8 days | 13-17 days |
| **M3: Messaging** | 5-6 days | **18-23 days** |

**Total Effort**: 18-23 days (3.5-4.5 weeks)

---

## 📊 RESOURCE ALLOCATION BY CATEGORY

| Category | Total Tasks | Total Effort (days) |
|----------|-------------|---------------------|
| `database` | 3 | 1.5 |
| `visual-engineering` | 21 | 14.5 |
| `deep` | 10 | 9.5 |
| `quick` | 15 | 9.5 |
| `qa` | 3 | 3.0 |
| **TOTAL** | **52** | **38 days** |

**With parallelization**: 18-23 days (47% reduction)

---

## 🚀 MIGRATION EXECUTION PLAN (Big Bang)

### Pre-Migration Checklist
- [ ] All M1 tasks complete
- [ ] M1 QA passed
- [ ] User reviewed M1 checkpoint
- [ ] Database backup created

### Migration Steps (15 minutes downtime)

1. **Database Migration** (2 min)
   - Apply all M1 schema changes
   - Verify tables created
   - Run seed data (if any)

2. **Code Deployment** (5 min)
   - Deploy new layout (`(dashboard)/layout.tsx` with BookfaceTopNav)
   - Deploy new components
   - Deploy server actions

3. **Cache Invalidation** (1 min)
   - Clear `unstable_cache` tags
   - Revalidate all paths

4. **Verification** (5 min)
   - Test login flow
   - Test feed load
   - Test top nav dropdowns
   - Test search
   - Check no 500 errors in logs

5. **Rollback Plan** (if issues)
   - Revert to previous deployment
   - Database schema rollback not needed (additive changes only)

### Post-Migration Monitoring (24 hours)
- Monitor error logs (Sentry/Vercel)
- Check feed load times (<1s target)
- Monitor database query performance
- Gather user feedback

---

## 🔍 TESTING STRATEGY

### Automated Tests (E2E with Playwright)

**M1 Tests**:
- [ ] User can navigate using top nav dropdowns
- [ ] User can create post with category
- [ ] User can follow/unfollow another user
- [ ] User can bookmark/unbookmark post
- [ ] Search returns relevant posts
- [ ] Post detail page renders

**M2 Tests**:
- [ ] User can filter founders directory
- [ ] User can filter companies directory
- [ ] User can edit profile (experience/education)
- [ ] Admin can create company

**M3 Tests**:
- [ ] User can send 1-on-1 message
- [ ] User can create group chat
- [ ] Messages arrive in real-time (with polling fallback)
- [ ] Unread count updates

### Manual QA Checklist (Per Milestone)

**M1**:
- [ ] All dropdowns open/close correctly
- [ ] Feed tabs filter posts
- [ ] Post composer creates posts with link preview
- [ ] View counts increment
- [ ] Follow/bookmark works
- [ ] Search works
- [ ] Mobile responsive

**M2**:
- [ ] Directories load and filter
- [ ] Profiles display all sections
- [ ] Profile editing saves
- [ ] Company profiles render
- [ ] Admin can manage companies

**M3**:
- [ ] Messaging works (1-on-1 + group)
- [ ] Real-time updates work
- [ ] Unread indicators correct
- [ ] Search finds messages
- [ ] Batch isolation maintained

---

## ⚠️ CRITICAL RISKS & MITIGATION

| Risk | Milestone | Impact | Probability | Mitigation |
|------|-----------|--------|-------------|------------|
| Layout breaks existing pages | M1 | HIGH | MEDIUM | Test all routes after M1.4, rollback plan |
| Prisma migration drift (tsvector) | M1, M2 | MEDIUM | HIGH | Use `Unsupported("tsvector")?` in schema |
| View tracking DB load | M1 | MEDIUM | LOW | Debounce client-side, monitor query performance |
| Supabase Realtime RLS misconfiguration | M3 | HIGH | MEDIUM | Multi-user testing, security audit |
| Link preview scraping blocked | M1 | LOW | MEDIUM | Fallback to URL-only, use `user-agent: Googlebot` |
| Message pagination breaks scroll | M3 | MEDIUM | LOW | Test with 100+ message threads |
| Directory performance with large datasets | M2 | MEDIUM | LOW | Add database indexes, monitor query times |
| Component import errors from outsome-react | M1 | MEDIUM | LOW | Thorough testing in M1.2, remove react-router deps |

---

## ✅ SUCCESS METRICS (Per Milestone)

### M1: Navigation + Feed
- ✅ Top nav renders on all pages
- ✅ Feed category tabs functional
- ✅ Post creation with link preview works
- ✅ Follow system operational
- ✅ Search returns relevant posts within 300ms
- ✅ Zero regressions (all existing features work)
- ✅ Mobile: single-column responsive layout

### M2: Directory + Profiles
- ✅ Founders directory returns results with filters
- ✅ Companies directory returns results with filters
- ✅ User profiles show 4 tabs (Profile/Posts/Followers/Following)
- ✅ Profile editing saves all new fields
- ✅ Company profiles render
- ✅ Search returns multi-category results (posts + users + companies)

### M3: Messaging
- ✅ 1-on-1 messages send/receive
- ✅ Group chats work
- ✅ Messages arrive within 2 seconds (real-time)
- ✅ Unread counts accurate
- ✅ Message search functional
- ✅ Batch isolation maintained (no leaks)

---

## 📝 DELIVERABLES PER MILESTONE

### M1 Deliverables
1. New `BookfaceTopNav` component (4 dropdowns + search + profile menu)
2. Updated `(dashboard)/layout.tsx` with new layout grid
3. 23 outsome-react components in `src/components/bookface/`
4. Enhanced feed with category tabs + link previews
5. Follow/bookmark systems operational
6. PostgreSQL FTS for posts
7. M1 schema migration applied
8. E2E tests updated
9. User-facing documentation (if needed)

### M2 Deliverables
1. Founders directory page with filters
2. Companies directory page with filters
3. Enhanced user profile pages (4 tabs)
4. Company profile pages
5. Profile editing for new fields
6. Admin company management
7. Extended search (users + companies)
8. M2 schema migration applied
9. E2E tests updated

### M3 Deliverables
1. Messages page (inbox + thread view)
2. Supabase Realtime integration
3. 1-on-1 and group messaging
4. Public group browsing
5. Message search
6. Unread indicators
7. M3 schema migration applied
8. E2E tests updated

---

## 🎓 SKILLS MAPPING

| Skill Level | Agent Type | Tasks |
|-------------|------------|-------|
| **deep** | `sisyphus-junior` or `oracle` | Schema design, FTS implementation, Realtime integration, Layout refactor, Follow system |
| **quick** | `sisyphus-junior` or `frontend-engineer` | Component integration, UI widgets, Forms, Filters |
| **visual-engineering** | `frontend-engineer` | All UI/UX tasks, Component composition, Layout design |
| **database** | `oracle` | Schema migrations, Index creation |
| **qa** | `manual` | Manual testing, E2E test updates, Bug fixes |

---

## 📞 CHECKPOINT REVIEWS

### After M1 (Day 7-9)
**Deliverable**: Working top nav + enhanced feed in dev
**Review Items**:
- Does navigation feel intuitive?
- Are feed categories useful?
- Is link preview quality acceptable?
- Any performance issues?
- **GO/NO-GO Decision**: Proceed to M2?

### After M2 (Day 13-17)
**Deliverable**: Directories + enhanced profiles in dev
**Review Items**:
- Are directory filters sufficient?
- Do profiles show enough info?
- Is company data entry manageable?
- **GO/NO-GO Decision**: Proceed to M3?

### After M3 (Day 18-23)
**Deliverable**: Full messaging system in dev
**Review Items**:
- Is messaging UX smooth?
- Are real-time updates reliable?
- Any privacy concerns?
- **GO/NO-GO Decision**: Ship to production?

---

This plan is comprehensive, atomic, and ready for execution. Every task is delegatable to a specialized agent with clear success criteria and risk mitigation. The parallel execution graph ensures maximum efficiency while respecting dependencies.

**Ready to start implementation? 🚀**

<task_metadata>
session_id: ses_36d800560ffePVRBb5n0vKzYi0
subagent: plan
</task_metadata>