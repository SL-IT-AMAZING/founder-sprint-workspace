"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, EventType } from "@/types";
import { isCalendarConfigured, createCalendarEvent } from "@/lib/google-calendar";

const eventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  eventType: z.enum(["one_off", "office_hour", "in_person"]),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  timezone: z.string().default("UTC"),
  location: z.string().optional(),
});

export async function createEvent(formData: FormData): Promise<ActionResult<{ id: string }>> {
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

    const event = await prisma.event.create({
      data: {
        batchId: user.batchId,
        creatorId: user.id,
        title: validated.title,
        description: validated.description || null,
        eventType: validated.eventType,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        timezone: validated.timezone,
        location: validated.location || null,
      },
    });

    let warning: string | undefined;

    if (isCalendarConfigured()) {
      try {
        const batchUsers = await prisma.userBatch.findMany({
          where: { batchId: user.batchId, status: "active" },
          include: { user: { select: { email: true } } },
        });
        const attendeeEmails = batchUsers.map((ub: { user: { email: string } }) => ub.user.email);

        const calResult = await createCalendarEvent({
          summary: validated.title,
          description: validated.description || undefined,
          startTime: new Date(validated.startTime),
          endTime: new Date(validated.endTime),
          attendeeEmails,
          timezone: validated.timezone,
          location: validated.location || undefined,
        });

        if (calResult) {
          await prisma.event.update({
            where: { id: event.id },
            data: { googleEventId: calResult.eventId },
          });
        } else {
          warning = "Event created, but Google Calendar sync failed. Please create the calendar event manually.";
        }
      } catch (err) {
        console.error("Google Calendar sync failed:", err);
        warning = "Event created, but Google Calendar sync failed. Please create the calendar event manually.";
      }
    }

    revalidatePath("/events");
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
    const events = await prisma.event.findMany({
      where: { batchId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: { startTime: "desc" },
    });

    return events;
  } catch (error) {
    console.error("Failed to fetch events:", error);
    return [];
  }
}

export async function getEvent(eventId: string) {
  try {
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

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

    await prisma.event.delete({
      where: { id: eventId },
    });

    revalidatePath("/events");
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

    await prisma.event.update({
      where: { id: eventId },
      data: {
        title: validated.title,
        description: validated.description || null,
        eventType: validated.eventType,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        timezone: validated.timezone,
        location: validated.location || null,
      },
    });

    revalidatePath("/events");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to update event:", error);
    return { success: false, error: "Failed to update event" };
  }
}
