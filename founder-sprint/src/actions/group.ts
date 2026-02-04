"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const CreateGroupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().or(z.literal("")),
});

export async function createGroup(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const parsed = CreateGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const group = await prisma.group.create({
    data: {
      batchId: user.batchId,
      name: parsed.data.name,
      description: parsed.data.description || null,
      createdBy: user.id,
    },
  });

  revalidatePath("/groups");
  revalidateTag(`groups-${user.batchId}`);
  revalidateTag(`group-${group.id}`);
  return { success: true, data: { id: group.id } };
}

export async function getGroups(batchId: string) {
  return unstable_cache(
    () =>
      prisma.group.findMany({
        where: { batchId },
        include: {
          _count: {
            select: {
              members: true,
              posts: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    [`groups-${batchId}`],
    { revalidate: 60, tags: [`groups-${batchId}`] }
  )();
}

export async function getUserGroups(batchId: string, userId: string) {
  return unstable_cache(
    () =>
      prisma.group.findMany({
        where: {
          batchId,
          members: { some: { userId } },
        },
        include: {
          _count: { select: { members: true, posts: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    [`user-groups-${batchId}-${userId}`],
    { revalidate: 60, tags: [`groups-${batchId}`] }
  )();
}

export async function getGroup(id: string) {
  return unstable_cache(
    () =>
      prisma.group.findUnique({
        where: { id },
        include: {
          members: {
            include: {
              user: true,
            },
            orderBy: { joinedAt: "desc" },
          },
          posts: {
            include: {
              author: true,
              images: true,
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
            orderBy: [
              { isPinned: "desc" },
              { createdAt: "desc" },
            ],
          },
        },
      }),
    [`group-${id}`],
    { revalidate: 60, tags: [`group-${id}`] }
  )();
}

export async function joinGroup(groupId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  // Check if already a member
  const existing = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (existing) {
    return { success: false, error: "Already a member" };
  }

  await prisma.groupMember.create({
    data: {
      groupId,
      userId: user.id,
    },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidateTag(`groups-${user.batchId}`);
  revalidateTag(`group-${groupId}`);
  return { success: true, data: undefined };
}

export async function addMembersToGroup(
  groupId: string,
  userIds: string[]
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  // Validate group exists and get its batchId
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { batchId: true, name: true },
  });

  if (!group) {
    return { success: false, error: "Group not found" };
  }

  // Validate all userIds are members of the same batch
  const validBatchMembers = await prisma.userBatch.findMany({
    where: {
      batchId: group.batchId,
      userId: { in: userIds },
      status: "active",
    },
    select: { userId: true },
  });

  const validUserIds = validBatchMembers.map(ub => ub.userId);

  if (validUserIds.length === 0) {
    return { success: false, error: "No valid batch members found" };
  }

  // Filter out users who are already group members
  const existingMembers = await prisma.groupMember.findMany({
    where: {
      groupId,
      userId: { in: validUserIds },
    },
    select: { userId: true },
  });

  const existingUserIds = existingMembers.map(gm => gm.userId);
  const newUserIds = validUserIds.filter(id => !existingUserIds.includes(id));

  if (newUserIds.length === 0) {
    return { success: false, error: "All users are already members of this group" };
  }

  // Create GroupMember records for each valid userId
  await prisma.groupMember.createMany({
    data: newUserIds.map(userId => ({
      groupId,
      userId,
    })),
  });

  // Auto-set company from group name for new members who don't have one
  if (group.name) {
    await prisma.user.updateMany({
      where: {
        id: { in: newUserIds },
        company: null,
      },
      data: { company: group.name },
    });
  }

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/manage`);
  revalidateTag(`groups-${group.batchId}`);
  revalidateTag(`group-${groupId}`);

  return { success: true, data: undefined };
}

export async function leaveGroup(groupId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: user.id,
      },
    },
  });

  if (!member) {
    return { success: false, error: "Not a member" };
  }

  await prisma.groupMember.delete({
    where: { id: member.id },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidateTag(`groups-${user.batchId}`);
  revalidateTag(`group-${groupId}`);
  return { success: true, data: undefined };
}

export async function updateGroup(
  groupId: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const parsed = CreateGroupSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  await prisma.group.update({
    where: { id: groupId },
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/manage`);
  revalidateTag(`groups-${user.batchId}`);
  revalidateTag(`group-${groupId}`);
  return { success: true, data: undefined };
}

export async function deleteGroup(groupId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  await prisma.group.delete({
    where: { id: groupId },
  });

  revalidatePath("/groups");
  revalidateTag(`groups-${user.batchId}`);
  revalidateTag(`group-${groupId}`);
  return { success: true, data: undefined };
}

export async function removeGroupMember(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  if (userId === user.id) {
    return { success: false, error: "Cannot remove yourself from a group" };
  }

  const member = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
  });

  if (!member) {
    return { success: false, error: "Member not found" };
  }

  await prisma.groupMember.delete({
    where: { id: member.id },
  });

  revalidatePath("/groups");
  revalidatePath(`/groups/${groupId}`);
  revalidatePath(`/groups/${groupId}/manage`);
  revalidateTag(`groups-${user.batchId}`);
  revalidateTag(`group-${groupId}`);
  return { success: true, data: undefined };
}
