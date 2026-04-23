"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult, EventType } from "@/types";
import { isCalendarConfigured, createCalendarEvent, createCalendarEventWithMeet, deleteCalendarEvent, updateCalendarEvent } from "@/lib/google-calendar";
import { revalidateSchedule } from "@/lib/cache-helpers";
import { toIanaTimezone } from "@/lib/timezone";
import { fromZonedTime } from "date-fns-tz";
import { getUserCompanyIds } from "@/actions/company";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  eventType: z.enum(["office_hour", "in_person", "virtual", "general_session"]),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  timezone: z.string().default("UTC"),
  location: z.string().optional(),
});

async function resolveEventTargetCompanies(batchIds: string[], formData: FormData) {
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
    return { error: "Some selected companies are invalid for the chosen batch." } as const;
  }

  return { targetCompanyIds: [...companyIds] };
}

async function getEventAttendeeEmails(userEmail: string, batchIds: string[], targetCompanyIds: string[]) {
  if (targetCompanyIds.length > 0) {
    const companyMembers = await prisma.companyMember.findMany({
      where: { companyId: { in: targetCompanyIds }, isCurrent: true },
      include: { user: { select: { email: true } } },
    });
    return [...new Set([userEmail, ...companyMembers.map((m) => m.user.email)])];
  }

  const batchUsers = await prisma.userBatch.findMany({
    where: { batchId: { in: batchIds }, status: "active" },
    include: { user: { select: { email: true } } },
  });
  return [...new Set([userEmail, ...batchUsers.map((ub) => ub.user.email)])];
}

export async function createEvent(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return { success: false, error: "Unauthorized: admin access required" };
    }

    const batchCheck = await requireActiveBatch(user.batchId, user.role);
    if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

    const selectedBatchIds = formData.getAll("batchIds") as string[];
    const batchIds = [...new Set((selectedBatchIds.length > 0 ? selectedBatchIds : [user.batchId]).filter(Boolean))];

    const batches = await prisma.batch.findMany({
      where: { id: { in: batchIds } },
      select: { id: true, status: true },
    });

    if (batches.length !== batchIds.length) {
      return { success: false, error: "One or more selected batches are invalid" };
    }

    const hasActiveBatch = batches.some((batch) => batch.status === "active");
    if (!hasActiveBatch) {
      return { success: false, error: "At least one active batch is required" };
    }

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string | undefined,
      eventType: formData.get("eventType") as EventType,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: (formData.get("timezone") as string) || "UTC",
      location: formData.get("location") as string | undefined,
    };

     const validated = eventSchema.parse(data);
     const resolvedTargets = await resolveEventTargetCompanies(batchIds, formData);
     if ("error" in resolvedTargets) {
       return { success: false, error: resolvedTargets.error || "Invalid target companies" };
     }

    for (const bid of batchIds) {
      const eventCount = await prisma.eventBatch.count({ where: { batchId: bid } });
      if (eventCount >= 20) {
        return { success: false, error: "Maximum 20 events reached for batch" };
      }
    }

    const ianaTimezone = toIanaTimezone(validated.timezone);
    const startTimeUtc = fromZonedTime(validated.startTime, ianaTimezone);
    const endTimeUtc = fromZonedTime(validated.endTime, ianaTimezone);

    const event = await prisma.$transaction(async (tx) => {
      const createdEvent = await tx.event.create({
        data: {
          batchId: batchIds[0],
          creatorId: user.id,
          targetGroupId: null,
          targetCompanyIds: resolvedTargets.targetCompanyIds,
          title: validated.title,
          description: validated.description || null,
          eventType: validated.eventType,
          startTime: startTimeUtc,
          endTime: endTimeUtc,
          timezone: ianaTimezone,
          location: validated.location || null,
        },
      });

      await tx.eventBatch.createMany({
        data: batchIds.map((batchId) => ({ eventId: createdEvent.id, batchId })),
      });

      return createdEvent;
    });

    let warning: string | undefined;

    if (isCalendarConfigured()) {
      try {
        const attendeeEmails = await getEventAttendeeEmails(user.email, batchIds, resolvedTargets.targetCompanyIds);

        const calResult = validated.eventType === "office_hour" || validated.eventType === "virtual"
          ? await createCalendarEventWithMeet({
              summary: validated.title,
              description: validated.description || undefined,
              startTime: startTimeUtc,
              endTime: endTimeUtc,
              attendeeEmails,
              timezone: ianaTimezone,
            })
          : await createCalendarEvent({
              summary: validated.title,
              description: validated.description || undefined,
              startTime: startTimeUtc,
              endTime: endTimeUtc,
              attendeeEmails,
              timezone: ianaTimezone,
              location: validated.location || undefined,
            });

        if (calResult) {
          await prisma.event.update({
            where: { id: event.id },
            data: {
              googleMeetLink: calResult.meetLink || null,
              googleEventId: calResult.eventId,
            },
          });
        } else {
          warning = "Event created, but Google Calendar sync failed. Please create the calendar event manually.";
        }
      } catch (err) {
        console.error("Google Calendar sync failed:", err);
        warning = "Event created, but Google Calendar sync failed. Please create the calendar event manually.";
      }
    }

    for (const bid of batchIds) {
      revalidateTag(`events-${bid}`);
      revalidateTag(`schedule-${bid}`);
      revalidateSchedule(bid);
    }
    revalidatePath("/events");
    revalidatePath("/schedule");
    revalidateTag(`event-${event.id}`);
    return { success: true, data: { id: event.id }, warning };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to create event:", error);
    return { success: false, error: "Failed to create event" };
  }
}

export async function getEvents(batchId: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    if (!isAdmin(user.role) && user.batchId !== batchId) return [];
    const userCompanyIds = isAdmin(user.role) ? [] : await getUserCompanyIds(user.id);

    const cacheKey = isAdmin(user.role) ? `events-${batchId}-admin` : `events-${batchId}-${user.id}`;

    const events = await unstable_cache(
      () =>
        prisma.event.findMany({
          where: {
            batches: { some: { batchId } },
            ...(isAdmin(user.role)
              ? {}
              : {
                  OR: [
                    { targetCompanyIds: { isEmpty: true } },
                    ...(userCompanyIds.length > 0 ? [{ targetCompanyIds: { hasSome: userCompanyIds } }] : []),
                  ],
                }),
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
            batches: {
              include: {
                batch: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: { startTime: "desc" },
        }),
      [cacheKey],
      { revalidate: 60, tags: [`events-${batchId}`] }
    )();

    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export async function getEvent(eventId: string, batchId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return null;

    const isUserAdmin = isAdmin(user.role);
    const userCompanyIds = isUserAdmin ? [] : await getUserCompanyIds(user.id);
    const event = await unstable_cache(
      () =>
        prisma.event.findFirst({
          where: {
            ...(batchId ? { id: eventId, batches: { some: { batchId } } } : { id: eventId }),
            ...(isUserAdmin
              ? {}
              : {
                  OR: [
                    { targetCompanyIds: { isEmpty: true } },
                    ...(userCompanyIds.length > 0 ? [{ targetCompanyIds: { hasSome: userCompanyIds } }] : []),
                  ],
                }),
          },
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
            batches: {
              include: {
                batch: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        }),
      [`event-${eventId}-${batchId ?? "all"}-${isUserAdmin ? "admin" : user.id}`],
      { revalidate: 60, tags: [`event-${eventId}`] }
    )();

    return event;
  } catch (error) {
    console.error("Failed to fetch event:", error);
    return null;
  }
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return { success: false, error: "Unauthorized: admin access required" };
    }

    // Get the event to check if it has a Google Calendar event ID
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { batches: true },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const eventBatchIds = event.batches.map((batch) => batch.batchId);
    const hasAccess = isAdmin(user.role) && (eventBatchIds.includes(user.batchId) || user.role === "super_admin");

    if (!hasAccess) {
      return { success: false, error: "Event not found" };
    }

    // Attempt to delete from Google Calendar if googleEventId exists
    if (event?.googleEventId) {
      try {
        await deleteCalendarEvent(event.googleEventId);
      } catch (err) {
        console.error("Failed to delete Google Calendar event:", err);
        // Continue with DB deletion even if Calendar delete fails
      }
    }

    await prisma.event.delete({
      where: { id: eventId },
    });

    for (const bid of eventBatchIds) {
      revalidateTag(`events-${bid}`);
      revalidateTag(`schedule-${bid}`);
      revalidateSchedule(bid);
    }
    revalidatePath("/events");
    revalidatePath("/schedule");
    revalidateTag(`event-${eventId}`);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete event:", error);
    return { success: false, error: "Failed to delete event" };
  }
}

export async function updateEvent(eventId: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdmin(user.role)) {
      return { success: false, error: "Unauthorized: admin access required" };
    }

    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string | undefined,
      eventType: formData.get("eventType") as EventType,
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: (formData.get("timezone") as string) || "UTC",
      location: formData.get("location") as string | undefined,
    };

    const validated = eventSchema.parse(data);
    const selectedBatchIds = formData.getAll("batchIds") as string[];
    const batchIds = [...new Set(selectedBatchIds.filter(Boolean))];

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: { batches: true },
    });

    if (!event) {
      return { success: false, error: "Event not found" };
    }

    const eventBatchIds = event.batches.map((batch) => batch.batchId);
    const hasAccess = isAdmin(user.role) && (eventBatchIds.includes(user.batchId) || user.role === "super_admin");
    if (!hasAccess) {
      return { success: false, error: "Event not found" };
    }

    if (batchIds.length > 0) {
      const batches = await prisma.batch.findMany({
        where: { id: { in: batchIds } },
        select: { id: true, status: true },
      });

      if (batches.length !== batchIds.length) {
        return { success: false, error: "One or more selected batches are invalid" };
      }

      const hasActiveBatch = batches.some((batch) => batch.status === "active");
      if (!hasActiveBatch) {
        return { success: false, error: "At least one active batch is required" };
      }
    }

    const targetBatchIds = batchIds.length > 0 ? batchIds : eventBatchIds;
    const resolvedTargets = await resolveEventTargetCompanies(targetBatchIds, formData);
    if ("error" in resolvedTargets) {
      return { success: false, error: resolvedTargets.error || "Invalid target companies" };
    }

    const ianaTimezone = toIanaTimezone(validated.timezone);
    const startTimeUtc = fromZonedTime(validated.startTime, ianaTimezone);
    const endTimeUtc = fromZonedTime(validated.endTime, ianaTimezone);

    if (batchIds.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.eventBatch.deleteMany({ where: { eventId } });
        await tx.eventBatch.createMany({
          data: batchIds.map((batchId) => ({ eventId, batchId })),
        });
        await tx.event.update({
          where: { id: eventId },
          data: {
           batchId: batchIds[0],
           targetGroupId: null,
           targetCompanyIds: resolvedTargets.targetCompanyIds,
           title: validated.title,
            description: validated.description || null,
            eventType: validated.eventType,
            startTime: startTimeUtc,
            endTime: endTimeUtc,
            timezone: ianaTimezone,
            googleMeetLink: null,
            location: validated.location || null,
          },
        });
      });
    } else {
      await prisma.event.update({
        where: { id: eventId },
        data: {
          targetGroupId: null,
          targetCompanyIds: resolvedTargets.targetCompanyIds,
          title: validated.title,
          description: validated.description || null,
          eventType: validated.eventType,
          startTime: startTimeUtc,
          endTime: endTimeUtc,
          timezone: ianaTimezone,
          googleMeetLink: null,
          location: validated.location || null,
        },
      });
    }

    // Attempt to update Google Calendar event if googleEventId exists
    if (event.googleEventId) {
      try {
        const attendeeEmails = await getEventAttendeeEmails(user.email, targetBatchIds, resolvedTargets.targetCompanyIds);
        const calResult = await updateCalendarEvent(event.googleEventId, {
          summary: validated.title,
          description: validated.description || undefined,
          startTime: startTimeUtc,
          endTime: endTimeUtc,
          attendeeEmails,
          timezone: ianaTimezone,
          location: validated.location || undefined,
        });

        await prisma.event.update({
          where: { id: eventId },
          data: {
            googleMeetLink: validated.eventType === "virtual" || validated.eventType === "office_hour"
              ? calResult?.meetLink || event.googleMeetLink || null
              : null,
          },
        });
      } catch (err) {
        console.error("Failed to update Google Calendar event:", err);
        // Continue even if Calendar update fails
      }
    }

    const revalidateBatchIds = [...new Set([...eventBatchIds, ...targetBatchIds])];
    for (const bid of revalidateBatchIds) {
      revalidateTag(`events-${bid}`);
      revalidateTag(`schedule-${bid}`);
      revalidateSchedule(bid);
    }
    revalidatePath("/events");
    revalidatePath("/schedule");
    revalidateTag(`event-${eventId}`);
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}
