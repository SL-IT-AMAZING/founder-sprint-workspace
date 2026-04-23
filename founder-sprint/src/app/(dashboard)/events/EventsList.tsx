"use client";

import { useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { isSameDay } from "date-fns";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Calendar } from "@/components/ui/Calendar";
import { OfficeHourSchedulerModal } from "@/components/office-hours/OfficeHourSchedulerModal";
import { CompanySelect, type CompanyOption as TargetCompanyOption } from "@/components/ui/CompanySelect";
import { getCompaniesForBatch } from "@/actions/company";
import { formatDate, getDisplayName } from "@/lib/utils";
import { isAdmin } from "@/lib/permissions-client";
import { createEvent, deleteEvent } from "@/actions/event";
import { useToast } from "@/hooks/useToast";
import { BatchSelect, type BatchOption } from "@/components/ui/BatchSelect";
import type { UserWithBatch, EventType } from "@/types";
import type { CompanyOption, FounderOption } from "@/types/invite";
import type { ScheduleItem, VisibleScheduleFilter } from "@/types/schedule";
import {
  VISIBLE_SCHEDULE_COLORS,
  VISIBLE_SCHEDULE_FILTERS,
  VISIBLE_SCHEDULE_LABELS,
} from "@/types/schedule";
import { TIMEZONE_OPTIONS, displayInUserTimezone, displayRangeInUserTimezone } from "@/lib/timezone";
import { addMinutesToDateTimeLocalValue, getDateTimeRangeDurationMinutes } from "@/lib/schedule-form";

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
  googleMeetLink: string | null;
  creator: {
    id: string;
    name: string | null;
    email: string;
    profileImage: string | null;
  };
  targetCompanyIds: string[];
  batches?: { batch: { id: string; name: string } }[];
}

interface EventsListProps {
  user: UserWithBatch;
  events: Event[];
  batchOptions: BatchOption[];
  companies: CompanyOption[];
  founders: FounderOption[];
  currentBatchId: string;
}

const eventTypeOptions = [
  { value: "in_person", label: "Event: In-person" },
  { value: "virtual", label: "Event: Virtual" },
  { value: "general_session", label: "General Session" },
  { value: "office_hour", label: "Office Hour" },
];

function getEventTypeBadgeVariant(type: EventType): "default" | "success" | "warning" {
  switch (type) {
    case "one_off":
    case "general_session":
      return "default";
    case "office_hour":
    case "virtual":
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
    case "general_session":
      return "General Session";
    case "office_hour":
      return "Office Hour";
    case "virtual":
      return "Virtual";
    case "in_person":
      return "In-person";
    default:
      return type;
  }
}

export function EventsList({
  user,
  events,
  batchOptions,
  companies,
  founders,
  currentBatchId,
}: EventsListProps) {
  const searchParams = useSearchParams();
  const prefillDate = searchParams.get("date");
  const canCreate = isAdmin(user.role);
  const [createModalOpen, setCreateModalOpen] = useState(Boolean(prefillDate && canCreate));
  const [officeHourModalOpen, setOfficeHourModalOpen] = useState(false);
  const [selectedCreateEventType, setSelectedCreateEventType] = useState<EventType | null>(null);
  const [selectedType, setSelectedType] = useState<VisibleScheduleFilter | "all">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [availableCompanies, setAvailableCompanies] = useState<TargetCompanyOption[]>(companies.map((company) => ({ id: company.id, name: company.name, memberCount: company.memberCount })));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const createStartTimeRef = useRef<HTMLInputElement>(null);
  const createEndTimeRef = useRef<HTMLInputElement>(null);
  const createDurationMinutesRef = useRef(60);
  const defaultStartDateTime = prefillDate ? `${prefillDate}T09:00` : undefined;
  const defaultEndDateTime = defaultStartDateTime
    ? addMinutesToDateTimeLocalValue(defaultStartDateTime, 60)
    : undefined;

  const handleCreateStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!createEndTimeRef.current || !e.target.value) {
      return;
    }

    const nextEndValue = addMinutesToDateTimeLocalValue(
      e.target.value,
      createDurationMinutesRef.current
    );

    if (nextEndValue) {
      createEndTimeRef.current.value = nextEndValue;
    }
  };

  const handleCreateEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (createStartTimeRef.current && e.target.value) {
      const nextDuration = getDateTimeRangeDurationMinutes(createStartTimeRef.current.value, e.target.value);
      if (nextDuration) {
        createDurationMinutesRef.current = nextDuration;
      }
    }
  };

  const filteredEvents = selectedType === "all"
    ? events
    : events.filter((event) => event.eventType === selectedType);

  const calendarItems: ScheduleItem[] = filteredEvents.map((event) => ({
    id: event.id,
    kind: event.eventType === "office_hour" ? "officeHour" : event.eventType === "general_session" ? "session" : "event",
    title: event.title,
    startTime: new Date(event.startTime).toISOString(),
    endTime: new Date(event.endTime).toISOString(),
    timezone: event.timezone,
    isAllDay: false,
    eventType: event.eventType,
    location: event.location || undefined,
    deepLink: "/events",
  }));

  const handleDayClick = (date: Date) => {
    setSelectedDate((prev) => (prev && isSameDay(prev, date) ? null : date));
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

    if (!selectedCreateEventType) {
      setError("Please choose what to create");
      setLoading(false);
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);
    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time");
      setLoading(false);
      return;
    }

    const result = await createEvent(formData);

    if (result.success) {
      setCreateModalOpen(false);
      setSelectedCreateEventType(null);
      createDurationMinutesRef.current = 60;
      form.reset();
      if (result.warning) toast.warning(result.warning);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

  const handleBatchSelection = async (selection: { mode: "all" | "specific"; batchIds: string[] }) => {
    setSelectedBatchIds(selection.batchIds);
    if (selection.mode === "specific" && selection.batchIds.length === 1) {
      const nextCompanies = await getCompaniesForBatch(selection.batchIds[0]);
      setAvailableCompanies(nextCompanies.map((company) => ({ id: company.id, name: company.name, memberCount: company._count.members })));
    } else {
      setAvailableCompanies([]);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    const result = await deleteEvent(eventId);
    if (!result.success) {
      toast.error(result.error);
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
          {VISIBLE_SCHEDULE_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedType(filter)}
              className={selectedType === filter ? "btn btn-primary" : "btn btn-secondary"}
              style={{
                fontSize: 14,
                height: 36,
                padding: "0 16px",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: VISIBLE_SCHEDULE_COLORS[filter],
                  flexShrink: 0,
                }}
              />
              {VISIBLE_SCHEDULE_LABELS[filter]}
            </button>
          ))}
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
            <Button onClick={() => { setCreateModalOpen(true); setSelectedCreateEventType(null); }} size="sm">
              Create Event
            </Button>
          )}
        </div>
      </div>

      {viewMode === "calendar" ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <Calendar
              items={calendarItems}
              onDayClick={handleDayClick}
              selectedDay={selectedDate}
              typeFilter={selectedType === "all" ? null : selectedType}
            />
          </div>
          <div className="space-y-3">
            <div className="card p-4 space-y-3">
              <h3 className="font-medium">Day Details</h3>
              {!selectedDate ? (
                <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                  Select a day to view details.
                </p>
              ) : selectedDateEvents.length === 0 ? (
                <>
                  <div className="text-sm font-medium">{formatDate(selectedDate)}</div>
                  <p className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    No events on this day.
                  </p>
                </>
              ) : (
                <>
                  <div className="text-sm font-medium">{formatDate(selectedDate)}</div>
                  {selectedDateEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border p-3 space-y-2" style={{ borderColor: "var(--color-card-border)", backgroundColor: "var(--color-background-secondary)" }}>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-sm">{event.title}</h4>
                        <Badge variant={getEventTypeBadgeVariant(event.eventType)}>
                          {getEventTypeLabel(event.eventType)}
                        </Badge>
                      </div>
                      <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                        {displayRangeInUserTimezone(event.startTime, event.endTime, user.timezone, event.timezone)}
                      </p>
                      {event.location && (
                        <p className="text-xs" style={{ color: "var(--color-foreground-muted)" }}>
                          {event.location}
                        </p>
                      )}
                      {event.googleMeetLink && (
                        <a href={event.googleMeetLink} target="_blank" rel="noreferrer" className="text-xs underline" style={{ color: "var(--color-primary)" }}>
                          Open meeting
                        </a>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      ) : filteredEvents.length === 0 ? (
        <EmptyState
          title="No events found"
          description={selectedType === "all" ? "No events scheduled yet" : `No ${getEventTypeLabel(selectedType as EventType).toLowerCase()} events scheduled`}
          action={
            canCreate ? (
              <Button onClick={() => { setCreateModalOpen(true); setSelectedCreateEventType(null); }}>Create Event</Button>
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
                  {event.batches && event.batches.length > 0 && (
                    <div className="flex gap-1 flex-wrap">
                      {event.batches.slice(0, 3).map((b) => (
                        <span
                          key={b.batch.id}
                          style={{
                            fontSize: 11,
                            backgroundColor: "#f0f0f0",
                            color: "#666666",
                            padding: "1px 6px",
                            borderRadius: 4,
                            fontFamily: '"BDO Grotesk", sans-serif',
                          }}
                        >
                          {b.batch.name}
                        </span>
                      ))}
                      {event.batches.length > 3 && (
                        <span style={{ fontSize: 11, color: "#999999", fontFamily: '"BDO Grotesk", sans-serif' }}>
                          +{event.batches.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                  {event.description && (
                    <p style={{ color: "var(--color-foreground-secondary)" }}>{event.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    <div>
                    <strong>Start:</strong> {displayInUserTimezone(event.startTime, user.timezone, event.timezone)}
                    </div>
                    <div>
                    <strong>End:</strong> {displayInUserTimezone(event.endTime, user.timezone, event.timezone)}
                    </div>
                    {event.location && (
                      <div>
                        <strong>Location:</strong> {event.location}
                      </div>
                    )}
                    {event.googleMeetLink && (
                      <div>
                        <strong>Meeting:</strong>{" "}
                        <a href={event.googleMeetLink} target="_blank" rel="noreferrer" style={{ color: "var(--color-primary)", textDecoration: "underline" }}>
                          Open link
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="text-sm" style={{ color: "var(--color-foreground-muted)" }}>
                    Created by {getDisplayName(event.creator)}
                  </div>
                </div>
                {canCreate && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteEvent(event.id)}
                    disabled={loading}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setSelectedCreateEventType(null);
          setError(null);
          createDurationMinutesRef.current = 60;
        }}
        title="Create Event"
      >
        <form onSubmit={handleCreateEvent} className="space-y-4">
          {error && (
            <div
              className="p-3 rounded text-sm"
              style={{ backgroundColor: "var(--color-error-light)", color: "var(--color-error)" }}
            >
              {error}
            </div>
          )}

          <BatchSelect batches={batchOptions} onSelectionChange={handleBatchSelection} />
          {!selectedCreateEventType ? (
            <div className="space-y-2">
              {eventTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    if (option.value === "office_hour") {
                      setCreateModalOpen(false);
                      setSelectedCreateEventType(null);
                      setError(null);
                      setOfficeHourModalOpen(true);
                      return;
                    }

                    setSelectedCreateEventType(option.value as EventType);
                    setError(null);
                    createDurationMinutesRef.current = 60;
                  }}
                  className="w-full rounded-md border px-3 py-3 text-left text-sm"
                  style={{ borderColor: "var(--color-border)", backgroundColor: "var(--color-background)" }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          ) : (
            <>
              <input type="hidden" name="eventType" value={selectedCreateEventType} />
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
              <Input
                label="Start Time"
                name="startTime"
                type="datetime-local"
                required
                ref={createStartTimeRef}
                onChange={handleCreateStartTimeChange}
                defaultValue={defaultStartDateTime}
              />
              <Input
                label="End Time"
                name="endTime"
                type="datetime-local"
                required
                ref={createEndTimeRef}
                onChange={handleCreateEndTimeChange}
                defaultValue={defaultEndDateTime}
              />
              <Select
                label="Timezone"
                name="timezone"
                options={TIMEZONE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
                defaultValue={user.timezone || "UTC"}
                required
              />
              <Input
                label="Location"
                name="location"
                placeholder="Location or meeting link (optional)"
              />
              <CompanySelect
                companies={availableCompanies}
                totalBatchMembers={availableCompanies.reduce((sum, company) => sum + company.memberCount, 0)}
                label="Target Companies"
                inputName="companyIds"
                allowSpecific={selectedBatchIds.length === 1}
                disabledMessage="Specific companies are available only when exactly one batch is selected."
              />
            </>
          )}
          <div className="flex justify-end gap-3 pt-2">
            {selectedCreateEventType ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedCreateEventType(null);
                  setError(null);
                }}
              >
                Back
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setCreateModalOpen(false);
                setSelectedCreateEventType(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={loading} disabled={!selectedCreateEventType}>
              Create Event
            </Button>
          </div>
        </form>
      </Modal>

      <OfficeHourSchedulerModal
        open={officeHourModalOpen}
        onClose={() => setOfficeHourModalOpen(false)}
        batchOptions={batchOptions}
        companies={companies}
        founders={founders}
        currentBatchId={currentBatchId}
        defaultStartDateTime={defaultStartDateTime}
        defaultEndDateTime={addMinutesToDateTimeLocalValue(defaultStartDateTime || "", 30) || undefined}
        successBehavior="redirect-office-hours"
      />
    </div>
  );
}
