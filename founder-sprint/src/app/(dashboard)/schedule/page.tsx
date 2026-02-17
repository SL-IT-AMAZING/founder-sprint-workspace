import { getCurrentUser } from "@/lib/permissions";
import { getScheduleItems } from "@/actions/schedule";
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

  const items = await getScheduleItems({
    batchId: user.batchId,
    viewerId: user.id,
    viewerRole: user.role,
    rangeStart,
    rangeEnd,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl">Schedule</h1>
      <ScheduleView
        items={items}
        month={monthDate.toISOString()}
        selectedDay={selectedDay}
        typeFilter={typeFilter}
        isAdmin={user.role === "admin" || user.role === "super_admin"}
      />
    </div>
  );
}
