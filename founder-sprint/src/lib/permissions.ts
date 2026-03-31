import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { classifyAvatarSource } from "@/lib/avatar-source";
import { ingestLinkedInAvatar } from "@/lib/linkedin-avatar-ingest";
import type { UserRole, UserStatus, UserWithBatch } from "@/types";

type PermissionSubject =
  | UserRole
  | {
      role?: UserRole | null;
      additionalRoles?: string[] | null;
      status?: string | null;
    }
  | null
  | undefined;

function getPermissionContext(subject: PermissionSubject): { isActive: boolean; roles: Set<string> } {
  if (!subject) {
    return { isActive: false, roles: new Set<string>() };
  }

  if (typeof subject === "string") {
    return { isActive: true, roles: new Set<string>([subject]) };
  }

  const roles = new Set<string>();

  if (subject.role) {
    roles.add(subject.role);
  }

  for (const additionalRole of subject.additionalRoles || []) {
    if (additionalRole) {
      roles.add(additionalRole);
    }
  }

  const isActive = !subject.status || subject.status === "active";

  return { isActive, roles };
}

function hasAnyRole(subject: PermissionSubject, allowedRoles: UserRole[]): boolean {
  const { isActive, roles } = getPermissionContext(subject);
  if (!isActive) return false;
  return allowedRoles.some((allowedRole) => roles.has(allowedRole));
}

const getCachedUserByEmail = (email: string, batchId?: string) =>
  unstable_cache(
    async () => {
      return prisma.user.findUnique({
        where: { email },
        include: {
          userBatches: {
            where: batchId ? { batchId, status: "active" } : { status: "active" },
            include: { batch: true },
            take: 1,
            orderBy: { batch: { createdAt: "desc" } },
          },
        },
      });
    },
    [`current-user-${email}-${batchId || "default"}`],
    { revalidate: 30, tags: ["current-user"] }
  )();

/**
 * Returns the authenticated user with their active batch context.
 *
 * SECURITY NOTE: The `selected_batch_id` cookie is client-modifiable, but this is safe because:
 * 1. `getCachedUserByEmail()` filters userBatches by `status: "active"`, so a user can only
 *    access batches where they have an active membership.
 * 2. If the cookie points to a batch the user doesn't belong to, `userBatches` returns empty,
 *    triggering the fallback (lines 58-67) which clears the invalid cookie and retries.
 * 3. Non-admin users without any active batch membership get `null` (no access).
 *
 * This means manipulating the cookie can only switch between the user's OWN active batches,
 * never grant access to unauthorized batches.
 */
export const getCurrentUser = cache(async (batchId?: string): Promise<UserWithBatch | null> => {
  // Read batch preference from cookie if not explicitly provided
  if (!batchId) {
    try {
      const cookieStore = await cookies();
      batchId = cookieStore.get("selected_batch_id")?.value; // Client-modifiable; validated by getCachedUserByEmail()
    } catch {
      // cookies() may throw in some contexts (e.g., during build)
    }
  }

  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser?.email) return null;
  const authEmail = authUser.email;
  const authAvatarUrl = authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture || null;

  let user = await getCachedUserByEmail(authEmail, batchId);

  if (!user) return null;
  if (authAvatarUrl) {
    const avatarSource = classifyAvatarSource(user.profileImage);
    if (avatarSource === "empty" || avatarSource === "linkedin") {
      const ingestedAvatarUrl = await ingestLinkedInAvatar(user.id, authAvatarUrl);
      if (ingestedAvatarUrl) {
        await prisma.user.update({
          where: { id: user.id },
          data: { profileImage: ingestedAvatarUrl },
        });
        user = {
          ...user,
          profileImage: ingestedAvatarUrl,
        };
      }
    }
  }
  const userStatus = (user as { status?: string }).status ?? "active";
  if (userStatus !== "active") return null;

  const globalRole = user.role as UserRole | null;
  const isGlobalAdmin = globalRole === "super_admin" || globalRole === "admin";

  // Fallback: if cookie pointed to an invalid batch, clear it and retry
  if (batchId && user.userBatches.length === 0 && !isGlobalAdmin) {
    try {
      const cookieStore = await cookies();
      cookieStore.delete("selected_batch_id");
    } catch {
      // ignore
    }
    user = await getCachedUserByEmail(authEmail);
    if (!user) return null;
  }

  // Fetch ALL active batch memberships for multi-batch support
  const allBatchMemberships = await prisma.userBatch.findMany({
    where: { userId: user.id, status: "active" },
    select: { batchId: true, role: true },
  });
  const userBatchIds = allBatchMemberships.map(b => b.batchId);
  const hasSuperAdminMembership = allBatchMemberships.some((membership) => membership.role === "super_admin");
  const effectiveGlobalRole = globalRole === "super_admin" || hasSuperAdminMembership
    ? "super_admin"
    : globalRole;
  const isElevatedAdmin = effectiveGlobalRole === "super_admin" || effectiveGlobalRole === "admin";

  const userTimezone = (user as { timezone?: string | null }).timezone ?? null;

  if (user.userBatches.length === 0) {
    if (isElevatedAdmin) {
      const selectedBatch =
        (batchId
          ? await prisma.batch.findUnique({
              where: { id: batchId },
              select: { id: true, name: true, endDate: true, status: true },
            })
          : null) ||
        (await prisma.batch.findFirst({
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          select: { id: true, name: true, endDate: true, status: true },
        }));

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        timezone: userTimezone,
        status: userStatus as UserStatus,
        jobTitle: user.jobTitle,
        company: user.company,
        bio: user.bio,
        role: effectiveGlobalRole,
        additionalRoles: [],
        batchId: selectedBatch?.id || "",
        batchName: selectedBatch?.name || "",
        batchEndDate: selectedBatch?.endDate,
        batchStatus: selectedBatch?.status as import("@/types").BatchStatus | undefined,
        userBatchIds,
      };
    }
    return null;
  }

  const ub = user.userBatches[0];
  const additionalRoles = (ub as { additionalRoles?: string[] }).additionalRoles ?? [];

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
    timezone: userTimezone,
    status: userStatus as UserStatus,
    jobTitle: user.jobTitle,
    company: user.company,
    bio: user.bio,
    role: effectiveGlobalRole ?? (ub.role as UserRole),
    additionalRoles: isElevatedAdmin ? [] : additionalRoles,
    batchId: ub.batchId,
    batchName: ub.batch.name,
    batchEndDate: ub.batch.endDate,
    batchStatus: ub.batch.status as import("@/types").BatchStatus,
    userBatchIds,
  };
});

export const isCurrentUserSuperAdmin = cache(async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === "super_admin";
});

export function isAdmin(subject: PermissionSubject): boolean {
  return hasAnyRole(subject, ["super_admin", "admin"]);
}

export function isStaff(subject: PermissionSubject): boolean {
  return hasAnyRole(subject, ["super_admin", "admin", "mentor"]);
}

export function isSuperAdmin(subject: PermissionSubject): boolean {
  return hasAnyRole(subject, ["super_admin"]);
}

export function isFounder(subject: PermissionSubject): boolean {
  return hasAnyRole(subject, ["founder", "co_founder"]);
}

export function canCreateQuestion(subject: PermissionSubject): boolean {
  return isFounder(subject);
}

export function canAnswerQuestion(subject: PermissionSubject): boolean {
  return isStaff(subject);
}

export function canCreateSummary(subject: PermissionSubject): boolean {
  return isAdmin(subject);
}

export function canCreateEvent(subject: PermissionSubject): boolean {
  return isAdmin(subject);
}

export function canCreateAssignment(subject: PermissionSubject): boolean {
  return isAdmin(subject) || hasAnyRole(subject, ["mentor"]);
}

export function canManageBatch(subject: PermissionSubject): boolean {
  return isAdmin(subject);
}

export function canManageUsers(subject: PermissionSubject): boolean {
  return isAdmin(subject);
}

export function canCreateOfficeHourSlot(subject: PermissionSubject): boolean {
  return isAdmin(subject);
}

export function canManageGroups(subject: PermissionSubject): boolean {
  return isAdmin(subject);
}

export function requireRole(subject: PermissionSubject, allowedRoles: UserRole[]): void {
  if (!hasAnyRole(subject, allowedRoles)) {
    throw new Error("Unauthorized: insufficient permissions");
  }
}
