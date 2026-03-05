import { getCurrentUser } from "@/lib/permissions";
import { getEvents } from "@/actions/event";
import { getAllBatchesForSelect } from "@/actions/session";
import { redirect } from "next/navigation";
import { EventsList } from "./EventsList";

export const revalidate = 60;

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const events = await getEvents(user.batchId);
  const allBatches = await getAllBatchesForSelect();
  const batchOptions = allBatches.map(b => ({
    id: b.id,
    name: b.name,
    status: b.status,
    memberCount: b._count.userBatches,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Events</h1>
      </div>
      <EventsList user={user} events={events} batchOptions={batchOptions} />
    </div>
  );
}
