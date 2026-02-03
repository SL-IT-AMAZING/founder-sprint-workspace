import { cache } from "react";
import { unstable_cache } from "next/cache";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserFromHeaders } from "@/lib/auth";
import type { UserRole, UserWithBatch } from "@/types";

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

export const getCurrentUser = cache(async (batchId?: string): Promise<UserWithBatch | null> => {
  // Read batch preference from cookie if not explicitly provided
  if (!batchId) {
    try {
      const cookieStore = await cookies();
      batchId = cookieStore.get("selected_batch_id")?.value;
    } catch {
      // cookies() may throw in some contexts (e.g., during build)
    }
  }

  let authEmail: string | null = null;

  const headerAuth = await getAuthUserFromHeaders();
  if (headerAuth) {
    authEmail = headerAuth.email;
  } else {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;
    authEmail = authUser.email!;
  }

  if (!authEmail) return null;

  let user = await getCachedUserByEmail(authEmail, batchId);

  if (!user) return null;

  // Fallback: if cookie pointed to an invalid batch, clear it and retry
  if (batchId && user.userBatches.length === 0) {
    try {
      const cookieStore = await cookies();
      cookieStore.delete("selected_batch_id");
    } catch {
      // ignore
    }
    user = await getCachedUserByEmail(authEmail);
    if (!user) return null;
  }

  if (user.userBatches.length === 0) {
    const globalRole = user.role as UserRole | null;
    if (globalRole === "super_admin" || globalRole === "admin") {
      return {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        jobTitle: user.jobTitle,
        company: user.company,
        bio: user.bio,
        role: globalRole,
        batchId: "",
        batchName: "",
      };
    }
    return null;
  }

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
});

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

export function requireRole(role: UserRole, allowedRoles: UserRole[]): void {
  if (!allowedRoles.includes(role)) {
    throw new Error("Unauthorized: insufficient permissions");
  }
}
