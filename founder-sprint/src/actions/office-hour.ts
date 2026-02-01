"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff, isFounder } from "@/lib/permissions";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { isCalendarConfigured, createCalendarEventWithMeet } from "@/lib/google-calendar";

const slotSchema = z.object({
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  timezone: z.string().default("UTC"),
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes === 30;
  },
  { message: "Office hour slots must be exactly 30 minutes long" }
);

const requestSchema = z.object({
  slotId: z.string().uuid("Invalid slot ID"),
  message: z.string().optional(),
});

const responseSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  status: z.enum(["approved", "rejected"]),
});

export async function createOfficeHourSlot(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: "Unauthorized: staff access required" };
    }

    const data = {
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: (formData.get("timezone") as string) || "UTC",
    };

    const validated = slotSchema.parse(data);

    const slot = await prisma.officeHourSlot.create({
      data: {
        batchId: user.batchId,
        hostId: user.id,
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        timezone: validated.timezone,
        status: "available",
      },
    });

    revalidatePath("/office-hours");
    return { success: true, data: { id: slot.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to create office hour slot:", error);
    return { success: false, error: "Failed to create office hour slot" };
  }
}

export async function getOfficeHourSlots(batchId: string) {
  try {
    const slots = await prisma.officeHourSlot.findMany({
      where: { batchId },
      include: {
        host: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        requests: {
          include: {
            requester: {
              select: {
                id: true,
                name: true,
                email: true,
                profileImage: true,
              },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { startTime: "asc" },
    });

    return slots;
  } catch (error) {
    console.error("Failed to fetch office hour slots:", error);
    return [];
  }
}

export async function requestOfficeHour(slotId: string, message?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !isFounder(user.role)) {
      return { success: false, error: "Unauthorized: founder access required" };
    }

    const validated = requestSchema.parse({ slotId, message });

    // Check if slot exists and is available
    const slot = await prisma.officeHourSlot.findUnique({
      where: { id: validated.slotId },
      include: { requests: true },
    });

    if (!slot) {
      return { success: false, error: "Office hour slot not found" };
    }

    // Allow requests on slots with status "available" OR "requested"
    if (slot.status !== "available" && slot.status !== "requested") {
      return { success: false, error: "This slot is no longer available" };
    }

    // Check if user already has a pending request for this slot
    const existingRequest = slot.requests.find(
      (req) => req.requesterId === user.id && req.status === "pending"
    );

    if (existingRequest) {
      return { success: false, error: "You already have a pending request for this slot" };
    }

    const request = await prisma.officeHourRequest.create({
      data: {
        slotId: validated.slotId,
        requesterId: user.id,
        message: validated.message || null,
        status: "pending",
      },
    });

    // Update slot status to requested
    await prisma.officeHourSlot.update({
      where: { id: validated.slotId },
      data: { status: "requested" },
    });

    revalidatePath("/office-hours");
    return { success: true, data: { id: request.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to request office hour:", error);
    return { success: false, error: "Failed to request office hour" };
  }
}

export async function respondToRequest(requestId: string, status: "approved" | "rejected"): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: "Unauthorized: staff access required" };
    }

    const validated = responseSchema.parse({ requestId, status });

    // Get the request with slot info
    const request = await prisma.officeHourRequest.findUnique({
      where: { id: validated.requestId },
      include: { slot: true },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Allow host OR Admin OR Super Admin to respond
    const isHost = request.slot.hostId === user.id;
    const isAdminOrSuper = user.role === "admin" || user.role === "super_admin";

    if (!isHost && !isAdminOrSuper) {
      return { success: false, error: "Unauthorized: only the host or admins can respond to requests" };
    }

    // Update request status
    await prisma.officeHourRequest.update({
      where: { id: validated.requestId },
      data: {
        status: validated.status,
        respondedAt: new Date(),
      },
    });

    // Update slot status based on response
    if (validated.status === "approved") {
      await prisma.officeHourSlot.update({
        where: { id: request.slotId },
        data: { status: "confirmed" },
      });

      // Reject all other pending requests for this slot
      await prisma.officeHourRequest.updateMany({
        where: {
          slotId: request.slotId,
          id: { not: validated.requestId },
          status: "pending",
        },
        data: {
          status: "rejected",
          respondedAt: new Date(),
        },
      });

      // Google Calendar + Meet link generation
      let warning: string | undefined;

      if (isCalendarConfigured()) {
        try {
          const [host, requester] = await Promise.all([
            prisma.user.findUnique({
              where: { id: request.slot.hostId },
              select: { email: true, name: true },
            }),
            prisma.user.findUnique({
              where: { id: request.requesterId },
              select: { email: true, name: true },
            }),
          ]);

          if (host && requester) {
            const calResult = await createCalendarEventWithMeet({
              summary: `Office Hour: ${host.name} × ${requester.name}`,
              description: request.message
                ? `Office hour session.\n\nFounder message: ${request.message}`
                : "Office hour session.",
              startTime: request.slot.startTime,
              endTime: request.slot.endTime,
              attendeeEmails: [host.email, requester.email],
              timezone: request.slot.timezone,
            });

            if (calResult) {
              await prisma.officeHourSlot.update({
                where: { id: request.slotId },
                data: {
                  googleMeetLink: calResult.meetLink || null,
                  googleEventId: calResult.eventId,
                },
              });
            } else {
              warning = "Request approved, but Google Meet link generation failed. Please set up the meeting manually.";
            }
          }
        } catch (err) {
          console.error("Google Calendar sync failed for office hour:", err);
          warning = "Request approved, but Google Meet link generation failed. Please set up the meeting manually.";
        }
      }

      revalidatePath("/office-hours");
      return { success: true, data: undefined, warning };
    } else {
      // If rejected, check if there are other pending requests
      const pendingRequests = await prisma.officeHourRequest.count({
        where: {
          slotId: request.slotId,
          status: "pending",
        },
      });

      // If no pending requests, set slot back to available
      if (pendingRequests === 0) {
        await prisma.officeHourSlot.update({
          where: { id: request.slotId },
          data: { status: "available" },
        });
      }

      revalidatePath("/office-hours");
      return { success: true, data: undefined };
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to respond to request:", error);
    return { success: false, error: "Failed to respond to request" };
  }
}

export async function updateSlot(slotId: string, formData: FormData): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: "Unauthorized: staff access required" };
    }

    // Get the slot with requests
    const slot = await prisma.officeHourSlot.findUnique({
      where: { id: slotId },
      include: {
        requests: {
          where: {
            status: { in: ["pending", "approved"] },
          },
        },
      },
    });

    if (!slot) {
      return { success: false, error: "Office hour slot not found" };
    }

    // Verify user is the host or admin
    const isHost = slot.hostId === user.id;
    const isAdminUser = user.role === "super_admin" || user.role === "admin";

    if (!isHost && !isAdminUser) {
      return { success: false, error: "Unauthorized: only host or admin can update slot" };
    }

    // Check if there are pending or approved requests
    if (slot.requests.length > 0) {
      return { success: false, error: "Cannot update slot with pending or approved requests" };
    }

    const data = {
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: (formData.get("timezone") as string) || "UTC",
    };

    const validated = slotSchema.parse(data);

    await prisma.officeHourSlot.update({
      where: { id: slotId },
      data: {
        startTime: new Date(validated.startTime),
        endTime: new Date(validated.endTime),
        timezone: validated.timezone,
      },
    });

    revalidatePath("/office-hours");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to update office hour slot:", error);
    return { success: false, error: "Failed to update office hour slot" };
  }
}

export async function deleteSlot(slotId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isStaff(user.role)) {
      return { success: false, error: "Unauthorized: staff access required" };
    }

    // Get the slot with requests
    const slot = await prisma.officeHourSlot.findUnique({
      where: { id: slotId },
      include: {
        _count: {
          select: { requests: true },
        },
      },
    });

    if (!slot) {
      return { success: false, error: "Office hour slot not found" };
    }

    // Verify user is the host or admin
    const isHost = slot.hostId === user.id;
    const isAdminUser = user.role === "super_admin" || user.role === "admin";

    if (!isHost && !isAdminUser) {
      return { success: false, error: "Unauthorized: only host or admin can delete slot" };
    }

    // Check if there are any requests at all
    if (slot._count.requests > 0) {
      return { success: false, error: "Cannot delete slot with requests" };
    }

    await prisma.officeHourSlot.delete({
      where: { id: slotId },
    });

    revalidatePath("/office-hours");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to delete office hour slot:", error);
    return { success: false, error: "Failed to delete office hour slot" };
  }
}

export async function cancelRequest(requestId: string): Promise<ActionResult> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Not authenticated" };

    const request = await prisma.officeHourRequest.findUnique({
      where: { id: requestId },
      include: { slot: true },
    });

    if (!request) {
      return { success: false, error: "Request not found" };
    }

    // Verify user is the requester
    if (request.requesterId !== user.id) {
      return { success: false, error: "Unauthorized: only the requester can cancel this request" };
    }

    // Only pending requests can be cancelled
    if (request.status !== "pending") {
      return { success: false, error: "Only pending requests can be cancelled" };
    }

    // Update request status to cancelled
    await prisma.officeHourRequest.update({
      where: { id: requestId },
      data: {
        status: "cancelled",
        respondedAt: new Date(),
      },
    });

    // Check if there are other pending requests
    const pendingRequests = await prisma.officeHourRequest.count({
      where: {
        slotId: request.slotId,
        status: "pending",
      },
    });

    // If no pending requests and slot was requested, set back to available
    if (pendingRequests === 0 && request.slot.status === "requested") {
      await prisma.officeHourSlot.update({
        where: { id: request.slotId },
        data: { status: "available" },
      });
    }

    revalidatePath("/office-hours");
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to cancel request:", error);
    return { success: false, error: "Failed to cancel request" };
  }
}
