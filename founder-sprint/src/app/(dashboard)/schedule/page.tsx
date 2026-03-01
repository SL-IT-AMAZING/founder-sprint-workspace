import { getCurrentUser } from "@/lib/permissions";
import { getScheduleItems } from "@/actions/schedule"; import { getGroups } from "@/actions/group"; import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ScheduleView } from "./ScheduleView";
import { startOfWeek, startOfMonth, endOfWeek, endOfMonth, parse, isValid } from "date-fns";

export const revalidate = 60;

const VALID_TYPES = new Set(["event", "officeHour", "session"]);

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
      ? (params.type as "event" | "officeHour" | "session")
      : null;

  const rangeStart = startOfWeek(startOfMonth(monthDate));
  const rangeEnd = endOfWeek(endOfMonth(monthDate));

  const [items, groups, batchMembers] = await Promise.all([
    getScheduleItems({
      batchId: user.batchId,
      viewerId: user.id,
      viewerRole: user.role,
      rangeStart,
      rangeEnd,
    }),
    getGroups(user.batchId),
    prisma.userBatch.findMany({
      where: { batchId: user.batchId, status: "active" },
      select: { user: { select: { id: true, name: true, email: true, profileImage: true, role: true, groupMembers: { select: { group: { select: { name: true } } } } } } }
    }),
  ]);
  const companies = groups.map(g => ({ id: g.id, name: g.name, memberCount: g._count?.members ?? 0 }));
  const founders = batchMembers
    .filter(ub => ub.user.role === "founder" || ub.user.role === "co_founder")
    .map(ub => ({ id: ub.user.id, name: ub.user.name, email: ub.user.email, profileImage: ub.user.profileImage, groupName: ub.user.groupMembers[0]?.group.name ?? null }));
  const totalBatchMembers = batchMembers.length;

  return (
    <div className="space-y-6">
      <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Schedule</h1>
      <ScheduleView
        items={items}
        month={monthDate.toISOString()}
        selectedDay={selectedDay}
        typeFilter={typeFilter}
        isAdmin={user.role === "admin" || user.role === "super_admin"}
        companies={companies}
        founders={founders}
        totalBatchMembers={totalBatchMembers}
      />
    </div>
  );
}
