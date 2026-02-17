/**
 * Shared cache invalidation helpers for the scheduling domain.
 *
 * Call revalidateSchedule(batchId) from EVERY scheduling mutation
 * (events, sessions, office hours) so the unified /schedule calendar stays fresh.
 */

import { revalidatePath, revalidateTag as revalidateTagBase } from "next/cache";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

/**
 * Invalidate all schedule-related caches for a batch.
 * Must be called by every mutation in event.ts, session.ts, office-hour.ts.
 */
export function revalidateSchedule(batchId: string) {
  revalidatePath("/schedule");
  revalidateTag(`schedule-${batchId}`);
}
