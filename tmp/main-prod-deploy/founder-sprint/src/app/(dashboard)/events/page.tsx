import { getCurrentUser } from "@/lib/permissions";
import { getEvents } from "@/actions/event";
import { getOfficeHourBatchContext } from "@/actions/office-hour";
import { getAllBatchesForSelect } from "@/actions/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { EventsList } from "./EventsList";

export const revalidate = 60;

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const [events, allBatches, batchContextResult] = await Promise.all([
    getEvents(user.batchId),
    getAllBatchesForSelect(),
    getOfficeHourBatchContext(user.batchId),
  ]);
  const batchOptions = allBatches.map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    memberCount: b._count.userBatches,
  }));
  const batchContext = batchContextResult.success
    ? batchContextResult.data
    : { companies: [], founders: [], mentors: [] };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Events</h1>
        <Link
          href="/schedule"
          className="text-sm font-medium underline"
          style={{ color: "var(--color-primary)" }}
        >
          Open Unified Schedule
        </Link>
      </div>
      <EventsList
        user={user}
        events={events}
        batchOptions={batchOptions}
        companies={batchContext.companies}
        founders={batchContext.founders}
        currentBatchId={user.batchId}
      />
    </div>
  );
}
