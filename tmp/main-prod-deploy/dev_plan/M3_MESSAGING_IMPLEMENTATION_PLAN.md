# M3 Messaging System - Production-Ready Implementation Plan

## Executive Summary

This plan implements a complete YC Bookface-style messaging system with:
- 1-on-1 and group conversations
- Real-time message delivery via Supabase Realtime
- Unread indicators and conversation search
- "Message" buttons on profiles and "Reply Privately" on comments
- Full batch isolation and proper auth checks
- Zero breaking changes to existing functionality

**Estimated Total Effort:** 32-40 hours  
**Critical Path:** Schema → Server Actions → Realtime Hook → UI Components → Integration  
**Parallel Execution:** Up to 6 tasks can run simultaneously (see dependency graph)

---

## Architecture Overview

### Tech Stack Decisions
| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Database | PostgreSQL + Prisma | Existing pattern; uuid IDs, snake_case conventions |
| Real-time | Supabase Realtime (postgres_changes) | Already configured; MVP uses postgres_changes, future: migrate to Broadcast |
| Auth | Next.js server actions + getCurrentUser() | Existing pattern; RLS required for Realtime security |
| UI | React Server Components + Client Islands | Existing pattern; inline CSS styles, NOT Tailwind colors |
| State | React useState + Optimistic UI | Simple, matches existing patterns (InlineComposer) |
| Unread Tracking | `lastReadAt` timestamp | Industry best practice; no race conditions |

### Data Flow
```
User Action → Server Action (auth check) → Prisma Write → DB
                                              ↓
                                         PostgreSQL
                                              ↓
                                    Supabase Realtime (RLS check)
                                              ↓
Client useRealtimeMessages Hook → State Update → UI Re-render
```

---

## Schema Changes

### New Tables (3)

```prisma
model Conversation {
  id            String   @id @default(uuid()) @db.Uuid
  isGroup       Boolean  @default(false) @map("is_group")
  groupName     String?  @map("group_name") @db.VarChar(200)
  lastMessage   String?  @map("last_message") @db.Text
  lastMessageAt DateTime? @map("last_message_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")
  
  participants  ConversationParticipant[]
  messages      Message[]
  
  @@index([lastMessageAt])
  @@map("conversations")
}

model ConversationParticipant {
  id             String   @id @default(uuid()) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  joinedAt       DateTime @default(now()) @map("joined_at")
  lastReadAt     DateTime @default(now()) @map("last_read_at")
  
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user           User @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@unique([conversationId, userId])
  @@index([userId])
  @@index([conversationId])
  @@index([userId, lastReadAt])
  @@map("conversation_participants")
}

model Message {
  id             String   @id @default(uuid()) @db.Uuid
  conversationId String   @map("conversation_id") @db.Uuid
  senderId       String   @map("sender_id") @db.Uuid
  content        String   @db.Text
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")
  
  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User @relation(fields: [senderId], references: [id], onDelete: Cascade)
  
  @@index([conversationId, createdAt])
  @@index([senderId])
  @@map("messages")
}
```

### User Model Additions

```prisma
model User {
  // ... existing fields ...
  
  // NEW RELATIONS
  conversations  ConversationParticipant[]
  sentMessages   Message[]
}
```

### RLS Policies (Required for Supabase Realtime Security)

```sql
-- Enable RLS on messages table
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT messages from their conversations
CREATE POLICY "Users see own conversation messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Add to Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

---

## Task Breakdown

### Phase 1: Database Schema (3 tasks, 4-6 hours)

#### T1.1: Add Prisma Schema Models
**Dependencies:** None  
**Effort:** 1 hour  
**Category:** backend  
**Files to modify:**
- `prisma/schema.prisma` — Add Conversation, ConversationParticipant, Message models + User relations

**Success Criteria:**
- ✅ All fields follow existing conventions (@map, @@map, @db.Uuid)
- ✅ Relations properly defined with onDelete: Cascade
- ✅ Indexes on FK columns and query patterns
- ✅ `npx prisma format` passes

**Verification:**
```bash
npx prisma format
npx prisma validate
```

---

#### T1.2: Push Schema to Database
**Dependencies:** T1.1  
**Effort:** 30 minutes  
**Category:** backend  
**Command:**
```bash
npx prisma db push --url "postgresql://postgres.hyoawlhekcujihblbkkj:FounderSprint2025@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"
```

**Success Criteria:**
- ✅ All 3 new tables created in Supabase
- ✅ User table updated with new relations
- ✅ All indexes created
- ✅ No errors in push output

**Verification:**
```bash
npx prisma db pull  # Should show no changes
```

---

#### T1.3: Configure RLS Policies
**Dependencies:** T1.2  
**Effort:** 2-3 hours  
**Category:** backend  
**Files to create:**
- `prisma/rls-policies.sql` — RLS policies for messages table + Realtime publication

**SQL to execute:**
```sql
-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SELECT policy for authenticated users (own conversations only)
CREATE POLICY "Users see own conversation messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Add to Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE messages;

-- Performance index for RLS policy
CREATE INDEX IF NOT EXISTS idx_conversation_participants_lookup 
  ON conversation_participants(user_id, conversation_id);
```

**Success Criteria:**
- ✅ RLS enabled on messages table (visible in Supabase dashboard)
- ✅ Policy created and active
- ✅ messages table added to supabase_realtime publication
- ✅ Index created for policy performance

**Verification:**
- Check Supabase Dashboard → Authentication → Policies
- Run: `SELECT * FROM pg_policies WHERE tablename = 'messages';`
- Run: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';`

**Risk:** RLS policy must correctly filter; test with authenticated Supabase client before proceeding.

---

### Phase 2: Server Actions (5 tasks, 8-10 hours)

#### T2.1: Create Messaging Server Actions Scaffold
**Dependencies:** T1.2  
**Effort:** 2 hours  
**Category:** backend  
**Files to create:**
- `lib/actions/messaging.ts`

**Functions to implement:**
```typescript
"use server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

// Type definitions
export type ConversationWithParticipants = {
  id: string;
  isGroup: boolean;
  groupName: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  participants: {
    id: string;
    name: string;
    profileImage: string | null;
    jobTitle: string | null;
    company: string | null;
  }[];
};

export type MessageWithSender = {
  id: string;
  content: string;
  createdAt: Date;
  sender: {
    id: string;
    name: string;
    profileImage: string | null;
  };
};

// Schemas
const CreateMessageSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

const StartConversationSchema = z.object({
  participantIds: z.array(z.string().uuid()).min(1).max(29), // Max 30 including sender
  groupName: z.string().min(1).max(200).optional(),
});

// Action stubs (to be implemented in T2.2-T2.5)
export async function getConversations(): Promise<ActionResult<ConversationWithParticipants[]>> {
  // TODO: T2.2
}

export async function getMessages(conversationId: string): Promise<ActionResult<MessageWithSender[]>> {
  // TODO: T2.3
}

export async function sendMessage(data: z.infer<typeof CreateMessageSchema>): Promise<ActionResult<MessageWithSender>> {
  // TODO: T2.4
}

export async function startConversation(data: z.infer<typeof StartConversationSchema>): Promise<ActionResult<{ conversationId: string }>> {
  // TODO: T2.5
}

export async function markConversationRead(conversationId: string): Promise<ActionResult<void>> {
  // TODO: T2.5
}
```

**Success Criteria:**
- ✅ File structure matches existing actions pattern
- ✅ All type exports defined
- ✅ Zod schemas for validation
- ✅ Function signatures with ActionResult<T>
- ✅ No TypeScript errors

---

#### T2.2: Implement getConversations()
**Dependencies:** T2.1  
**Effort:** 2-3 hours  
**Category:** backend  
**Files to modify:**
- `lib/actions/messaging.ts`

**Implementation:**
```typescript
export async function getConversations(): Promise<ActionResult<ConversationWithParticipants[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // Batch gate check
  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<ConversationWithParticipants[]>;

  try {
    // Efficient query: get all conversations with unread counts in ONE query
    const conversations = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id,
        c.is_group as "isGroup",
        c.group_name as "groupName",
        c.last_message as "lastMessage",
        c.last_message_at as "lastMessageAt",
        COUNT(m.id) FILTER (
          WHERE m.created_at > cp.last_read_at 
          AND m.sender_id != ${user.id}
        ) as "unreadCount",
        jsonb_agg(
          jsonb_build_object(
            'id', u.id,
            'name', u.name,
            'profileImage', u.profile_image,
            'jobTitle', u.job_title,
            'company', u.company
          ) ORDER BY u.name
        ) FILTER (WHERE u.id != ${user.id}) as participants
      FROM conversations c
      JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = ${user.id}
      JOIN conversation_participants cp_all ON cp_all.conversation_id = c.id
      JOIN users u ON u.id = cp_all.user_id
      LEFT JOIN messages m ON m.conversation_id = c.id
      WHERE u.batch_id = ${user.batchId}  -- Batch isolation
      GROUP BY c.id, c.is_group, c.group_name, c.last_message, c.last_message_at, cp.last_read_at
      ORDER BY c.last_message_at DESC NULLS LAST
    `;

    return { success: true, data: conversations };
  } catch (error) {
    console.error("getConversations error:", error);
    return { success: false, error: "Failed to fetch conversations" };
  }
}
```

**Success Criteria:**
- ✅ Returns all user's conversations sorted by lastMessageAt
- ✅ Includes unread count (efficient single query, not N+1)
- ✅ Filters participants to exclude current user (for 1-on-1 display)
- ✅ Enforces batch isolation (only shows users from same batch)
- ✅ Handles empty conversations (no messages yet)

**Verification:**
- Create test conversation manually in DB
- Call action from a test page
- Verify unread count calculation
- Test with multiple batches (should not see cross-batch)

---

#### T2.3: Implement getMessages()
**Dependencies:** T2.1  
**Effort:** 1.5 hours  
**Category:** backend  
**Files to modify:**
- `lib/actions/messaging.ts`

**Implementation:**
```typescript
export async function getMessages(conversationId: string): Promise<ActionResult<MessageWithSender[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<MessageWithSender[]>;

  // Validate UUID
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
    return { success: false, error: "Invalid conversation ID" };
  }

  try {
    // 1. Check membership
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      return { success: false, error: "Not a member of this conversation" };
    }

    // 2. Fetch messages with sender info
    const messages = await prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: 500, // Limit to most recent 500 messages for performance
    });

    return { success: true, data: messages };
  } catch (error) {
    console.error("getMessages error:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}
```

**Success Criteria:**
- ✅ Validates conversation membership before returning messages
- ✅ Returns messages in chronological order (oldest first)
- ✅ Includes sender name + avatar
- ✅ Handles non-existent conversation gracefully
- ✅ Limits to 500 messages (performance)

**Verification:**
- Test with valid conversation ID (user is member)
- Test with valid ID (user NOT member) → should return error
- Test with invalid UUID → should return error

---

#### T2.4: Implement sendMessage()
**Dependencies:** T2.1  
**Effort:** 2 hours  
**Category:** backend  
**Files to modify:**
- `lib/actions/messaging.ts`

**Implementation:**
```typescript
export async function sendMessage(data: z.infer<typeof CreateMessageSchema>): Promise<ActionResult<MessageWithSender>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<MessageWithSender>;

  // Validate input
  const parsed = CreateMessageSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid message data" };
  }

  const { conversationId, content } = parsed.data;

  try {
    // 1. Check membership
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
    });

    if (!participant) {
      return { success: false, error: "Not a member of this conversation" };
    }

    // 2. Create message + update conversation metadata in transaction
    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content,
        },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              profileImage: true,
            },
          },
        },
      });

      // Update conversation last message metadata
      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: content.substring(0, 200), // Truncate for preview
          lastMessageAt: newMessage.createdAt,
        },
      });

      return newMessage;
    });

    // 3. Revalidate messages page
    revalidatePath(`/messages/${conversationId}`);
    revalidatePath("/messages");

    return { success: true, data: message };
  } catch (error) {
    console.error("sendMessage error:", error);
    return { success: false, error: "Failed to send message" };
  }
}
```

**Success Criteria:**
- ✅ Validates membership before allowing send
- ✅ Creates message in DB with proper relations
- ✅ Updates conversation lastMessage/lastMessageAt atomically
- ✅ Truncates long messages for preview (200 chars)
- ✅ Revalidates paths for RSC refresh
- ✅ Returns created message with sender info

**Verification:**
- Send message to valid conversation → should succeed
- Send message to conversation user not in → should fail
- Send empty/whitespace message → should fail (Zod validation)
- Verify lastMessage updated in conversations table

---

#### T2.5: Implement startConversation() + markConversationRead()
**Dependencies:** T2.1  
**Effort:** 2-3 hours  
**Category:** backend  
**Files to modify:**
- `lib/actions/messaging.ts`

**Implementation (startConversation):**
```typescript
export async function startConversation(data: z.infer<typeof StartConversationSchema>): Promise<ActionResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<{ conversationId: string }>;

  const parsed = StartConversationSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid conversation data" };
  }

  const { participantIds, groupName } = parsed.data;
  const isGroup = participantIds.length > 1 || !!groupName;

  // Add current user to participants
  const allParticipantIds = [...new Set([user.id, ...participantIds])];

  try {
    // 1. Verify all participants exist and are in same batch
    const participants = await prisma.user.findMany({
      where: {
        id: { in: allParticipantIds },
        batchId: user.batchId, // Batch isolation
      },
      select: { id: true },
    });

    if (participants.length !== allParticipantIds.length) {
      return { success: false, error: "Some participants not found or not in your batch" };
    }

    // 2. For 1-on-1, check if conversation already exists
    if (!isGroup) {
      const existing = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            every: {
              userId: { in: allParticipantIds },
            },
          },
        },
        include: {
          participants: {
            select: { userId: true },
          },
        },
      });

      // Verify it's exactly the same participants
      if (existing && existing.participants.length === allParticipantIds.length) {
        return { success: true, data: { conversationId: existing.id } };
      }
    }

    // 3. Create new conversation with participants
    const conversation = await prisma.conversation.create({
      data: {
        isGroup,
        groupName: isGroup ? groupName : null,
        participants: {
          create: allParticipantIds.map((userId) => ({
            userId,
          })),
        },
      },
    });

    revalidatePath("/messages");

    return { success: true, data: { conversationId: conversation.id } };
  } catch (error) {
    console.error("startConversation error:", error);
    return { success: false, error: "Failed to create conversation" };
  }
}
```

**Implementation (markConversationRead):**
```typescript
export async function markConversationRead(conversationId: string): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    await prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    revalidatePath("/messages");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("markConversationRead error:", error);
    return { success: false, error: "Failed to mark conversation as read" };
  }
}
```

**Success Criteria:**
- ✅ startConversation() enforces batch isolation
- ✅ Prevents duplicate 1-on-1 conversations (returns existing if found)
- ✅ Allows duplicate group conversations (users can create multiple groups with same people)
- ✅ Creates all participants atomically
- ✅ markConversationRead() updates lastReadAt timestamp
- ✅ Both functions revalidate /messages path

**Verification:**
- Start 1-on-1 conversation → should succeed
- Start same 1-on-1 again → should return existing conversation ID
- Start conversation with user from different batch → should fail
- Mark conversation as read → lastReadAt updated in DB

---

### Phase 3: Real-time Infrastructure (2 tasks, 4-5 hours)

#### T3.1: Create Supabase Client Singleton
**Dependencies:** T1.3 (RLS must be configured)  
**Effort:** 1 hour  
**Category:** frontend  
**Files to create:**
- `lib/supabase/client-singleton.ts`

**Implementation:**
```typescript
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase environment variables");
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        logLevel: process.env.NODE_ENV === "development" ? "info" : "error",
      },
    });
  }

  return supabaseClient;
}

// For debugging channel leaks
export function getActiveChannels() {
  if (!supabaseClient) return [];
  return supabaseClient.getChannels();
}

export function removeAllChannels() {
  if (!supabaseClient) return;
  return supabaseClient.removeAllChannels();
}
```

**Success Criteria:**
- ✅ Singleton pattern (one client instance)
- ✅ Uses environment variables
- ✅ Logging enabled in development
- ✅ Exports debug helpers

**Verification:**
- Import in multiple components → same instance
- Log `getActiveChannels()` → should be empty initially

---

#### T3.2: Create useRealtimeMessages Hook
**Dependencies:** T3.1, T2.4 (sendMessage must exist)  
**Effort:** 3-4 hours  
**Category:** frontend  
**Files to create:**
- `hooks/useRealtimeMessages.ts`

**Implementation:**
```typescript
"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupabaseClient } from "@/lib/supabase/client-singleton";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
    profileImage: string | null;
  };
};

type OptimisticMessage = Message & { status: "sending" | "failed" };

export function useRealtimeMessages(
  conversationId: string,
  initialMessages: Message[],
  currentUserId: string
) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [optimisticMessages, setOptimisticMessages] = useState<OptimisticMessage[]>([]);
  const [connectionState, setConnectionState] = useState<"connected" | "connecting" | "disconnected" | "error">("connecting");

  // Subscribe to real-time updates
  useEffect(() => {
    const supabase = getSupabaseClient();
    let channel: RealtimeChannel;

    const subscribeToMessages = async () => {
      channel = supabase
        .channel(`messages:${conversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${conversationId}`,
          },
          (payload) => {
            const newMessage = payload.new as any;
            
            // Skip if it's our own message (already in state from optimistic update)
            if (newMessage.sender_id === currentUserId) {
              return;
            }

            // Add message from other users
            setMessages((prev) => {
              // Dedup: check if message already exists
              if (prev.some((m) => m.id === newMessage.id)) return prev;
              
              return [
                ...prev,
                {
                  id: newMessage.id,
                  conversationId: newMessage.conversation_id,
                  senderId: newMessage.sender_id,
                  content: newMessage.content,
                  createdAt: newMessage.created_at,
                  sender: {
                    id: newMessage.sender_id,
                    name: "Unknown", // Will be populated by server on refresh
                    profileImage: null,
                  },
                },
              ];
            });
          }
        )
        .subscribe((status, error) => {
          if (status === "SUBSCRIBED") {
            setConnectionState("connected");
          } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
            console.error("Realtime subscription error:", error);
            setConnectionState("error");
          } else if (status === "CLOSED") {
            setConnectionState("disconnected");
          }
        });
    };

    subscribeToMessages();

    // Cleanup on unmount or conversationId change
    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [conversationId, currentUserId]);

  // Add optimistic message
  const addOptimisticMessage = useCallback((content: string, sender: { id: string; name: string; profileImage: string | null }) => {
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticMsg: OptimisticMessage = {
      id: tempId,
      conversationId,
      senderId: sender.id,
      content,
      createdAt: new Date().toISOString(),
      sender,
      status: "sending",
    };

    setOptimisticMessages((prev) => [...prev, optimisticMsg]);
    return tempId;
  }, [conversationId]);

  // Resolve optimistic message (success)
  const resolveOptimisticMessage = useCallback((tempId: string, realMessage: Message) => {
    setOptimisticMessages((prev) => prev.filter((m) => m.id !== tempId));
    setMessages((prev) => {
      // Dedup: check if already exists
      if (prev.some((m) => m.id === realMessage.id)) return prev;
      return [...prev, realMessage];
    });
  }, []);

  // Reject optimistic message (failure)
  const rejectOptimisticMessage = useCallback((tempId: string) => {
    setOptimisticMessages((prev) =>
      prev.map((m) => (m.id === tempId ? { ...m, status: "failed" as const } : m))
    );
  }, []);

  // Merged list for display
  const allMessages = [...messages, ...optimisticMessages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  return {
    messages: allMessages,
    connectionState,
    addOptimisticMessage,
    resolveOptimisticMessage,
    rejectOptimisticMessage,
  };
}
```

**Success Criteria:**
- ✅ Subscribes to postgres_changes with conversation filter
- ✅ Optimistic UI: adds message immediately, resolves on success
- ✅ Deduplicates messages (checks ID before adding)
- ✅ Skips own messages from Realtime (already in optimistic state)
- ✅ Tracks connection state for UI feedback
- ✅ Cleans up subscription on unmount

**Verification:**
- Open conversation in two browser tabs (different users)
- Send message from tab 1 → should appear in tab 2 via Realtime
- Disconnect network → connectionState should show "error"
- Check `getActiveChannels()` after unmount → should be empty

**Risk:** RLS policy must be correct; if messages don't appear, check Supabase logs for RLS denials.

---

### Phase 4: UI Components (6 tasks, 10-14 hours)

#### T4.1: Adapt MessageList Component
**Dependencies:** T2.2 (getConversations must exist)  
**Effort:** 2 hours  
**Category:** frontend  
**Files to modify:**
- `src/components/bookface/MessageList.tsx`

**Changes:**
1. Remove mock data
2. Accept `conversations: ConversationWithParticipants[]` prop
3. Update interface to match server action return type
4. Keep all inline CSS styles (NO Tailwind colors)
5. Update colors: `#555AB9` → `#1A1A1A`
6. Add loading state prop

**Success Criteria:**
- ✅ Displays real conversation data from props
- ✅ Shows unread dot if `unreadCount > 0`
- ✅ Formats lastMessageAt with relative time
- ✅ Handles empty state (no conversations)
- ✅ All inline styles use #1A1A1A design system
- ✅ Search functionality works (client-side filter)

**Verification:**
- Render with empty array → shows "No conversations yet"
- Render with conversations → displays correctly
- Click conversation → fires `onMessageClick` callback
- Search for conversation → filters list

---

#### T4.2: Create MessageThread Component
**Dependencies:** T3.2 (useRealtimeMessages hook)  
**Effort:** 3-4 hours  
**Category:** frontend  
**Files to create:**
- `src/components/bookface/MessageThread.tsx`

**Component Structure:**
```typescript
"use client";
import { useState, useRef, useEffect } from "react";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { sendMessage } from "@/lib/actions/messaging";
import { Avatar } from "./Avatar";
import { useToast } from "@/hooks/useToast";

type MessageThreadProps = {
  conversationId: string;
  initialMessages: Message[];
  currentUser: {
    id: string;
    name: string;
    profileImage: string | null;
  };
  otherParticipants: {
    id: string;
    name: string;
    profileImage: string | null;
  }[];
  isGroup: boolean;
  groupName?: string | null;
};

export function MessageThread({ conversationId, initialMessages, currentUser, otherParticipants, isGroup, groupName }: MessageThreadProps) {
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { showToast } = useToast();

  const {
    messages,
    connectionState,
    addOptimisticMessage,
    resolveOptimisticMessage,
    rejectOptimisticMessage,
  } = useRealtimeMessages(conversationId, initialMessages, currentUser.id);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isSending) return;

    const content = inputValue.trim();
    setInputValue("");
    setIsSending(true);

    // Add optimistic message
    const tempId = addOptimisticMessage(content, currentUser);

    try {
      const result = await sendMessage({ conversationId, content });

      if (result.success) {
        resolveOptimisticMessage(tempId, result.data);
      } else {
        rejectOptimisticMessage(tempId);
        showToast(result.error, "error");
        setInputValue(content); // Restore input
      }
    } catch (error) {
      rejectOptimisticMessage(tempId);
      showToast("Failed to send message", "error");
      setInputValue(content);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          {isGroup ? (
            <>
              <div style={styles.groupAvatarStack}>
                {otherParticipants.slice(0, 2).map((p) => (
                  <Avatar key={p.id} src={p.profileImage} name={p.name} size="sm" />
                ))}
              </div>
              <div>
                <div style={styles.headerTitle}>{groupName || "Group Chat"}</div>
                <div style={styles.headerSubtitle}>
                  {otherParticipants.length + 1} members
                </div>
              </div>
            </>
          ) : (
            <>
              <Avatar
                src={otherParticipants[0]?.profileImage}
                name={otherParticipants[0]?.name || "Unknown"}
                size="md"
              />
              <div>
                <div style={styles.headerTitle}>{otherParticipants[0]?.name || "Unknown"}</div>
                {otherParticipants[0]?.jobTitle && (
                  <div style={styles.headerSubtitle}>{otherParticipants[0].jobTitle}</div>
                )}
              </div>
            </>
          )}
        </div>
        {connectionState !== "connected" && (
          <div style={styles.connectionBadge}>
            {connectionState === "connecting" && "Connecting..."}
            {connectionState === "error" && "Connection error"}
            {connectionState === "disconnected" && "Disconnected"}
          </div>
        )}
      </div>

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.senderId === currentUser.id;
            const isOptimistic = "status" in msg;
            const showAvatar = !isMine && (idx === 0 || messages[idx - 1]?.senderId !== msg.senderId);

            return (
              <div
                key={msg.id}
                style={{
                  ...styles.messageRow,
                  justifyContent: isMine ? "flex-end" : "flex-start",
                }}
              >
                {!isMine && showAvatar && (
                  <Avatar src={msg.sender.profileImage} name={msg.sender.name} size="xs" />
                )}
                {!isMine && !showAvatar && <div style={{ width: 24 }} />}
                
                <div style={{
                  ...styles.messageBubble,
                  backgroundColor: isMine ? "#1A1A1A" : "#f5f5f5",
                  color: isMine ? "#ffffff" : "#2F2C26",
                  opacity: isOptimistic && msg.status === "sending" ? 0.6 : 1,
                  border: isOptimistic && msg.status === "failed" ? "1px solid #ff4444" : "none",
                }}>
                  {isGroup && !isMine && showAvatar && (
                    <div style={styles.senderName}>{msg.sender.name}</div>
                  )}
                  <div>{msg.content}</div>
                  {isOptimistic && msg.status === "failed" && (
                    <div style={styles.failedLabel}>Failed to send</div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <textarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={styles.input}
          disabled={isSending}
        />
        <button
          onClick={handleSend}
          disabled={!inputValue.trim() || isSending}
          style={{
            ...styles.sendButton,
            opacity: !inputValue.trim() || isSending ? 0.4 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    height: "100%",
    backgroundColor: "#ffffff",
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    overflow: "hidden",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px",
    borderBottom: "1px solid #e0e0e0",
    backgroundColor: "#fafafa",
  },
  headerLeft: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: "16px",
    fontWeight: 600,
    color: "#2F2C26",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
  },
  headerSubtitle: {
    fontSize: "13px",
    color: "#666666",
    marginTop: "2px",
  },
  connectionBadge: {
    fontSize: "12px",
    color: "#999999",
    fontStyle: "italic",
  },
  groupAvatarStack: {
    display: "flex",
    marginLeft: "-8px",
  },
  messagesContainer: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "16px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "8px",
  },
  emptyState: {
    textAlign: "center" as const,
    color: "#999999",
    fontSize: "14px",
    marginTop: "40px",
  },
  messageRow: {
    display: "flex",
    gap: "8px",
    alignItems: "flex-end",
  },
  messageBubble: {
    maxWidth: "70%",
    padding: "10px 14px",
    borderRadius: "16px",
    fontSize: "14px",
    lineHeight: "1.4",
    wordWrap: "break-word" as const,
  },
  senderName: {
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "4px",
    opacity: 0.7,
  },
  failedLabel: {
    fontSize: "11px",
    color: "#ff4444",
    marginTop: "4px",
    fontStyle: "italic",
  },
  inputContainer: {
    display: "flex",
    gap: "8px",
    padding: "12px",
    borderTop: "1px solid #e0e0e0",
    backgroundColor: "#fafafa",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
    resize: "none" as const,
    outline: "none",
  },
  sendButton: {
    padding: "10px 20px",
    backgroundColor: "#1A1A1A",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
  },
};
```

**Success Criteria:**
- ✅ Displays messages in chronological order
- ✅ Auto-scrolls to bottom on new messages
- ✅ Optimistic UI: message appears immediately on send
- ✅ Shows "sending" state, handles failures
- ✅ Enter to send, Shift+Enter for newline
- ✅ Connection state indicator in header
- ✅ Shows avatars for group messages (sender name above bubble)
- ✅ Mine vs theirs bubble styling (#1A1A1A vs #f5f5f5)

**Verification:**
- Send message → appears immediately (optimistic)
- Receive message from other user → appears via Realtime
- Network disconnect → shows "Connection error" badge
- Failed send → shows red border + "Failed to send"

---

#### T4.3: Create NewConversationModal Component
**Dependencies:** T2.5 (startConversation must exist)  
**Effort:** 2-3 hours  
**Category:** frontend  
**Files to create:**
- `src/components/bookface/NewConversationModal.tsx`

**Component Structure:**
```typescript
"use client";
import { useState } from "react";
import { startConversation } from "@/lib/actions/messaging";
import { Avatar } from "./Avatar";
import { useToast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  profileImage: string | null;
  jobTitle: string | null;
  company: string | null;
};

type NewConversationModalProps = {
  allUsers: User[]; // Users in current batch (excluding self)
  onClose: () => void;
};

export function NewConversationModal({ allUsers, onClose }: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const { showToast } = useToast();
  const router = useRouter();

  const filteredUsers = allUsers.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGroup = selectedUserIds.size > 1;

  const toggleUser = (userId: string) => {
    setSelectedUserIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
  };

  const handleCreate = async () => {
    if (selectedUserIds.size === 0) {
      showToast("Please select at least one person", "error");
      return;
    }

    if (isGroup && !groupName.trim()) {
      showToast("Please enter a group name", "error");
      return;
    }

    setIsCreating(true);

    try {
      const result = await startConversation({
        participantIds: Array.from(selectedUserIds),
        groupName: isGroup ? groupName.trim() : undefined,
      });

      if (result.success) {
        onClose();
        router.push(`/messages/${result.data.conversationId}`);
        showToast("Conversation created", "success");
      } else {
        showToast(result.error, "error");
      }
    } catch (error) {
      showToast("Failed to create conversation", "error");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div style={styles.overlay} onClick={onClose} />

      {/* Modal */}
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>New Message</h2>
          <button onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        {/* Group name input (if multiple selected) */}
        {isGroup && (
          <div style={styles.section}>
            <label style={styles.label}>Group Name</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name..."
              style={styles.input}
              maxLength={200}
            />
          </div>
        )}

        {/* Search */}
        <div style={styles.section}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search founders..."
            style={styles.searchInput}
          />
        </div>

        {/* Selected count */}
        {selectedUserIds.size > 0 && (
          <div style={styles.selectedBadge}>
            {selectedUserIds.size} selected
          </div>
        )}

        {/* User list */}
        <div style={styles.userList}>
          {filteredUsers.map((user) => {
            const isSelected = selectedUserIds.has(user.id);
            return (
              <div
                key={user.id}
                onClick={() => toggleUser(user.id)}
                style={{
                  ...styles.userItem,
                  backgroundColor: isSelected ? "rgba(26, 26, 26, 0.05)" : "transparent",
                }}
              >
                <div style={styles.userItemLeft}>
                  <Avatar src={user.profileImage} name={user.name} size="md" />
                  <div>
                    <div style={styles.userName}>{user.name}</div>
                    {user.jobTitle && (
                      <div style={styles.userMeta}>
                        {user.jobTitle}
                        {user.company && ` at ${user.company}`}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{
                  ...styles.checkbox,
                  backgroundColor: isSelected ? "#1A1A1A" : "#ffffff",
                  border: `2px solid ${isSelected ? "#1A1A1A" : "#e0e0e0"}`,
                }}>
                  {isSelected && <span style={{ color: "#ffffff" }}>✓</span>}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.cancelButton}>
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={selectedUserIds.size === 0 || isCreating}
            style={{
              ...styles.createButton,
              opacity: selectedUserIds.size === 0 || isCreating ? 0.4 : 1,
            }}
          >
            {isCreating ? "Creating..." : "Create"}
          </button>
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  modal: {
    position: "fixed" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "90%",
    maxWidth: "500px",
    maxHeight: "80vh",
    backgroundColor: "#ffffff",
    borderRadius: "12px",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
    zIndex: 1001,
    display: "flex",
    flexDirection: "column" as const,
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "20px",
    borderBottom: "1px solid #e0e0e0",
  },
  modalTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#2F2C26",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
    margin: 0,
  },
  closeButton: {
    background: "none",
    border: "none",
    fontSize: "24px",
    color: "#666666",
    cursor: "pointer",
    padding: "0 8px",
  },
  section: {
    padding: "16px 20px",
    borderBottom: "1px solid #f0f0f0",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#666666",
    marginBottom: "8px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
    outline: "none",
  },
  searchInput: {
    width: "100%",
    padding: "10px 12px",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
    outline: "none",
  },
  selectedBadge: {
    padding: "8px 20px",
    fontSize: "13px",
    fontWeight: 600,
    color: "#1A1A1A",
    backgroundColor: "#f9f9f9",
  },
  userList: {
    flex: 1,
    overflowY: "auto" as const,
    padding: "8px 0",
  },
  userItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 20px",
    cursor: "pointer",
    transition: "background-color 0.15s",
  },
  userItemLeft: {
    display: "flex",
    gap: "12px",
    alignItems: "center",
    flex: 1,
  },
  userName: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#2F2C26",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
  },
  userMeta: {
    fontSize: "13px",
    color: "#666666",
    marginTop: "2px",
  },
  checkbox: {
    width: "20px",
    height: "20px",
    borderRadius: "4px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "12px",
  },
  modalFooter: {
    display: "flex",
    gap: "12px",
    justifyContent: "flex-end",
    padding: "16px 20px",
    borderTop: "1px solid #e0e0e0",
  },
  cancelButton: {
    padding: "10px 20px",
    backgroundColor: "#ffffff",
    color: "#666666",
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
  },
  createButton: {
    padding: "10px 20px",
    backgroundColor: "#1A1A1A",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
  },
};
```

**Success Criteria:**
- ✅ Search filters user list
- ✅ Multi-select with checkboxes
- ✅ Shows "Group Name" input if 2+ selected
- ✅ Validates: at least 1 user, group name if isGroup
- ✅ Creates conversation via server action
- ✅ Redirects to new conversation on success
- ✅ Overlay click closes modal

**Verification:**
- Select 1 user → creates 1-on-1 (no group name required)
- Select 2+ users → requires group name
- Create without selection → shows error toast
- Successful creation → redirects to /messages/[id]

---

#### T4.4: Update BookfaceTopNav with Messages Link
**Dependencies:** None (can run in parallel)  
**Effort:** 1 hour  
**Category:** frontend  
**Files to modify:**
- `src/components/bookface/BookfaceTopNav.tsx`

**Changes:**
1. Add "Messages" link to nav (after "Community", before "Advice")
2. Add envelope icon from Lucide React
3. Add unread badge if total unread > 0 (prop: `totalUnread?: number`)
4. Keep all inline styles

**Implementation snippet:**
```typescript
// Add to nav items
<Link
  href="/messages"
  style={{
    ...styles.navLink,
    backgroundColor: pathname === "/messages" ? "rgba(255, 255, 255, 0.1)" : "transparent",
  }}
>
  <Mail size={18} />
  Messages
  {totalUnread > 0 && (
    <span style={styles.unreadBadge}>{totalUnread > 99 ? "99+" : totalUnread}</span>
  )}
</Link>

// Add to styles
const styles = {
  // ... existing styles ...
  unreadBadge: {
    position: "absolute" as const,
    top: "-4px",
    right: "-8px",
    backgroundColor: "#ff4444",
    color: "#ffffff",
    fontSize: "10px",
    fontWeight: 700,
    padding: "2px 6px",
    borderRadius: "10px",
    minWidth: "18px",
    textAlign: "center" as const,
  },
};
```

**Success Criteria:**
- ✅ "Messages" link visible in nav
- ✅ Envelope icon displays
- ✅ Active state when on /messages
- ✅ Unread badge shows if totalUnread > 0
- ✅ Badge shows "99+" for counts > 99
- ✅ All inline styles

**Verification:**
- Navigate to /messages → link should be active
- Pass totalUnread={5} → badge shows "5"
- Pass totalUnread={0} → no badge

---

#### T4.5: Create "Message" Button for Profiles
**Dependencies:** T2.5 (startConversation)  
**Effort:** 1.5 hours  
**Category:** frontend  
**Files to create:**
- `src/components/bookface/MessageUserButton.tsx`

**Component Structure:**
```typescript
"use client";
import { useState } from "react";
import { startConversation } from "@/lib/actions/messaging";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { Send } from "lucide-react";

type MessageUserButtonProps = {
  userId: string;
  userName: string;
};

export function MessageUserButton({ userId, userName }: MessageUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { showToast } = useToast();

  const handleClick = async () => {
    setIsLoading(true);

    try {
      const result = await startConversation({
        participantIds: [userId],
      });

      if (result.success) {
        router.push(`/messages/${result.data.conversationId}`);
      } else {
        showToast(result.error, "error");
      }
    } catch (error) {
      showToast("Failed to start conversation", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      style={{
        ...styles.button,
        opacity: isLoading ? 0.6 : 1,
      }}
    >
      <Send size={16} />
      {isLoading ? "Loading..." : "Message"}
    </button>
  );
}

const styles = {
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    padding: "8px 16px",
    backgroundColor: "#1A1A1A",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: '"BDO Grotesk", -apple-system, sans-serif',
    transition: "opacity 0.15s",
  },
};
```

**Success Criteria:**
- ✅ Click → starts 1-on-1 conversation
- ✅ If conversation exists, returns existing ID
- ✅ Redirects to /messages/[conversationId]
- ✅ Shows loading state
- ✅ Error handling with toast

**Verification:**
- Click on user profile → creates/opens conversation
- Click again → should reuse same conversation
- Network error → shows error toast

---

#### T4.6: Create "Reply Privately" Comment Action
**Dependencies:** T2.5 (startConversation)  
**Effort:** 1 hour  
**Category:** frontend  
**Files to modify:**
- `src/components/bookface/CommentThread.tsx` (add "Reply Privately" action)

**Implementation:**
Add a new action button next to "Upvote | Reply":

```typescript
"use client";
import { MessageSquare } from "lucide-react";
import { startConversation } from "@/lib/actions/messaging";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";

// In CommentThread component, add to each comment's action row:
const handleReplyPrivately = async (authorId: string) => {
  const result = await startConversation({ participantIds: [authorId] });
  if (result.success) {
    router.push(`/messages/${result.data.conversationId}`);
  } else {
    showToast(result.error, "error");
  }
};

// In JSX:
<div style={styles.actions}>
  <button style={styles.actionButton} onClick={handleUpvote}>
    Upvote ({comment.upvotes})
  </button>
  <span style={styles.actionDivider}>|</span>
  <button style={styles.actionButton} onClick={handleReply}>
    Reply
  </button>
  <span style={styles.actionDivider}>|</span>
  <button
    style={styles.actionButton}
    onClick={() => handleReplyPrivately(comment.author.id)}
  >
    <MessageSquare size={14} />
    Reply Privately
  </button>
</div>
```

**Success Criteria:**
- ✅ "Reply Privately" appears on every comment
- ✅ Click → opens 1-on-1 conversation with comment author
- ✅ Icon + text label
- ✅ Matches existing action button styling

**Verification:**
- Click "Reply Privately" on any comment → opens DM with author
- Check multiple comments → all have the action

---

### Phase 5: Page Implementation (2 tasks, 4-5 hours)

#### T5.1: Create /messages Page (Conversation List)
**Dependencies:** T2.2, T4.1, T4.3  
**Effort:** 2-3 hours  
**Category:** frontend  
**Files to create:**
- `src/app/(dashboard)/messages/page.tsx`

**Implementation:**
```typescript
import { getCurrentUser } from "@/lib/permissions";
import { redirect } from "next/navigation";
import { getConversations } from "@/lib/actions/messaging";
import { MessageList } from "@/components/bookface/MessageList";
import { prisma } from "@/lib/prisma";

export default async function MessagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch conversations
  const conversationsResult = await getConversations();
  const conversations = conversationsResult.success ? conversationsResult.data : [];

  // Get all users in batch for "New Message" modal
  const batchUsers = await prisma.user.findMany({
    where: {
      batchId: user.batchId,
      id: { not: user.id }, // Exclude self
    },
    select: {
      id: true,
      name: true,
      profileImage: true,
      jobTitle: true,
      company: true,
    },
    orderBy: { name: "asc" },
  });

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <MessageList
          conversations={conversations}
          batchUsers={batchUsers}
          currentUserId={user.id}
        />
      </div>
      <div style={styles.emptyState}>
        <h2 style={styles.emptyTitle}>Select a conversation</h2>
        <p style={styles.emptyText}>
          Choose a conversation from the list or start a new one
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "calc(100vh - 48px)", // Full height minus nav
    backgroundColor: "#fefaf3",
  },
  sidebar: {
    width: "360px",
    borderRight: "1px solid #e0e0e0",
    backgroundColor: "#ffffff",
  },
  emptyState: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    color: "#999999",
  },
  emptyTitle: {
    fontSize: "20px",
    fontWeight: 600,
    color: "#666666",
    marginBottom: "8px",
  },
  emptyText: {
    fontSize: "14px",
  },
};
```

**Success Criteria:**
- ✅ Shows conversation list in left sidebar
- ✅ Right panel shows empty state (no conversation selected)
- ✅ "New Message" button opens modal
- ✅ Full-height layout (minus nav bar)
- ✅ Server-side rendering

**Verification:**
- Navigate to /messages → shows list
- No conversations → shows empty list
- Click conversation → navigates to /messages/[id]

---

#### T5.2: Create /messages/[id] Page (Conversation View)
**Dependencies:** T2.3, T2.5, T3.2, T4.2  
**Effort:** 2-3 hours  
**Category:** frontend  
**Files to create:**
- `src/app/(dashboard)/messages/[id]/page.tsx`

**Implementation:**
```typescript
import { getCurrentUser } from "@/lib/permissions";
import { redirect, notFound } from "next/navigation";
import { getConversations, getMessages, markConversationRead } from "@/lib/actions/messaging";
import { MessageList } from "@/components/bookface/MessageList";
import { MessageThread } from "@/components/bookface/MessageThread";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function ConversationPage({ params }: PageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  // Fetch current conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id },
    include: {
      participants: {
        where: { userId: { not: user.id } },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              profileImage: true,
              jobTitle: true,
              company: true,
            },
          },
        },
      },
    },
  });

  if (!conversation) notFound();

  // Verify membership
  const isMember = await prisma.conversationParticipant.findUnique({
    where: {
      conversationId_userId: {
        conversationId: id,
        userId: user.id,
      },
    },
  });

  if (!isMember) notFound();

  // Fetch messages
  const messagesResult = await getMessages(id);
  const messages = messagesResult.success ? messagesResult.data : [];

  // Mark as read
  await markConversationRead(id);

  // Fetch all conversations for sidebar
  const conversationsResult = await getConversations();
  const conversations = conversationsResult.success ? conversationsResult.data : [];

  // Get all users for "New Message" modal
  const batchUsers = await prisma.user.findMany({
    where: {
      batchId: user.batchId,
      id: { not: user.id },
    },
    select: {
      id: true,
      name: true,
      profileImage: true,
      jobTitle: true,
      company: true,
    },
    orderBy: { name: "asc" },
  });

  const otherParticipants = conversation.participants.map((p) => p.user);

  return (
    <div style={styles.container}>
      <div style={styles.sidebar}>
        <MessageList
          conversations={conversations}
          batchUsers={batchUsers}
          currentUserId={user.id}
          activeConversationId={id}
        />
      </div>
      <div style={styles.main}>
        <MessageThread
          conversationId={id}
          initialMessages={messages}
          currentUser={{
            id: user.id,
            name: user.name,
            profileImage: user.profileImage,
          }}
          otherParticipants={otherParticipants}
          isGroup={conversation.isGroup}
          groupName={conversation.groupName}
        />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    height: "calc(100vh - 48px)",
    backgroundColor: "#fefaf3",
  },
  sidebar: {
    width: "360px",
    borderRight: "1px solid #e0e0e0",
    backgroundColor: "#ffffff",
  },
  main: {
    flex: 1,
    display: "flex",
    flexDirection: "column" as const,
  },
};
```

**Success Criteria:**
- ✅ Shows conversation list in sidebar (with active state)
- ✅ Shows message thread in main panel
- ✅ Real-time message delivery works
- ✅ Marks conversation as read on load
- ✅ Handles non-existent conversation (404)
- ✅ Handles unauthorized access (404)

**Verification:**
- Navigate to /messages/[valid-id] → shows thread
- Send message → appears immediately + via Realtime in other tab
- Navigate to /messages/[invalid-id] → 404
- Check lastReadAt in DB → updated on page load

---

### Phase 6: Integration Points (3 tasks, 3-4 hours)

#### T6.1: Add Message Button to User Profiles
**Dependencies:** T4.5  
**Effort:** 1 hour  
**Category:** frontend  
**Files to modify:**
- `src/app/(dashboard)/profile/[userId]/page.tsx`

**Changes:**
Add MessageUserButton next to Follow button (or in header if no Follow exists):

```typescript
import { MessageUserButton } from "@/components/bookface/MessageUserButton";

// In profile header section:
<div style={styles.actionButtons}>
  {/* Existing Follow button if it exists */}
  <MessageUserButton userId={profileUser.id} userName={profileUser.name} />
</div>
```

**Success Criteria:**
- ✅ "Message" button visible on all user profiles (except own profile)
- ✅ Click → starts conversation and redirects
- ✅ Positioned next to Follow button (if exists)

**Verification:**
- Visit another user's profile → "Message" button visible
- Visit own profile → no "Message" button
- Click button → redirects to DM

---

#### T6.2: Add Message Button to Company Profiles
**Dependencies:** T4.5  
**Effort:** 30 minutes  
**Category:** frontend  
**Files to modify:**
- `src/app/(dashboard)/companies/[slug]/page.tsx`

**Changes:**
For company pages, we need to decide who to message. Options:
1. Message the founder (primary contact)
2. Message all company members (group)

**Recommended:** Message the founder (first company member with role=founder).

```typescript
import { MessageUserButton } from "@/components/bookface/MessageUserButton";

// Find primary founder
const primaryFounder = companyMembers.find((m) => m.user.role === "founder") || companyMembers[0];

// In company header:
{primaryFounder && (
  <MessageUserButton
    userId={primaryFounder.user.id}
    userName={primaryFounder.user.name}
  />
)}
```

**Success Criteria:**
- ✅ "Message" button on company pages
- ✅ Opens DM with primary founder
- ✅ If no founder, messages first member

**Verification:**
- Visit company page → "Message" button visible
- Click → opens DM with founder

---

#### T6.3: Add "Reply Privately" to Comments
**Dependencies:** T4.6  
**Effort:** 30 minutes  
**Category:** frontend  
**Files to modify:**
- `src/components/bookface/CommentThread.tsx` (already modified in T4.6)

**Changes:**
Already implemented in T4.6. Verify integration across all pages that use CommentThread:
- `/feed/[id]` (post detail)
- `/questions/[id]` (if questions have comments)

**Success Criteria:**
- ✅ "Reply Privately" visible on all comments
- ✅ Works across all pages using CommentThread

**Verification:**
- Check feed post comments → action visible
- Check questions comments → action visible

---

#### T6.4: Add Total Unread Count to Nav
**Dependencies:** T2.2, T4.4  
**Effort:** 1.5 hours  
**Category:** frontend  
**Files to modify:**
- `src/app/layout.tsx` or create `src/components/bookface/NavWrapper.tsx`

**Implementation:**

Since BookfaceTopNav needs `totalUnread` prop, create a wrapper component:

```typescript
// src/components/bookface/NavWrapper.tsx
import { getCurrentUser } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { BookfaceTopNav } from "./BookfaceTopNav";

export async function NavWrapper() {
  const user = await getCurrentUser();
  
  let totalUnread = 0;
  
  if (user) {
    // Efficient query: count all unread messages across all conversations
    const result = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(m.id) as count
      FROM messages m
      JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = ${user.id}
        AND m.created_at > cp.last_read_at
        AND m.sender_id != ${user.id}
    `;
    
    totalUnread = Number(result[0]?.count || 0);
  }

  return <BookfaceTopNav totalUnread={totalUnread} />;
}
```

**Update layout:**
```typescript
// src/app/layout.tsx
import { NavWrapper } from "@/components/bookface/NavWrapper";

// Replace <BookfaceTopNav /> with:
<NavWrapper />
```

**Success Criteria:**
- ✅ Unread badge shows correct count
- ✅ Count updates when conversation marked as read
- ✅ Efficient query (single COUNT, not N+1)

**Verification:**
- Send unread messages → badge shows count
- Open conversation → badge decrements
- No conversations → no badge

---

### Phase 7: Testing & Verification (4 tasks, 4-6 hours)

#### T7.1: Manual QA - Core Messaging Flow
**Dependencies:** All previous tasks  
**Effort:** 1.5 hours  
**Category:** qa  

**Test Cases:**
1. **Start 1-on-1 conversation**
   - Navigate to /messages
   - Click "New Message"
   - Select one user
   - Click "Create"
   - Verify redirects to /messages/[id]
   - Send message
   - Verify appears immediately
   - Open in second browser (different user)
   - Verify Realtime delivery

2. **Start group conversation**
   - Click "New Message"
   - Select 3 users
   - Enter group name "Test Group"
   - Create
   - Send message
   - Verify all participants can see

3. **Unread tracking**
   - Send message from user A
   - Login as user B
   - Check /messages → unread dot visible
   - Click conversation
   - Verify dot disappears
   - Check nav badge → count decrements

4. **Message from profile**
   - Visit user profile
   - Click "Message"
   - Verify conversation opens
   - Click again → reuses same conversation

5. **Reply Privately**
   - Go to feed post
   - Click "Reply Privately" on comment
   - Verify opens DM with author

**Success Criteria:**
- ✅ All flows work end-to-end
- ✅ No console errors
- ✅ Realtime works across tabs
- ✅ Unread counts accurate

---

#### T7.2: Batch Isolation Verification
**Dependencies:** All previous tasks  
**Effort:** 1 hour  
**Category:** qa  

**Test Cases:**
1. Create two users in different batches
2. Login as user A
3. Try to start conversation with user B (different batch)
4. Verify error: "Not in your batch"
5. Verify user B does NOT appear in "New Message" user list
6. Check conversations query → should not see cross-batch conversations

**Success Criteria:**
- ✅ Cannot message users from other batches
- ✅ Cannot see conversations from other batches
- ✅ "New Message" modal only shows same-batch users

**Verification Script:**
```sql
-- Verify no cross-batch conversations exist
SELECT c.id, cp1.user_id, u1.batch_id, cp2.user_id, u2.batch_id
FROM conversations c
JOIN conversation_participants cp1 ON cp1.conversation_id = c.id
JOIN conversation_participants cp2 ON cp2.conversation_id = c.id
JOIN users u1 ON u1.id = cp1.user_id
JOIN users u2 ON u2.id = cp2.user_id
WHERE u1.batch_id != u2.batch_id;
-- Should return 0 rows
```

---

#### T7.3: RLS Policy Testing
**Dependencies:** T1.3, All server actions  
**Effort:** 1.5 hours  
**Category:** qa  

**Test Cases:**
1. **RLS enabled check**
   ```sql
   SELECT tablename, policyname, permissive, roles, cmd
   FROM pg_policies
   WHERE tablename = 'messages';
   ```
   Should show "Users see own conversation messages" policy

2. **Test RLS with Supabase client**
   - Create authenticated Supabase client (not Prisma)
   - Try to SELECT messages from conversation user is NOT in
   - Should return 0 rows (RLS blocks)

3. **Realtime subscription test**
   - Subscribe to conversation user is NOT a member of
   - Send message via another user
   - Should NOT receive Realtime event (RLS blocks)

**Success Criteria:**
- ✅ RLS policy active on messages table
- ✅ Cannot read messages from conversations user is not in
- ✅ Realtime respects RLS (no unauthorized events)

**Verification:**
Use Supabase Dashboard → Authentication → Policies → messages table → should show active policy

---

#### T7.4: Build & Type Check
**Dependencies:** All previous tasks  
**Effort:** 30 minutes  
**Category:** qa  

**Commands:**
```bash
# TypeScript check
npx tsc --noEmit

# Prisma generate
npx prisma generate

# Build
npm run build

# LSP diagnostics (if available)
# Check all messaging files for errors
```

**Success Criteria:**
- ✅ Zero TypeScript errors
- ✅ Build completes successfully
- ✅ No runtime errors on page load
- ✅ All imports resolve

---

## Dependency Graph & Parallel Execution

### Phase 1 (Schema) — Sequential
```
T1.1 (Schema) → T1.2 (DB Push) → T1.3 (RLS)
```

### Phase 2 (Server Actions) — Mostly Sequential
```
T2.1 (Scaffold) → T2.2, T2.3, T2.4, T2.5 (all parallel after T2.1)
```

### Phase 3 (Realtime) — Sequential
```
T3.1 (Client Singleton) → T3.2 (useRealtimeMessages)
```

### Phase 4 (Components) — High Parallelism
```
T4.1 (MessageList) ← T2.2
T4.2 (MessageThread) ← T3.2
T4.3 (NewConversationModal) ← T2.5
T4.4 (Nav) ← Independent
T4.5 (MessageUserButton) ← T2.5
T4.6 (Reply Privately) ← T2.5

All can run in parallel once dependencies met
```

### Phase 5 (Pages) — Parallel
```
T5.1 (/messages) ← T2.2, T4.1, T4.3
T5.2 (/messages/[id]) ← T2.3, T2.5, T3.2, T4.2

Can run in parallel
```

### Phase 6 (Integration) — Parallel
```
T6.1 (Profile Button) ← T4.5
T6.2 (Company Button) ← T4.5
T6.3 (Comment Reply) ← T4.6
T6.4 (Nav Unread) ← T2.2, T4.4

All can run in parallel
```

### Phase 7 (Testing) — Sequential
```
T7.1 → T7.2 → T7.3 → T7.4
```

### Maximum Parallelism Points
| Phase | Max Parallel Tasks |
|-------|-------------------|
| Phase 2 | 4 (T2.2, T2.3, T2.4, T2.5) |
| Phase 4 | 6 (T4.1-T4.6) |
| Phase 5 | 2 (T5.1, T5.2) |
| Phase 6 | 4 (T6.1-T6.4) |

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **RLS policy blocks legitimate access** | High | Medium | Test with Supabase client before Realtime; verify policy with SQL queries |
| **Supabase Realtime disconnects** | Medium | Low | Implement connection state UI; consider polling fallback (not in MVP) |
| **N+1 queries on conversation list** | High | High | Use raw SQL for unread counts (already in T2.2); monitor with Prisma query logs |
| **Optimistic UI race condition** | Low | Low | Dedup messages by ID; skip own messages from Realtime |
| **Cross-batch message leak** | Critical | Low | Enforce batch checks in ALL server actions; verify with T7.2 |
| **Channel leak (too many subscriptions)** | Medium | Medium | Singleton client + cleanup in useEffect; monitor with `getActiveChannels()` |
| **Messages table grows unbounded** | Low | High (long-term) | Not in scope; future: pagination + archival |

---

## Success Criteria Summary

### Functional Requirements
- ✅ Users can start 1-on-1 and group conversations
- ✅ Real-time message delivery (< 1s latency)
- ✅ Unread indicators (dot on conversation, badge on nav)
- ✅ "Message" button on profiles and companies
- ✅ "Reply Privately" on comments
- ✅ Search conversations by name
- ✅ Batch isolation enforced (no cross-batch messaging)

### Non-Functional Requirements
- ✅ Zero breaking changes to existing features
- ✅ Follows existing code conventions (inline CSS, ActionResult, Prisma patterns)
- ✅ RLS policies protect Realtime subscriptions
- ✅ Efficient queries (no N+1, single aggregation for unread counts)
- ✅ Optimistic UI for instant feedback
- ✅ Clean subscription management (no channel leaks)

### Quality Gates
- ✅ TypeScript: zero errors
- ✅ Build: completes without errors
- ✅ Manual QA: all 5 core flows pass
- ✅ Batch isolation: verified via SQL
- ✅ RLS: active and tested

---

## Out of Scope (Future Enhancements)

These features were NOT shown in YC Bookface screenshots and are deliberately excluded:

- ❌ Typing indicators ("X is typing...")
- ❌ Read receipts (beyond unread dots)
- ❌ Message editing/deletion
- ❌ File attachments / images
- ❌ Message reactions (emoji)
- ❌ Message search within conversation
- ❌ Pagination for old messages (loads most recent 500)
- ❌ Push notifications
- ❌ Email notifications for messages
- ❌ Mute/archive conversations
- ❌ Pin conversations
- ❌ Message threading/replies
- ❌ Presence (online/offline status)

---

## Effort Summary

| Phase | Tasks | Estimated Hours |
|-------|-------|-----------------|
| Phase 1: Schema | 3 | 4-6 |
| Phase 2: Server Actions | 5 | 8-10 |
| Phase 3: Realtime | 2 | 4-5 |
| Phase 4: Components | 6 | 10-14 |
| Phase 5: Pages | 2 | 4-5 |
| Phase 6: Integration | 4 | 3-4 |
| Phase 7: Testing | 4 | 4-6 |
| **Total** | **26 tasks** | **32-40 hours** |

**With parallel execution:** Can be completed in **3-4 working days** with 2-3 developers.

---

## Next Steps

1. **Review this plan** with team/stakeholders
2. **Clarify any questions**:
   - Should "Message" on company pages message the founder or create a group with all members?
   - Do we want a polling fallback for Realtime disconnections, or just show connection state?
   - Should we limit group conversation size (e.g., max 20 participants)?
3. **Get approval** to proceed
4. **Start execution** with Phase 1 (Schema)

---

## Questions for User

Before proceeding to implementation, please clarify:

1. **Company Messaging**: When clicking "Message" on a company profile, should it:
   - Option A: DM the primary founder (recommended)
   - Option B: Create a group chat with all company members

2. **Realtime Fallback**: If Supabase Realtime disconnects, should we:
   - Option A: Just show "Disconnected" state (recommended for MVP)
   - Option B: Implement polling fallback (5s interval)

3. **Group Size Limit**: Should we enforce a maximum group size? (e.g., 20 participants)

4. **Message Length**: 10,000 character limit reasonable, or should it be different?

5. **Historical Messages**: Loading 500 most recent messages per conversation - is this sufficient, or do we need pagination UI?

Please confirm these decisions so we can finalize the plan and begin implementation.
