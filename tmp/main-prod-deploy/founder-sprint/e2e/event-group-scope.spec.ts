import { config } from "dotenv";
import path from "path";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { expect, test } from "./fixtures";

config({ path: path.resolve(__dirname, "../.env.local") });
config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pg;

function createPrisma() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, min: 0 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool };
}

test.describe("Event group scope", () => {
  test.describe.configure({ mode: "serial" });

  test("group-scoped event stays hidden until founder joins target group", async ({ adminPage, founderPage }) => {
    test.setTimeout(180000);
    const { prisma, pool } = createPrisma();
    const now = Date.now();
    const groupName = `E2E Event Scope ${now}`;
    const eventTitle = `Scoped Event ${now}`;

    let founderId: string | null = null;
    let batchId: string | null = null;
    let batchName: string | null = null;
    let groupId: string | null = null;
    let eventId: string | null = null;

    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE events ADD COLUMN IF NOT EXISTS target_group_id UUID`);

      const founder = await prisma.user.findUnique({
        where: { email: "test-founder@example.com" },
        include: {
          userBatches: {
            where: { status: "active" },
            take: 1,
            select: { batchId: true, batch: { select: { name: true } } },
          },
        },
      });

      if (!founder || founder.userBatches.length === 0) {
        throw new Error("Missing founder fixture batch");
      }

      founderId = founder.id;
      batchId = founder.userBatches[0].batchId;
      batchName = founder.userBatches[0].batch.name;

      await adminPage.context().addCookies([{ name: "selected_batch_id", value: batchId, domain: "localhost", path: "/" }]);
      await founderPage.context().addCookies([{ name: "selected_batch_id", value: batchId, domain: "localhost", path: "/" }]);

      await adminPage.goto("/groups", { waitUntil: "networkidle" });
      await adminPage.getByRole("button", { name: /Create Company|Create First Company/i }).first().click();
      const createGroupModal = adminPage.locator("dialog[open]").first();
      await createGroupModal.getByLabel(/Company Name/i).fill(groupName);
      await createGroupModal.getByRole("button", { name: /Create Company/i }).click();
      await expect(createGroupModal).not.toBeVisible({ timeout: 10000 });

      const group = await prisma.group.findFirst({
        where: { name: groupName },
        select: { id: true },
        orderBy: { createdAt: "desc" },
      });
      if (!group) {
        throw new Error("Failed to create scope group");
      }
      groupId = group.id;

      await adminPage.goto("/events", { waitUntil: "networkidle" });
      await adminPage.getByRole("button", { name: "Create Event" }).first().click();
      await adminPage.getByRole("button", { name: "Event: In-person" }).click();

      const modal = adminPage.locator("dialog[open]").first();
      await modal.getByRole("button", { name: /Specific Batches/i }).click();
      await modal.getByRole("checkbox", { name: new RegExp(batchName || "") }).check();
      await modal.getByLabel(/title/i).fill(eventTitle);
      await modal.getByLabel(/start time/i).fill("2026-04-15T10:00");
      await modal.getByLabel(/end time/i).fill("2026-04-15T11:00");
      await modal.getByLabel(/timezone/i).selectOption("Asia/Seoul");
      await modal.locator('select[name="targetGroupId"]').selectOption(groupId);
      await modal.getByRole("button", { name: /^create event$/i }).click();
      await expect(modal).not.toBeVisible({ timeout: 10000 });

      const createdEvent = await prisma.event.findFirst({
        where: { title: eventTitle },
        select: { id: true, targetGroupId: true },
        orderBy: { createdAt: "desc" },
      });

      eventId = createdEvent?.id ?? null;
      expect(createdEvent?.targetGroupId).toBe(groupId);

      await founderPage.goto("/events", { waitUntil: "networkidle" });
      await expect(founderPage.getByText(eventTitle)).toHaveCount(0);

      await founderPage.goto("/schedule?month=2026-04", { waitUntil: "networkidle" });
      await founderPage.getByRole("button", { name: /April 15, 2026/i }).click();
      await expect(founderPage.getByText(eventTitle)).toHaveCount(0);

      if (eventId) {
        await founderPage.goto(`/events/${eventId}`, { waitUntil: "networkidle" });
        await expect(founderPage).toHaveURL(/\/events$/);
      }

      await founderPage.goto(`/groups/${groupId}`, { waitUntil: "networkidle" });
      await founderPage.getByRole("button", { name: /Join Company/i }).click();
      await founderPage.waitForTimeout(1200);

      await founderPage.goto("/events", { waitUntil: "networkidle" });
      await expect(founderPage.getByText(eventTitle)).toBeVisible();

      await founderPage.goto("/schedule?month=2026-04", { waitUntil: "networkidle" });
      await founderPage.getByRole("button", { name: /April 15, 2026/i }).click();
      await expect(founderPage.getByText(eventTitle)).toBeVisible();

      if (eventId) {
        await founderPage.goto(`/events/${eventId}`, { waitUntil: "networkidle" });
        await expect(founderPage).toHaveURL(new RegExp(`/events/${eventId}$`));
      }
    } finally {
      if (eventId) {
        await prisma.event.deleteMany({ where: { id: eventId } }).catch(() => undefined);
      }
      if (groupId && founderId) {
        await prisma.groupMember.deleteMany({ where: { groupId, userId: founderId } }).catch(() => undefined);
      }
      if (groupId) {
        await prisma.group.deleteMany({ where: { id: groupId } }).catch(() => undefined);
      }
      await prisma.$disconnect();
      await pool.end();
    }
  });
});
