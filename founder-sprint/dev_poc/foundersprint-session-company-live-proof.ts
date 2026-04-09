import { chromium } from "playwright";
import path from "path";
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
  const batchName = `FS TEST KST 0410 SESSION SAFE BATCH ${now}`;
  const companyName = `FS TEST KST 0410 SESSION SAFE CO ${now}`;
  const sessionTitle = `FS TEST KST 0410 SAFE SESSION ${now}`;
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
      description: "safe live session proof batch",
      startDate: new Date("2026-04-01T00:00:00+09:00"),
      endDate: new Date("2026-05-01T00:00:00+09:00"),
      status: "active",
    },
    select: { id: true, name: true },
  });

  const company = await prisma.company.create({
    data: { name: companyName, slug: `fs-test-kst-0410-session-safe-${now}` },
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

  let createdSessionId: string | null = null;
  try {
    await page.goto("http://localhost:3000/sessions", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /create|add|new/i }).first().click();
    const modal = page.locator("dialog[open]").first();

    await modal.getByRole("button", { name: /Specific Batches/i }).click();
    await modal.getByPlaceholder("Search batches...").fill(batchName);
    await modal.getByLabel(new RegExp(batchName)).check();

    await modal.getByLabel(/title|name/i).fill(sessionTitle);
    await modal.getByLabel(/description/i).fill("Live KST session safe proof");
    await modal.getByLabel(/session date/i).fill("2026-04-10");
    await modal.getByLabel(/start time/i).fill("05:00");
    await modal.getByLabel(/end time/i).fill("05:30");
    await modal.locator('select[name="timezone"]').selectOption("Asia/Seoul");

    await modal.getByRole("button", { name: /Specific Companies/i }).click();
    await modal.getByPlaceholder("Search companies...").fill(companyName);
    await modal.getByLabel(new RegExp(companyName)).check();

    await modal.getByRole("button", { name: /^create session$/i }).click();
    await modal.waitFor({ state: "hidden", timeout: 30000 });

    const created = await prisma.session.findFirst({
      where: { title: sessionTitle },
      select: { id: true, googleEventId: true, timezone: true, startTime: true, endTime: true, targetCompanyIds: true },
      orderBy: { createdAt: "desc" },
    });
    if (!created) throw new Error("Session not found after create");
    createdSessionId = created.id;

    const calendar = await getCalendarClient();
    const cal = await calendar.events.get({ calendarId: process.env.GOOGLE_CALENDAR_ID!, eventId: created.googleEventId! });
    const event = cal.data;
    const attendeeEmails = (event.attendees || []).map((a) => a.email).filter(Boolean).sort();

    console.log(JSON.stringify({
      app: {
        sessionId: created.id,
        googleEventId: created.googleEventId,
        timezone: created.timezone,
        startTimeIso: created.startTime?.toISOString() || null,
        endTimeIso: created.endTime?.toISOString() || null,
        targetCompanyIds: created.targetCompanyIds,
      },
      organizerCalendar: {
        summary: event.summary,
        organizerSelf: event.organizer?.self || false,
        attendeeEmails,
        start: event.start,
        end: event.end,
        hangoutLink: event.hangoutLink || null,
      }
    }, null, 2));

    if (!created.googleEventId) throw new Error("googleEventId missing");
    if (created.timezone !== "Asia/Seoul") throw new Error(`Unexpected timezone ${created.timezone}`);
    if (created.targetCompanyIds.length !== 1 || created.targetCompanyIds[0] !== company.id) throw new Error("targetCompanyIds mismatch");
    if (!attendeeEmails.includes(slitEmail)) throw new Error("slit.amazing@gmail.com missing from session attendee list");
    if (!attendeeEmails.includes("test-admin@example.com")) throw new Error("admin missing from session attendee list");
    if (attendeeEmails.length !== 2) throw new Error(`Unexpected attendee count: ${attendeeEmails.length}`);
    if ((event.start?.dateTime || "").indexOf("2026-04-10T05:00:00+09:00") === -1) throw new Error("Session start time not preserved as KST in organizer calendar");
  } finally {
    await browser.close();
    if (createdSessionId) {
      const found = await prisma.session.findUnique({ where: { id: createdSessionId }, select: { googleEventId: true } });
      if (found?.googleEventId) {
        try {
          const calendar = await getCalendarClient();
          await calendar.events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID!, eventId: found.googleEventId, sendUpdates: "all" });
        } catch {}
      }
      await prisma.session.deleteMany({ where: { id: createdSessionId } }).catch(() => undefined);
    }
    await prisma.companyMember.deleteMany({ where: { companyId: company.id } }).catch(() => undefined);
    await prisma.userBatch.deleteMany({ where: { batchId: batch.id } }).catch(() => undefined);
    await prisma.companyBatch.deleteMany({ where: { companyId: company.id, batchId: batch.id } }).catch(() => undefined);
    await prisma.company.deleteMany({ where: { id: company.id } }).catch(() => undefined);
    await prisma.batch.deleteMany({ where: { id: batch.id } }).catch(() => undefined);
    await prisma.$disconnect();
    await pool.end();
  }
})().catch(async (err) => { console.error(err); try { await prisma.$disconnect(); } catch {} try { await pool.end(); } catch {} process.exit(1); });
