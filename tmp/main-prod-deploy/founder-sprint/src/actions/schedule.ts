"use server";

import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import type { ScheduleItem } from "@/types/schedule";

export async function getScheduleItems(params: {
  batchId: string;
  batchIds?: string[];
  viewerId: string;
  viewerRole: string;
  rangeStart: Date;
  rangeEnd: Date;
}): Promise<ScheduleItem[]> {
  const { batchId, batchIds, viewerId, viewerRole, rangeStart, rangeEnd } = params;
  const isAdminViewer = viewerRole === "admin" || viewerRole === "super_admin";
  const effectiveBatchIds = batchIds && batchIds.length > 0 ? batchIds : [batchId];

  const fetchSchedule = async () => {
    const userCompanies = isAdminViewer
      ? []
      : await prisma.companyMember.findMany({
          where: { userId: viewerId, isCurrent: true },
          select: { companyId: true },
        });
    const companyIds = new Set(userCompanies.map((c) => c.companyId));

    const [events, officeHourSlots, sessions] = await Promise.all([
      prisma.event.findMany({
        where: {
          batches: { some: { batchId: { in: effectiveBatchIds } } },
          startTime: { gte: rangeStart, lte: rangeEnd },
          ...(isAdminViewer
            ? {}
            : {
                OR: [
                  { targetCompanyIds: { isEmpty: true } },
                  ...(companyIds.size > 0 ? [{ targetCompanyIds: { hasSome: Array.from(companyIds) } }] : []),
                ],
              }),
        },
        select: {
          id: true,
          title: true,
          startTime: true,
          endTime: true,
          timezone: true,
          eventType: true,
          targetCompanyIds: true,
          googleMeetLink: true,
          location: true,
          googleEventId: true,
          batches: {
            select: {
              batch: { select: { name: true } },
            },
          },
        },
        orderBy: { startTime: "asc" },
      }),

      prisma.officeHourSlot.findMany({
        where: {
          batchId: { in: effectiveBatchIds },
          startTime: { gte: rangeStart, lte: rangeEnd },
        },
        select: {
          id: true,
          startTime: true,
          endTime: true,
          timezone: true,
          status: true,
          googleMeetLink: true,
          companyId: true,
          targetFounderIds: true,
          slotMode: true,
          groupId: true,
          requests: { select: { requesterId: true } },
          host: { select: { name: true } },
          company: { select: { name: true } },
          group: { select: { name: true } },
          batch: { select: { name: true } },
        },
        orderBy: { startTime: "asc" },
      }),

      prisma.session.findMany({
        where: {
          batches: { some: { batchId: { in: effectiveBatchIds } } },
          ...(isAdminViewer
            ? {}
            : {
                OR: [
                  { targetCompanyIds: { isEmpty: true } },
                  ...(companyIds.size > 0 ? [{ targetCompanyIds: { hasSome: Array.from(companyIds) } }] : []),
                ],
              }),
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
          targetCompanyIds: true,
          googleEventId: true,
          batches: {
            select: {
              batch: { select: { name: true } },
            },
          },
        },
        orderBy: [{ startTime: "asc" }, { sessionDate: "asc" }],
      }),
    ]);

    let filteredOH = officeHourSlots;
    if (viewerRole === "founder" || viewerRole === "co_founder") {
      filteredOH = officeHourSlots.filter((s) => {
        const matchesCompany = Boolean(s.companyId && companyIds.has(s.companyId));
        const matchesDirectRequest = s.requests.some((request) => request.requesterId === viewerId);
        const matchesTargetedFounder = s.targetFounderIds.length === 0 || s.targetFounderIds.includes(viewerId);

        if (s.slotMode === "open_batch") {
          if (s.status === "available" && !s.companyId) {
            return true;
          }

          return matchesCompany || matchesDirectRequest;
        }

        if (s.slotMode === "direct_founder") {
          return s.targetFounderIds.includes(viewerId) || matchesDirectRequest;
        }

        return (matchesCompany && matchesTargetedFounder) || matchesDirectRequest;
      });
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
        googleMeetLink: e.googleMeetLink || undefined,
        location: e.location || undefined,
        batchNames: e.batches.map((batch) => batch.batch.name),
        deepLink: "/events",
      });
    }

    for (const oh of filteredOH) {
      items.push({
        id: oh.id,
        kind: "officeHour",
        title: `Office Hour${oh.company ? `: ${oh.company.name}` : oh.group ? `: ${oh.group.name}` : ""}`,
        startTime: oh.startTime.toISOString(),
        endTime: oh.endTime.toISOString(),
        timezone: oh.timezone,
        isAllDay: false,
        status: oh.status as ScheduleItem["status"],
        hostName: oh.host.name || undefined,
        companyName: oh.company?.name || oh.group?.name || undefined,
        googleMeetLink: oh.googleMeetLink || undefined,
        batchNames: [oh.batch.name],
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
        batchNames: s.batches.map((batch) => batch.batch.name),
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
      effectiveBatchIds.join(","),
    ],
    { revalidate: 60, tags: effectiveBatchIds.map((id) => `schedule-${id}`) }
  )();
}
