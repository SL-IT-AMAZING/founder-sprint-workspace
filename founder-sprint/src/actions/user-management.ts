"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isCurrentUserSuperAdmin, requireRole, isAdmin } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { sendInvitationEmail } from "@/lib/email";
import { ASSIGNABLE_ROLES, isRoleBelow } from "@/lib/role-hierarchy";
import { revalidatePath, revalidateTag as revalidateTagBase } from "next/cache";
import { randomUUID } from "crypto";
import { z } from "zod";
import type { ActionResult, UserRole } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().max(100).optional().transform((v) => v || undefined),
  role: z.enum(["super_admin", "admin", "mentor", "founder", "co_founder"]),
  batchId: z.string().uuid(),
  linkedInUrl: z.string().optional(),
  founderId: z.string().uuid().optional(), // Required when role is co_founder
  companyId: z.string().uuid().optional(),
});

const BulkInviteSchema = z.object({
  emails: z.string().min(1),
  role: z.enum(["super_admin", "admin", "mentor", "founder", "co_founder"]),
  batchId: z.string().uuid(),
});

const InviteBatchMembersSchema = z.object({
  sourceBatchId: z.string().uuid(),
  targetBatchId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(1),
});

interface InviteUserParams {
  email: string;
  name?: string;
  role: "super_admin" | "admin" | "mentor" | "founder" | "co_founder";
  batchId: string;
  linkedInUrl?: string;
  founderId?: string;
  companyId?: string;
  callerRole?: UserRole;
}

function getBatchRoleForAssignment(role: InviteUserParams["role"]): Exclude<UserRole, "super_admin"> {
  return role === "super_admin" ? "admin" : role;
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
  "user_batch_dropped_out",
  "user_batch_restored",
  "invite_resent",
  "user_notification_email_changed",
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
): Promise<ActionResult<{ id: string; inviteLink?: string; membershipStatus: "active" | "invited" }>> {
  const { email, name, role, batchId, founderId, companyId } = params;
  const batchRole = getBatchRoleForAssignment(role);

  if (role === "super_admin" && params.callerRole !== "super_admin") {
    return { success: false, error: "Only Super Admin can assign Super Admin role" };
  }

  if (role === "co_founder" && !founderId) {
    return { success: false, error: "founderId is required when inviting a co-founder" };
  }

  const batchCheck = await requireActiveBatch(batchId, params.callerRole);
  if (batchCheck && !batchCheck.success) {
    return { success: false, error: "error" in batchCheck ? batchCheck.error : "Invalid batch" };
  }

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

  if (role === "co_founder") {
    const founderMembership = await prisma.userBatch.findFirst({
      where: {
        batchId,
        userId: founderId,
        OR: [{ role: "founder" }, { additionalRoles: { has: "founder" } }],
      },
      select: { id: true },
    });

    if (!founderMembership) {
      return { success: false, error: "Primary founder must belong to this batch" };
    }

    const coFounderCount = await prisma.userBatch.count({
      where: { batchId, founderId, role: "co_founder" },
    });
    if (coFounderCount >= 2) {
      return { success: false, error: "Maximum 2 co-founders per founder reached" };
    }
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      status: true,
      linkedinId: true,
      role: true,
      name: true,
      userBatches: {
        where: { status: "active" },
        select: { id: true },
      },
      companyMemberships: {
        where: { isCurrent: true },
        select: {
          companyId: true,
          company: {
            select: { name: true },
          },
        },
      },
    },
  });

  if (existingUser && companyId) {
    const currentCompanyIds = new Set(existingUser.companyMemberships.map((membership) => membership.companyId));

    if (existingUser.companyMemberships.length > 0 && !currentCompanyIds.has(companyId)) {
      const currentCompanies = existingUser.companyMemberships.map((membership) => membership.company.name).join(", ");
      return {
        success: false,
        error: `Existing user already belongs to ${currentCompanies}. Leave company empty or update company membership separately.`,
      };
    }
  }

  const existingGlobalRole = existingUser?.role as UserRole | null | undefined;
  const elevatedGlobalRole: import("@prisma/client").$Enums.UserRole | null =
    role === "super_admin"
      ? "super_admin"
      : role === "admin" && existingGlobalRole !== "super_admin"
        ? "admin"
        : null;

  const invitedUser = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: name || email.split("@")[0],
      status: "active",
      ...(elevatedGlobalRole ? { role: elevatedGlobalRole } : {}),
    },
    update: {
      ...(name ? { name } : {}),
      status: "active",
      ...(elevatedGlobalRole ? { role: elevatedGlobalRole } : {}),
    },
  });

  const canDirectActivate = Boolean(
    existingUser &&
      existingUser.status === "active" &&
      (existingUser.userBatches.length > 0 ||
        existingUser.role === "admin" ||
        existingUser.role === "super_admin" ||
        existingUser.linkedinId)
  );

  const existing = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId: invitedUser.id, batchId } },
  });

  if (existing) {
    if (existing.status === "invited" && canDirectActivate) {
      const activatedMembership = await prisma.userBatch.update({
        where: { userId_batchId: { userId: invitedUser.id, batchId } },
        data: {
          role: batchRole as import("@prisma/client").$Enums.UserRole,
          founderId: role === "co_founder" ? founderId : null,
          status: "active",
          joinedAt: new Date(),
        },
      });

      await prisma.invitationToken.updateMany({
        where: { userId: invitedUser.id, batchId, usedAt: null },
        data: { usedAt: new Date() },
      });

      if (companyId) {
        const companyMember = await prisma.companyMember.findFirst({
          where: { companyId, userId: invitedUser.id, isCurrent: true },
          select: { id: true },
        });

        if (!companyMember) {
          await prisma.companyMember.create({
            data: {
              companyId,
              userId: invitedUser.id,
              isCurrent: true,
            },
          });
        }
      }

      return {
        success: true,
        data: { id: activatedMembership.id, membershipStatus: "active" },
        warning: "Existing user was added directly to this batch.",
      };
    }

    return { success: false, error: "User already in this batch" };
  }

  const membershipStatus = canDirectActivate ? "active" : "invited";

  const userBatch = await prisma.userBatch.create({
    data: {
      userId: invitedUser.id,
      batchId,
      role: batchRole as import("@prisma/client").$Enums.UserRole,
      founderId: role === "co_founder" ? founderId : undefined,
      status: membershipStatus,
      joinedAt: membershipStatus === "active" ? new Date() : undefined,
    },
  });

  if (companyId) {
    const companyExists = await prisma.company.findUnique({
      where: { id: companyId },
    });
    if (companyExists) {
      const companyMember = await prisma.companyMember.findFirst({
        where: { companyId, userId: invitedUser.id, isCurrent: true },
        select: { id: true },
      });
      if (!companyMember) {
        await prisma.companyMember.create({
          data: {
            companyId,
            userId: invitedUser.id,
            isCurrent: true,
          },
        });
      }
    }
  }

  if (membershipStatus === "active") {
    return {
      success: true,
      data: { id: userBatch.id, membershipStatus },
      warning: "Existing user was added directly to this batch.",
    };
  }

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
      data: { id: userBatch.id, inviteLink, membershipStatus },
      warning: "User was invited but the email could not be sent. Please share the invite link directly.",
    };
  }

  return { success: true, data: { id: userBatch.id, inviteLink, membershipStatus } };
}

export async function inviteUser(formData: FormData): Promise<ActionResult<{ id: string; inviteLink?: string; membershipStatus: "active" | "invited" }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const canAssignSuperAdmin = await isCurrentUserSuperAdmin();

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

  const result = await inviteUserCore({
    ...parsed.data,
    callerRole: canAssignSuperAdmin ? "super_admin" : user.role,
  });

  if (result.success) {
    revalidatePath("/admin/users");
    revalidatePath("/admin/batches");
    revalidateTag(`batch-users-${parsed.data.batchId}`);
    revalidateTag("current-user");
  }

  return result;
}

export async function bulkInviteUsers(formData: FormData): Promise<ActionResult<{
  results: Array<{ email: string; success: boolean; error?: string; inviteLink?: string; membershipStatus?: "active" | "invited" }>;
}>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const canAssignSuperAdmin = await isCurrentUserSuperAdmin();

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

  const results: Array<{ email: string; success: boolean; error?: string; inviteLink?: string; membershipStatus?: "active" | "invited" }> = [];

  for (const email of uniqueEmails) {
        const result = await inviteUserCore({
          email,
          role: parsed.data.role,
          batchId: parsed.data.batchId,
          callerRole: canAssignSuperAdmin ? "super_admin" : user.role,
        });

    if (result.success) {
      results.push({ email, success: true, inviteLink: result.data.inviteLink, membershipStatus: result.data.membershipStatus });
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

export async function inviteBatchMembersFromSource(input: {
  sourceBatchId: string;
  targetBatchId: string;
  userIds: string[];
}): Promise<ActionResult<{
  results: Array<{ email: string; success: boolean; error?: string; inviteLink?: string; membershipStatus?: "active" | "invited" }>;
}>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };
  const canAssignSuperAdmin = await isCurrentUserSuperAdmin();

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = InviteBatchMembersSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  if (parsed.data.sourceBatchId === parsed.data.targetBatchId) {
    return { success: false, error: "Source and target batch must be different" };
  }

  const sourceMembers = await prisma.userBatch.findMany({
    where: {
      batchId: parsed.data.sourceBatchId,
      userId: { in: parsed.data.userIds },
      status: "active",
    },
    include: {
      user: {
        include: {
          companyMemberships: {
            where: { isCurrent: true },
            select: { companyId: true },
          },
        },
      },
    },
  });

  if (sourceMembers.length === 0) {
    return { success: false, error: "No valid source members selected" };
  }

  const roleOrder = { founder: 0, co_founder: 1, mentor: 2, admin: 3, super_admin: 4 } as const;
  sourceMembers.sort((a, b) => {
    const aRole = (a.user.role === "super_admin" ? "super_admin" : a.role) as keyof typeof roleOrder;
    const bRole = (b.user.role === "super_admin" ? "super_admin" : b.role) as keyof typeof roleOrder;
    return roleOrder[aRole] - roleOrder[bRole];
  });

  const results: Array<{ email: string; success: boolean; error?: string; inviteLink?: string; membershipStatus?: "active" | "invited" }> = [];

  for (const member of sourceMembers) {
    const role = (member.user.role === "super_admin" ? "super_admin" : member.role) as InviteUserParams["role"];
    const companyId = member.user.companyMemberships[0]?.companyId;
    const result = await inviteUserCore({
      email: member.user.email.toLowerCase(),
      name: member.user.name || undefined,
      role,
      batchId: parsed.data.targetBatchId,
      founderId: role === "co_founder" ? member.founderId || undefined : undefined,
      companyId,
      callerRole: canAssignSuperAdmin ? "super_admin" : user.role,
    });

    if (result.success) {
      results.push({
        email: member.user.email,
        success: true,
        inviteLink: result.data.inviteLink,
        membershipStatus: result.data.membershipStatus,
      });
    } else {
      results.push({ email: member.user.email, success: false, error: result.error });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  revalidateTag(`batch-users-${parsed.data.targetBatchId}`);
  revalidateTag("current-user");

  const successCount = results.filter((r) => r.success).length;
  const failCount = results.length - successCount;

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
  const canAssignSuperAdmin = await isCurrentUserSuperAdmin();

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  // Cannot change super_admin role
  if (newRole === "super_admin" && !canAssignSuperAdmin) {
    return { success: false, error: "Only Super Admin can assign Super Admin role" };
  }

  const existingMembership = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId, batchId } },
    include: {
      user: {
        select: { email: true, role: true },
      },
    },
  });

  if (!existingMembership) {
    return { success: false, error: "User not found in this batch" };
  }

  const previousRole = (existingMembership.user.role === "super_admin"
    ? "super_admin"
    : existingMembership.role) as UserRole;

  const previousGlobalRole = existingMembership.user.role as UserRole | null;
  const isPromotingToElevated = newRole === "super_admin" || newRole === "admin";
  const isDemotingFromElevated =
    !isPromotingToElevated &&
    (previousGlobalRole === "super_admin" || previousGlobalRole === "admin");

  const expectedGlobalRole: import("@prisma/client").$Enums.UserRole | undefined =
    isPromotingToElevated
      ? (newRole as import("@prisma/client").$Enums.UserRole)
      : isDemotingFromElevated
        ? "founder"
        : undefined;

  const batchRoleChanged = previousRole !== newRole;
  const globalRoleNeedsSync =
    expectedGlobalRole !== undefined && expectedGlobalRole !== previousGlobalRole;

  if (batchRoleChanged || globalRoleNeedsSync) {
    const nextPrimaryBatchRole = newRole === "super_admin" ? "admin" : newRole;
    const previousAdditionalRoles = (existingMembership.additionalRoles ?? []).filter(
      (role): role is UserRole => ASSIGNABLE_ROLES.includes(role as UserRole)
    );
    const nextAdditionalRoles = previousAdditionalRoles.filter((role) => isRoleBelow(role, nextPrimaryBatchRole));
    const removedAdditionalRoles = previousAdditionalRoles.filter((role) => !nextAdditionalRoles.includes(role));

    await prisma.$transaction(async (tx) => {
      if (expectedGlobalRole !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: { role: expectedGlobalRole },
        });
      }

      await tx.userBatch.update({
        where: { userId_batchId: { userId, batchId } },
        data: {
          role: nextPrimaryBatchRole as import("@prisma/client").$Enums.UserRole,
          additionalRoles: nextAdditionalRoles,
        },
      });
    });

    if (batchRoleChanged) {
      await createAuditLogEntry({
        actor: user,
        action: "user_role_changed",
        targetId: userId,
        details: {
          batchId,
          userEmail: existingMembership.user.email,
          previousRole,
          newRole,
          removedAdditionalRoles,
        },
      });
    }
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

  const filteredRoles = normalizedRoles.filter((role): role is UserRole =>
    ASSIGNABLE_ROLES.includes(role as UserRole)
  );
  const primaryRole = existingMembership.role as UserRole;
  const invalidHierarchyRole = filteredRoles.find((role) => !isRoleBelow(role, primaryRole));

  if (invalidHierarchyRole) {
    return {
      success: false,
      error: `Additional roles must be below the primary role (${primaryRole})`,
    };
  }

  await prisma.userBatch.update({
    where: { userId_batchId: { userId, batchId } },
    data: { additionalRoles: filteredRoles },
  });

  await createAuditLogEntry({
    actor: user,
    action: "user_additional_roles_changed",
    targetId: userId,
    details: {
        batchId,
        userEmail: existingMembership.user.email,
        previousAdditionalRoles: existingMembership.additionalRoles,
        newAdditionalRoles: filteredRoles,
      },
    });

  revalidatePath("/admin/users");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

const NotificationEmailInputSchema = z
  .string()
  .email("Notification email must be a valid email address")
  .max(254, "Notification email is too long")
  .optional()
  .nullable()
  .transform((value) => {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : null;
  });

export async function updateUserNotificationEmail(
  userId: string,
  notificationEmailInput: string | null
): Promise<ActionResult> {
  const actor = await getCurrentUser();
  if (!actor) return { success: false, error: "Not authenticated" };

  try {
    requireRole(actor.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = NotificationEmailInputSchema.safeParse(notificationEmailInput);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid email" };
  }

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, notificationEmail: true },
  });
  if (!target) return { success: false, error: "User not found" };

  const nextValue = parsed.data;
  if (nextValue === target.notificationEmail) {
    return { success: true, data: undefined };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { notificationEmail: nextValue },
  });

  await createAuditLogEntry({
    actor,
    action: "user_notification_email_changed",
    targetId: userId,
    details: {
      userEmail: target.email,
      previousNotificationEmail: target.notificationEmail,
      newNotificationEmail: nextValue,
    },
  });

  revalidatePath("/admin/users");
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

export async function cancelInvite(userId: string, batchId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const targetMembership = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId, batchId } },
    select: { status: true },
  });

  if (!targetMembership) {
    return { success: false, error: "Invite not found" };
  }

  if (targetMembership.status !== "invited") {
    return { success: false, error: "Only pending invites can be cancelled" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.invitationToken.deleteMany({ where: { userId, batchId } });
    await tx.userBatch.deleteMany({ where: { userId, batchId, status: "invited" } });

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
  revalidateTag(`batch-users-${batchId}`);
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

export async function dropoutUserFromBatch(
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
    return { success: false, error: "Cannot drop yourself out of the batch" };
  }

  const membership = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId, batchId } },
    include: { user: { select: { email: true } } },
  });

  if (!membership) {
    return { success: false, error: "Batch membership not found" };
  }

  if (membership.status !== "active") {
    return { success: false, error: "Only active batch memberships can be dropped out" };
  }

  await prisma.userBatch.update({
    where: { userId_batchId: { userId, batchId } },
    data: { status: "dropped_out" },
  });

  await createAuditLogEntry({
    actor: user,
    action: "user_batch_dropped_out",
    targetId: userId,
    details: {
      batchId,
      userEmail: membership.user.email,
      previousStatus: membership.status,
      newStatus: "dropped_out",
    },
  });

  revalidatePath("/admin/users");
  revalidateTag(`batch-users-${batchId}`);
  revalidateTag("current-user");
  return { success: true, data: undefined };
}

export async function restoreUserBatch(
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

  const membership = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId, batchId } },
    include: { user: { select: { email: true } } },
  });

  if (!membership) {
    return { success: false, error: "Batch membership not found" };
  }

  if (membership.status !== "dropped_out") {
    return { success: false, error: "Only dropped out memberships can be restored" };
  }

  await prisma.userBatch.update({
    where: { userId_batchId: { userId, batchId } },
    data: { status: "active" },
  });

  await createAuditLogEntry({
    actor: user,
    action: "user_batch_restored",
    targetId: userId,
    details: {
      batchId,
      userEmail: membership.user.email,
      previousStatus: membership.status,
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

  const batchUsers = await prisma.userBatch.findMany({
    where: { batchId },
    include: { user: true, batch: true },
    orderBy: { invitedAt: "desc" },
  });

  return batchUsers.map((membership) => ({
    ...membership,
    role: membership.user.role === "super_admin" ? "super_admin" : membership.role,
    additionalRoles: membership.additionalRoles ?? [],
    user: {
      ...membership.user,
      status: membership.user.status ?? "active",
    },
  }));
}

export async function getAllBatchUsers() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user)) return [];

  const batchUsers = await prisma.userBatch.findMany({
    include: { user: true, batch: true },
    orderBy: [{ batchId: "asc" }, { invitedAt: "desc" }],
  });

  return batchUsers.map((membership) => ({
    ...membership,
    role: membership.user.role === "super_admin" ? "super_admin" : membership.role,
    additionalRoles: membership.additionalRoles ?? [],
    user: {
      ...membership.user,
      status: membership.user.status ?? "active",
    },
  }));
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
