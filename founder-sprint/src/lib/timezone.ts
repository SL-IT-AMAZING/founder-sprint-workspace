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
