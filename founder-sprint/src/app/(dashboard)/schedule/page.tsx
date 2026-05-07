import { getCurrentUser } from "@/lib/permissions";
import { getScheduleItems } from "@/actions/schedule";
import { getOfficeHourBatchContext } from "@/actions/office-hour";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PageCategoryLabel } from "@/components/layout/PageCategoryLabel";
import { ScheduleView } from "./ScheduleView";
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, parse, isValid } from "date-fns";
import type { VisibleScheduleFilter } from "@/types/schedule";

export const revalidate = 60;

const VALID_TYPES = new Set(["in_person", "virtual", "general_session", "office_hour"]);

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; day?: string; type?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");

  const params = await searchParams;

  const ref = new Date();
  ref.setDate(1);
  const monthCandidate = params.month ? parse(params.month, "yyyy-MM", ref) : new Date();
  const monthDate = isValid(monthCandidate) ? monthCandidate : new Date();

  const selectedDay =
    params.day && /^\d{4}-\d{2}-\d{2}$/.test(params.day) ? params.day : null;
  const typeFilter =
    params.type && VALID_TYPES.has(params.type)
      ? (params.type as VisibleScheduleFilter)
      : null;

  const rangeStart = startOfWeek(startOfMonth(monthDate));
  const rangeEnd = endOfWeek(endOfMonth(monthDate));

  const [adminBatchOptions, batchContextResult, totalBatchMembers] = await Promise.all([
    user.role === "admin" || user.role === "super_admin"
      ? prisma.batch.findMany({
          orderBy: [{ status: "asc" }, { createdAt: "desc" }],
          select: { id: true, name: true, status: true, _count: { select: { userBatches: true } } },
        })
      : Promise.resolve([]),
    getOfficeHourBatchContext(user.batchId),
    prisma.userBatch.count({
      where: { batchId: user.batchId, status: "active" },
    }),
  ]);

  const adminBatchIds = adminBatchOptions.map((batch) => batch.id);

  const items = await getScheduleItems({
    batchId: user.batchId,
    batchIds: user.role === "admin" || user.role === "super_admin" ? adminBatchIds : [user.batchId],
    viewerId: user.id,
    viewerRole: user.role,
    rangeStart,
    rangeEnd,
  });

  const batchOptions = adminBatchOptions.map((batch) => ({
    id: batch.id,
    name: batch.name,
    status: batch.status,
    memberCount: batch._count.userBatches,
  }));
  const batchContext = batchContextResult.success
    ? batchContextResult.data
    : { companies: [], founders: [], mentors: [] };

  return (
    <div className="space-y-6">
      <div>
        <PageCategoryLabel label="Batch" />
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Schedule</h1>
      </div>
      <ScheduleView
        items={items}
        month={monthDate.toISOString()}
        selectedDay={selectedDay}
        typeFilter={typeFilter}
        isAdmin={user.role === "admin" || user.role === "super_admin"}
        userTimezone={user.timezone}
        companies={batchContext.companies}
        founders={batchContext.founders}
        totalBatchMembers={totalBatchMembers}
        batchOptions={batchOptions}
        currentBatchId={user.batchId}
      />
    </div>
  );
}
