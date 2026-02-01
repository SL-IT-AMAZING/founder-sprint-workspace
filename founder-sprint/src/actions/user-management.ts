"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, UserRole } from "@/types";

const InviteUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "mentor", "founder", "co_founder"]),
  batchId: z.string().uuid(),
});

export async function inviteUser(formData: FormData): Promise<ActionResult<{ id: string }>> {
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
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const { email, name, role, batchId } = parsed.data;

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

  // Check co-founder limit (0-2 per founder, not 0-3)
  if (role === "co_founder") {
    // Note: This validation assumes co-founders are associated with a specific founder
    // Since the current schema doesn't directly link co-founders to their main founder,
    // we enforce a general limit per batch. If you need per-founder limits,
    // you'll need to add a founderId field to track which founder each co-founder belongs to.
    const coFounderCount = await prisma.userBatch.count({
      where: { batchId, role: "co_founder" },
    });
    // With 30 founders max and 2 co-founders per founder, max is 60
    if (coFounderCount >= 60) {
      return { success: false, error: "Co-founder limit reached (2 per founder, 60 per batch)" };
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
      status: "invited",
    },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  return { success: true, data: { id: userBatch.id } };
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

  await prisma.userBatch.delete({
    where: { userId_batchId: { userId, batchId } },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/batches");
  return { success: true, data: undefined };
}

export async function getBatchUsers(batchId: string) {
  return prisma.userBatch.findMany({
    where: { batchId },
    include: { user: true, batch: true },
    orderBy: { invitedAt: "desc" },
  });
}
