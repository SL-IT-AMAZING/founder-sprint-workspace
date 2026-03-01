# M3 — Messaging System Implementation Plan

> **Goal**: Implement the messaging system shown in Bookface screenshot 13, plus "Message" buttons on profiles (screenshots 22-28), "Reply Privately" on comments (screenshot 35), and unread indicators in nav.
>
> **Constraint**: No breaking changes. Follow existing ERD conventions. Inline CSS. #1A1A1A design system only.


## Oracle Review — Finalized Decisions (2025-02-25)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Realtime strategy | **Poll server actions (3-5s)** | Consistent with arch, no RLS needed, no security hole |
| Batch scoping | **NO batchId on Conversation** | Bookface messaging is cross-batch (screenshot 13: groups have 110-200 members, far exceeding 30/batch). Follows same pattern as Follow system. |
| DM dedup | **`dmKey String? @unique`** on Conversation | Race-safe O(1) lookup. Computed as `min(a,b):max(a,b)`. NULL for groups (Postgres allows multiple NULLs). |
| User deletion | **`onDelete: SetNull`** on Message.sender | Preserve message history. senderId becomes nullable. |
| Public group index | **`@@index([isPublic, isGroup, lastMessageAt])`** | Replace separate boolean indexes for efficient browse query |
| sendMessage atomicity | **Prisma `$transaction`** | Atomic insert Message + update Conversation.lastMessage/lastMessageAt |
| Permission model | **`requireActiveBatch` only** | No batch-to-batch checks. Any user with active batch can message anyone. Cross-batch allowed (same as follows). |

---

## Schema Changes (3 new models + 2 model modifications)

```prisma
model Conversation {
  id            String   @id @default(uuid()) @db.Uuid
  isGroup       Boolean  @default(false) @map("is_group")
  groupName     String?  @map("group_name") @db.VarChar(200)
  groupEmoji    String?  @map("group_emoji") @db.VarChar(10)
  isPublic      Boolean  @default(false) @map("is_public")
  createdBy     String?  @map("created_by") @db.Uuid
  lastMessage   String?  @map("last_message") @db.Text
  lastMessageAt DateTime? @map("last_message_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  creator       User?    @relation("ConversationCreator", fields: [createdBy], references: [id], onDelete: SetNull)
  participants  ConversationParticipant[]
  messages      Message[]

  @@index([lastMessageAt])
  @@index([isPublic])
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

// User model — ADD these relations:
//   conversations    ConversationParticipant[]
//   sentMessages     Message[]
//   createdConversations Conversation[] @relation("ConversationCreator")
```

**Why `isPublic` and `createdBy` on Conversation (not on Group model)**:
Screenshot 13 shows "Browse public groups" is a messaging feature — these are group conversations, NOT the existing Group model (which is for founder groups/cohorts). Keeping messaging groups separate from founder groups avoids polluting the existing Group model and maintains clean separation of concerns.

---

## Task Breakdown

### WAVE 1 — Foundation (blocking, must complete first)

---

#### M3.1: Schema Migration
**Effort**: 30 min | **Depends on**: Nothing | **Category**: `quick`

**Files to modify**:
- `founder-sprint/prisma/schema.prisma` — Add 3 models + User relations

**Tasks**:
1. Add `Conversation`, `ConversationParticipant`, `Message` models to schema.prisma
2. Add relations to User model: `conversations`, `sentMessages`, `createdConversations`
3. Run `npx prisma generate` to validate
4. Run `npx prisma db push --url "postgresql://postgres.hyoawlhekcujihblbkkj:FounderSprint2025@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"`

**Success criteria**:
- ✅ `npx prisma generate` exits 0
- ✅ `npx prisma db push` exits 0
- ✅ Tables `conversations`, `conversation_participants`, `messages` exist in DB
- ✅ Existing 28 models untouched

**Risks**: Low. Additive-only schema change.

---

#### M3.2: Server Actions — messaging.ts
**Effort**: 3-4 hours | **Depends on**: M3.1 | **Category**: `deep`

**Files to create**:
- `founder-sprint/src/actions/messaging.ts`

**Functions to implement** (following ActionResult<T> pattern from existing actions):

```typescript
// Conversation CRUD
getOrCreateDMConversation(targetUserId: string): ActionResult<{ conversationId: string }>
createGroupConversation(name: string, emoji: string | null, isPublic: boolean, participantIds: string[]): ActionResult<{ conversationId: string }>
getUserConversations(): ActionResult<ConversationListItem[]>
getConversation(conversationId: string): ActionResult<ConversationDetail>

// Messages
getMessages(conversationId: string, limit?: number, cursor?: string): ActionResult<{ messages: MessageItem[], nextCursor: string | null }>
sendMessage(conversationId: string, content: string): ActionResult<{ messageId: string }>

// Read status
markConversationRead(conversationId: string): ActionResult<void>
getUnreadCount(): ActionResult<{ count: number }>

// Public groups
getPublicGroups(search?: string, sort?: 'recent' | 'members'): ActionResult<PublicGroupItem[]>
joinPublicGroup(conversationId: string): ActionResult<void>

// Search
searchConversations(query: string): ActionResult<ConversationListItem[]>
```

**Permission checks (CRITICAL)**:
- `getOrCreateDMConversation`: Both users must share a batch (check via UserBatch)
- `sendMessage`: User must be participant of conversation
- `getMessages`: User must be participant of conversation
- `createGroupConversation`: All participants must share a batch with creator
- `joinPublicGroup`: Conversation must be public AND isGroup

**Transactional updates**:
- `sendMessage` must atomically: create Message + update Conversation.lastMessage + Conversation.lastMessageAt

**Types to define** (in same file or separate types file):
```typescript
interface ConversationListItem {
  id: string
  isGroup: boolean
  groupName: string | null
  groupEmoji: string | null
  lastMessage: string | null
  lastMessageAt: Date | null
  unreadCount: number
  participants: { id: string; name: string | null; profileImage: string | null }[]
}

interface MessageItem {
  id: string
  content: string
  createdAt: Date
  sender: { id: string; name: string | null; profileImage: string | null }
}

interface PublicGroupItem {
  id: string
  groupName: string
  groupEmoji: string | null
  createdBy: { name: string | null } | null
  lastMessageAt: Date | null
  memberCount: number
  memberAvatars: { profileImage: string | null }[]
  isJoined: boolean
}
```

**Success criteria**:
- ✅ All functions compile with no TypeScript errors
- ✅ Permission checks prevent cross-batch messaging
- ✅ DM deduplication works (getOrCreate returns existing)
- ✅ Unread count uses lastReadAt comparison correctly

**Risks**:
- ⚠️ Race condition on getOrCreateDMConversation — two users create simultaneously
- **Mitigation**: Use @@unique([conversationId, userId]) constraint + catch P2002 error and retry

---

### WAVE 2 — UI Pages (depends on Wave 1)

---

#### M3.3: Messages Page — Inbox + Thread View
**Effort**: 6-8 hours | **Depends on**: M3.2 | **Category**: `unspecified-high`

**Files to create**:
- `founder-sprint/src/app/(dashboard)/messages/page.tsx` — Server component, inbox shell
- `founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx` — Client component, split-pane
- `founder-sprint/src/app/(dashboard)/messages/ConversationList.tsx` — Left sidebar (320px)
- `founder-sprint/src/app/(dashboard)/messages/ConversationThread.tsx` — Right pane, message bubbles + composer
- `founder-sprint/src/app/(dashboard)/messages/MessageBubble.tsx` — Individual message
- `founder-sprint/src/app/(dashboard)/messages/MessageComposer.tsx` — Input + send button

**Layout** (from screenshot 13):
```
┌──────────────────────────────────────────────┐
│ Messages    ✏️ 📤 👥 ⋯                       │
├──────────────┬───────────────────────────────┤
│ 🔍 Search    │                               │
│ Messages     │   [Conversation Thread]        │
│              │                               │
│ Mathieu R... │   Message bubbles              │
│ Jan 16       │   chronological                │
│ You: Sure... │                               │
│              │                               │
│ YC Cancun... │                               │
│ Jan 14       │                               │
│ Skyler: dw.. │   ┌─────────────────────┐     │
│              │   │ Type a message...   │ ➤   │
│ Pranav B...  │   └─────────────────────┘     │
│ Jan 9        │                               │
├──────────────┴───────────────────────────────┤
│              320px          1fr              │
└──────────────────────────────────────────────┘
```

**Key UI details from screenshot 13**:
- Conversation list items: avatar (circular, 40px), name (bold), batch badge (optional), timestamp (right-aligned), preview text (gray, truncated 1 line)
- Group conversations show overlapping avatars
- Blue unread dot (left edge of unread conversations)
- Header has 4 action icons: compose (pencil), share, group browse, more (⋯)
- System message "Welcome to YC Messaging" with YC logo avatar
- Active conversation highlighted with subtle background

**Styling rules**:
- All inline CSS, NO Tailwind for colors/spacing
- Card bg: #FFFFFF, page bg: #fefaf3
- Text primary: #2F2C26, secondary: #666666, muted: #999999
- Border: #e0e0e0
- Unread dot: #1A1A1A
- Message bubble (own): #1A1A1A bg, #FFFFFF text
- Message bubble (other): #f1eadd bg, #2F2C26 text
- Border radius: 8px cards, 16px bubbles
- Font: inherit (BDO Grotesk)

**Success criteria**:
- ✅ Split-pane layout renders correctly
- ✅ Conversation list shows all user's conversations sorted by lastMessageAt DESC
- ✅ Clicking conversation loads messages in right pane
- ✅ Unread dots show for conversations with unread messages
- ✅ Message composer sends messages and they appear in thread
- ✅ Messages display in chronological order with sender avatars
- ✅ Auto-scroll to bottom on load and new message
- ✅ Empty state when no conversations exist

---

#### M3.4: Supabase Realtime Integration
**Effort**: 3-4 hours | **Depends on**: M3.3 | **Category**: `deep`

**Files to create**:
- `founder-sprint/src/hooks/useRealtimeMessages.ts` — Subscribe to conversation messages
- `founder-sprint/src/hooks/useUnreadCount.ts` — Global unread count for nav badge

**useRealtimeMessages(conversationId, onNewMessage)**:
```typescript
// Subscribe to postgres_changes on messages table
// Filter: conversation_id=eq.${conversationId}
// Event: INSERT
// On new message: call onNewMessage callback
// Config: broadcast { self: false }
// Cleanup: removeChannel on unmount
// Fallback: poll every 5s if subscription fails after 3 retries
```

**useUnreadCount()**:
```typescript
// On mount: fetch initial unread count via getUnreadCount() server action
// Subscribe to postgres_changes on messages table (no conversation filter — ALL user's conversations)
// On new message in a non-active conversation: increment count
// On markConversationRead: decrement count
// Return: { unreadCount, refreshUnreadCount }
```

**Success criteria**:
- ✅ New messages appear instantly without page refresh
- ✅ Own messages don't duplicate (self: false)
- ✅ Cleanup on unmount (no memory leaks)
- ✅ Fallback polling works if realtime disconnects
- ✅ Unread count updates in real-time

**Risks**:
- ⚠️ Supabase Realtime must be enabled on the project
- **Mitigation**: Document in USER_ACTION_REQUIRED.md if needed
- ⚠️ Subscription filter must match conversation_id — user could receive messages from conversations they're not in if RLS is misconfigured
- **Mitigation**: Server actions already enforce permission; client only displays what server returns

---

### WAVE 3 — Integration Points (parallel, depends on Wave 2)

---

#### M3.5: "Message" Button on User Profiles
**Effort**: 1 hour | **Depends on**: M3.2 | **Category**: `quick`

**Files to modify**:
- `founder-sprint/src/app/(dashboard)/profile/[userId]/page.tsx` — Add Message button next to Follow

**Implementation**:
- Add "Message" button next to existing FollowButton
- On click: call `getOrCreateDMConversation(userId)`, then `router.push(/messages?conversation=${conversationId})`
- Hide if viewing own profile
- Style: same as Follow button but with chat icon, `backgroundColor: '#1A1A1A'`, `color: '#FFFFFF'`, `borderRadius: '9px'`

**Success criteria**:
- ✅ Message button visible on other users' profiles
- ✅ Hidden on own profile
- ✅ Click creates/opens DM conversation
- ✅ Redirects to /messages with conversation selected

---

#### M3.6: "Message" Button on Company Profiles
**Effort**: 45 min | **Depends on**: M3.2 | **Category**: `quick`

**Files to modify**:
- `founder-sprint/src/app/(dashboard)/companies/[slug]/page.tsx` — Add Message button

**Implementation**:
- Add "Message" button in company header area
- On click: message the first active founder of the company (query CompanyMember where role = 'founder')
- If no founders: disable button with tooltip "No founders to message"

**Success criteria**:
- ✅ Message button on company profile header
- ✅ Opens DM with company's primary founder
- ✅ Disabled gracefully if no founders

---

#### M3.7: "Reply Privately" on Comments
**Effort**: 1 hour | **Depends on**: M3.2 | **Category**: `quick`

**Files to modify**:
- `founder-sprint/src/components/bookface/CommentThread.tsx` — Add "Reply Privately" action

**Implementation**:
- Add "Reply Privately" link after existing "Reply" action on each comment
- On click: call `getOrCreateDMConversation(comment.author.id)`, then navigate to `/messages?conversation=${conversationId}`
- Style: same as existing "Reply" link text, separated by " | "

**Success criteria**:
- ✅ "Reply Privately" appears on all comments (except own)
- ✅ Click opens/creates DM with comment author
- ✅ Navigates to messaging page

---

#### M3.8: Browse Public Groups Modal
**Effort**: 3-4 hours | **Depends on**: M3.2, M3.3 | **Category**: `unspecified-high`

**Files to create**:
- `founder-sprint/src/app/(dashboard)/messages/BrowseGroupsModal.tsx`
- `founder-sprint/src/app/(dashboard)/messages/CreateGroupModal.tsx`

**BrowseGroupsModal layout** (from screenshot 13):
```
┌────────────────────────────────────────────┐
│ Browse public groups          [Create group]│
├────────────────────────────────────────────┤
│ 🔍 Search...              Recently Active ▾│
├────────────────────────────────────────────┤
│ 🟠 Robotics founders                       │
│ Created by Y Combinator · Last active 7h   │
│ 👤👤👤👤👤👤👤👤👤👤  110 members          │
├────────────────────────────────────────────┤
│ 🟠 Deeptech founders                       │
│ Created by Y Combinator · Last active 15h  │
│ 👤👤👤👤👤👤👤👤👤👤  131 members          │
├────────────────────────────────────────────┤
│ ...                                        │
└────────────────────────────────────────────┘
```

**CreateGroupModal**:
- Group name input
- Emoji picker (optional, or just text input)
- Public/Private toggle
- Multi-select user picker (search batch members)
- Create button

**Success criteria**:
- ✅ Modal triggered from group icon in Messages header
- ✅ Public groups listed with member count, creator, last active
- ✅ Search filters groups by name
- ✅ Sort by "Recently Active" / "Most Members"
- ✅ Click group → joinPublicGroup() → navigate to conversation
- ✅ "Create group" opens CreateGroupModal
- ✅ Group creation works with name, participants, public flag

---

#### M3.9: Nav Update — Envelope Icon + Unread Badge
**Effort**: 1 hour | **Depends on**: M3.4 (useUnreadCount) | **Category**: `quick`

**Files to modify**:
- `founder-sprint/src/components/layout/BookfaceTopNav.tsx`

**Implementation**:
- Add "Messages" link to Contact dropdown (or as standalone icon)
- Add envelope SVG icon next to "Contact" in nav (matching screenshot 08, 13, 14)
- Wrap in link to `/messages`
- Add unread count badge (red/dark circle with white number) using useUnreadCount hook
- Badge hidden when count = 0

**Note**: BookfaceTopNav is currently a server component. The unread badge requires client-side state (useUnreadCount hook). Options:
1. Make entire nav client component (bad — loses SSR benefits)
2. Extract badge into a small `UnreadBadge.tsx` client component and embed it (good)

**Approach**: Create `UnreadBadge.tsx` as "use client" component, render it inside the server nav.

**Files to create**:
- `founder-sprint/src/components/layout/UnreadBadge.tsx` — Client component for real-time unread count

**Success criteria**:
- ✅ Envelope icon visible in nav
- ✅ Clicking navigates to /messages
- ✅ Unread badge shows count when > 0
- ✅ Badge updates in real-time
- ✅ Badge hidden when count = 0

---

#### M3.10: Message Search
**Effort**: 1-2 hours | **Depends on**: M3.3 | **Category**: `quick`

**Implementation** (within ConversationList.tsx):
- Search input at top of conversation list (already in M3.3 layout)
- On input change (debounced 300ms): call `searchConversations(query)`
- Results replace conversation list
- Each result shows: conversation name/participant + matching message snippet
- Click result → select that conversation + scroll to matching message
- Clear search → restore full conversation list

**Success criteria**:
- ✅ Search input in conversation list header
- ✅ Searches across conversation names and message content
- ✅ Results display with preview snippet
- ✅ Click result opens conversation

---

### WAVE 4 — Verification (after all waves complete)

---

#### M3.11: Build Verification + QA
**Effort**: 1-2 hours | **Depends on**: All M3 tasks

**Verification steps**:
1. `tsc --noEmit` — zero TypeScript errors
2. `npm run build` — all routes compile, exit 0
3. No `#555AB9` in any new .tsx files
4. No Tailwind classes for colors/spacing in new files
5. LSP diagnostics clean on all modified files

**Manual QA checklist**:
- [ ] Create 1-on-1 DM from profile page
- [ ] Send messages back and forth
- [ ] Messages appear in real-time (no refresh needed)
- [ ] Create group conversation
- [ ] Browse public groups modal works
- [ ] Join public group
- [ ] Unread dots appear for new messages
- [ ] Nav badge shows unread count
- [ ] "Reply Privately" on comment opens DM
- [ ] Message search finds conversations
- [ ] Company profile "Message" button works
- [ ] Empty states display correctly
- [ ] Mobile responsive (conversation list collapses)

---

## Parallel Execution Graph

```
WAVE 1 (Sequential — blocking):
  M3.1 (Schema)  ──→  M3.2 (Server Actions)

WAVE 2 (Depends on Wave 1):
  M3.3 (Messages Page UI)  ──→  M3.4 (Realtime)

WAVE 3 (Parallel — each depends on M3.2, independent of each other):
  ┌── M3.5 (Profile Message Button)
  ├── M3.6 (Company Message Button)
  ├── M3.7 (Reply Privately)
  ├── M3.8 (Browse/Create Groups)  [depends on M3.3 too]
  ├── M3.9 (Nav Envelope + Badge)  [depends on M3.4 too]
  └── M3.10 (Message Search)       [depends on M3.3 too]

WAVE 4 (After everything):
  M3.11 (Build Verification + QA)
```

**Optimal execution with parallelization**:
- Day 1: M3.1 → M3.2
- Day 2-3: M3.3 (main UI work)
- Day 3: M3.5 + M3.6 + M3.7 (parallel, quick)
- Day 3-4: M3.4 (realtime) + M3.8 (groups)
- Day 4: M3.9 + M3.10 (parallel)
- Day 4-5: M3.11 (QA)
- **Total: 4-5 days**

---

## Files Summary

### New Files (14):
```
founder-sprint/src/actions/messaging.ts
founder-sprint/src/hooks/useRealtimeMessages.ts
founder-sprint/src/hooks/useUnreadCount.ts
founder-sprint/src/app/(dashboard)/messages/page.tsx
founder-sprint/src/app/(dashboard)/messages/MessagesClient.tsx
founder-sprint/src/app/(dashboard)/messages/ConversationList.tsx
founder-sprint/src/app/(dashboard)/messages/ConversationThread.tsx
founder-sprint/src/app/(dashboard)/messages/MessageBubble.tsx
founder-sprint/src/app/(dashboard)/messages/MessageComposer.tsx
founder-sprint/src/app/(dashboard)/messages/BrowseGroupsModal.tsx
founder-sprint/src/app/(dashboard)/messages/CreateGroupModal.tsx
founder-sprint/src/components/layout/UnreadBadge.tsx
```

### Modified Files (4):
```
founder-sprint/prisma/schema.prisma          — Add 3 models + User relations
founder-sprint/src/components/layout/BookfaceTopNav.tsx — Add Messages link + UnreadBadge
founder-sprint/src/app/(dashboard)/profile/[userId]/page.tsx — Add Message button
founder-sprint/src/app/(dashboard)/companies/[slug]/page.tsx — Add Message button
founder-sprint/src/components/bookface/CommentThread.tsx — Add "Reply Privately"
```

### Existing Files NOT Modified:
- All existing 28 models remain unchanged
- All existing 35 routes remain unchanged
- All existing 19 server action files remain unchanged
- All existing 28 bookface components remain unchanged
- Navbar.tsx and DashboardSidebar.tsx preserved for rollback

---

## Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Supabase Realtime not enabled on project | LOW | HIGH | Check dashboard settings before M3.4; document in USER_ACTION_REQUIRED if needed |
| Race condition on DM creation | LOW | LOW | Unique constraint catches duplicate; retry on P2002 |
| Cross-batch message leak | MEDIUM | HIGH | Server action checks batch membership before every operation |
| Scroll position breaks with pagination | MEDIUM | MEDIUM | Use ref-based scrollIntoView with anchor element |
| Large conversation lists slow | LOW | MEDIUM | Paginate conversations (limit 50), lazy load older |
| Realtime disconnects silently | MEDIUM | MEDIUM | Fallback polling at 5s; "Reconnecting..." indicator |

---

## Design System Reference (for all new components)

```
Primary:        #1A1A1A
Primary Hover:  #333333
Background:     #fefaf3
Background Alt: #f1eadd
Card BG:        #FFFFFF
Text Primary:   #2F2C26
Text Secondary: #666666
Text Muted:     #999999
Border:         #e0e0e0
Border Light:   #f1eadd
Success:        #2E7D32
Error:          #C62828

Card radius:    8px
Button radius:  9px
Bubble radius:  16px
Section padding: 20-24px

Own message bubble:    bg #1A1A1A, text #FFFFFF
Other message bubble:  bg #f1eadd, text #2F2C26

Fonts: BDO Grotesk (sans), Libre Caslon Condensed (serif), Roboto Mono (mono)
```

---

## Delegation Plan (Category + Skills per task)

| Task | Category | Skills | Sync/Background |
|------|----------|--------|-----------------|
| M3.1 Schema | `quick` | `[]` | sync |
| M3.2 Server Actions | `deep` | `[]` | sync |
| M3.3 Messages Page | `unspecified-high` | `["frontend-ui-ux"]` | sync |
| M3.4 Realtime | `deep` | `[]` | sync |
| M3.5 Profile Button | `quick` | `[]` | sync (can parallel) |
| M3.6 Company Button | `quick` | `[]` | sync (can parallel) |
| M3.7 Reply Privately | `quick` | `[]` | sync (can parallel) |
| M3.8 Group Modals | `unspecified-high` | `["frontend-ui-ux"]` | sync |
| M3.9 Nav Badge | `quick` | `[]` | sync |
| M3.10 Search | `quick` | `[]` | sync |
| M3.11 QA | manual | `[]` | sync |
