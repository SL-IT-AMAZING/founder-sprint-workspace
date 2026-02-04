import type { BatchStatus } from "@/types";

interface BatchForStatus {
  status: BatchStatus;
  endDate: Date;
}

/**
 * Computes effective batch status from manual status + endDate.
 * - "active": status is active AND endDate has not passed
 * - "expired": status is active BUT endDate has passed
 * - "archived": status is archived (manual, regardless of date)
 */
export function getEffectiveBatchStatus(batch: BatchForStatus): "active" | "expired" | "archived" {
  if (batch.status === "archived") return "archived";

  const now = new Date();
  const end = new Date(batch.endDate);
  end.setHours(23, 59, 59, 999);

  if (now > end) return "expired";
  return "active";
}

export function isBatchActive(batch: BatchForStatus): boolean {
  return getEffectiveBatchStatus(batch) === "active";
}

export function getBatchStatusLabel(batch: BatchForStatus): string {
  const status = getEffectiveBatchStatus(batch);
  switch (status) {
    case "active": return "Active";
    case "archived": return "Archived";
    case "expired": return "Ended";
  }
}

export function getBatchStatusVariant(batch: BatchForStatus): "success" | "default" | "error" {
  const status = getEffectiveBatchStatus(batch);
  switch (status) {
    case "active": return "success";
    case "archived": return "default";
    case "expired": return "error";
  }
}
