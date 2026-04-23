import { formatInTimeZone } from "date-fns-tz";

/**
 * Shared timezone utilities.
 * Single source of truth for timezone abbreviation → IANA mapping.
 *
 * All DB columns store IANA strings (e.g. "America/Los_Angeles"), NOT abbreviations.
 * The UI may display abbreviations; convert to IANA before storing.
 */

const TIMEZONE_MAP: Record<string, string> = {
  UTC: "UTC",
  KST: "Asia/Seoul",
  PST: "America/Los_Angeles",
  EST: "America/New_York",
};

/**
 * Convert a timezone abbreviation (PST, KST, etc.) to an IANA timezone string.
 * If the input is already IANA (e.g. "America/Los_Angeles"), returns it as-is.
 */
export function toIanaTimezone(tz: string): string {
  return TIMEZONE_MAP[tz.toUpperCase()] || tz;
}

/**
 * All supported timezone options for UI select dropdowns.
 */
export const TIMEZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "PST (Pacific)" },
  { value: "Asia/Seoul", label: "KST (Korea)" },
  { value: "UTC", label: "UTC" },
  { value: "America/New_York", label: "EST (Eastern)" },
] as const;

function toValidDate(value: Date | string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function displayInUserTimezone(
  date: Date | string | null | undefined,
  userTimezone: string | null | undefined,
  fallbackTimezone: string = "UTC",
  formatString: string = "MMM d, yyyy h:mm a zzz"
): string {
  const parsedDate = toValidDate(date);
  if (!parsedDate) return "Time TBD";
  const targetTimezone = toIanaTimezone(userTimezone || fallbackTimezone || "UTC");
  try {
    return formatInTimeZone(parsedDate, targetTimezone, formatString);
  } catch {
    return formatInTimeZone(parsedDate, "UTC", formatString);
  }
}

export function displayRangeInUserTimezone(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined,
  userTimezone: string | null | undefined,
  fallbackTimezone: string = "UTC"
): string {
  const parsedStart = toValidDate(start);
  const parsedEnd = toValidDate(end);
  if (!parsedStart || !parsedEnd) return "Time TBD";
  const targetTimezone = toIanaTimezone(userTimezone || fallbackTimezone || "UTC");
  try {
    return `${formatInTimeZone(parsedStart, targetTimezone, "MMM d, yyyy h:mm a")} - ${formatInTimeZone(parsedEnd, targetTimezone, "h:mm a zzz")}`;
  } catch {
    return `${formatInTimeZone(parsedStart, "UTC", "MMM d, yyyy h:mm a")} - ${formatInTimeZone(parsedEnd, "UTC", "h:mm a zzz")}`;
  }
}
