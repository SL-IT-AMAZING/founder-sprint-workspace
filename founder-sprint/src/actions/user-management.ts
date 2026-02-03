"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/permissions";
import { sendInvitationEmail } from "@/lib/email";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { ActionResult, UserRole } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "mentor", "founder", "co_founder"]),
  batchId: z.string().uuid(),
  linkedInUrl: z.string().optional(),
  founderId: z.string().uuid().optional(), // Required when role is co_founder
  groupId: z.string().uuid().optional(),
});

export async function inviteUser(formData: FormData): Promise<ActionResult<{ id: string; inviteLink: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = InviteUserSchema.safeParse({
    email: formData.get("email"),
    name: formData.get("name"),
    role: formData.get("role"),
    batchId: formData.get("batchId"),
    linkedInUrl: formData.get("linkedInUrl") || undefined,
    founderId: formData.get("founderId") || undefined,
    groupId: formData.get("groupId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { email, name, role, batchId, linkedInUrl, founderId, groupId } = parsed.data;

  // Validate founderId is provided for co-founders
  if (role === "co_founder" && !founderId) {
    return { success: false, error: "founderId is required when inviting a co-founder" };
  }

  // Check batch exists and is active
  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch || batch.status !== "active") {
    return { success: false, error: "Batch not found or archived" };
  }

  // Check founder limit (30 per batch)
  if (role === "founder") {
    const founderCount = await prisma.userBatch.count({
      where: { batchId, role: "founder" },
    });
    if (founderCount >= 30) {
      return { success: false, error: "Founder limit reached (30 per batch)" };
    }
  }

  // Prevent founder re-participation (check email)
  if (role === "founder") {
    const existingFounder = await prisma.userBatch.findFirst({
      where: {
        user: { email: email },
        role: "founder",
      },
    });
    if (existingFounder) {
      return { success: false, error: "This email is already registered as a Founder in another batch" };
    }
  }

  // Prevent founder re-participation (check LinkedIn profile)
  if (role === "founder" && linkedInUrl) {
    const existingFounder = await prisma.user.findFirst({
      where: {
        linkedinId: linkedInUrl,
        userBatches: {
          some: {
            role: "founder",
          },
        },
      },
    });
    if (existingFounder) {
      return { success: false, error: "This LinkedIn profile has already participated as a founder" };
    }
  }

  // Check co-founder limit (max 2 per founder)
  if (role === "co_founder") {
    const coFounderCount = await prisma.userBatch.count({
      where: { batchId, founderId, role: "co_founder" },
    });
    if (coFounderCount >= 2) {
      return { success: false, error: "Maximum 2 co-founders per founder reached" };
    }
  }

  // Upsert user
  const invitedUser = await prisma.user.upsert({
    where: { email },
    create: { email, name },
    update: { name },
  });

  // Check if already in this batch
  const existing = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId: invitedUser.id, batchId } },
  });

  if (existing) {
    return { success: false, error: "User already in this batch" };
  }

  // Create user-batch relationship
  const userBatch = await prisma.userBatch.create({
    data: {
      userId: invitedUser.id,
      batchId,
      role: role as any,
      founderId: role === "co_founder" ? founderId : undefined,
      status: "invited",
    },
  });

  // Generate invitation token (expires in 7 days)
  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.invitationToken.create({
    data: {
      token,
      userId: invitedUser.id,
      batchId,
      email,
      expiresAt,
    },
  });

  // Auto-assign to group if groupId provided
  if (groupId) {
    const groupExists = await prisma.group.findFirst({
      where: { id: groupId, batchId },
    });
    if (groupExists) {
      await prisma.groupMember.create({
        data: {
          groupId: groupId,
          userId: invitedUser.id,
        },
      });
      // Revalidate group cache
      revalidateTag(`group-${groupId}`);
      revalidateTag(`groups-${batchId}`);
    }
  }

  // Send invitation email (non-blocking - don't fail invite if email fails)
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/invite/${token}`;

  const emailResult = await sendInvitationEmail({
    to: email,
    inviteeName: name,
    batchName: batch.name,
    role,
    inviteLink,
  });

  if (!emailResult.success) {
    console.warn(`Failed to send invitation email to ${email}:`, emailResult.error);
    // Continue anyway - user is created, they can be re-invited
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: { id: userBatch.id, inviteLink } };
}

export async function updateUserRole(
  userId: string,
  batchId: string,
  newRole: UserRole
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Cannot change super_admin role
  if (newRole === "super_admin" && user.role !== "super_admin") {
    return { success: false, error: "Only Super Admin can assign Super Admin role" };
  }

  await prisma.userBatch.update({
    where: { userId_batchId: { userId, batchId } },
    data: { role: newRole as any },
  });

  revalidatePath("/admin/users");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function removeUserFromBatch(
  userId: string,
  batchId: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Prevent self-deletion
  if (userId === user.id) {
    return { success: false, error: "Cannot remove yourself from a batch" };
  }

  await prisma.$transaction(async (tx) => {
    // Clean up group memberships for this user in this batch
    await tx.groupMember.deleteMany({
      where: { userId, group: { batchId } },
    });

    // Delete the batch relationship
    await tx.userBatch.delete({
      where: { userId_batchId: { userId, batchId } },
    });

    // If no remaining batch memberships, delete the user entirely
    const remainingBatches = await tx.userBatch.count({
      where: { userId },
    });

    if (remainingBatches === 0) {
      await tx.invitationToken.deleteMany({ where: { userId } });
      await tx.user.delete({ where: { id: userId } });
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function cancelInvite(userId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { userBatches: true },
  });

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  const hasActiveStatus = targetUser.userBatches.some((ub) => ub.status === "active");
  if (hasActiveStatus) {
    return { success: false, error: "Cannot cancel invite for active user" };
  }

  await prisma.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  targetUser.userBatches.forEach((userBatch) => {
    revalidateTag(`batch-users-${userBatch.batchId}`);
  });
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function getBatchUsers(batchId: string) {
  return unstable_cache(
    () =>
      prisma.userBatch.findMany({
        where: { batchId },
        include: { user: true, batch: true },
        orderBy: { invitedAt: "desc" },
      }),
    [`batch-users-${batchId}`],
    { revalidate: 60, tags: [`batch-users-${batchId}`] }
  )();
}

export async function checkInviteExpiration(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userBatches: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  // Check if user has any invited status in any batch
  const invitedBatch = user.userBatches.find((ub) => ub.status === "invited");

  if (invitedBatch) {
    // Find the latest invitation token for this user
    const latestToken = await prisma.invitationToken.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    if (!latestToken) {
      return { expired: true, message: "No invitation token found" };
    }

    // Check if token has been used
    if (latestToken.usedAt) {
      return { expired: false };
    }

    // Check if token has expired
    if (latestToken.expiresAt < new Date()) {
      return { expired: true, message: "Invite has expired after 7 days" };
    }
  }

  return { expired: false };
}
