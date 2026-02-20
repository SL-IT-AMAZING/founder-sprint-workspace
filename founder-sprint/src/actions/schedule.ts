"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { ScheduleItem } from "@/types/schedule";

export async function getScheduleItems(params: {
  batchId: string;
  viewerId: string;
  viewerRole: string;
  rangeStart: Date;
  rangeEnd: Date;
}): Promise<ScheduleItem[]> {
  const { batchId, viewerId, viewerRole, rangeStart, rangeEnd } = params;

  const fetchSchedule = async () => {
    const [events, officeHourSlots, sessions] = await Promise.all([
      prisma.event.findMany({
        where: {
          batchId,
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          timezone: true,
          eventType: true,
          location: true,
          googleEventId: true,
        },
        orderBy: { startTime: "asc" },
      }),

      prisma.officeHourSlot.findMany({
        where: {
          batchId,
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          timezone: true,
          status: true,
          googleMeetLink: true,
          groupId: true,
          host: { select: { name: true } },
          group: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      prisma.session.findMany({
        where: {
          batchId,
          OR: [
            { startTime: { gte: rangeStart, lte: rangeEnd } },
            {
              startTime: null,
              sessionDate: { gte: rangeStart, lte: rangeEnd },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          sessionDate: true,
          startTime: true,
          endTime: true,
          timezone: true,
          googleEventId: true,
        },
        orderBy: [{ startTime: "asc" }, { sessionDate: "asc" }],
      }),
    ]);

    let filteredOH = officeHourSlots;
    if (viewerRole === "founder" || viewerRole === "co_founder") {
      const userGroups = await prisma.groupMember.findMany({
        where: { userId: viewerId },
        select: { groupId: true },
      });
      const groupIds = new Set(userGroups.map((g) => g.groupId));
      filteredOH = officeHourSlots.filter(
        (s) => s.groupId === null || groupIds.has(s.groupId)
      );
    }

    const items: ScheduleItem[] = [];

    for (const e of events) {
      items.push({
        id: e.id,
        kind: "event",
        title: e.title,
        startTime: e.startTime.toISOString(),
        endTime: e.endTime.toISOString(),
        timezone: e.timezone,
        isAllDay: false,
        eventType: e.eventType as ScheduleItem["eventType"],
        location: e.location || undefined,
        deepLink: "/events",
      });
    }

    for (const oh of filteredOH) {
      items.push({
        id: oh.id,
        kind: "officeHour",
        title: `Office Hour${oh.group ? `: ${oh.group.name}` : ""}`,
        startTime: oh.startTime.toISOString(),
        endTime: oh.endTime.toISOString(),
        timezone: oh.timezone,
        isAllDay: false,
        status: oh.status as ScheduleItem["status"],
        hostName: oh.host.name || undefined,
        groupName: oh.group?.name || undefined,
        googleMeetLink: oh.googleMeetLink || undefined,
        deepLink: "/office-hours",
      });
    }

    for (const s of sessions) {
      const hasTime = !!s.startTime && !!s.endTime;
      const day = s.sessionDate.toISOString().slice(0, 10);
      items.push({
        id: s.id,
        kind: "session",
        title: s.title,
        startTime: hasTime
          ? s.startTime!.toISOString()
          : `${day}T00:00:00.000Z`,
        endTime: hasTime
          ? s.endTime!.toISOString()
          : `${day}T23:59:59.000Z`,
        timezone: s.timezone,
        isAllDay: !hasTime,
        deepLink: "/sessions",
      });
    }

    items.sort((a, b) => {
      if (a.isAllDay && !b.isAllDay) return -1;
      if (!a.isAllDay && b.isAllDay) return 1;
      return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
    });

    return items;
  };

  return unstable_cache(
    fetchSchedule,
    [
      `schedule-${batchId}-${viewerId}-${viewerRole}-${rangeStart.toISOString()}-${rangeEnd.toISOString()}`,
    ],
    { revalidate: 60, tags: [`schedule-${batchId}`] }
  )();
}
