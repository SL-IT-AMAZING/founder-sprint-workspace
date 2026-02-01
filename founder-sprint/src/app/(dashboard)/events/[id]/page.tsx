import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, isAdmin } from "@/lib/permissions";
import { getEvent } from "@/actions/event";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate } from "@/lib/utils";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const event = await getEvent(id);
  if (!event) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl">Event not found</h1>
      </div>
    );
  }

  const isUserAdmin = isAdmin(user.role);
  const isPastEvent = new Date(event.endTime) < new Date();

  return (
    <div className="space-y-6">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm" style={{ color: "var(--color-foreground-secondary)" }}>
        <span>←</span>
        <span>Back to Events</span>
      </Link>

      <div className="card">
        <div className="space-y-4">
          {/* Event Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-2xl mb-2">{event.title}</h1>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={isPastEvent ? "default" : "success"}>
                  {event.eventType.replace("_", " ").toUpperCase()}
                </Badge>
                {isPastEvent && <Badge variant="default">Past Event</Badge>}
              </div>
            </div>
            {isUserAdmin && (
              <Link href={`/events/${id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit Event
                </Button>
              </Link>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                Date & Time
              </p>
              <p className="text-base">
                {formatDate(event.startTime)} - {formatDate(event.endTime)}
              </p>
              <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                {event.timezone}
              </p>
            </div>

            {event.location && (
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                  Location
                </p>
                <p className="text-base">{event.location}</p>
              </div>
            )}

            {event.description && (
              <div>
                <p className="text-sm font-medium mb-1" style={{ color: "var(--color-foreground-muted)" }}>
                  Description
                </p>
                <p className="text-base" style={{ whiteSpace: "pre-wrap" }}>
                  {event.description}
                </p>
              </div>
            )}

            {/* Organizer */}
            <div className="pt-3 border-t" style={{ borderColor: "var(--color-card-border)" }}>
              <p className="text-sm font-medium mb-2" style={{ color: "var(--color-foreground-muted)" }}>
                Organized by
              </p>
              <div className="flex items-center gap-3">
                <Avatar
                  src={event.creator.profileImage}
                  name={event.creator.name}
                  size={40}
                />
                <div>
                  <p className="font-medium">{event.creator.name}</p>
                  <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    {event.creator.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
