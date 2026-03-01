"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

export interface ConversationListItem {
  id: string;
  isGroup: boolean;
  groupName: string | null;
  groupEmoji: string | null;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  participants: { id: string; name: string | null; profileImage: string | null }[];
}

export interface MessageItem {
  id: string;
  content: string;
  createdAt: Date;
  sender: { id: string; name: string | null; profileImage: string | null } | null;
}

export interface ConversationDetail {
  id: string;
  isGroup: boolean;
  groupName: string | null;
  groupEmoji: string | null;
  isPublic: boolean;
  participants: {
    id: string;
    name: string | null;
    profileImage: string | null;
    jobTitle: string | null;
    company: string | null;
  }[];
}

export interface PublicGroupItem {
  id: string;
  groupName: string;
  groupEmoji: string | null;
  createdBy: { name: string | null } | null;
  lastMessageAt: Date | null;
  memberCount: number;
  memberAvatars: { profileImage: string | null }[];
  isJoined: boolean;
}

type ParticipantConversation = {
  conversationId: string;
  lastReadAt: Date;
  conversation: {
    id: string;
    isGroup: boolean;
    groupName: string | null;
    groupEmoji: string | null;
    lastMessage: string | null;
    lastMessageAt: Date | null;
    participants: {
      user: {
        id: string;
        name: string | null;
        profileImage: string | null;
      };
    }[];
  };
};

async function getUnreadCountsByConversation(
  userId: string,
  conversationIds?: string[]
): Promise<Map<string, number>> {
  if (conversationIds && conversationIds.length === 0) {
    return new Map();
  }

  const rows = conversationIds
    ? await prisma.$queryRaw<Array<{ conversationId: string; unreadCount: bigint }>>`
        SELECT
          cp.conversation_id AS "conversationId",
          COUNT(*)::bigint AS "unreadCount"
        FROM messages m
        INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE cp.user_id = ${userId}
          AND cp.conversation_id = ANY(${conversationIds}::uuid[])
          AND m.created_at > cp.last_read_at
          AND (m.sender_id IS NULL OR m.sender_id != ${userId}::uuid)
        GROUP BY cp.conversation_id
      `
    : await prisma.$queryRaw<Array<{ conversationId: string; unreadCount: bigint }>>`
        SELECT
          cp.conversation_id AS "conversationId",
          COUNT(*)::bigint AS "unreadCount"
        FROM messages m
        INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
        WHERE cp.user_id = ${userId}
          AND m.created_at > cp.last_read_at
          AND (m.sender_id IS NULL OR m.sender_id != ${userId}::uuid)
        GROUP BY cp.conversation_id
      `;

  return new Map(rows.map((row) => [row.conversationId, Number(row.unreadCount)]));
}

function mapConversationListItems(
  records: ParticipantConversation[],
  userId: string,
  unreadMap: Map<string, number>
): ConversationListItem[] {
  const items = records.map((record) => ({
    id: record.conversation.id,
    isGroup: record.conversation.isGroup,
    groupName: record.conversation.groupName,
    groupEmoji: record.conversation.groupEmoji,
    lastMessage: record.conversation.lastMessage,
    lastMessageAt: record.conversation.lastMessageAt,
    unreadCount: unreadMap.get(record.conversation.id) ?? 0,
    participants: record.conversation.participants
      .map((participant) => participant.user)
      .filter((participant) => record.conversation.isGroup || participant.id !== userId),
  }));

  items.sort((a, b) => {
    if (!a.lastMessageAt && !b.lastMessageAt) return 0;
    if (!a.lastMessageAt) return 1;
    if (!b.lastMessageAt) return -1;
    return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
  });

  return items;
}

export async function getOrCreateDMConversation(
  targetUserId: string
): Promise<ActionResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // No batch gate - messaging is cross-batch (like Follow system)

  if (!targetUserId) {
    return { success: false, error: "Target user is required" };
  }

  if (targetUserId === user.id) {
    return { success: false, error: "Cannot message yourself" };
  }

  const [minId, maxId] = [user.id, targetUserId].sort();
  const dmKey = `${minId}:${maxId}`;

  try {
    const existing = await prisma.conversation.findUnique({
      where: { dmKey },
      select: { id: true },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: existing.id,
              userId: user.id,
            },
          },
          update: {},
          create: {
            conversationId: existing.id,
            userId: user.id,
          },
        }),
        prisma.conversationParticipant.upsert({
          where: {
            conversationId_userId: {
              conversationId: existing.id,
              userId: targetUserId,
            },
          },
          update: {},
          create: {
            conversationId: existing.id,
            userId: targetUserId,
          },
        }),
      ]);

      revalidatePath("/messages");
      return { success: true, data: { conversationId: existing.id } };
    }

    try {
      const conversation = await prisma.conversation.create({
        data: {
          dmKey,
          isGroup: false,
          participants: {
            create: [{ userId: user.id }, { userId: targetUserId }],
          },
        },
        select: { id: true },
      });

      revalidatePath("/messages");
      return { success: true, data: { conversationId: conversation.id } };
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes("Unique constraint") || error.message.includes("P2002"))
      ) {
        const retryConversation = await prisma.conversation.findUnique({
          where: { dmKey },
          select: { id: true },
        });

        if (retryConversation) {
          await prisma.$transaction([
            prisma.conversationParticipant.upsert({
              where: {
                conversationId_userId: {
                  conversationId: retryConversation.id,
                  userId: user.id,
                },
              },
              update: {},
              create: {
                conversationId: retryConversation.id,
                userId: user.id,
              },
            }),
            prisma.conversationParticipant.upsert({
              where: {
                conversationId_userId: {
                  conversationId: retryConversation.id,
                  userId: targetUserId,
                },
              },
              update: {},
              create: {
                conversationId: retryConversation.id,
                userId: targetUserId,
              },
            }),
          ]);

          revalidatePath("/messages");
          return { success: true, data: { conversationId: retryConversation.id } };
        }
      }

      return { success: false, error: "Failed to create conversation" };
    }
  } catch {
    return { success: false, error: "Failed to create conversation" };
  }
}

export async function createGroupConversation(
  name: string,
  emoji: string | null,
  isPublic: boolean,
  participantIds: string[]
): Promise<ActionResult<{ conversationId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // No batch gate - messaging is cross-batch

  const normalizedName = name.trim();
  if (normalizedName.length < 1 || normalizedName.length > 200) {
    return { success: false, error: "Group name must be between 1 and 200 characters" };
  }

  const uniqueParticipants = new Set(participantIds.filter(Boolean));
  uniqueParticipants.add(user.id);

  if (uniqueParticipants.size < 2) {
    return { success: false, error: "Group must include at least one participant besides yourself" };
  }

  try {
    const conversation = await prisma.conversation.create({
      data: {
        isGroup: true,
        groupName: normalizedName,
        groupEmoji: emoji,
        isPublic,
        createdBy: user.id,
        participants: {
          create: Array.from(uniqueParticipants).map((participantId) => ({
            userId: participantId,
          })),
        },
      },
      select: { id: true },
    });

    revalidatePath("/messages");
    return { success: true, data: { conversationId: conversation.id } };
  } catch {
    return { success: false, error: "Failed to create group conversation" };
  }
}

export async function getUserConversations(): Promise<ActionResult<ConversationListItem[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const participantRecords = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: {
        conversationId: true,
        lastReadAt: true,
        conversation: {
          select: {
            id: true,
            isGroup: true,
            groupName: true,
            groupEmoji: true,
            lastMessage: true,
            lastMessageAt: true,
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const unreadMap = await getUnreadCountsByConversation(user.id);
    const conversations = mapConversationListItems(participantRecords, user.id, unreadMap);

    return { success: true, data: conversations };
  } catch {
    return { success: false, error: "Failed to fetch conversations" };
  }
}

export async function getConversation(
  conversationId: string
): Promise<ActionResult<ConversationDetail>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (!participant) {
      return { success: false, error: "You do not have access to this conversation" };
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        isGroup: true,
        groupName: true,
        groupEmoji: true,
        isPublic: true,
        participants: {
          select: {
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

    if (!conversation) {
      return { success: false, error: "Conversation not found" };
    }

    return {
      success: true,
      data: {
        id: conversation.id,
        isGroup: conversation.isGroup,
        groupName: conversation.groupName,
        groupEmoji: conversation.groupEmoji,
        isPublic: conversation.isPublic,
        participants: conversation.participants.map((participant) => participant.user),
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch conversation" };
  }
}

export async function getMessages(
  conversationId: string,
  limit: number = 50,
  cursor?: string
): Promise<ActionResult<{ messages: MessageItem[]; nextCursor: string | null }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (!participant) {
      return { success: false, error: "You do not have access to this conversation" };
    }

    const safeLimit = Math.max(1, Math.min(limit, 100));
    const cursorDate = cursor ? new Date(cursor) : null;

    if (cursor && (!cursorDate || Number.isNaN(cursorDate.getTime()))) {
      return { success: false, error: "Invalid cursor" };
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        ...(cursorDate ? { createdAt: { lt: cursorDate } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: safeLimit + 1,
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    const hasMore = messages.length > safeLimit;
    const paginatedMessages = hasMore ? messages.slice(0, safeLimit) : messages;
    const nextCursor = hasMore
      ? paginatedMessages[paginatedMessages.length - 1]?.createdAt.toISOString() ?? null
      : null;

    const orderedMessages: MessageItem[] = paginatedMessages.reverse();

    return {
      success: true,
      data: {
        messages: orderedMessages,
        nextCursor,
      },
    };
  } catch {
    return { success: false, error: "Failed to fetch messages" };
  }
}

export async function sendMessage(
  conversationId: string,
  content: string
): Promise<ActionResult<{ messageId: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // No batch gate - messaging is cross-batch

  const trimmedContent = content.trim();
  if (trimmedContent.length < 1 || trimmedContent.length > 5000) {
    return { success: false, error: "Message content must be between 1 and 5000 characters" };
  }

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (!participant) {
      return { success: false, error: "You do not have access to this conversation" };
    }

    const [message] = await prisma.$transaction([
      prisma.message.create({
        data: {
          conversationId,
          senderId: user.id,
          content: trimmedContent,
        },
        select: { id: true },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: trimmedContent.substring(0, 200),
          lastMessageAt: new Date(),
        },
        select: { id: true },
      }),
    ]);

    revalidatePath("/messages");
    return { success: true, data: { messageId: message.id } };
  } catch {
    return { success: false, error: "Failed to send message" };
  }
}

export async function deleteConversation(
  conversationId: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!conversationId) {
    return { success: false, error: "Conversation ID is required" };
  }

  try {
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (!participant) {
      return { success: false, error: "You do not have access to this conversation" };
    }

    await prisma.$transaction(async (tx) => {
      await tx.conversationParticipant.delete({
        where: {
          conversationId_userId: {
            conversationId,
            userId: user.id,
          },
        },
      });

      const remainingParticipants = await tx.conversationParticipant.count({
        where: { conversationId },
      });

      if (remainingParticipants === 0) {
        await tx.conversation.delete({
          where: { id: conversationId },
        });
      }
    });

    revalidatePath("/messages");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to delete conversation" };
  }
}

export async function markConversationRead(
  conversationId: string
): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const result = await prisma.conversationParticipant.updateMany({
      where: {
        conversationId,
        userId: user.id,
      },
      data: {
        lastReadAt: new Date(),
      },
    });

    if (result.count === 0) {
      return { success: false, error: "You do not have access to this conversation" };
    }

    revalidatePath("/messages");
    return { success: true, data: undefined };
  } catch {
    return { success: false, error: "Failed to mark conversation as read" };
  }
}

export async function getUnreadCount(): Promise<ActionResult<{ count: number }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS "count"
      FROM messages m
      INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
      WHERE cp.user_id = ${user.id}
        AND m.created_at > cp.last_read_at
        AND (m.sender_id IS NULL OR m.sender_id != ${user.id}::uuid)
    `;

    const count = rows[0] ? Number(rows[0].count) : 0;
    return { success: true, data: { count } };
  } catch {
    return { success: false, error: "Failed to fetch unread count" };
  }
}

export async function getPublicGroups(
  search?: string,
  sort: "recent" | "members" = "recent"
): Promise<ActionResult<PublicGroupItem[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    const normalizedSearch = search?.trim();
    const groups = await prisma.conversation.findMany({
      where: {
        isPublic: true,
        isGroup: true,
        ...(normalizedSearch
          ? {
              groupName: {
                contains: normalizedSearch,
                mode: "insensitive",
              },
            }
          : {}),
      },
      orderBy:
        sort === "members"
          ? { participants: { _count: "desc" } }
          : { lastMessageAt: { sort: "desc", nulls: "last" } },
      take: 50,
      select: {
        id: true,
        groupName: true,
        groupEmoji: true,
        lastMessageAt: true,
        creator: {
          select: {
            name: true,
          },
        },
        participants: {
          select: {
            userId: true,
            user: {
              select: {
                profileImage: true,
              },
            },
          },
        },
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    const items: PublicGroupItem[] = groups
      .filter((group): group is typeof group & { groupName: string } => group.groupName !== null)
      .map((group) => ({
        id: group.id,
        groupName: group.groupName,
        groupEmoji: group.groupEmoji,
        createdBy: group.creator,
        lastMessageAt: group.lastMessageAt,
        memberCount: group._count.participants,
        memberAvatars: group.participants
          .slice(0, 5)
          .map((participant) => ({ profileImage: participant.user.profileImage })),
        isJoined: group.participants.some((participant) => participant.userId === user.id),
      }));

    if (sort === "members") {
      items.sort((a, b) => {
        if (b.memberCount !== a.memberCount) return b.memberCount - a.memberCount;
        if (!a.lastMessageAt && !b.lastMessageAt) return 0;
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
      });
    }

    return { success: true, data: items };
  } catch {
    return { success: false, error: "Failed to fetch public groups" };
  }
}

export async function joinPublicGroup(conversationId: string): Promise<ActionResult<void>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  // No batch gate - messaging is cross-batch

  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        isPublic: true,
        isGroup: true,
      },
    });

    if (!conversation || !conversation.isPublic || !conversation.isGroup) {
      return { success: false, error: "Public group not found" };
    }

    const existingParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (existingParticipant) {
      return { success: true, data: undefined };
    }

    await prisma.conversationParticipant.create({
      data: {
        conversationId,
        userId: user.id,
      },
    });

    revalidatePath("/messages");
    return { success: true, data: undefined };
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      (error.message.includes("Unique constraint") || error.message.includes("P2002"))
    ) {
      return { success: true, data: undefined };
    }

    return { success: false, error: "Failed to join public group" };
  }
}

export async function searchConversations(
  query: string
): Promise<ActionResult<ConversationListItem[]>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const normalizedQuery = query.trim();
  if (!normalizedQuery) {
    return { success: true, data: [] };
  }

  try {
    const participantRecords = await prisma.conversationParticipant.findMany({
      where: {
        userId: user.id,
        conversation: {
          OR: [
            {
              groupName: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
            {
              participants: {
                some: {
                  user: {
                    name: {
                      contains: normalizedQuery,
                      mode: "insensitive",
                    },
                  },
                },
              },
            },
            {
              messages: {
                some: {
                  content: {
                    contains: normalizedQuery,
                    mode: "insensitive",
                  },
                },
              },
            },
          ],
        },
      },
      orderBy: {
        conversation: {
          lastMessageAt: "desc",
        },
      },
      take: 20,
      select: {
        conversationId: true,
        lastReadAt: true,
        conversation: {
          select: {
            id: true,
            isGroup: true,
            groupName: true,
            groupEmoji: true,
            lastMessage: true,
            lastMessageAt: true,
            participants: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const unreadMap = await getUnreadCountsByConversation(
      user.id,
      participantRecords.map((record) => record.conversationId)
    );
    const conversations = mapConversationListItems(participantRecords, user.id, unreadMap);

    return { success: true, data: conversations.slice(0, 20) };
  } catch {
    return { success: false, error: "Failed to search conversations" };
  }
}
