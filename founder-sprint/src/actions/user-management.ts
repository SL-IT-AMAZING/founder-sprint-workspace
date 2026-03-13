"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole, isAdmin } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { sendInvitationEmail } from "@/lib/email";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { ActionResult, UserRole } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional().transform((v) => v || undefined),
  role: z.enum(["admin", "mentor", "founder", "co_founder"]),
  batchId: z.string().uuid(),
  linkedInUrl: z.string().optional(),
  founderId: z.string().uuid().optional(), // Required when role is co_founder
  companyId: z.string().uuid().optional(),
});

const BulkInviteSchema = z.object({
  emails: z.string().min(1),
  role: z.enum(["admin", "mentor", "founder", "co_founder"]),
  batchId: z.string().uuid(),
});

interface InviteUserParams {
  email: string;
  name?: string;
  role: "admin" | "mentor" | "founder" | "co_founder";
  batchId: string;
  linkedInUrl?: string;
  founderId?: string;
  companyId?: string;
  callerRole?: UserRole;
}

type AdminActor = {
  id: string;
  email: string;
  name: string | null;
};

const USER_ADMIN_AUDIT_ACTIONS = [
  "user_role_changed",
  "user_additional_roles_changed",
  "user_deactivated",
  "user_reactivated",
  "invite_resent",
] as const;

async function createAuditLogEntry(params: {
  actor: AdminActor;
  action: (typeof USER_ADMIN_AUDIT_ACTIONS)[number];
  targetId?: string;
  details?: Record<string, unknown>;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      userId: params.actor.id,
      userName: params.actor.name?.trim() || params.actor.email,
      targetId: params.targetId,
      details: params.details ? JSON.stringify(params.details) : null,
    },
  });
}

async function inviteUserCore(
  params: InviteUserParams
): Promise<ActionResult<{ id: string; inviteLink: string }>> {
  const { email, name, role, batchId, linkedInUrl, founderId, companyId } = params;

  if (role === "co_founder" && !founderId) {
    return { success: false, error: "founderId is required when inviting a co-founder" };
  }

  const batchCheck = await requireActiveBatch(batchId, params.callerRole);
  if (batchCheck) return batchCheck as ActionResult<{ id: string; inviteLink: string }>;

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return { success: false, error: "Batch not found" };
  }

  if (role === "founder") {
    const founderCount = await prisma.userBatch.count({
      where: { batchId, role: "founder" },
    });
    if (founderCount >= 30) {
      return { success: false, error: "Founder limit reached (30 per batch)" };
    }
  }

  if (role === "founder") {
    const existingFounder = await prisma.userBatch.findFirst({
      where: {
        user: { email },
        role: "founder",
      },
    });
    if (existingFounder) {
      return { success: false, error: "This email is already registered as a Founder in another batch" };
    }
  }

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

  if (role === "co_founder") {
    const coFounderCount = await prisma.userBatch.count({
      where: { batchId, founderId, role: "co_founder" },
    });
    if (coFounderCount >= 2) {
      return { success: false, error: "Maximum 2 co-founders per founder reached" };
    }
  }

  const invitedUser = await prisma.user.upsert({
    where: { email },
    create: { email, name: name || email.split("@")[0], status: "active" },
    update: { ...(name ? { name } : {}), status: "active" },
  });

  const existing = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId: invitedUser.id, batchId } },
  });

  if (existing) {
    return { success: false, error: "User already in this batch" };
  }

  const userBatch = await prisma.userBatch.create({
    data: {
      userId: invitedUser.id,
      batchId,
      role: role as import("@prisma/client").$Enums.UserRole,
      founderId: role === "co_founder" ? founderId : undefined,
      status: "invited",
    },
  });

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

  if (companyId) {
    const companyExists = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (companyExists) {
      await prisma.companyMember.create({
        data: {
          companyId,
          userId: invitedUser.id,
          isCurrent: true,
        },
      });
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/invite/${token}`;

  const emailResult = await sendInvitationEmail({
    to: email,
    inviteeName: name || undefined,
    batchName: batch.name,
    role,
    inviteLink,
  });

  if (!emailResult.success) {
    console.warn(`Failed to send invitation email to ${email}:`, emailResult.error);
    return {
      success: true,
      data: { id: userBatch.id, inviteLink },
      warning: "User was invited but the email could not be sent. Please share the invite link directly.",
    };
  }

  return { success: true, data: { id: userBatch.id, inviteLink } };
}

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
    name: formData.get("name") || undefined,
    role: formData.get("role"),
    batchId: formData.get("batchId"),
    linkedInUrl: formData.get("linkedInUrl") || undefined,
    founderId: formData.get("founderId") || undefined,
    companyId: formData.get("companyId") || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const result = await inviteUserCore({ ...parsed.data, callerRole: user.role });

  if (result.success) {
    revalidatePath("/admin/users");
    revalidatePath("/admin/batches");
    revalidateTag(`batch-users-${parsed.data.batchId}`);
    revalidateTag("current-user");
  }

  return result;
}

export async function bulkInviteUsers(formData: FormData): Promise<ActionResult<{
  results: Array<{ email: string; success: boolean; error?: string; inviteLink?: string }>;
}>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = BulkInviteSchema.safeParse({
    emails: formData.get("emails"),
    role: formData.get("role"),
    batchId: formData.get("batchId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const rawEmails = parsed.data.emails
    .split(/[\s,;\n\r]+/)
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);

  const uniqueEmails = [...new Set(rawEmails)];

  if (uniqueEmails.length === 0) {
    return { success: false, error: "No valid emails provided" };
  }

  if (uniqueEmails.length > 50) {
    return { success: false, error: "Maximum 50 invites at once" };
  }

  const emailSchema = z.string().email();
  const invalidEmails = uniqueEmails.filter((e) => !emailSchema.safeParse(e).success);
  if (invalidEmails.length > 0) {
    return {
      success: false,
      error: `Invalid email format: ${invalidEmails.slice(0, 3).join(", ")}${invalidEmails.length > 3 ? ` and ${invalidEmails.length - 3} more` : ""}`,
    };
  }

  if (parsed.data.role === "founder") {
    const currentFounderCount = await prisma.userBatch.count({
      where: { batchId: parsed.data.batchId, role: "founder" },
    });
    const remaining = 30 - currentFounderCount;
    if (remaining <= 0) {
      return { success: false, error: "Founder limit reached (30 per batch)" };
    }

    if (uniqueEmails.length > remaining) {
      return {
        success: false,
        error: `Only ${remaining} founder slot(s) remaining. Reduce to ${remaining} emails or fewer.`,
      };
    }
  }

  const results: Array<{ email: string; success: boolean; error?: string; inviteLink?: string }> = [];

  for (const email of uniqueEmails) {
    const result = await inviteUserCore({
          email,
          role: parsed.data.role,
          batchId: parsed.data.batchId,
          callerRole: user.role,
        });

    if (result.success) {
      results.push({ email, success: true, inviteLink: result.data.inviteLink });
    } else {
      results.push({ email, success: false, error: result.error });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  revalidateTag(`batch-users-${parsed.data.batchId}`);
  revalidateTag("current-user");

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.filter((r) => !r.success).length;

  if (successCount === 0) {
    return {
      success: false,
      error: `All ${failCount} invitations failed. ${results[0]?.error || "Unknown error"}`,
    };
  }

  return {
    success: true,
    data: { results },
    ...(failCount > 0 ? { warning: `${successCount} invited, ${failCount} failed` } : {}),
  };
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

  const existingMembership = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId, batchId } },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  if (!existingMembership) {
    return { success: false, error: "User not found in this batch" };
  }

  const previousRole = existingMembership.role as UserRole;

  if (previousRole !== newRole) {
    await prisma.userBatch.update({
      where: { userId_batchId: { userId, batchId } },
      data: { role: newRole as import("@prisma/client").$Enums.UserRole },
    });

    await createAuditLogEntry({
      actor: user,
      action: "user_role_changed",
      targetId: userId,
      details: {
        batchId,
        userEmail: existingMembership.user.email,
        previousRole,
        newRole,
      },
    });
  }

  revalidatePath("/admin/users");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function updateAdditionalRoles(
  userId: string,
  batchId: string,
  additionalRoles: string[]
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const existingMembership = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId, batchId } },
    include: {
      user: {
        select: { email: true },
      },
    },
  });

  if (!existingMembership) {
    return { success: false, error: "User not found in this batch" };
  }

  const normalizedRoles = Array.from(
    new Set(
      additionalRoles
        .map((role) => role.trim())
        .filter((role) => role.length > 0)
    )
  );

  await prisma.userBatch.update({
    where: { userId_batchId: { userId, batchId } },
    data: { additionalRoles: normalizedRoles },
  });

  await createAuditLogEntry({
    actor: user,
    action: "user_additional_roles_changed",
    targetId: userId,
    details: {
      batchId,
      userEmail: existingMembership.user.email,
      previousAdditionalRoles: existingMembership.additionalRoles,
      newAdditionalRoles: normalizedRoles,
    },
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

    const remainingBatches = await tx.userBatch.count({
      where: { userId },
    });

    if (remainingBatches === 0) {
      await tx.user.update({
        where: { id: userId },
        data: { status: "inactive" },
      });
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

  await prisma.$transaction(async (tx) => {
    await tx.invitationToken.deleteMany({ where: { userId } });
    await tx.userBatch.deleteMany({ where: { userId, status: "invited" } });

    const hasAnyMembership = await tx.userBatch.count({ where: { userId } });
    if (hasAnyMembership === 0) {
      await tx.user.update({
        where: { id: userId },
        data: { status: "inactive" },
      });
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  targetUser.userBatches.forEach((userBatch) => {
    revalidateTag(`batch-users-${userBatch.batchId}`);
  });
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function resendInvite(
  userId: string,
  batchId: string
): Promise<ActionResult<{ inviteLink: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const targetMembership = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId, batchId } },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      batch: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!targetMembership) {
    return { success: false, error: "User not found in this batch" };
  }

  if (targetMembership.status !== "invited") {
    return { success: false, error: "Invite can only be resent for invited users" };
  }

  const token = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await prisma.$transaction(async (tx) => {
    await tx.invitationToken.deleteMany({
      where: {
        userId,
        batchId,
        usedAt: null,
      },
    });

    await tx.invitationToken.create({
      data: {
        token,
        userId,
        batchId,
        email: targetMembership.user.email,
        expiresAt,
      },
    });
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/invite/${token}`;

  const emailResult = await sendInvitationEmail({
    to: targetMembership.user.email,
    inviteeName: targetMembership.user.name || undefined,
    batchName: targetMembership.batch.name,
    role: targetMembership.role,
    inviteLink,
  });

  await createAuditLogEntry({
    actor: user,
    action: "invite_resent",
    targetId: userId,
    details: {
      batchId,
      userEmail: targetMembership.user.email,
      role: targetMembership.role,
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");

  if (!emailResult.success) {
    return {
      success: true,
      data: { inviteLink },
      warning: "Invite was renewed but the email could not be sent. Share the invite link directly.",
    };
  }

  return { success: true, data: { inviteLink } };
}

export async function deactivateUser(
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

  if (userId === user.id) {
    return { success: false, error: "Cannot deactivate your own account" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true },
  });

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  if (targetUser.status === "inactive") {
    return { success: false, error: "User is already deactivated" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "inactive" },
  });

  await createAuditLogEntry({
    actor: user,
    action: "user_deactivated",
    targetId: userId,
    details: {
      batchId,
      userEmail: targetUser.email,
      previousStatus: targetUser.status,
      newStatus: "inactive",
    },
  });

  revalidatePath("/admin/users");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function reactivateUser(
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

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, status: true },
  });

  if (!targetUser) {
    return { success: false, error: "User not found" };
  }

  if (targetUser.status === "active") {
    return { success: false, error: "User is already active" };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { status: "active" },
  });

  await createAuditLogEntry({
    actor: user,
    action: "user_reactivated",
    targetId: userId,
    details: {
      batchId,
      userEmail: targetUser.email,
      previousStatus: targetUser.status,
      newStatus: "active",
    },
  });

  revalidatePath("/admin/users");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function getRecentUserManagementAuditLogs(batchId: string, limit = 12) {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return [];
  }

  return prisma.auditLog.findMany({
    where: {
      action: {
        in: [...USER_ADMIN_AUDIT_ACTIONS],
      },
      details: {
        contains: `"batchId":"${batchId}"`,
      },
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });
}

export async function getFounderActivitySummaries(batchId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return [];
  }

  const founders = await prisma.userBatch.findMany({
    where: {
      batchId,
      status: "active",
      role: { in: ["founder", "co_founder"] },
    },
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          name: true,
          email: true,
          profileImage: true,
        },
      },
    },
    orderBy: { user: { name: "asc" } },
  });

  return Promise.all(
    founders.map(async (founder) => {
      const [submissionCount, feedbackCount, officeHourCount, postCount] = await Promise.all([
        prisma.submission.count({ where: { authorId: founder.userId, assignment: { batchId } } }),
        prisma.feedback.count({ where: { submission: { authorId: founder.userId, assignment: { batchId } } } }),
        prisma.officeHourRequest.count({ where: { requesterId: founder.userId, slot: { batchId } } }),
        prisma.post.count({ where: { authorId: founder.userId, batchId } }),
      ]);

      return {
        userId: founder.userId,
        name: founder.user.name,
        email: founder.user.email,
        profileImage: founder.user.profileImage,
        role: founder.role,
        submissionCount,
        feedbackCount,
        officeHourCount,
        postCount,
      };
    })
  );
}

export async function getBatchUsers(batchId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user) && user.batchId !== batchId) return [];

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
