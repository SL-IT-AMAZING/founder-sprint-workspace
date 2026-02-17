"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar } from "@/components/ui/Calendar";
import { formatDateTime, formatDate } from "@/lib/utils";
import { isAdmin } from "@/lib/permissions-client";
import { createEvent, deleteEvent } from "@/actions/event";
import type { UserWithBatch, EventType } from "@/types";

type ViewMode = "list" | "calendar";

interface Event {
  id: string;
  title: string;
  description: string | null;
  eventType: EventType;
  startTime: Date;
  endTime: Date;
  timezone: string;
  location: string | null;
  creator: {
    id: string;
    name: string;
    email: string;
    profileImage: string | null;
  };
}

interface EventsListProps {
  user: UserWithBatch;
  events: Event[];
}

const eventTypeOptions = [
  { value: "one_off", label: "One-off Event" },
  { value: "office_hour", label: "Office Hour" },
  { value: "in_person", label: "In-person Event" },
];

function getEventTypeBadgeVariant(type: EventType): "default" | "success" | "warning" {
  switch (type) {
    case "one_off":
      return "default";
    case "office_hour":
      return "success";
    case "in_person":
      return "warning";
    default:
      return "default";
  }
}

function getEventTypeLabel(type: EventType): string {
  switch (type) {
    case "one_off":
      return "One-off";
    case "office_hour":
      return "Office Hour";
    case "in_person":
      return "In-person";
    default:
      return type;
  }
}

export function EventsList({ user, events }: EventsListProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<EventType | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const prefillDate = searchParams.get("date");

  const canCreate = isAdmin(user.role);

  useEffect(() => {
    if (prefillDate && canCreate) {
      setCreateModalOpen(true);
    }
  }, [prefillDate, canCreate]);

  const filteredEvents = selectedType === "all"
    ? events
    : events.filter((e) => e.eventType === selectedType);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const selectedDateEvents = selectedDate
    ? filteredEvents.filter((e) => {
        const eventDate = new Date(e.startTime);
        return (
          eventDate.getFullYear() === selectedDate.getFullYear() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getDate() === selectedDate.getDate()
        );
      })
    : [];

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createEvent(formData);

    if (result.success) {
      setCreateModalOpen(false);
      (e.target as HTMLFormElement).reset();
      if (result.warning) alert(result.warning);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const result = await deleteEvent(eventId);
    if (!result.success) {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedType("all")}
            className={selectedType === "all" ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: 14, height: 36, padding: "0 16px" }}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType("one_off")}
            className={selectedType === "one_off" ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: 14, height: 36, padding: "0 16px" }}
          >
            One-off
          </button>
          <button
            onClick={() => setSelectedType("office_hour")}
            className={selectedType === "office_hour" ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: 14, height: 36, padding: "0 16px" }}
          >
            Office Hour
          </button>
          <button
            onClick={() => setSelectedType("in_person")}
            className={selectedType === "in_person" ? "btn btn-primary" : "btn btn-secondary"}
            style={{ fontSize: 14, height: 36, padding: "0 16px" }}
          >
            In-person
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex border rounded overflow-hidden" style={{ borderColor: "#e0e0e0" }}>
            <button
              onClick={() => setViewMode("list")}
              className="px-3 py-1.5 text-sm"
              style={{
                border: "none",
                background: viewMode === "list" ? "var(--color-primary)" : "transparent",
                color: viewMode === "list" ? "white" : "var(--color-foreground)",
                cursor: "pointer",
              }}
            >
              List
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className="px-3 py-1.5 text-sm"
              style={{
                border: "none",
                background: viewMode === "calendar" ? "var(--color-primary)" : "transparent",
                color: viewMode === "calendar" ? "white" : "var(--color-foreground)",
                cursor: "pointer",
              }}
            >
              Calendar
            </button>
          </div>
          {canCreate && (
            <Button onClick={() => setCreateModalOpen(true)} size="sm">
              Create Event
            </Button>
          )}
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Calendar events={filteredEvents} onDayClick={handleDayClick} />
          </div>
          <div className="space-y-3">
            <h3 className="font-medium">
              {selectedDate ? formatDate(selectedDate) : "Select a day"}
            </h3>
            {selectedDate && selectedDateEvents.length === 0 && (
              <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                No events on this day
              </p>
            )}
            {selectedDateEvents.map((event) => (
              <div key={event.id} className="card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-sm">{event.title}</h4>
                  <Badge variant={getEventTypeBadgeVariant(event.eventType)}>
                    {getEventTypeLabel(event.eventType)}
                  </Badge>
                </div>
                <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                  {formatDateTime(event.startTime)} - {formatDateTime(event.endTime)}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description={selectedType === "all" ? "No events scheduled yet" : `No ${getEventTypeLabel(selectedType as EventType).toLowerCase()} events scheduled`}
          action={
            canCreate ? (
              <Button onClick={() => setCreateModalOpen(true)}>Create Event</Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <div key={event.id} className="card space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-medium">{event.title}</h3>
                    <Badge variant={getEventTypeBadgeVariant(event.eventType)}>
                      {getEventTypeLabel(event.eventType)}
                    </Badge>
                  </div>
                  {event.description && (
                    <p style={{ color: "var(--color-foreground-secondary)" }}>{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    <div>
                      <strong>Start:</strong> {formatDateTime(event.startTime)}
                    </div>
                    <div>
                      <strong>End:</strong> {formatDateTime(event.endTime)}
                    </div>
                    {event.location && (
                      <div>
                        <strong>Location:</strong> {event.location}
                      </div>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    Created by {event.creator.name}
                  </div>
                </div>
                {canCreate && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}
          <Input
            label="Title"
            name="title"
            required
            placeholder="Event title"
          />
          <Textarea
            label="Description"
            name="description"
            placeholder="Event description (optional)"
            rows={3}
          />
          <Select
            label="Event Type"
            name="eventType"
            options={eventTypeOptions}
            required
          />
           <Input
             label="Start Time"
             name="startTime"
             type="datetime-local"
             required
             defaultValue={prefillDate ? `${prefillDate}T09:00` : undefined}
           />
           <Input
             label="End Time"
             name="endTime"
             type="datetime-local"
             required
             defaultValue={prefillDate ? `${prefillDate}T10:00` : undefined}
           />
          <Select
            label="Timezone"
            name="timezone"
            options={[
              { value: "America/Los_Angeles", label: "PST (Pacific)" },
              { value: "Asia/Seoul", label: "KST (Korea)" },
              { value: "UTC", label: "UTC" },
            ]}
            required
          />
          <Input
            label="Location"
            name="location"
            placeholder="Location or meeting link (optional)"
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Event
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
