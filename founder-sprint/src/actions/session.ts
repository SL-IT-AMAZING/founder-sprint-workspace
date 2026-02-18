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

export async function createSession(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Not authenticated" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

  if (!isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

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

  const session = await prisma.session.create({
    data: {
      batchId: user.batchId,
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

  if (isCalendarConfigured()) {
    try {
      const batchUsers = await prisma.userBatch.findMany({
        where: { batchId: user.batchId, status: "active" },
        include: { user: { select: { email: true } } },
      });
      const attendeeEmails = batchUsers.map((ub: { user: { email: string } }) => ub.user.email);

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
  revalidateTag(`sessions-${user.batchId}`);
  revalidateTag(`session-${session.id}`);
  revalidateSchedule(user.batchId);
  return { success: true, data: { id: session.id } };
}

export async function getSessions(batchId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user.role) && user.batchId !== batchId) return [];

  return unstable_cache(
    () =>
      prisma.session.findMany({
        where: { batchId },
        orderBy: { sessionDate: "desc" },
      }),
    [`sessions-${batchId}`],
    { revalidate: 60, tags: [`sessions-${batchId}`] }
  )();
}

export async function getSession(id: string, batchId?: string) {
  const session = await unstable_cache(
    () =>
      prisma.session.findUnique({
        where: { id },
      }),
    [`session-${id}`],
    { revalidate: 60, tags: [`session-${id}`] }
  )();

  if (batchId && session?.batchId !== batchId) {
    return null;
  }

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
    select: {
      batchId: true,
      googleEventId: true,
      title: true,
      description: true,
      startTime: true,
      endTime: true,
      timezone: true,
    },
  });

  if (!existingSession || existingSession.batchId !== user.batchId) {
    return { success: false, error: "Session not found" };
  }

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

  await prisma.session.update({
    where: { id },
    data: {
      ...(parsed.data.title && { title: parsed.data.title }),
      ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      ...(parsed.data.sessionDate && { sessionDate: parsed.data.sessionDate }),
      ...(parsed.data.slidesUrl !== undefined && { slidesUrl: parsed.data.slidesUrl || null }),
      ...(parsed.data.recordingUrl !== undefined && { recordingUrl: parsed.data.recordingUrl || null }),
      ...(startTimeUtc !== undefined && { startTime: startTimeUtc }),
      ...(endTimeUtc !== undefined && { endTime: endTimeUtc }),
      ...(parsed.data.timezone !== undefined && { timezone: nextTimezone }),
    },
  });

  if (existingSession.googleEventId) {
    try {
      const batchUsers = await prisma.userBatch.findMany({
        where: { batchId: user.batchId, status: "active" },
        include: { user: { select: { email: true } } },
      });
      const attendeeEmails = batchUsers.map((ub: { user: { email: string } }) => ub.user.email);

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
  revalidateTag(`sessions-${user.batchId}`);
  revalidateTag(`session-${id}`);
  revalidateSchedule(user.batchId);
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
      select: { batchId: true, googleEventId: true },
    });

    if (!session || session.batchId !== user.batchId) {
      return { success: false, error: "Session not found" };
    }

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
    revalidateTag(`sessions-${user.batchId}`);
    revalidateTag(`session-${sessionId}`);
    revalidateSchedule(user.batchId);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) {
      return { success: false, error: "Session not found" };
    }
    return { success: false, error: "Failed to delete session" };
  }
}
