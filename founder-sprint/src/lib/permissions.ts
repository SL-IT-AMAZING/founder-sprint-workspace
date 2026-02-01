import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { UserRole, UserWithBatch } from "@/types";

// Get current authenticated user with their role in a specific batch
export async function getCurrentUser(batchId?: string): Promise<UserWithBatch | null> {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) return null;

  // Find user in our DB
  const user = await prisma.user.findUnique({
    where: { email: authUser.email! },
    include: {
      userBatches: {
        where: batchId ? { batchId, status: "active" } : { status: "active" },
        include: { batch: true },
        take: 1,
        orderBy: { batch: { createdAt: "desc" } },
      },
    },
  });

  if (!user || user.userBatches.length === 0) return null;

  const ub = user.userBatches[0];
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    profileImage: user.profileImage,
    jobTitle: user.jobTitle,
    company: user.company,
    bio: user.bio,
    role: ub.role as UserRole,
    batchId: ub.batchId,
    batchName: ub.batch.name,
  };
}

// Permission check helpers
export function isAdmin(role: UserRole): boolean {
  return role === "super_admin" || role === "admin";
}

export function isStaff(role: UserRole): boolean {
  return role === "super_admin" || role === "admin" || role === "mentor";
}

export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

export function isFounder(role: UserRole): boolean {
  return role === "founder" || role === "co_founder";
}

export function canCreateQuestion(role: UserRole): boolean {
  return role === "founder" || role === "co_founder";
}

export function canAnswerQuestion(role: UserRole): boolean {
  return isStaff(role);
}

export function canCreateSummary(role: UserRole): boolean {
  return isAdmin(role);
}

export function canCreateEvent(role: UserRole): boolean {
  return isAdmin(role);
}

export function canCreateAssignment(role: UserRole): boolean {
  return isAdmin(role) || role === "mentor";
}

export function canManageBatch(role: UserRole): boolean {
  return isAdmin(role);
}

export function canManageUsers(role: UserRole): boolean {
  return isAdmin(role);
}

export function canCreateOfficeHourSlot(role: UserRole): boolean {
  return isStaff(role);
}

export function canManageGroups(role: UserRole): boolean {
  return isAdmin(role);
}

// Require permission - throws if not authorized
export function requireRole(role: UserRole, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized: insufficient permissions");
  }
}
