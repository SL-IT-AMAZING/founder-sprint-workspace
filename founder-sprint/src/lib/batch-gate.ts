import { prisma } from "@/lib/prisma";
import { isBatchActive } from "@/lib/batch-utils";
import type { ActionResult, BatchStatus, UserRole } from "@/types";

/**
 * Server-side gate: checks if a batch is active (fresh DB query).
 * Returns an error ActionResult if batch is not active, or null if OK.
 * Admins and super_admins bypass this check — they can operate on ended batches.
 */
export async function requireActiveBatch(batchId: string, userRole?: UserRole): Promise<ActionResult | null> {
  if (!batchId) return { success: false, error: "No batch selected" };

  // Admins bypass the active batch check
  if (userRole === "admin" || userRole === "super_admin") return null;

  const batch = await prisma.batch.findUnique({
    where: { id: batchId },
    select: { status: true, endDate: true },
  });

  if (!batch) return { success: false, error: "Batch not found" };

  if (!isBatchActive(batch as { status: BatchStatus; endDate: Date })) {
    return { success: false, error: "This batch has ended. New content cannot be created." };
  }

  return null;
}
