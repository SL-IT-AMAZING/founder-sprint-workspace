"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { revalidateSchedule } from "@/lib/cache-helpers";
import { toIanaTimezone } from "@/lib/timezone";
import { fromZonedTime } from "date-fns-tz";
import { isCalendarConfigured, createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const TimeOrDateTime = z.string().refine(
  (val) => /^\d{2}:\d{2}$/.test(val) || !isNaN(Date.parse(val)),
  "Must be HH:mm or a valid datetime"
);

const CreateSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sessionDate: z.string().transform((s) => new Date(s)),
  slidesUrl: z.string().url().optional().or(z.literal("")),
  recordingUrl: z.string().url().optional().or(z.literal("")),
  startTime: TimeOrDateTime.optional(),
  endTime: TimeOrDateTime.optional(),
  timezone: z.string().default("UTC"),
}).refine(
  (data) => {
    if (!!data.startTime !== !!data.endTime) return false;
    if (data.startTime && data.endTime) {
      const dateStr = data.sessionDate.toISOString().slice(0, 10);
      const s = data.startTime.includes("T") ? data.startTime : `${dateStr}T${data.startTime}`;
      const e = data.endTime.includes("T") ? data.endTime : `${dateStr}T${data.endTime}`;
      return new Date(e) > new Date(s);
    }
    return true;
  },
  { message: "Start and end time must both be provided, and end time must be after start time" }
);

const UpdateSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  sessionDate: z.string().transform((s) => new Date(s)).optional(),
  slidesUrl: z.string().url().optional().or(z.literal("")),
  recordingUrl: z.string().url().optional().or(z.literal("")),
  startTime: TimeOrDateTime.optional(),
  endTime: TimeOrDateTime.optional(),
  timezone: z.string().optional(),
});

function toFullDatetime(dateStr: string, timeOrDatetime: string): string {
  return timeOrDatetime.includes("T") ? timeOrDatetime : `${dateStr}T${timeOrDatetime}`;
}

function toUniqueBatchIds(batchIds: string[], fallbackBatchId: string): string[] {
  const selected = batchIds.length > 0 ? batchIds : [fallbackBatchId];
  return [...new Set(selected.filter(Boolean))];
}

function getSessionBatchIds(
  session: { batchId: string; batches: Array<{ batchId: string }> }
): string[] {
  const relationBatchIds = session.batches.map((b) => b.batchId);
  if (relationBatchIds.length > 0) {
    return [...new Set(relationBatchIds)];
  }
  return [session.batchId];
}

export async function getAllBatchesForSelect() {
  return prisma.batch.findMany({
    select: {
      id: true,
      name: true,
      status: true,
      _count: { select: { userBatches: true } },
    },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });
}

export async function createSession(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const requestedBatchIds = formData.getAll("batchIds") as string[];
  const batchIds = toUniqueBatchIds(requestedBatchIds, user.batchId);
  const selectedBatches = await prisma.batch.findMany({
    where: { id: { in: batchIds } },
    select: { id: true, status: true },
  });

  if (selectedBatches.length !== batchIds.length) {
    return { success: false, error: "Invalid batch selection" };
  }

  const activeSelectedBatchIds = selectedBatches
    .filter((batch) => batch.status === "active")
    .map((batch) => batch.id);

  if (activeSelectedBatchIds.length === 0) {
    return { success: false, error: "At least one active batch is required" };
  }

  const firstActiveBatchId =
    batchIds.find((batchId) => activeSelectedBatchIds.includes(batchId)) || activeSelectedBatchIds[0];
  const batchCheck = await requireActiveBatch(firstActiveBatchId);
  if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

  const parsed = CreateSessionSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    sessionDate: formData.get("sessionDate"),
    slidesUrl: formData.get("slidesUrl") || undefined,
    recordingUrl: formData.get("recordingUrl") || undefined,
    startTime: (formData.get("startTime") as string) || undefined,
    endTime: (formData.get("endTime") as string) || undefined,
    timezone: (formData.get("timezone") as string) || "UTC",
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const ianaTimezone = toIanaTimezone(parsed.data.timezone);
  const hasTimedSession = !!parsed.data.startTime && !!parsed.data.endTime;
  const sessionDateStr = parsed.data.sessionDate.toISOString().slice(0, 10);
  const startTimeUtc = hasTimedSession
    ? fromZonedTime(toFullDatetime(sessionDateStr, parsed.data.startTime!), ianaTimezone)
    : null;
  const endTimeUtc = hasTimedSession
    ? fromZonedTime(toFullDatetime(sessionDateStr, parsed.data.endTime!), ianaTimezone)
    : null;

  const session = await prisma.$transaction(async (tx) => {
    const createdSession = await tx.session.create({
      data: {
        batchId: batchIds[0],
        title: parsed.data.title,
        description: parsed.data.description || null,
        sessionDate: parsed.data.sessionDate,
        slidesUrl: parsed.data.slidesUrl || null,
        recordingUrl: parsed.data.recordingUrl || null,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone: ianaTimezone,
      },
    });

    await tx.sessionBatch.createMany({
      data: batchIds.map((batchId) => ({ sessionId: createdSession.id, batchId })),
    });

    return createdSession;
  });

  if (isCalendarConfigured()) {
    try {
      const groupIds = formData.getAll("groupIds") as string[];

      let attendeeEmails: string[];
      if (groupIds.length > 0) {
        // Specific companies selected — get their members
        const groupMembers = await prisma.groupMember.findMany({
          where: { groupId: { in: groupIds } },
          include: { user: { select: { email: true } } },
        });
        // Always include the creator + deduplicate
        attendeeEmails = [...new Set([user.email, ...groupMembers.map((m: { user: { email: string } }) => m.user.email)])];
      } else {
        const batchUsers = await prisma.userBatch.findMany({
          where: { batchId: { in: batchIds }, status: "active" },
          include: { user: { select: { email: true } } },
        });
        attendeeEmails = [...new Set([user.email, ...batchUsers.map((ub: { user: { email: string } }) => ub.user.email)])];
      }

      const calResult = hasTimedSession
        ? await createCalendarEvent({
            summary: parsed.data.title,
            description: parsed.data.description || undefined,
            startTime: startTimeUtc!,
            endTime: endTimeUtc!,
            attendeeEmails,
            timezone: ianaTimezone,
          })
        : await createCalendarEvent({
            summary: parsed.data.title,
            description: parsed.data.description || undefined,
            attendeeEmails,
            timezone: ianaTimezone,
            isAllDay: true,
            allDayDate: parsed.data.sessionDate.toISOString().split("T")[0],
          });

      if (calResult?.eventId) {
        await prisma.session.update({
          where: { id: session.id },
          data: { googleEventId: calResult.eventId },
        });
      }
    } catch (error) {
      console.error("Failed to sync session with Google Calendar:", error);
    }
  }

  revalidatePath("/sessions");
  for (const bid of batchIds) {
    revalidateTag(`sessions-${bid}`);
  }
  revalidateTag(`session-${session.id}`);
  revalidateSchedule(batchIds[0]);
  for (const bid of batchIds.slice(1)) {
    revalidateTag(`schedule-${bid}`);
  }
  return { success: true, data: { id: session.id } };
}

export async function getSessions(batchId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user.role) && !user.userBatchIds.includes(batchId)) return [];

  return unstable_cache(
    () =>
      prisma.session.findMany({
        where: { batches: { some: { batchId } } },
        include: {
          batches: {
            include: { batch: { select: { id: true, name: true } } },
          },
        },
        orderBy: { sessionDate: "desc" },
      }),
    [`sessions-${batchId}`],
    { revalidate: 60, tags: [`sessions-${batchId}`] }
  )();
}

export async function getSession(id: string, batchId?: string) {
  const session = await unstable_cache(
    () =>
      prisma.session.findFirst({
        where: batchId
          ? {
              id,
              batches: { some: { batchId } },
            }
          : { id },
        include: {
          batches: {
            include: { batch: { select: { id: true, name: true } } },
          },
        },
      }),
    [`session-${id}-${batchId || "all"}`],
    { revalidate: 60, tags: [`session-${id}`] }
  )();

  return session;
}

export async function updateSession(
  id: string,
  formData: FormData
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const requestedBatchIds = formData.getAll("batchIds") as string[];
  const batchIds = toUniqueBatchIds(requestedBatchIds, user.batchId);

  if (requestedBatchIds.length > 0) {
    const selectedBatches = await prisma.batch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, status: true },
    });

    if (selectedBatches.length !== batchIds.length) {
      return { success: false, error: "Invalid batch selection" };
    }

    const activeSelectedBatchIds = selectedBatches.filter((batch) => batch.status === "active");
    if (activeSelectedBatchIds.length === 0) {
      return { success: false, error: "At least one active batch is required" };
    }
  }

  const parsed = UpdateSessionSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    sessionDate: formData.get("sessionDate") || undefined,
    slidesUrl: formData.get("slidesUrl") || undefined,
    recordingUrl: formData.get("recordingUrl") || undefined,
    startTime: (formData.get("startTime") as string) || undefined,
    endTime: (formData.get("endTime") as string) || undefined,
    timezone: (formData.get("timezone") as string) || undefined,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || "Invalid input" };
  }

  const existingSession = await prisma.session.findUnique({
    where: { id },
    include: {
      batches: true,
    },
  });

  if (!existingSession) {
    return { success: false, error: "Session not found" };
  }

  const sessionBatchIds = getSessionBatchIds(existingSession);
  const hasBatchAccess = sessionBatchIds.some((batchId) => user.userBatchIds.includes(batchId));
  const hasAccess = isAdmin(user.role) && (user.role === "super_admin" || hasBatchAccess);
  if (!hasAccess) return { success: false, error: "Session not found" };

  const nextTimezone = parsed.data.timezone
    ? toIanaTimezone(parsed.data.timezone)
    : existingSession.timezone;
  const hasTimedUpdate = !!parsed.data.startTime && !!parsed.data.endTime;
  const updateDateStr = parsed.data.sessionDate
    ? parsed.data.sessionDate.toISOString().slice(0, 10)
    : existingSession.startTime
    ? existingSession.startTime.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);
  const startTimeUtc = hasTimedUpdate
    ? fromZonedTime(toFullDatetime(updateDateStr, parsed.data.startTime!), nextTimezone)
    : undefined;
  const endTimeUtc = hasTimedUpdate
    ? fromZonedTime(toFullDatetime(updateDateStr, parsed.data.endTime!), nextTimezone)
    : undefined;

  const updateData = {
    ...(parsed.data.title && { title: parsed.data.title }),
    ...(parsed.data.description !== undefined && { description: parsed.data.description }),
    ...(parsed.data.sessionDate && { sessionDate: parsed.data.sessionDate }),
    ...(parsed.data.slidesUrl !== undefined && { slidesUrl: parsed.data.slidesUrl || null }),
    ...(parsed.data.recordingUrl !== undefined && { recordingUrl: parsed.data.recordingUrl || null }),
    ...(startTimeUtc !== undefined && { startTime: startTimeUtc }),
    ...(endTimeUtc !== undefined && { endTime: endTimeUtc }),
    ...(parsed.data.timezone !== undefined && { timezone: nextTimezone }),
  };

  const oldBatchIds = sessionBatchIds;
  const nextBatchIds = requestedBatchIds.length > 0 ? batchIds : oldBatchIds;

  if (requestedBatchIds.length > 0) {
    await prisma.$transaction(async (tx) => {
      await tx.sessionBatch.deleteMany({ where: { sessionId: id } });
      await tx.sessionBatch.createMany({
        data: batchIds.map((batchId) => ({ sessionId: id, batchId })),
      });
      await tx.session.update({
        where: { id },
        data: {
          ...updateData,
          batchId: batchIds[0],
        },
      });
    });
  } else {
    await prisma.session.update({
      where: { id },
      data: updateData,
    });
  }

  if (existingSession.googleEventId) {
    try {
      const groupIds = formData.getAll("groupIds") as string[];

      let attendeeEmails: string[];
      if (groupIds.length > 0) {
        // Specific companies selected — get their members
        const groupMembers = await prisma.groupMember.findMany({
          where: { groupId: { in: groupIds } },
          include: { user: { select: { email: true } } },
        });
        // Always include the creator + deduplicate
        attendeeEmails = [...new Set([user.email, ...groupMembers.map((m: { user: { email: string } }) => m.user.email)])];
      } else {
        const batchUsers = await prisma.userBatch.findMany({
          where: { batchId: { in: nextBatchIds }, status: "active" },
          include: { user: { select: { email: true } } },
        });
        attendeeEmails = [...new Set([user.email, ...batchUsers.map((ub: { user: { email: string } }) => ub.user.email)])];
      }

      await updateCalendarEvent(existingSession.googleEventId, {
        summary: parsed.data.title || existingSession.title,
        description:
          parsed.data.description !== undefined
            ? parsed.data.description || undefined
            : existingSession.description || undefined,
        startTime: startTimeUtc || existingSession.startTime || undefined,
        endTime: endTimeUtc || existingSession.endTime || undefined,
        attendeeEmails,
        timezone: nextTimezone,
      });
    } catch (error) {
      console.error("Failed to update Google Calendar session event:", error);
    }
  }

  revalidatePath("/sessions");
  const batchesToRevalidate = [...new Set([...oldBatchIds, ...nextBatchIds])];
  for (const batchId of batchesToRevalidate) {
    revalidateTag(`sessions-${batchId}`);
    revalidateTag(`schedule-${batchId}`);
  }
  revalidateTag(`session-${id}`);
  if (batchesToRevalidate.length > 0) {
    revalidateSchedule(batchesToRevalidate[0]);
  }
  return { success: true, data: undefined };
}

export async function deleteSession(sessionId: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { batches: true },
    });

    if (!session) {
      return { success: false, error: "Session not found" };
    }

    const sessionBatchIds = getSessionBatchIds(session);
    const hasBatchAccess = sessionBatchIds.some((batchId) => user.userBatchIds.includes(batchId));
    const hasAccess = isAdmin(user.role) && (user.role === "super_admin" || hasBatchAccess);
    if (!hasAccess) return { success: false, error: "Session not found" };

    if (session.googleEventId) {
      try {
        await deleteCalendarEvent(session.googleEventId);
      } catch (error) {
        console.error("Failed to delete Google Calendar session event:", error);
      }
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    revalidatePath("/sessions");
    for (const sb of session.batches) {
      revalidateTag(`sessions-${sb.batchId}`);
      revalidateTag(`schedule-${sb.batchId}`);
    }
    if (session.batches.length === 0) {
      revalidateTag(`sessions-${session.batchId}`);
      revalidateTag(`schedule-${session.batchId}`);
    }
    revalidateTag(`session-${sessionId}`);
    revalidateSchedule(session.batches[0]?.batchId || session.batchId);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return { success: false, error: "Session not found" };
    }
    return { success: false, error: "Failed to delete session" };
  }
}
