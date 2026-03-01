# M3 Messaging System - Implementation Documentation

## 📋 Quick Navigation

| Document | Purpose | Read This If... |
|----------|---------|-----------------|
| **[Executive Summary](./M3_EXECUTIVE_SUMMARY.md)** | High-level overview | You want a quick summary of what's being built |
| **[Decision Points](./M3_DECISION_POINTS.md)** | 5 key decisions needed | You need to make product decisions before implementation |
| **[Full Implementation Plan](./M3_MESSAGING_IMPLEMENTATION_PLAN.md)** | Complete task breakdown | You're the developer implementing this |

---

## 🎯 What This Is

A **production-ready implementation plan** for a complete YC Bookface-style messaging system with:
- Real-time message delivery via Supabase Realtime
- 1-on-1 and group conversations
- Unread tracking and notifications
- Batch isolation (founders can only message within their batch)
- Full security (RLS policies)
- Zero breaking changes to existing code

---

## 📊 At a Glance

| Metric | Value |
|--------|-------|
| **Total Tasks** | 26 |
| **Estimated Effort** | 32-40 hours |
| **Timeline (2-3 devs)** | 3-4 working days |
| **New Database Tables** | 3 |
| **New Files** | 14 |
| **Modified Files** | 6 |
| **New Server Actions** | 5 functions |

---

## ✅ Features Delivered (All from YC Bookface Screenshots)

1. **Full Messages Page** with conversation list sidebar
2. **Real-time message delivery** (< 1s latency)
3. **Unread indicators** (dots on conversations + nav badge)
4. **"Message" button on user profiles**
5. **"Message" button on company profiles**
6. **"Reply Privately" action on comments**
7. **Search conversations**
8. **Group conversations** with custom names

---

## 🚀 How to Use This Plan

### Step 1: Review
Read the **[Executive Summary](./M3_EXECUTIVE_SUMMARY.md)** first (5 minutes)

### Step 2: Decide
Answer the 5 questions in **[Decision Points](./M3_DECISION_POINTS.md)** (10 minutes)

### Step 3: Implement
Follow the **[Full Implementation Plan](./M3_MESSAGING_IMPLEMENTATION_PLAN.md)** (32-40 hours)

---

## 📐 Architecture Overview

### Database Schema
```
┌─────────────────┐
│  conversations  │
│  - id           │
│  - isGroup      │
│  - groupName    │
│  - lastMessage  │
└─────────────────┘
         │
         │ 1:N
         ▼
┌──────────────────────────┐
│ conversation_participants│
│  - conversationId        │
│  - userId                │
│  - lastReadAt (unread ✓) │
└──────────────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐
│    messages     │
│  - id           │
│  - conversationId│
│  - senderId     │
│  - content      │
└─────────────────┘
```

### Data Flow
```
User Action
    ↓
Server Action (auth + batch check)
    ↓
Prisma Write → PostgreSQL
    ↓
Supabase Realtime (RLS check)
    ↓
useRealtimeMessages Hook
    ↓
React State Update → UI
```

---

## 🔒 Security

- **RLS Policies**: Users can only see messages from their conversations
- **Batch Isolation**: Server actions enforce same-batch messaging
- **Membership Checks**: All actions verify conversation membership
- **Optimistic UI**: No client-side data manipulation, only display

---

## 🎨 Design System Compliance

- **Colors**: #1A1A1A (NOT #555AB9 purple)
- **Styling**: Inline CSS objects (NOT Tailwind for colors/spacing)
- **Fonts**: BDO Grotesk, Libre Caslon Condensed, Roboto Mono
- **Patterns**: ActionResult<T>, Prisma conventions, uuid IDs, snake_case DB

---

## 📦 Dependencies

### Existing Infrastructure (Already in Place)
- ✅ Supabase (PostgreSQL + Realtime)
- ✅ Prisma ORM
- ✅ Next.js 16 (Server Components + Server Actions)
- ✅ getCurrentUser() auth helper
- ✅ Toast notification system
- ✅ Batch system (User.batchId)

### New Dependencies (Need to Install)
- ❌ None! Uses existing stack

---

## ⚠️ Critical Constraints

These are **non-negotiable** requirements from the user:

1. **NO breaking changes** to existing functionality
2. **Follow existing patterns** exactly (Prisma conventions, inline CSS, #1A1A1A)
3. **Batch isolation** must be enforced everywhere
4. **Use #1A1A1A** design system (NOT #555AB9 purple from outsome-react)
5. **Implement ONLY features shown** in YC Bookface screenshots

---

## 📝 What's NOT Included

These features were **NOT** in YC Bookface screenshots and are deliberately excluded:
- ❌ Typing indicators
- ❌ Read receipts (beyond unread dots)
- ❌ Message editing/deletion
- ❌ File attachments
- ❌ Message reactions
- ❌ Push notifications
- ❌ Presence (online/offline)

**Why?** They weren't shown in the reference screenshots, so they're out of scope.

---

## 🧪 Testing Strategy

### Phase 7 (Final Phase)
1. **Manual QA**: 5 core user flows (1.5 hours)
2. **Batch Isolation**: SQL verification (1 hour)
3. **RLS Testing**: Supabase client tests (1.5 hours)
4. **Build & Type Check**: Zero errors (30 minutes)

### Success Criteria
- ✅ All 5 flows work end-to-end
- ✅ No console errors
- ✅ Realtime works across tabs
- ✅ Batch isolation enforced (SQL verified)
- ✅ RLS policies active and tested

---

## 🛠️ Implementation Phases

| Phase | Description | Effort | Parallel? |
|-------|-------------|--------|-----------|
| 1. Schema | Add Prisma models + RLS | 4-6h | ❌ |
| 2. Server Actions | 5 messaging functions | 8-10h | ✅ (4 parallel) |
| 3. Real-Time | useRealtimeMessages hook | 4-5h | ❌ |
| 4. Components | UI components | 10-14h | ✅ (6 parallel) |
| 5. Pages | /messages routes | 4-5h | ✅ (2 parallel) |
| 6. Integration | Wire up buttons | 3-4h | ✅ (4 parallel) |
| 7. Testing | QA + verification | 4-6h | ❌ |

**Maximum parallelism**: 6 tasks simultaneously (Phase 4)

---

## 🤔 Still Have Questions?

### Before Implementation
- Read: **[Decision Points](./M3_DECISION_POINTS.md)** — 5 questions you need to answer
- Review: **[Executive Summary](./M3_EXECUTIVE_SUMMARY.md)** — High-level overview

### During Implementation
- Follow: **[Full Implementation Plan](./M3_MESSAGING_IMPLEMENTATION_PLAN.md)** — Step-by-step tasks
- Reference: Background research from explore/librarian agents (available in session logs)

### After Implementation
- Run: Phase 7 testing checklist
- Deploy: With confidence — all edge cases covered!

---

## 🎬 Next Steps

1. **Read** the Executive Summary (5 min)
2. **Answer** the 5 Decision Points (10 min)
3. **Get approval** from stakeholders
4. **Start Phase 1**: Database Schema

**Ready?** Open `M3_DECISION_POINTS.md` and make your choices!
