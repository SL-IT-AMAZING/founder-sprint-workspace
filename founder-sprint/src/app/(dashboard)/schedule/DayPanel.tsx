"use client";

import { useState, useTransition, type FormEvent } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { CompanySelect } from "@/components/ui/CompanySelect";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { createEvent } from "@/actions/event";
import { createOfficeHourSlot, scheduleGroupOfficeHour, scheduleIndividualOfficeHour } from "@/actions/office-hour";
import { createSession } from "@/actions/session";
import type { ScheduleItem } from "@/types/schedule";
import type { CompanyOption, FounderOption } from "@/types/invite";
import { SCHEDULE_COLORS, SCHEDULE_LABELS } from "@/types/schedule";

interface DayPanelProps {
  items: ScheduleItem[];
  selectedDay: Date | null;
  isAdmin: boolean;
  companies: CompanyOption[];
  founders: FounderOption[];
  totalBatchMembers: number;
}

function formatItemTime(item: ScheduleItem): string {
  if (item.isAllDay) return "All day";
  const start = format(parseISO(item.startTime), "h:mm a");
  const end = format(parseISO(item.endTime), "h:mm a");
  return `${start} - ${end}`;
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

type CreateType = "event" | "officeHour" | "session";

const eventTypeOptions = [
  { value: "one_off", label: "One-off Event" },
  { value: "office_hour", label: "Office Hour" },
  { value: "in_person", label: "In-person Event" },
];

const timezoneOptions = [
  { value: "America/Los_Angeles", label: "PST (Pacific)" },
  { value: "Asia/Seoul", label: "KST (Korea)" },
  { value: "UTC", label: "UTC" },
];

export function DayPanel({ items, selectedDay, isAdmin, companies, founders, totalBatchMembers }: DayPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [createType, setCreateType] = useState<CreateType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [ohMode, setOhMode] = useState<"company" | "individual">("company");
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [selectedFounderId, setSelectedFounderId] = useState<string>("");

  const dateStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : "";
  const defaultStartDateTime = dateStr ? `${dateStr}T09:00` : undefined;
  const defaultEndDateTime = dateStr ? `${dateStr}T10:00` : undefined;
  const defaultSessionDate = dateStr || undefined;

  const createTitle =
    createType === "event"
      ? "Create Event"
      : createType === "officeHour"
      ? "Create Office Hour"
      : createType === "session"
      ? "Create Session"
      : "Create";

  const createButtonLabel =
    createType === "event"
      ? "Create Event"
      : createType === "officeHour"
      ? "Create Office Hour"
      : "Create Session";

  const handleCreate = (path: string) => {
    const nextType: CreateType | null =
      path === "/events" ? "event" : path === "/office-hours" ? "officeHour" : path === "/sessions" ? "session" : null;

    setCreateType(nextType);
    setError(null);
    setCreateOpen(false);
  };

  const handleCloseModal = () => {
    setCreateType(null);
    setError(null);
    setOhMode("company");
    setSelectedGroupId("");
    setSelectedFounderId("");
  };

  const handleCreateSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!createType) return;

    setError(null);
    const formData = new FormData(e.currentTarget);

    if (createType === "event") {
      const startTime = formData.get("startTime") as string;
      const endTime = formData.get("endTime") as string;
      if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
        setError("End time must be after start time");
        return;
      }
    }

    if (createType === "officeHour") {
      if (ohMode === "individual" && !selectedFounderId) {
        setError("Please select a founder");
        return;
      }
      if (ohMode === "company" && !selectedGroupId) {
        setError("Please select a company");
        return;
      }
      const startTime = formData.get("startTime") as string;
      const endTime = formData.get("endTime") as string;
      if (startTime && endTime && new Date(endTime) <= new Date(startTime)) {
        setError("End time must be after start time");
        return;
      }
    }

    if (createType === "session") {
      const sessionDate = (formData.get("sessionDate") as string) || dateStr;
      const startTime = formData.get("startTime") as string;
      const endTime = formData.get("endTime") as string;

      if ((startTime && !endTime) || (!startTime && endTime)) {
        setError("Start and end time must both be provided");
        return;
      }

      if (startTime && endTime && new Date(`${sessionDate}T${endTime}`) <= new Date(`${sessionDate}T${startTime}`)) {
        setError("End time must be after start time");
        return;
      }
    }

    startTransition(() => {
      void (async () => {
        let result;
        if (createType === "event") {
          result = await createEvent(formData);
        } else if (createType === "officeHour") {
          if (ohMode === "individual") {
            formData.set("founderId", selectedFounderId);
            result = await scheduleIndividualOfficeHour(formData);
          } else {
            formData.set("groupId", selectedGroupId);
            result = await scheduleGroupOfficeHour(formData);
          }
        } else {
          result = await createSession(formData);
        }

        if (result.success) {
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
                      backgroundColor: SCHEDULE_COLORS[item.kind],
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
                      {formatItemTime(item)}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span
                        style={{
                          fontSize: 11,
                          color: "var(--color-foreground-secondary)",
                        }}
                      >
                        {SCHEDULE_LABELS[item.kind]}
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
            ))}
          </div>
        )}
      </div>

      {isAdmin && selectedDay && (
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
            + Create
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
                { label: "Event", path: "/events", color: SCHEDULE_COLORS.event },
                { label: "Office Hour", path: "/office-hours", color: SCHEDULE_COLORS.officeHour },
                { label: "Session", path: "/sessions", color: SCHEDULE_COLORS.session },
              ].map((opt) => (
                <button
                  key={opt.path}
                  onClick={() => handleCreate(opt.path)}
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

      <Modal open={createType !== null} onClose={handleCloseModal} title={createTitle}>
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

          {createType === "event" && (
            <>
              <Input label="Title" name="title" required placeholder="Event title" />
              <Textarea
                label="Description"
                name="description"
                placeholder="Event description (optional)"
                rows={3}
              />
              <Select label="Event Type" name="eventType" options={eventTypeOptions} required />
              <Input
                label="Start Time"
                name="startTime"
                type="datetime-local"
                required
                defaultValue={defaultStartDateTime}
              />
              <Input
                label="End Time"
                name="endTime"
                type="datetime-local"
                required
                defaultValue={defaultEndDateTime}
              />
              <Select label="Timezone" name="timezone" options={timezoneOptions} required />
              <Input label="Location" name="location" placeholder="Location or meeting link (optional)" />
              <CompanySelect companies={companies} totalBatchMembers={totalBatchMembers} />
            </>
          )}

          {createType === "officeHour" && (
            <>
              {/* Mode toggle */}
              <div style={{ display: "flex", gap: 0, borderRadius: 6, overflow: "hidden", border: "1px solid #e0e0e0" }}>
                <button
                  type="button"
                  onClick={() => { setOhMode("company"); setSelectedFounderId(""); }}
                  style={{
                    flex: 1, padding: "8px 12px", fontSize: 13, fontWeight: 500,
                    fontFamily: '"BDO Grotesk", sans-serif', border: "none", cursor: "pointer",
                    backgroundColor: ohMode === "company" ? "#1A1A1A" : "transparent",
                    color: ohMode === "company" ? "#FFFFFF" : "#666666",
                    transition: "background-color 0.15s, color 0.15s",
                  }}
                >
                  Company
                </button>
                <button
                  type="button"
                  onClick={() => { setOhMode("individual"); setSelectedGroupId(""); }}
                  style={{
                    flex: 1, padding: "8px 12px", fontSize: 13, fontWeight: 500,
                    fontFamily: '"BDO Grotesk", sans-serif', border: "none",
                    borderLeft: "1px solid #e0e0e0", cursor: "pointer",
                    backgroundColor: ohMode === "individual" ? "#1A1A1A" : "transparent",
                    color: ohMode === "individual" ? "#FFFFFF" : "#666666",
                    transition: "background-color 0.15s, color 0.15s",
                  }}
                >
                  Individual Founder
                </button>
              </div>

              {/* Company or Founder dropdown */}
              {ohMode === "company" ? (
                <SearchableSelect
                  label="Company"
                  options={companies.map((c) => ({
                    id: c.id,
                    label: c.name,
                    secondary: `${c.memberCount} members`,
                  }))}
                  value={selectedGroupId}
                  onChange={setSelectedGroupId}
                  placeholder="Search for a company..."
                  required
                  emptyMessage="No companies found"
                />
              ) : (
                <SearchableSelect
                  label="Founder"
                  options={founders.map((f) => ({
                    id: f.id,
                    label: f.name || f.email,
                    secondary: f.groupName ? `Company: ${f.groupName}` : f.email,
                    imageUrl: f.profileImage,
                  }))}
                  value={selectedFounderId}
                  onChange={setSelectedFounderId}
                  placeholder="Search for a founder..."
                  required
                  emptyMessage="No founders found"
                />
              )}

              <Input label="Start Time" name="startTime" type="datetime-local" required defaultValue={defaultStartDateTime} />
              <Input label="End Time" name="endTime" type="datetime-local" required defaultValue={defaultEndDateTime} />
              <Select label="Timezone" name="timezone" options={timezoneOptions} required />
            </>
          )}

          {createType === "session" && (
            <>
              <Input label="Title" name="title" required placeholder="Session title" />
              <Textarea
                label="Description"
                name="description"
                placeholder="Session description (optional)"
                rows={3}
              />
              <Input
                label="Session Date"
                name="sessionDate"
                type="date"
                required
                defaultValue={defaultSessionDate}
              />
              <Input label="Start Time" name="startTime" type="time" defaultValue="09:00" />
              <Input label="End Time" name="endTime" type="time" defaultValue="10:00" />
              <Select label="Timezone" name="timezone" options={timezoneOptions} required />
              <CompanySelect companies={companies} totalBatchMembers={totalBatchMembers} />
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
    </div>
  );
}
