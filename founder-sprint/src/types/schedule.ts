/**
 * Types for the unified /schedule calendar view.
 *
 * ScheduleItem is a normalized union of Events, Office Hours, and Sessions.
 * All times are ISO 8601 UTC strings (not Date objects) for safe server→client serialization.
 */

export type ScheduleItemKind = "event" | "officeHour" | "session";
export type VisibleScheduleFilter = "in_person" | "virtual" | "general_session" | "office_hour";

export interface ScheduleItem {
  /** Unique ID from the source model */
  id: string;

  /** Discriminator: which model this came from */
  kind: ScheduleItemKind;

  /** Display title */
  title: string;

  /** ISO 8601 UTC string. For all-day items, this is 00:00 UTC of the session date. */
  startTime: string;

  /** ISO 8601 UTC string. For all-day items, this is 23:59:59 UTC of the session date. */
  endTime: string;

  /** IANA timezone string (e.g. "America/Los_Angeles") */
  timezone: string;

  /** True for date-only sessions (no startTime/endTime in the Session model) */
  isAllDay: boolean;

  // --- Kind-specific optional fields ---

  /** Office Hours only: slot status */
  status?: "available" | "requested" | "confirmed" | "completed" | "cancelled";

  /** Events only: event sub-type */
  eventType?: "one_off" | "office_hour" | "in_person" | "virtual" | "general_session";

  /** Office Hours only: mentor/host name */
  hostName?: string;

  /** Office Hours only: company name */
  companyName?: string;

  /** Google Meet link (OH confirmed slots, or Events with meet) */
  googleMeetLink?: string;

  /** Events only: location string */
  location?: string;

  // --- Navigation ---

  /** Link to the management page for this item type */
  deepLink: string;
}

/**
 * Color mapping for calendar indicators.
 */
export const SCHEDULE_COLORS: Record<ScheduleItemKind, string> = {
  event: "#3B82F6",       // Blue
  officeHour: "#22C55E",  // Green
  session: "#A855F7",     // Purple
};

/**
 * Display labels for filter buttons.
 */
export const SCHEDULE_LABELS: Record<ScheduleItemKind, string> = {
  event: "Events",
  officeHour: "Office Hours",
  session: "Sessions",
};

export const VISIBLE_SCHEDULE_FILTERS: VisibleScheduleFilter[] = [
  "in_person",
  "virtual",
  "general_session",
  "office_hour",
];

export const VISIBLE_SCHEDULE_LABELS: Record<VisibleScheduleFilter, string> = {
  in_person: "In-person",
  virtual: "Virtual",
  general_session: "General Session",
  office_hour: "Office Hour",
};

export const VISIBLE_SCHEDULE_COLORS: Record<VisibleScheduleFilter, string> = {
  in_person: "#F59E0B",
  virtual: "#10B981",
  general_session: "#8B5CF6",
  office_hour: "#EF4444",
};

export function matchesVisibleScheduleFilter(
  item: ScheduleItem,
  filter: VisibleScheduleFilter | null
): boolean {
  if (!filter) return true;

  if (filter === "office_hour") {
    return item.kind === "officeHour" || item.eventType === "office_hour";
  }

  if (filter === "general_session") {
    return item.kind === "session" || item.eventType === "general_session";
  }

  return item.eventType === filter;
}

export function getVisibleScheduleFilterForItem(
  item: ScheduleItem
): VisibleScheduleFilter | null {
  if (item.kind === "officeHour" || item.eventType === "office_hour") {
    return "office_hour";
  }

  if (item.kind === "session" || item.eventType === "general_session") {
    return "general_session";
  }

  if (item.eventType === "in_person" || item.eventType === "virtual") {
    return item.eventType;
  }

  return null;
}
