import { google, calendar_v3 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

/**
 * Check if Google Calendar credentials are configured
 */
export function isCalendarConfigured(): boolean {
  return !!(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
    process.env.GOOGLE_PRIVATE_KEY &&
    process.env.GOOGLE_CALENDAR_ID
  );
}

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const impersonateUser = process.env.GOOGLE_CALENDAR_IMPERSONATE;

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    return null;
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    clientOptions: impersonateUser ? { subject: impersonateUser } : undefined,
    scopes: SCOPES,
  });
}

async function getCalendarClient(): Promise<calendar_v3.Calendar | null> {
  const auth = getAuth();
  if (!auth) return null;
  return google.calendar({ version: "v3", auth });
}

interface CreateCalendarEventParams {
  summary: string;
  description?: string;
  startTime?: Date;
  endTime?: Date;
  attendeeEmails: string[];
  timezone?: string;
  location?: string;
  isAllDay?: boolean;
  allDayDate?: string;
}

interface CalendarEventResult {
  eventId: string;
  htmlLink: string;
  meetLink?: string;
}

/**
 * Create a calendar event and send invites to attendees.
 * Returns null if credentials are not configured (graceful degradation).
 */
export async function createCalendarEvent({
  summary,
  description,
  startTime,
  endTime,
  attendeeEmails,
  timezone = "UTC",
  location,
  isAllDay = false,
  allDayDate,
}: CreateCalendarEventParams): Promise<CalendarEventResult | null> {
  if (!isCalendarConfigured()) {
    console.warn(
      "[Google Calendar] Not configured. Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_CALENDAR_ID"
    );
    return null;
  }

  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendar || !calendarId) {
    console.warn("[Google Calendar] Failed to initialize client");
    return null;
  }

  try {
    if (isAllDay && !allDayDate) {
      console.error("[Google Calendar] allDayDate is required for all-day events");
      return null;
    }

    if (!isAllDay && (!startTime || !endTime)) {
      console.error("[Google Calendar] startTime and endTime are required for timed events");
      return null;
    }

    let endAllDayDate: string | undefined;
    if (isAllDay && allDayDate) {
      const [y, m, d] = allDayDate.split("-").map(Number);
      const nextDay = new Date(Date.UTC(y, m - 1, d + 1));
      endAllDayDate = nextDay.toISOString().slice(0, 10);
    }

    const event: calendar_v3.Schema$Event = {
      summary,
      description: description || undefined,
      start: isAllDay
        ? { date: allDayDate }
        : {
            dateTime: startTime!.toISOString(),
            timeZone: timezone,
          },
      end: isAllDay
        ? { date: endAllDayDate }
        : {
            dateTime: endTime!.toISOString(),
            timeZone: timezone,
          },
      attendees: attendeeEmails.map((email) => ({ email })),
      location: location || undefined,
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      sendUpdates: "all",
    });

    const createdEvent = response.data;

    if (!createdEvent.id) {
      console.error("[Google Calendar] Event created but no ID returned");
      return null;
    }

    return {
      eventId: createdEvent.id,
      htmlLink: createdEvent.htmlLink || "",
    };
  } catch (error) {
    console.error("[Google Calendar] Failed to create event:", error);
    return null;
  }
}

/**
 * Create a calendar event with Google Meet link.
 * Returns null if credentials are not configured (graceful degradation).
 */
export async function createCalendarEventWithMeet({
  summary,
  description,
  startTime,
  endTime,
  attendeeEmails,
  timezone = "UTC",
}: CreateCalendarEventParams): Promise<CalendarEventResult | null> {
  if (!isCalendarConfigured()) {
    console.warn(
      "[Google Calendar] Not configured - cannot create event with Meet"
    );
    return null;
  }

  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendar || !calendarId) {
    console.warn("[Google Calendar] Failed to initialize client");
    return null;
  }

  if (!startTime || !endTime) {
    console.error("[Google Calendar] startTime and endTime are required for Meet events");
    return null;
  }

  try {
    const event: calendar_v3.Schema$Event = {
      summary,
      description: description || undefined,
      start: {
        dateTime: startTime.toISOString(),
        timeZone: timezone,
      },
      end: {
        dateTime: endTime.toISOString(),
        timeZone: timezone,
      },
      attendees: attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          conferenceSolutionKey: {
            type: "hangoutsMeet",
          },
        },
      },
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
      conferenceDataVersion: 1,
      sendUpdates: "all",
    });

    const createdEvent = response.data;

    if (!createdEvent.id) {
      console.error("[Google Calendar] Event created but no ID returned");
      return null;
    }

    const meetLink =
      createdEvent.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === "video"
      )?.uri || undefined;

    return {
      eventId: createdEvent.id,
      meetLink,
      htmlLink: createdEvent.htmlLink || "",
    };
  } catch (error) {
    console.error("[Google Calendar] Failed to create event with Meet:", error);
    return null;
  }
}

/**
 * Delete a calendar event by ID.
 * Returns false if credentials are not configured or deletion fails.
 */
export async function deleteCalendarEvent(eventId: string): Promise<boolean> {
  if (!isCalendarConfigured()) {
    console.warn("[Google Calendar] Not configured - cannot delete event");
    return false;
  }

  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendar || !calendarId) {
    console.warn("[Google Calendar] Failed to initialize client");
    return false;
  }

  try {
    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: "all",
    });
    return true;
  } catch (error) {
    console.error("[Google Calendar] Failed to delete event:", error);
    return false;
  }
}

/**
 * Update an existing calendar event.
 * Returns null if credentials are not configured or update fails.
 */
export async function updateCalendarEvent(
  eventId: string,
  params: Partial<CreateCalendarEventParams>
): Promise<CalendarEventResult | null> {
  if (!isCalendarConfigured()) {
    console.warn("[Google Calendar] Not configured - cannot update event");
    return null;
  }

  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendar || !calendarId) {
    console.warn("[Google Calendar] Failed to initialize client");
    return null;
  }

  try {
    const updateData: calendar_v3.Schema$Event = {};

    if (params.summary) updateData.summary = params.summary;
    if (params.description) updateData.description = params.description;
    if (params.location) updateData.location = params.location;
    if (params.startTime) {
      updateData.start = {
        dateTime: params.startTime.toISOString(),
        timeZone: params.timezone || "UTC",
      };
    }
    if (params.endTime) {
      updateData.end = {
        dateTime: params.endTime.toISOString(),
        timeZone: params.timezone || "UTC",
      };
    }
    if (params.attendeeEmails) {
      updateData.attendees = params.attendeeEmails.map((email) => ({ email }));
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: updateData,
      sendUpdates: "all",
    });

    const updatedEvent = response.data;

    return {
      eventId: updatedEvent.id || eventId,
      htmlLink: updatedEvent.htmlLink || "",
      meetLink:
        updatedEvent.conferenceData?.entryPoints?.find(
          (ep) => ep.entryPointType === "video"
        )?.uri || undefined,
    };
  } catch (error) {
    console.error("[Google Calendar] Failed to update event:", error);
    return null;
  }
}
