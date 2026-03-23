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
import { format } from "date-fns";
import { isCalendarConfigured, createCalendarEvent, deleteCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";
import { getUserCompanyIds } from "@/actions/company";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const TimeOrDateTime = z.string().refine(
  (val) => /^\d{2}:\d{2}$/.test(val) || !isNaN(Date.parse(val)),
  "Must be HH:mm or a valid datetime"
);

const SessionDateString = z.string().refine(
  (value) => !Number.isNaN(new Date(value).getTime()),
  "Invalid session date"
);

const CreateSessionSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  sessionDate: SessionDateString.transform((s) => new Date(s)),
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
  sessionDate: SessionDateString.transform((s) => new Date(s)).optional(),
  slidesUrl: z.string().url().optional().or(z.literal("")),
  recordingUrl: z.string().url().optional().or(z.literal("")),
  startTime: TimeOrDateTime.optional(),
  endTime: TimeOrDateTime.optional(),
  timezone: z.string().optional(),
});

async function resolveSessionTargetCompanies(batchIds: string[], formData: FormData) {
  const companyIds = [...new Set(formData.getAll("companyIds").map((value) => value.toString().trim()).filter(Boolean))];
  if (companyIds.length === 0) return { targetCompanyIds: [] as string[] };

  if (batchIds.length !== 1) {
    return { error: "Specific companies can only be used when exactly one batch is selected." } as const;
  }

  const batchCompanies = await prisma.companyBatch.findMany({
    where: { batchId: batchIds[0], companyId: { in: companyIds } },
    select: { companyId: true },
  });

  if (batchCompanies.length !== companyIds.length) {
    return { error: "Some selected companies are invalid for the selected batch." } as const;
  }

  return { targetCompanyIds: [...companyIds] };
}

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

export async function getSessionTemplates() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) return [];

  try {
    return await prisma.sessionTemplate.findMany({
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        title: true,
        description: true,
        timezone: true,
        slidesUrl: true,
        recordingUrl: true,
        defaultStartTime: true,
        defaultEndTime: true,
        createdAt: true,
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("Failed to load session templates:", error);
    return [];
  }
}

export async function saveSessionAsTemplate(
  sessionId: string,
  templateName?: string
): Promise<ActionResult<{ id: string }>> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return { success: false, error: "Unauthorized: admin only" };
  }

  const session = await prisma.session.findFirst({
    where: {
      id: sessionId,
      batches: { some: { batchId: { in: user.userBatchIds } } },
    },
    select: {
      id: true,
      title: true,
      description: true,
      timezone: true,
      slidesUrl: true,
      recordingUrl: true,
      startTime: true,
      endTime: true,
    },
  });

  if (!session) {
    return { success: false, error: "Session not found" };
  }

  let template;
  try {
    template = await prisma.sessionTemplate.create({
      data: {
        name: templateName?.trim() || session.title,
        title: session.title,
        description: session.description,
        timezone: session.timezone,
        slidesUrl: session.slidesUrl,
        recordingUrl: session.recordingUrl,
        defaultStartTime: session.startTime ? format(session.startTime, "HH:mm") : null,
        defaultEndTime: session.endTime ? format(session.endTime, "HH:mm") : null,
        createdBy: user.id,
      },
      select: { id: true },
    });
  } catch (error) {
    console.error("Failed to save session template:", error);
    return { success: false, error: "Template storage is currently unavailable" };
  }

  revalidatePath("/sessions");
  return { success: true, data: { id: template.id } };
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
  const batchCheck = await requireActiveBatch(firstActiveBatchId, user.role);
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

  const resolvedTargets = await resolveSessionTargetCompanies(batchIds, formData);
  if ("error" in resolvedTargets && typeof resolvedTargets.error === "string") {
    return { success: false, error: resolvedTargets.error || "Invalid target companies" };
  }

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
        targetGroupId: null,
        targetCompanyIds: resolvedTargets.targetCompanyIds,
      },
    });

    await tx.sessionBatch.createMany({
      data: batchIds.map((batchId) => ({ sessionId: createdSession.id, batchId })),
    });

    return createdSession;
  });

  let warning: string | undefined;

  if (isCalendarConfigured()) {
    try {
      let attendeeEmails: string[];
      if (resolvedTargets.targetCompanyIds.length > 0) {
        const companyMembers = await prisma.companyMember.findMany({
          where: { companyId: { in: resolvedTargets.targetCompanyIds }, isCurrent: true },
          include: { user: { select: { email: true } } },
        });
        attendeeEmails = [...new Set([user.email, ...companyMembers.map((m) => m.user.email)])];
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
      } else {
        warning = "Session created, but Google Calendar sync failed. Please create the calendar event manually.";
      }
    } catch (error) {
      console.error("Failed to sync session with Google Calendar:", error);
      warning = "Session created, but Google Calendar sync failed. Please create the calendar event manually.";
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
  return { success: true as const, data: { id: session.id }, warning };
}

export async function getSessions(batchId: string) {
  const user = await getCurrentUser();
  if (!user) return [];
  if (!isAdmin(user.role) && !user.userBatchIds.includes(batchId)) return [];

  const userCompanyIds = isAdmin(user.role) ? [] : await getUserCompanyIds(user.id);

  if (!isAdmin(user.role)) {
    return prisma.session.findMany({
      where: {
        batches: { some: { batchId } },
        OR: [
          { targetCompanyIds: { isEmpty: true } },
          ...(userCompanyIds.length > 0 ? [{ targetCompanyIds: { hasSome: userCompanyIds } }] : []),
        ],
      },
      include: {
        batches: {
          include: { batch: { select: { id: true, name: true } } },
        },
      },
      orderBy: { sessionDate: "desc" },
    });
  }

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
  const user = await getCurrentUser();
  if (!user) return null;

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

  if (!session) return null;

  if (!isAdmin(user.role) && session.targetCompanyIds.length > 0) {
    const userCompanyIds = await getUserCompanyIds(user.id);
    const inTargetCompanies = session.targetCompanyIds.some((companyId) => userCompanyIds.includes(companyId));
    if (!inTargetCompanies) return null;
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
  } as Record<string, unknown>;

  const oldBatchIds = sessionBatchIds;
  const nextBatchIds = requestedBatchIds.length > 0 ? batchIds : oldBatchIds;
  const resolvedTargets = await resolveSessionTargetCompanies(nextBatchIds, formData);
  if ("error" in resolvedTargets && typeof resolvedTargets.error === "string") {
    return { success: false, error: resolvedTargets.error || "Invalid target companies" };
  }
  updateData.targetGroupId = null;
  updateData.targetCompanyIds = resolvedTargets.targetCompanyIds;

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
      let attendeeEmails: string[];
      const finalTargetCompanyIds =
        resolvedTargets.targetCompanyIds.length > 0
          ? resolvedTargets.targetCompanyIds
          : existingSession.targetCompanyIds;

      if (finalTargetCompanyIds.length > 0) {
        const companyMembers = await prisma.companyMember.findMany({
          where: { companyId: { in: finalTargetCompanyIds }, isCurrent: true },
          include: { user: { select: { email: true } } },
        });
        attendeeEmails = [...new Set([user.email, ...companyMembers.map((m) => m.user.email)])];
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
