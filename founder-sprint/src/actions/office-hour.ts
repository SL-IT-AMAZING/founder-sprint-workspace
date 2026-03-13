"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentUser, isStaff, isFounder, canCreateOfficeHourSlot, isAdmin } from "@/lib/permissions";
import { revalidatePath, revalidateTag as revalidateTagBase, unstable_cache } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/types";
import { isCalendarConfigured, createCalendarEventWithMeet } from "@/lib/google-calendar";
import { fromZonedTime } from "date-fns-tz";
import { startOfWeek } from "date-fns";
import { sendOfficeHourRequestEmail, sendOfficeHourBookingConfirmEmail } from "@/lib/email";
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
  agenda: z.string().min(3, "Agenda is required").max(1000, "Agenda must be 1000 characters or less"),
});

const responseSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  status: z.enum(["approved", "rejected"]),
});

const WEEKLY_OFFICE_HOUR_LIMIT = 2;

async function getRequesterStats(userId: string, batchId: string) {
  const [grantedCredits, reservedRequests, weeklyRequests] = await Promise.all([
    prisma.officeHourCredit.aggregate({
      where: { userId, batchId },
      _sum: { credits: true },
    }),
    prisma.officeHourRequest.count({
      where: {
        requesterId: userId,
        status: { in: ["pending", "approved"] },
        slot: { batchId },
      },
    }),
    prisma.officeHourRequest.count({
      where: {
        requesterId: userId,
        status: { in: ["pending", "approved"] },
        createdAt: { gte: startOfWeek(new Date(), { weekStartsOn: 1 }) },
        slot: { batchId },
      },
    }),
  ]);

  const totalCredits = 1 + (grantedCredits._sum.credits ?? 0);

  return {
    totalCredits,
    remainingCredits: Math.max(totalCredits - reservedRequests, 0),
    weeklyLimit: WEEKLY_OFFICE_HOUR_LIMIT,
    remainingWeeklyRequests: Math.max(WEEKLY_OFFICE_HOUR_LIMIT - weeklyRequests, 0),
  };
}

export async function getOfficeHourRequesterStats(batchId?: string) {
  const user = await getCurrentUser();
  if (!user || !isFounder(user.role)) {
    return {
      totalCredits: 0,
      remainingCredits: 0,
      weeklyLimit: WEEKLY_OFFICE_HOUR_LIMIT,
      remainingWeeklyRequests: 0,
    };
  }

  return getRequesterStats(user.id, batchId || user.batchId);
}

export async function grantOfficeHourCredits(
  userId: string,
  batchId: string,
  amount: number,
  reason?: string
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    return { success: false, error: "Unauthorized" };
  }

  const normalizedAmount = Math.floor(Number(amount));
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return { success: false, error: "Credit amount must be a positive number" };
  }

  await prisma.officeHourCredit.create({
    data: {
      userId,
      batchId,
      credits: normalizedAmount,
      grantedBy: user.id,
      reason: reason?.trim() || "Admin granted credits",
    },
  });

  revalidatePath("/office-hours");
  revalidateTag(`office-hours-${batchId}`);
  return { success: true, data: undefined };
}

export async function scheduleGroupOfficeHour(formData: FormData) {
  // 1. Auth check — staff only (admin/super_admin/mentor)
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Authentication required" };
  if (!canCreateOfficeHourSlot(user.role)) return { success: false, error: "Insufficient permissions" };


  // 2. Parse formData
  const companyId = formData.get("companyId") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const timezoneInput = formData.get("timezone") as string;

  if (!companyId || !startTime || !endTime) {
    return { success: false, error: "Company, start time, and end time are required" };
  }

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

  // 5. Validate company — exists and has members
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: {
      members: {
        where: { isCurrent: true },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      // batches filter removed — companies are global
    },
  });

  if (!company) return { success: false, error: "Company not found" };
  // Company-batch check removed — companies are global across all batches
  if (company.members.length === 0) return { success: false, error: "Cannot schedule for a company with no members" };

  try {
    // 6. Create slot as confirmed with companyId
    const slot = await prisma.officeHourSlot.create({
      data: {
        batchId: user.batchId,
        hostId: user.id,
        startTime: start,
        endTime: end,
        timezone,
        status: "confirmed",
        companyId,
      },
    });

    // 7. Create Google Calendar event with Meet link for all company members
    const memberEmails = company.members.map((m) => m.user.email);
    const hostEmail = user.email;
    const allEmails = [...new Set([hostEmail, ...memberEmails])];

    const calResult = await createCalendarEventWithMeet({
      summary: `Office Hour: ${user.name} × ${company.name}`,
      description: `Office hour session with ${company.name}`,
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
    return {
      success: true as const,
      data: { id: slot.id },
      ...(calResult ? {} : { warning: "Office hour created but Google Calendar invite failed. Check calendar configuration." }),
    };
  } catch (error) {
    console.error("[scheduleGroupOfficeHour] Error:", error);
    return { success: false, error: "Failed to schedule group office hour" };
  }
}

export async function scheduleIndividualOfficeHour(formData: FormData): Promise<ActionResult<{ id: string }>> {
  // 1. Auth check — staff only
  const user = await getCurrentUser();
  if (!user) return { success: false, error: "Authentication required" };
  if (!canCreateOfficeHourSlot(user.role)) return { success: false, error: "Insufficient permissions" };


  // 2. Parse formData
  const founderId = formData.get("founderId") as string;
  const startTime = formData.get("startTime") as string;
  const endTime = formData.get("endTime") as string;
  const timezoneInput = formData.get("timezone") as string;

  if (!founderId || !startTime || !endTime) {
    return { success: false, error: "Founder, start time, and end time are required" };
  }

  // 3. Validate timezone
  const timezone = TIMEZONE_MAP[timezoneInput?.toUpperCase()] || toIanaTimezone(timezoneInput || "UTC");

  // 4. Validate time (same rules as scheduleGroupOfficeHour)
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

  // 5. Validate founder — exists in batch
  const founder = await prisma.user.findFirst({
    where: {
      id: founderId,
      role: { in: ["founder", "co_founder"] },
      userBatches: {
        some: { batchId: user.batchId, status: "active" },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  if (!founder) return { success: false, error: "Founder not found in this batch" };

  try {
    const slot = await prisma.officeHourSlot.create({
      data: {
        batchId: user.batchId,
        hostId: user.id,
        startTime: start,
        endTime: end,
        timezone,
        status: "confirmed",
      },
    });

    await prisma.officeHourRequest.create({
      data: {
        slotId: slot.id,
        requesterId: founder.id,
        status: "approved",
        respondedAt: new Date(),
      },
    });

    // 7. Create Google Calendar event with Meet link
    const allEmails = [...new Set([user.email, founder.email])];

    const calResult = await createCalendarEventWithMeet({
      summary: `Office Hour: ${user.name} × ${founder.name || founder.email}`,
      description: `Individual office hour session`,
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
    return {
      success: true as const,
      data: { id: slot.id },
      ...(calResult ? {} : { warning: "Office hour created but Google Calendar invite failed. Check calendar configuration." }),
    };
  } catch (error) {
    console.error("[scheduleIndividualOfficeHour] Error:", error);
    return { success: false, error: "Failed to schedule individual office hour" };
  }
}

export async function proposeOfficeHour(formData: FormData): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !isFounder(user.role)) {
      return { success: false, error: "Unauthorized: founder access required" };
    }


    const companyId = formData.get("companyId") as string;
    if (!companyId) {
      return { success: false, error: "Company is required" };
    }

    // Validate company membership
    const membership = await prisma.companyMember.findFirst({
      where: { companyId, userId: user.id, isCurrent: true },
    });
    if (!membership) {
      return { success: false, error: "You must be a member of this company to request office hours" };
    }

    const requesterStats = await getRequesterStats(user.id, user.batchId);
    if (requesterStats.remainingCredits <= 0) {
      return { success: false, error: "You have no remaining office hour credits" };
    }
    if (requesterStats.remainingWeeklyRequests <= 0) {
      return { success: false, error: `Weekly office hour limit (${requesterStats.weeklyLimit}) reached` };
    }

    const data = {
      startTime: formData.get("startTime") as string,
      endTime: formData.get("endTime") as string,
      timezone: (formData.get("timezone") as string) || "KST",
    };
    const agenda = (formData.get("agenda") as string | null)?.trim() || "";
    const mentorIdRaw = formData.get("mentorId");
    const mentorId = typeof mentorIdRaw === "string" && mentorIdRaw.trim().length > 0 ? mentorIdRaw : null;

    const validated = slotSchema.parse(data);

    const ianaTimezone = toIanaTimezone(validated.timezone);
    const startTimeUtc = fromZonedTime(validated.startTime, ianaTimezone);
    const endTimeUtc = fromZonedTime(validated.endTime, ianaTimezone);

    if (startTimeUtc < new Date()) {
      return { success: false, error: "Cannot request office hours in the past" };
    }

    let targetHost: { id: string; email: string; name: string | null } | null = null;

    if (mentorId) {
      const mentorMembership = await prisma.userBatch.findFirst({
        where: {
          batchId: user.batchId,
          status: "active",
          userId: mentorId,
          OR: [
            { role: "mentor" },
            { additionalRoles: { has: "mentor" } },
          ],
          user: { status: "active" },
        },
        select: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });

      if (!mentorMembership?.user) {
        return { success: false, error: "Selected mentor is not available in this batch" };
      }

      targetHost = mentorMembership.user;
    } else if (OFFICE_HOUR_TARGET_EMAIL) {
      targetHost = await prisma.user.findFirst({
        where: {
          email: OFFICE_HOUR_TARGET_EMAIL,
        },
        select: {
          id: true,
          email: true,
          name: true,
        },
      });
    }

    if (!targetHost) {
      return { success: false, error: "No office hour mentor is available for this request" };
    }
    if (!agenda) {
      return { success: false, error: "Agenda is required" };
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
        companyId,
      },
    });

    // Create the request from this founder
    const request = await prisma.officeHourRequest.create({
      data: {
        slotId: slot.id,
        requesterId: user.id,
        message: (formData.get("message") as string) || null,
        agenda,
        status: "pending",
      },
    });

    revalidatePath("/office-hours");
    revalidateTag(`office-hours-${user.batchId}`);
    revalidateSchedule(user.batchId);

    // Notify host via email (non-blocking)
    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { name: true },
      });
      sendOfficeHourRequestEmail({
        to: targetHost.email,
        hostName: targetHost.name || targetHost.email,
        requesterName: user.name || user.email,
        companyName: company?.name,
        startTime: startTimeUtc,
        endTime: endTimeUtc,
        agenda,
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
            company: {
              include: {
                members: {
                  where: { isCurrent: true },
                  include: {
                    user: {
                      select: { id: true, name: true, email: true, profileImage: true },
                    },
                  },
                },
              },
            },
            // group relation removed — office hours use company now
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

    if (userId && userRole && (userRole === "founder" || userRole === "co_founder")) {
      const userCompanies = await prisma.companyMember.findMany({
        where: { userId, isCurrent: true },
        select: { companyId: true },
      });
      const companyIds = new Set(userCompanies.map((c) => c.companyId));
      filteredSlots = filteredSlots.filter((s) => {
        const matchesCompany = Boolean(s.companyId && companyIds.has(s.companyId));
        const matchesDirectRequest = s.requests.some((request) => request.requester.id === userId);
        return matchesCompany || matchesDirectRequest;
      });
    }

    return filteredSlots;
  } catch (error) {
    console.error("Failed to fetch office hour slots:", error);
    return [];
  }
}

export async function getAvailableOfficeHourMentors(batchId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) return [];

    const targetBatchId = batchId || user.batchId;
    if (!targetBatchId) return [];
    if (!isAdmin(user.role) && user.batchId !== targetBatchId) return [];

    const mentors = await prisma.userBatch.findMany({
      where: {
        batchId: targetBatchId,
        status: "active",
        OR: [
          { role: "mentor" },
          { additionalRoles: { has: "mentor" } },
        ],
        user: { status: "active" },
      },
      select: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    return mentors.map((entry) => entry.user);
  } catch (error) {
    console.error("Failed to fetch available office hour mentors:", error);
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

export async function requestOfficeHour(slotId: string, companyId: string, message?: string, agenda?: string): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await getCurrentUser();
    if (!user || !isFounder(user.role)) {
      return { success: false, error: "Unauthorized: founder access required" };
    }


    // Validate company membership
    const membership = await prisma.companyMember.findFirst({
      where: { companyId, userId: user.id, isCurrent: true },
    });
    if (!membership) {
      return { success: false, error: "You must be a member of this company to request office hours" };
    }

    const requesterStats = await getRequesterStats(user.id, user.batchId);
    if (requesterStats.remainingCredits <= 0) {
      return { success: false, error: "You have no remaining office hour credits" };
    }
    if (requesterStats.remainingWeeklyRequests <= 0) {
      return { success: false, error: `Weekly office hour limit (${requesterStats.weeklyLimit}) reached` };
    }

    const validated = requestSchema.parse({ slotId, message, agenda });

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
        agenda: validated.agenda,
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
          company: { select: { name: true } },
          // group relation removed — office hours use company now
        },
      });
      if (slotWithHost?.host) {
        sendOfficeHourRequestEmail({
          to: slotWithHost.host.email,
          hostName: slotWithHost.host.name || slotWithHost.host.email,
          requesterName: user.name || user.email,
          companyName: slotWithHost.company?.name,
          startTime: slotWithHost.startTime,
          endTime: slotWithHost.endTime,
          agenda: validated.agenda,
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

          // Get attendee emails — if slot has a company, invite all members
          let attendeeEmails: string[] = [];
          let calendarSummary = `Office Hour: ${host?.name || "Host"} × ${requester?.name || "Requester"}`;

          if (request.slot.companyId) {
            const company = await prisma.company.findUnique({
              where: { id: request.slot.companyId },
              include: {
                members: { where: { isCurrent: true }, include: { user: { select: { email: true, name: true } } } },
              },
            });
            if (company) {
              attendeeEmails = company.members.map((m) => m.user.email);
              calendarSummary = `Office Hour: ${host?.name || "Host"} × ${company.name}`;
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
        let companyName: string | undefined;

        if (request.slot.companyId) {
          const company = await prisma.company.findUnique({
            where: { id: request.slot.companyId },
            include: {
              members: { where: { isCurrent: true }, include: { user: { select: { email: true } } } },
            },
          });
          if (company) {
            recipientEmails = company.members.map((m) => m.user.email);
            companyName = company.name;
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
          await prisma.notification.create({
            data: {
              type: "office_hour_booking",
              userId: request.requesterId,
              entityId: request.slotId,
              title: "Office hour booking confirmed",
              message: `${host.name || "Host"} approved your office hour request`,
            },
          });

          sendOfficeHourBookingConfirmEmail({
            to: recipientEmails,
            hostName: host.name || "Host",
            startTime: request.slot.startTime,
            endTime: request.slot.endTime,
            meetLink: updatedSlot?.googleMeetLink || undefined,
            companyName,
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

export async function markOfficeHourNoShow(requestId: string, noShow: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user || !isStaff(user.role)) {
    return { success: false, error: "Unauthorized: staff access required" };
  }

  const request = await prisma.officeHourRequest.findUnique({
    where: { id: requestId },
    include: { slot: true },
  });

  if (!request) {
    return { success: false, error: "Request not found" };
  }

  const isHost = request.slot.hostId === user.id;
  const isAdminUser = user.role === "super_admin" || user.role === "admin";
  if (!isHost && !isAdminUser) {
    return { success: false, error: "Unauthorized: only host or admin can update attendance" };
  }

  if (request.status !== "approved") {
    return { success: false, error: "Only approved office hour requests can be marked as no-show" };
  }

  await prisma.officeHourRequest.update({
    where: { id: requestId },
    data: { noShow },
  });

  await prisma.notification.create({
    data: {
      type: "office_hour_attendance",
      userId: request.requesterId,
      entityId: request.slotId,
      title: noShow ? "Marked as no-show" : "Attendance updated",
      message: noShow ? "Your office hour was marked as a no-show." : "Your office hour attendance was updated.",
    },
  });

  revalidatePath("/office-hours");
  revalidateTag(`office-hours-${request.slot.batchId}`);
  revalidateSchedule(request.slot.batchId);
  return { success: true, data: undefined };
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
