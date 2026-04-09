import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { google } from "googleapis";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, min: 0 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function getCalendarClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    subject: process.env.GOOGLE_CALENDAR_IMPERSONATE || undefined,
  });
  return google.calendar({ version: "v3", auth });
}

(async () => {
  const now = Date.now();
  const batchName = `FS RETEST KST 0410 BATCH ${now}`;
  const companyName = `FS RETEST KST 0410 CO ${now}`;
  const eventTitle = `FS RETEST KST 0410 VIRTUAL EVENT ${now}`;
  const slitEmail = "slit.amazing@gmail.com";

  const admin = await prisma.user.findUnique({ where: { email: "test-admin@example.com" }, select: { id: true } });
  if (!admin) throw new Error("Missing test admin user");

  const slitUser = await prisma.user.upsert({
    where: { email: slitEmail },
    create: { email: slitEmail, name: "Slit Test User", status: "active", role: "founder" },
    update: { status: "active", name: "Slit Test User" },
    select: { id: true, email: true },
  });

  const batch = await prisma.batch.create({
    data: {
      name: batchName,
      description: "virtual event live proof batch",
      startDate: new Date("2026-04-01T00:00:00+09:00"),
      endDate: new Date("2026-05-01T00:00:00+09:00"),
      status: "active",
    },
    select: { id: true, name: true },
  });

  const company = await prisma.company.create({
    data: { name: companyName, slug: `fs-retest-kst-0410-${now}` },
    select: { id: true, name: true },
  });

  await prisma.companyBatch.create({ data: { companyId: company.id, batchId: batch.id } });
  await prisma.userBatch.createMany({
    data: [
      { userId: admin.id, batchId: batch.id, role: "admin", status: "active", joinedAt: new Date() },
      { userId: slitUser.id, batchId: batch.id, role: "founder", status: "active", joinedAt: new Date() },
    ],
  });
  await prisma.companyMember.create({ data: { companyId: company.id, userId: slitUser.id, isCurrent: true } });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: path.resolve("e2e/.auth/admin.json") });
  await context.addCookies([{ name: "selected_batch_id", value: batch.id, domain: "localhost", path: "/" }]);
  const page = await context.newPage();

  try {
    await page.goto("http://localhost:3000/events", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /create|add|new/i }).first().click();
    const modal = page.locator("dialog[open]").first();
    await modal.getByRole("button", { name: /Specific Batches/i }).click();
    await modal.getByPlaceholder("Search batches...").fill(batchName);
    await modal.getByLabel(new RegExp(batchName)).check();
    await modal.getByRole("button", { name: "Event: Virtual" }).click();
    await modal.getByLabel(/title/i).fill(eventTitle);
    await modal.getByLabel(/start time/i).fill("2026-04-10T04:00");
    await modal.getByLabel(/end time/i).fill("2026-04-10T04:30");
    await modal.getByLabel(/timezone/i).selectOption("Asia/Seoul");
    await modal.getByRole("button", { name: /Specific Companies/i }).click();
    await modal.getByPlaceholder("Search companies...").fill(companyName);
    await modal.getByLabel(new RegExp(companyName)).check();
    await modal.getByRole("button", { name: /^create event$/i }).click();
    await modal.waitFor({ state: "hidden", timeout: 30000 });

    const created = await prisma.event.findFirst({
      where: { title: eventTitle },
      select: { id: true, googleEventId: true, googleMeetLink: true, timezone: true, targetCompanyIds: true, startTime: true, endTime: true },
      orderBy: { createdAt: "desc" },
    });
    if (!created) throw new Error("Event not found after create");

    const calendar = await getCalendarClient();
    const cal = await calendar.events.get({ calendarId: process.env.GOOGLE_CALENDAR_ID!, eventId: created.googleEventId! });
    const event = cal.data;
    const attendeeEmails = (event.attendees || []).map((a) => a.email).filter(Boolean).sort();

    const result = {
      createdAt: new Date().toISOString(),
      recipient: slitEmail,
      kstStart: "2026-04-10 04:00",
      kstEnd: "2026-04-10 04:30",
      batch: { id: batch.id, name: batch.name },
      company: { id: company.id, name: company.name },
      app: {
        eventId: created.id,
        googleEventId: created.googleEventId,
        googleMeetLink: created.googleMeetLink,
        timezone: created.timezone,
        targetCompanyIds: created.targetCompanyIds,
        startTimeIso: created.startTime.toISOString(),
        endTimeIso: created.endTime.toISOString(),
      },
      organizerCalendar: {
        summary: event.summary,
        organizerSelf: event.organizer?.self || false,
        hangoutLink: event.hangoutLink || null,
        conferenceStatus: event.conferenceData?.createRequest?.status?.statusCode || null,
        attendeeEmails,
        start: event.start,
        end: event.end,
      },
      cleanup: {
        deleteGoogleEvent: false,
        deleteDbRecords: false,
        note: "Event intentionally left alive for recipient-side verification. Clean up manually after confirmation.",
      },
    };

    console.log(JSON.stringify(result, null, 2));
    fs.writeFileSync("dev_poc/foundersprint-live-event-proof-result.json", JSON.stringify(result, null, 2));

    if (!created.googleEventId) throw new Error("googleEventId missing");
    if (!created.googleMeetLink) throw new Error("googleMeetLink missing in DB");
    if (created.timezone !== "Asia/Seoul") throw new Error(`Unexpected timezone ${created.timezone}`);
    if (created.targetCompanyIds.length !== 1 || created.targetCompanyIds[0] !== company.id) throw new Error("targetCompanyIds mismatch");
    if (!event.hangoutLink) throw new Error("Organizer calendar event missing hangoutLink");
    if (!attendeeEmails.includes(slitEmail)) throw new Error("slit.amazing@gmail.com missing from organizer attendee list");
    if (!attendeeEmails.includes("test-admin@example.com")) throw new Error("admin missing from organizer attendee list");
    if (attendeeEmails.length !== 2) throw new Error(`Unexpected attendee count: ${attendeeEmails.length}`);
    if ((event.start?.dateTime || "").indexOf("2026-04-10T04:00:00+09:00") === -1) throw new Error("Event start time not preserved as KST in organizer calendar");
  } finally {
    await browser.close();
    await prisma.$disconnect();
    await pool.end();
  }
})().catch(async (err) => { console.error(err); try { await prisma.$disconnect(); } catch {} try { await pool.end(); } catch {} process.exit(1); });
