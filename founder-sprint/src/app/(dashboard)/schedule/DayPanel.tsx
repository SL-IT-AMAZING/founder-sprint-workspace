"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import type { ScheduleItem } from "@/types/schedule";
import { SCHEDULE_COLORS, SCHEDULE_LABELS } from "@/types/schedule";

interface DayPanelProps {
  items: ScheduleItem[];
  selectedDay: Date | null;
  isAdmin: boolean;
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

export function DayPanel({ items, selectedDay, isAdmin }: DayPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const router = useRouter();

  const dateStr = selectedDay ? format(selectedDay, "yyyy-MM-dd") : "";

  const handleCreate = (path: string) => {
    router.push(`${path}?date=${dateStr}`);
    setCreateOpen(false);
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
    </div>
  );
}
