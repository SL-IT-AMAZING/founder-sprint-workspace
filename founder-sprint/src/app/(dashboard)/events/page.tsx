import { getCurrentUser } from "@/lib/permissions";
import { getEvents } from "@/actions/event";
import { redirect } from "next/navigation";
import { EventsList } from "./EventsList";

export const revalidate = 60;

export default async function EventsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  const events = await getEvents(user.batchId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 style={{ fontSize: "32px", fontWeight: 600, fontFamily: '"Libre Caslon Condensed", Georgia, serif', color: "#2F2C26" }}>Events</h1>
      </div>
      <EventsList user={user} events={events} />
    </div>
  );
}
