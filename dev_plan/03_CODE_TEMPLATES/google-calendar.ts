import { google, calendar_v3 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    throw new Error("Google Calendar credentials not configured");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

export async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  const auth = getAuth();
  return google.calendar({ version: "v3", auth });
}

interface CreateEventParams {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
  timezone?: string;
}

export async function createCalendarEventWithMeet({
  summary,
  description,
  startTime,
  endTime,
  attendeeEmails,
  timezone = "UTC",
}: CreateEventParams): Promise<{
  eventId: string;
  meetLink: string;
  htmlLink: string;
}> {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID not configured");
  }

  const event: calendar_v3.Schema$Event = {
    summary,
    description,
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

  if (!createdEvent.id || !createdEvent.conferenceData?.entryPoints) {
    throw new Error("Failed to create event with Google Meet");
  }

  const meetLink =
    createdEvent.conferenceData.entryPoints.find(
      (ep) => ep.entryPointType === "video"
    )?.uri || "";

  return {
    eventId: createdEvent.id,
    meetLink,
    htmlLink: createdEvent.htmlLink || "",
  };
}
