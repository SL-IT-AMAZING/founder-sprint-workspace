"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff, isFounder, canCreateOfficeHourSlot, isAdmin } from "@/lib/permissions";
import { requireActiveBatch } from "@/lib/batch-gate";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { isCalendarConfigured, createCalendarEventWithMeet } from "@/lib/google-calendar";
import { fromZonedTime } from "date-fns-tz";
import { sendOfficeHourRequestEmail, sendOfficeHourApprovalEmail } from "@/lib/email";
import { revalidateSchedule } from "@/lib/cache-helpers";

const revalidateTag = (tag: string) => revalidateTagBase(tag, "default");

// Target email for founder-initiated office hour requests — easy to change
const OFFICE_HOUR_TARGET_EMAIL = process.env.OFFICE_HOUR_TARGET_EMAIL || "";

const TIMEZONE_MAP: Record<string, string> = {
  UTC: "UTC",
  KST: "Asia/Seoul",
  PST: "America/Los_Angeles",
  EST: "America/New_York",
};

function toIanaTimezone(tz: string): string {
  return TIMEZONE_MAP[tz.toUpperCase()] || tz;
}

const slotSchema = z.object({
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start time"),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end time"),
  timezone: z.string().default("UTC"),
}).refine(
  (data) => {
    const start = new Date(data.startTime);
    const end = new Date(data.endTime);
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffMinutes > 0 && diffMinutes <= 60;
  },
  { message: "Office hour slots must be 1 hour or less" }
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

    const batchCheck = await requireActiveBatch(user.batchId);
    if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

    const groupId = (formData.get("groupId") as string) || null;

    const data = {
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: (formData.get("timezone") as string) || "UTC",
    };

     const validated = slotSchema.parse(data);

     const ianaTimezone = toIanaTimezone(validated.timezone);
     const startTimeUtc = fromZonedTime(validated.startTime, ianaTimezone);
     const endTimeUtc = fromZonedTime(validated.endTime, ianaTimezone);

     if (startTimeUtc < new Date()) {
       throw new Error("Cannot create office hour slot in the past");
     }

     const slot = await prisma.officeHourSlot.create({
      data: {
        batchId: user.batchId,
        hostId: user.id,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone: validated.timezone,
        status: "available",
        groupId,
      },
    });

    revalidatePath("/office-hours");
    revalidateTag(`office-hours-${user.batchId}`);
    revalidateSchedule(user.batchId);
    return { success: true, data: { id: slot.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    const message = error instanceof Error ? error.message : "Failed to create office hour slot";
    console.error("Failed to create office hour slot:", error);
    return { success: false, error: message };
  }
}

export async function scheduleGroupOfficeHour(formData: FormData) {
  // 1. Auth check — staff only (admin/super_admin/mentor)
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Authentication required" };
  if (!canCreateOfficeHourSlot(user.role)) return { success: false, error: "Insufficient permissions" };

  const batchCheck = await requireActiveBatch(user.batchId);
  if (batchCheck) return batchCheck;

  // 2. Parse formData
  const groupId = formData.get("groupId") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const timezoneInput = formData.get("timezone") as string;

  if (!groupId || !startTime || !endTime) {
    return { success: false, error: "Group, start time, and end time are required" };
  }

  // 3. Validate timezone (same pattern as createOfficeHourSlot)
  const timezoneMap: Record<string, string> = {
    UTC: "UTC",
    KST: "Asia/Seoul",
    PST: "America/Los_Angeles",
    EST: "America/New_York",
  };
  const timezone = timezoneMap[timezoneInput] || "UTC";

  // 4. Validate time (30-min slot, not in past)
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { success: false, error: "Invalid date format" };
  }
  const durationMs = end.getTime() - start.getTime();
  if (durationMs <= 0 || durationMs > 60 * 60 * 1000) {
    return { success: false, error: "Office hour slots must be 1 hour or less" };
  }
  if (start < new Date()) {
    return { success: false, error: "Cannot schedule office hours in the past" };
  }

  // 5. Validate group — exists, same batch, has members
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  if (!group) return { success: false, error: "Group not found" };
  if (group.batchId !== user.batchId) return { success: false, error: "Group is not in your batch" };
  if (group.members.length === 0) return { success: false, error: "Cannot schedule for an empty group" };

  try {
    // 6. Create slot as confirmed with groupId
    const slot = await prisma.officeHourSlot.create({
      data: {
        batchId: user.batchId,
        hostId: user.id,
        startTime: start,
        endTime: end,
        timezone,
        status: "confirmed",
        groupId,
      },
    });

    // 7. Create Google Calendar event with Meet link for all group members
    const memberEmails = group.members.map((m) => m.user.email);
    const hostEmail = user.email;
    const allEmails = [...new Set([hostEmail, ...memberEmails])];

    const calResult = await createCalendarEventWithMeet({
      summary: `Office Hour: ${user.name} × ${group.name}`,
      description: `Group office hour session with ${group.name}`,
      startTime: start,
      endTime: end,
      attendeeEmails: allEmails,
      timezone,
    });

    if (calResult?.meetLink || calResult?.eventId) {
      await prisma.officeHourSlot.update({
        where: { id: slot.id },
        data: {
          googleMeetLink: calResult.meetLink || "https://meet.google.com/new",
          googleEventId: calResult.eventId || null,
        },
      });
    }

    revalidateTag(`office-hours-${user.batchId}`);
    revalidateSchedule(user.batchId);
    return { success: true, data: { id: slot.id } };
  } catch (error) {
    console.error("[scheduleGroupOfficeHour] Error:", error);
    return { success: false, error: "Failed to schedule group office hour" };
  }
}

export async function proposeOfficeHour(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !isFounder(user.role)) {
      return { success: false, error: "Unauthorized: founder access required" };
    }

    const batchCheck = await requireActiveBatch(user.batchId);
    if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

    const groupId = formData.get("groupId") as string;
    if (!groupId) {
      return { success: false, error: "Group is required" };
    }

    // Validate group membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
    });
    if (!membership) {
      return { success: false, error: "You must be a member of this group to request office hours" };
    }

    const data = {
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: (formData.get("timezone") as string) || "KST",
    };

    const validated = slotSchema.parse(data);

    const ianaTimezone = toIanaTimezone(validated.timezone);
    const startTimeUtc = fromZonedTime(validated.startTime, ianaTimezone);
    const endTimeUtc = fromZonedTime(validated.endTime, ianaTimezone);

    if (startTimeUtc < new Date()) {
      return { success: false, error: "Cannot request office hours in the past" };
    }

    // Look up the target host
    const targetHost = await prisma.user.findFirst({
      where: {
        email: OFFICE_HOUR_TARGET_EMAIL,
        userBatches: {
          some: { batchId: user.batchId, status: "active" },
        },
      },
    });

    if (!targetHost) {
      return { success: false, error: "Office hour host not found in this batch" };
    }

    // Create the slot with host as the target
    const slot = await prisma.officeHourSlot.create({
      data: {
        batchId: user.batchId,
        hostId: targetHost.id,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone: validated.timezone,
        status: "requested",
        groupId,
      },
    });

    // Create the request from this founder
    const request = await prisma.officeHourRequest.create({
      data: {
        slotId: slot.id,
        requesterId: user.id,
        message: (formData.get("message") as string) || null,
        status: "pending",
      },
    });

    revalidatePath("/office-hours");
    revalidateTag(`office-hours-${user.batchId}`);
    revalidateSchedule(user.batchId);

    // Notify host via email (non-blocking)
    try {
      const group = await prisma.group.findUnique({
        where: { id: groupId },
        select: { name: true },
      });
      sendOfficeHourRequestEmail({
        to: targetHost.email,
        hostName: targetHost.name || targetHost.email,
        requesterName: user.name || user.email,
        groupName: group?.name,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        message: (formData.get("message") as string) || undefined,
      }).catch((err) => console.error("[Office Hour] Email notification failed:", err));
    } catch (emailErr) {
      console.error("[Office Hour] Failed to send notification:", emailErr);
    }

    return { success: true, data: { id: request.id } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    console.error("Failed to propose office hour:", error);
    return { success: false, error: "Failed to propose office hour" };
  }
}

export async function getOfficeHourSlots(batchId: string, userId?: string, userRole?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];
    if (!isAdmin(user.role) && user.batchId !== batchId) return [];

    const slots = await unstable_cache(
      () =>
        prisma.officeHourSlot.findMany({
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
            group: {
              include: {
                members: {
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, profileImage: true },
                    },
                  },
                },
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
        }),
      [`office-hours-${batchId}`],
      { revalidate: 60, tags: [`office-hours-${batchId}`] }
    )();

    let filteredSlots = slots;

    // Filter for founders — only show their group's slots + ungrouped slots
    if (userId && userRole && (userRole === "founder" || userRole === "co_founder")) {
      const userGroups = await prisma.groupMember.findMany({
        where: { userId },
        select: { groupId: true },
      });
      const groupIds = new Set(userGroups.map((g) => g.groupId));
      filteredSlots = filteredSlots.filter(
        (s) => s.groupId === null || groupIds.has(s.groupId)
      );
    }

    return filteredSlots;
  } catch (error) {
    console.error("Failed to fetch office hour slots:", error);
    return [];
  }
}

export async function completeExpiredSlots(batchId: string) {
  const result = await prisma.officeHourSlot.updateMany({
    where: {
      batchId,
      status: "confirmed",
      endTime: { lt: new Date() },
    },
    data: { status: "completed" },
  });

  if (result.count > 0) {
    revalidateTag(`office-hours-${batchId}`);
    revalidateSchedule(batchId);
  }
}

export async function requestOfficeHour(slotId: string, groupId: string, message?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !isFounder(user.role)) {
      return { success: false, error: "Unauthorized: founder access required" };
    }

    const batchCheck = await requireActiveBatch(user.batchId);
    if (batchCheck) return batchCheck as ActionResult<{ id: string }>;

    // Validate group membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
    });
    if (!membership) {
      return { success: false, error: "You must be a member of this group to request office hours" };
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
      (req: { requesterId: string; status: string }) => req.requesterId === user.id && req.status === "pending"
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
    revalidateTag(`office-hours-${slot.batchId}`);
    revalidateSchedule(slot.batchId);

    // Notify host via email (non-blocking)
    try {
      const slotWithHost = await prisma.officeHourSlot.findUnique({
        where: { id: validated.slotId },
        include: {
          host: { select: { email: true, name: true } },
          group: { select: { name: true } },
        },
      });
      if (slotWithHost?.host) {
        sendOfficeHourRequestEmail({
          to: slotWithHost.host.email,
          hostName: slotWithHost.host.name || slotWithHost.host.email,
          requesterName: user.name || user.email,
          groupName: slotWithHost.group?.name,
          startTime: slotWithHost.startTime,
          endTime: slotWithHost.endTime,
          message: validated.message,
        }).catch((err) => console.error("[Office Hour] Email notification failed:", err));
      }
    } catch (emailErr) {
      console.error("[Office Hour] Failed to send notification:", emailErr);
    }

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

          // Get attendee emails — if slot has a group, invite all members
          let attendeeEmails: string[] = [];
          let calendarSummary = `Office Hour: ${host?.name || "Host"} × ${requester?.name || "Requester"}`;

          if (request.slot.groupId) {
            const group = await prisma.group.findUnique({
              where: { id: request.slot.groupId },
              include: {
                members: { include: { user: { select: { email: true, name: true } } } },
              },
            });
            if (group) {
              attendeeEmails = group.members.map((m) => m.user.email);
              calendarSummary = `Office Hour: ${host?.name || "Host"} × ${group.name}`;
            }
          } else if (requester) {
            attendeeEmails = [requester.email];
          }
          // Add host and deduplicate
          if (host) attendeeEmails = [...new Set([host.email, ...attendeeEmails])];

          if (attendeeEmails.length > 0) {
            const calResult = await createCalendarEventWithMeet({
              summary: calendarSummary,
              description: request.message
                ? `Office hour session.\n\nFounder message: ${request.message}`
                : "Office hour session.",
              startTime: request.slot.startTime,
              endTime: request.slot.endTime,
              attendeeEmails,
              timezone: request.slot.timezone,
            });

            if (calResult?.meetLink) {
              await prisma.officeHourSlot.update({
                where: { id: request.slotId },
                data: {
                  googleMeetLink: calResult.meetLink,
                  googleEventId: calResult.eventId,
                },
              });
            } else {
              // Fallback: store a "create new meeting" link
              await prisma.officeHourSlot.update({
                where: { id: request.slotId },
                data: {
                  googleMeetLink: "https://meet.google.com/new",
                  googleEventId: calResult?.eventId || null,
                },
              });
            }
          }
        } catch (err) {
          console.error("Google Calendar sync failed for office hour:", err);
          warning = "Request approved, but Google Meet link generation failed. Please set up the meeting manually.";
        }
      }

      // Send approval email to all attendees (non-blocking)
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

        let recipientEmails: string[] = [];
        let groupName: string | undefined;

        if (request.slot.groupId) {
          const group = await prisma.group.findUnique({
            where: { id: request.slot.groupId },
            include: {
              members: { include: { user: { select: { email: true } } } },
            },
          });
          if (group) {
            recipientEmails = group.members.map((m) => m.user.email);
            groupName = group.name;
          }
        } else if (requester) {
          recipientEmails = [requester.email];
        }

        // Get the updated slot to check for meet link
        const updatedSlot = await prisma.officeHourSlot.findUnique({
          where: { id: request.slotId },
          select: { googleMeetLink: true },
        });

        if (recipientEmails.length > 0 && host) {
          sendOfficeHourApprovalEmail({
            to: recipientEmails,
            hostName: host.name || "Host",
            startTime: request.slot.startTime,
            endTime: request.slot.endTime,
            meetLink: updatedSlot?.googleMeetLink || undefined,
            groupName,
          }).catch((err) => console.error("Failed to send approval email:", err));
        }
      } catch (err) {
        console.error("Failed to send approval email:", err);
      }

      revalidatePath("/office-hours");
      revalidateTag(`office-hours-${request.slot.batchId}`);
      revalidateSchedule(request.slot.batchId);
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
      revalidateTag(`office-hours-${request.slot.batchId}`);
      revalidateSchedule(request.slot.batchId);
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

    const ianaTimezone = toIanaTimezone(validated.timezone);
    const startTimeUtc = fromZonedTime(validated.startTime, ianaTimezone);
    const endTimeUtc = fromZonedTime(validated.endTime, ianaTimezone);

    await prisma.officeHourSlot.update({
      where: { id: slotId },
      data: {
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        timezone: validated.timezone,
      },
    });

    revalidatePath("/office-hours");
    revalidateTag(`office-hours-${slot.batchId}`);
    revalidateSchedule(slot.batchId);
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

    if (slot.batchId !== user.batchId) {
      return { success: false, error: "Slot not found" };
    }

    const isHost = slot.hostId === user.id;
    const isAdminUser = user.role === "super_admin" || user.role === "admin";

    if (!isHost && !isAdminUser) {
      return { success: false, error: "Unauthorized: only host or admin can delete slot" };
    }

    if (!isAdminUser && slot.status !== "completed" && slot.requests.length > 0) {
      return { success: false, error: "Cannot delete slot with pending or approved requests" };
    }

    await prisma.officeHourSlot.delete({
      where: { id: slotId },
    });

    revalidatePath("/office-hours");
    revalidateTag(`office-hours-${slot.batchId}`);
    revalidateSchedule(slot.batchId);
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

    const isRequester = request.requesterId === user.id;
    const isAdminUser = user.role === "super_admin" || user.role === "admin";

    if (request.status === "pending") {
      if (!isRequester) {
        return { success: false, error: "Unauthorized: only the requester can cancel pending requests" };
      }
    } else if (request.status === "approved") {
      if (!isAdminUser) {
        return { success: false, error: "Unauthorized: only Admin/Super Admin can cancel approved requests" };
      }
    } else {
      return { success: false, error: "This request cannot be cancelled" };
    }

    await prisma.officeHourRequest.update({
      where: { id: requestId },
      data: {
        status: "cancelled",
        respondedAt: new Date(),
      },
    });

    if (request.status === "approved") {
      await prisma.officeHourSlot.update({
        where: { id: request.slotId },
        data: { status: "cancelled" },
      });
    } else {
      const pendingRequests = await prisma.officeHourRequest.count({
        where: {
          slotId: request.slotId,
          status: "pending",
        },
      });

      if (pendingRequests === 0 && request.slot.status === "requested") {
        await prisma.officeHourSlot.update({
          where: { id: request.slotId },
          data: { status: "available" },
        });
      }
    }

    revalidatePath("/office-hours");
    revalidateTag(`office-hours-${request.slot.batchId}`);
    revalidateSchedule(request.slot.batchId);
    return { success: true, data: undefined };
  } catch (error) {
    console.error("Failed to cancel request:", error);
    return { success: false, error: "Failed to cancel request" };
  }
}
