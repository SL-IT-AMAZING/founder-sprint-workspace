"use client";

import { useRef, useState, useTransition, type FormEvent } from "react";
import { format } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CompanySelect } from "@/components/ui/CompanySelect";
import { OfficeHourSchedulerModal } from "@/components/office-hours/OfficeHourSchedulerModal";
import { createEvent } from "@/actions/event";
import type { ScheduleItem } from "@/types/schedule";
import type { CompanyOption, FounderOption } from "@/types/invite";
import {
  SCHEDULE_COLORS,
  SCHEDULE_LABELS,
  VISIBLE_SCHEDULE_COLORS,
  VISIBLE_SCHEDULE_LABELS,
  getVisibleScheduleFilterForItem,
} from "@/types/schedule";
import { TIMEZONE_OPTIONS, displayRangeInUserTimezone } from "@/lib/timezone";
import { addMinutesToDateTimeLocalValue, getDateTimeRangeDurationMinutes } from "@/lib/schedule-form";

interface DayPanelProps {
  items: ScheduleItem[];
  selectedDay: Date | null;
  isAdmin: boolean;
  userTimezone: string | null;
  companies: CompanyOption[];
  founders: FounderOption[];
  totalBatchMembers: number;
  batchOptions: Array<{ id: string; name: string }>;
  groupOptions: Array<{ id: string; name: string }>;
  currentBatchId: string;
}

function formatItemTime(item: ScheduleItem, userTimezone: string | null): string {
  if (item.isAllDay) return "All day";
  return displayRangeInUserTimezone(item.startTime, item.endTime, userTimezone, item.timezone);
}

function getItemAccent(item: ScheduleItem) {
  const visibleKind = getVisibleScheduleFilterForItem(item);
  if (visibleKind) {
    return {
      color: VISIBLE_SCHEDULE_COLORS[visibleKind],
      label: VISIBLE_SCHEDULE_LABELS[visibleKind],
    };
  }

  return {
    color: SCHEDULE_COLORS[item.kind],
    label: SCHEDULE_LABELS[item.kind],
  };
}

function getStatusVariant(
  status?: string
): "default" | "success" | "warning" | "error" {
  switch (status) {
    case "available":
      return "success";
    case "requested":
      return "warning";
    case "confirmed":
      return "default";
    case "completed":
      return "default";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

type EventCreateKind = "in_person" | "virtual" | "general_session";

const timezoneOptions = TIMEZONE_OPTIONS.map((option) => ({ value: option.value, label: option.label }));

export function DayPanel({ items, selectedDay, isAdmin, userTimezone, companies, founders, totalBatchMembers, batchOptions, groupOptions, currentBatchId }: DayPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEventType, setSelectedEventType] = useState<EventCreateKind | null>(null);
  const [officeHourModalOpen, setOfficeHourModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const createStartTimeRef = useRef<HTMLInputElement>(null);
  const createEndTimeRef = useRef<HTMLInputElement>(null);
  const createDurationMinutesRef = useRef(60);

  const dateStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : "";
  const defaultStartDateTime = dateStr ? `${dateStr}T09:00` : undefined;
  const defaultEndDateTime = defaultStartDateTime
    ? addMinutesToDateTimeLocalValue(defaultStartDateTime, 60)
    : undefined;

  const createTitle =
    selectedEventType === "in_person"
      ? "Create Event: In-person"
      : selectedEventType === "virtual"
        ? "Create Event: Virtual"
        : selectedEventType === "general_session"
          ? "Create General Session"
          : "Create";

  const createButtonLabel =
    selectedEventType === "general_session" ? "Create General Session" : "Create Event";

  const handleCreate = (eventType: EventCreateKind) => {
    setSelectedEventType(eventType);
    setError(null);
    createDurationMinutesRef.current = 60;
    setCreateOpen(false);
  };

  const handleCloseModal = () => {
    setSelectedEventType(null);
    setError(null);
    createDurationMinutesRef.current = 60;
  };

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

  const handleCreateSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEventType) return;

    setError(null);
    const formData = new FormData(e.currentTarget);

    const startTime = formData.get("startTime") as string;
    const endTime = formData.get("endTime") as string;
    if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
      setError("End time must be after start time");
      return;
    }

    startTransition(() => {
      void (async () => {
        formData.set("eventType", selectedEventType);
        const result = await createEvent(formData);

        if (result.success) {
          if ('warning' in result && result.warning) {
            setError(result.warning);
          }
          handleCloseModal();
          router.refresh();
          return;
        }

        setError(result.error || "Failed to create item");
      })();
    });
  };

  return (
    <div
      className="card"
      style={{
        padding: 16,
        minHeight: 200,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="font-medium mb-3"
        style={{ fontSize: 15, borderBottom: "1px solid #E8E4DE", paddingBottom: 12 }}
      >
        {selectedDay ? format(selectedDay, "EEEE, MMMM d") : "Day Details"}
      </div>

      <div style={{ flex: 1 }}>
        {!selectedDay && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "32px 16px",
              color: "var(--color-foreground-muted)",
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              style={{ marginBottom: 8, opacity: 0.5 }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span style={{ fontSize: 14 }}>Select a day to view details</span>
          </div>
        )}

        {selectedDay && items.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "32px 16px",
              color: "var(--color-foreground-muted)",
              fontSize: 14,
            }}
          >
            Nothing scheduled
          </div>
        )}

        {items.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((item) => (
              (() => {
                const accent = getItemAccent(item);
                return (
              <Link
                key={item.id}
                href={item.deepLink}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: 12,
                    borderRadius: 6,
                    transition: "background-color 0.15s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.02)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: accent.color,
                        flexShrink: 0,
                        marginTop: 5,
                      }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 14,
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--color-foreground-muted)",
                        marginBottom: 4,
                      }}
                    >
                          {formatItemTime(item, userTimezone)}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-foreground-secondary)",
                        }}
                      >
                        {accent.label}
                      </span>
                      {item.status && (
                        <Badge variant={getStatusVariant(item.status)}>
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Badge>
                      )}
                      {item.hostName && (
                        <span
                          style={{
                            fontSize: 11,
                            color: "var(--color-foreground-secondary)",
                          }}
                        >
                          {item.hostName}
                        </span>
                      )}
                    </div>
                    {item.location && (
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--color-foreground-muted)",
                          marginTop: 2,
                        }}
                      >
                        {item.location}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--color-foreground-muted)",
                      flexShrink: 0,
                      alignSelf: "center",
                    }}
                  >
                    View &rarr;
                  </span>
                </div>
              </Link>
                );
              })()
            ))}
          </div>
        )}
      </div>

      {isAdmin && (
        <div style={{ marginTop: 12, borderTop: "1px solid #E8E4DE", paddingTop: 12, position: "relative" }}>
          <button
            onClick={() => setCreateOpen(!createOpen)}
            className="btn btn-secondary"
            style={{
              width: "100%",
              fontSize: 13,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            Create Event
          </button>
          {createOpen && (
            <div
              style={{
                position: "absolute",
                bottom: 42,
                left: 0,
                right: 0,
                backgroundColor: "#ffffff",
                border: "1px solid #E8E4DE",
                borderRadius: 6,
                boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                overflow: "hidden",
                zIndex: 10,
              }}
            >
              {[
                { label: "Event: In-person", type: "event" as const, eventType: "in_person" as const, color: "#F59E0B" },
                { label: "Event: Virtual", type: "event" as const, eventType: "virtual" as const, color: "#10B981" },
                { label: "General Session", type: "event" as const, eventType: "general_session" as const, color: "#8B5CF6" },
                { label: "Office Hour", type: "officeHour" as const, color: SCHEDULE_COLORS.officeHour },
              ].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => {
                    if (opt.type === "officeHour") {
                      setCreateOpen(false);
                      setOfficeHourModalOpen(true);
                      return;
                    }

                    handleCreate(opt.eventType!);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    width: "100%",
                    padding: "10px 12px",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    color: "var(--color-foreground)",
                    textAlign: "left",
                    transition: "background-color 0.15s",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: opt.color,
                    }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <Modal open={selectedEventType !== null} onClose={handleCloseModal} title={createTitle}>
        <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {error && (
            <div
              style={{
                border: "1px solid #e0e0e0",
                backgroundColor: "#f7f7f7",
                color: "#1A1A1A",
                borderRadius: 6,
                padding: "10px 12px",
                fontSize: 13,
                fontFamily: "var(--font-sans)",
              }}
            >
              {error}
            </div>
          )}

          {selectedEventType !== null && (
            <>
              <Input label="Title" name="title" required placeholder="Event title" />
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
              <Select label="Timezone" name="timezone" options={timezoneOptions} required />
              <Input label="Location" name="location" placeholder="Location or meeting link (optional)" />
              <CompanySelect companies={companies} totalBatchMembers={totalBatchMembers} label="Target Companies" inputName="companyIds" />
            </>
          )}

          <div
            style={{
              marginTop: 4,
              paddingTop: 12,
              borderTop: "1px solid #e0e0e0",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              {createButtonLabel}
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
        defaultEndDateTime={addMinutesToDateTimeLocalValue(defaultStartDateTime || "", 30) || defaultEndDateTime}
      />
    </div>
  );
}
