"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireRole } from "@/lib/permissions";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const BatchDateStringSchema = z.string().refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  "Invalid batch date"
);

const CreateBatchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: BatchDateStringSchema.transform((s) => new Date(s)),
  endDate: BatchDateStringSchema.transform((s) => new Date(s)),
});

const UpdateBatchSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

const CloneBatchSchema = z.object({
  sourceBatchId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  startDate: BatchDateStringSchema.transform((s) => new Date(s)),
  endDate: BatchDateStringSchema.transform((s) => new Date(s)),
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
      role: user.role as import("@prisma/client").$Enums.UserRole,
      status: "active",
      joinedAt: new Date(),
    },
  });

  revalidatePath("/admin/batches");
  revalidateTag("batches");
  revalidateTag("current-user");
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
  revalidateTag("batches");
  return { success: true, data: undefined };
}

export async function updateBatch(
  batchId: string,
  data: { name?: string; startDate?: Date; endDate?: Date; description?: string }
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = UpdateBatchSchema.safeParse(data);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const batch = await prisma.batch.update({
    where: { id: batchId },
    data: {
      ...(parsed.data.name && { name: parsed.data.name }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description || null }),
      ...(parsed.data.startDate && { startDate: parsed.data.startDate }),
      ...(parsed.data.endDate && { endDate: parsed.data.endDate }),
    },
  });

  revalidatePath("/admin/batches");
  revalidateTag("batches");
  return { success: true, data: { id: batch.id } };
}

export async function deleteBatch(batchId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin"]);
  } catch {
    return { success: false, error: "Unauthorized: only Super Admin can delete batches" };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({ where: { id: batchId }, select: { id: true } });
      if (!batch) {
        return { success: false as const, error: "Batch not found" };
      }

      const [sessionCount, eventCount] = await Promise.all([
        tx.session.count({ where: { batchId } }),
        tx.event.count({ where: { batchId } }),
      ]);

      if (sessionCount > 0 || eventCount > 0) {
        const parts = [];
        if (sessionCount > 0) parts.push(`${sessionCount} session(s)`);
        if (eventCount > 0) parts.push(`${eventCount} event(s)`);
        return {
          success: false as const,
          error: `Cannot delete: ${parts.join(" and ")} still belong to this batch. Reassign or delete them first.`,
        };
      }

      await tx.batch.delete({ where: { id: batchId } });
      return { success: true as const };
    });

    if (!result.success) {
      return result;
    }
  } catch (error) {
    if (error && typeof error === "object" && "code" in error) {
      return {
        success: false,
        error: "Cannot delete this batch because related records still depend on it. Remove or reassign them first.",
      };
    }
    throw error;
  }

  revalidatePath("/admin/batches");
  revalidateTag("batches");
  return { success: true, data: undefined };
}

export async function cloneBatchStructure(formData: FormData): Promise<ActionResult<{ id: string; name: string; sourceBatchId: string; assignmentCount: number; sessionCount: number }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  try {
    requireRole(user.role, ["super_admin", "admin"]);
  } catch {
    return { success: false, error: "Unauthorized" };
  }

  const parsed = CloneBatchSchema.safeParse({
    sourceBatchId: formData.get("sourceBatchId"),
    name: formData.get("name"),
    description: formData.get("description"),
    startDate: formData.get("startDate"),
    endDate: formData.get("endDate"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const sourceBatch = await prisma.batch.findUnique({ where: { id: parsed.data.sourceBatchId } });
  if (!sourceBatch) {
    return { success: false, error: "Source batch not found" };
  }

  const sourceStartDate = new Date(sourceBatch.startDate);
  const newStartDate = new Date(parsed.data.startDate);
  const offsetMs = newStartDate.getTime() - sourceStartDate.getTime();

  function shiftDate(original: Date | null): Date | null {
    if (!original) return null;
    return new Date(original.getTime() + offsetMs);
  }

  const [sourceAssignments, sourceSessions] = await Promise.all([
    prisma.assignment.findMany({ where: { batchId: parsed.data.sourceBatchId } }),
    prisma.session.findMany({ where: { batchId: parsed.data.sourceBatchId } }),
  ]);

  const clonedBatch = await prisma.$transaction(async (tx) => {
    const newBatch = await tx.batch.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description || null,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
      },
    });

    await tx.userBatch.create({
      data: {
        userId: user.id,
        batchId: newBatch.id,
        role: user.role as import("@prisma/client").$Enums.UserRole,
        status: "active",
        joinedAt: new Date(),
      },
    });

    if (sourceAssignments.length > 0) {
      await tx.assignment.createMany({
        data: sourceAssignments.map((assignment) => ({
          batchId: newBatch.id,
          title: assignment.title,
          description: assignment.description,
          templateUrl: assignment.templateUrl,
          reviewCriteria: assignment.reviewCriteria,
          targetGroupId: null,
          targetUserIds: [],
          targetCompanyIds: [],
          dueDate: shiftDate(assignment.dueDate) || assignment.dueDate,
        })),
      });
    }

    if (sourceSessions.length > 0) {
      await tx.session.createMany({
        data: sourceSessions.map((session) => ({
          batchId: newBatch.id,
          title: session.title,
          description: session.description,
          sessionDate: shiftDate(session.sessionDate) || session.sessionDate,
          startTime: shiftDate(session.startTime),
          endTime: shiftDate(session.endTime),
          timezone: session.timezone,
          slidesUrl: null,
          recordingUrl: null,
          googleEventId: null,
          targetGroupId: null,
          targetCompanyIds: [],
        })),
      });
    }

    return newBatch;
  });

  revalidatePath("/admin/batches");
  revalidateTag("batches");
  revalidateTag("batches-active");
  revalidateTag("current-user");

  return {
    success: true,
    data: {
      id: clonedBatch.id,
      name: clonedBatch.name,
      sourceBatchId: parsed.data.sourceBatchId,
      assignmentCount: sourceAssignments.length,
      sessionCount: sourceSessions.length,
    },
    warning:
      sourceAssignments.length || sourceSessions.length
        ? `Cloned ${sourceAssignments.length} assignment(s) and ${sourceSessions.length} session(s).`
        : "Batch created. Source batch had no assignments or sessions to clone.",
  };
}

export async function getBatches() {
  return unstable_cache(
    () =>
      prisma.batch.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          _count: { select: { userBatches: true } },
        },
      }),
    ["batches"],
    { revalidate: 60, tags: ["batches"] }
  )();
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

export async function getActiveBatches() {
  return unstable_cache(
    () =>
      prisma.batch.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      }),
    ["batches-active"],
    { revalidate: 60, tags: ["batches-active", "batches"] }
  )();
}
