"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const CreateBatchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
});

export async function createBatch(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = CreateBatchSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const batch = await prisma.batch.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description || null,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
    },
  });

  // Auto-add the creator as admin of this batch
  await prisma.userBatch.create({
    data: {
      userId: user.id,
      batchId: batch.id,
      role: user.role as any,
      status: "active",
      joinedAt: new Date(),
    },
  });

  revalidatePath("/admin/batches");
  return { success: true, data: { id: batch.id } };
}

export async function archiveBatch(batchId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  await prisma.batch.update({
    where: { id: batchId },
    data: { status: "archived" },
  });

  revalidatePath("/admin/batches");
  return { success: true, data: undefined };
}

export async function deleteBatch(batchId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin"]);
  } catch {
    return { success: false, error: "Only Super Admin can delete batches" };
  }

  const batch = await prisma.batch.findUnique({ where: { id: batchId } });
  if (!batch) {
    return { success: false, error: "Batch not found" };
  }

  await prisma.batch.delete({
    where: { id: batchId },
  });

  revalidatePath("/admin/batches");
  return { success: true, data: undefined };
}

export async function getBatches() {
  return prisma.batch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { userBatches: true } },
    },
  });
}

export async function getBatch(id: string) {
  return prisma.batch.findUnique({
    where: { id },
    include: {
      userBatches: {
        include: { user: true },
        orderBy: { invitedAt: "desc" },
      },
    },
  });
}
