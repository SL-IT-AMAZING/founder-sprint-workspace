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

test.describe("Batch clone invite flow", () => {
  test.describe.configure({ mode: "serial" });

  test("admin can create a source batch, clone it, and use the changed invite handoff safely", async ({ adminPage }) => {
    const { prisma, pool } = createPrisma();
    const suffix = `${Date.now()}`;
    const sourceBatchName = `E2E Clone Source ${suffix}`;
    const firstCloneName = `E2E Clone Target ${suffix}`;
    const secondCloneName = `E2E Clone Invite ${suffix}`;
    const reviewCloneName = `E2E Clone Review ${suffix}`;

    try {
      await adminPage.goto("/admin/batches", { waitUntil: "networkidle" });
      await adminPage.getByRole("button", { name: /create.*batch/i }).click();
      const createModal = adminPage.locator("dialog[open]").first();
      await expect(createModal).toBeVisible();

      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      await createModal.getByLabel(/batch name/i).fill(sourceBatchName);
      await createModal.getByLabel(/start.*date/i).fill(startDate.toISOString().slice(0, 10));
      await createModal.getByLabel(/end.*date/i).fill(endDate.toISOString().slice(0, 10));
      await createModal.getByRole("button", { name: /create batch/i }).click();
      const sourceHeading = adminPage.locator("main h3").filter({ hasText: sourceBatchName }).first();
      await expect(sourceHeading).toBeVisible({ timeout: 10000 });

      const sourceBatch = await prisma.batch.findFirst({ where: { name: sourceBatchName }, select: { id: true } });
      const founder = await prisma.user.findUnique({ where: { email: "test-founder@example.com" }, select: { id: true } });
      const mentor = await prisma.user.findUnique({ where: { email: "test-mentor@example.com" }, select: { id: true } });
      if (!sourceBatch || !founder || !mentor) throw new Error("Missing source batch or seeded users");

      await prisma.userBatch.upsert({
        where: { userId_batchId: { userId: founder.id, batchId: sourceBatch.id } },
        create: { userId: founder.id, batchId: sourceBatch.id, role: "founder", status: "active", joinedAt: new Date() },
        update: { role: "founder", status: "active", joinedAt: new Date() },
      });
      await prisma.userBatch.upsert({
        where: { userId_batchId: { userId: mentor.id, batchId: sourceBatch.id } },
        create: { userId: mentor.id, batchId: sourceBatch.id, role: "mentor", status: "active", joinedAt: new Date() },
        update: { role: "mentor", status: "active", joinedAt: new Date() },
      });
      await prisma.assignment.create({
        data: {
          batchId: sourceBatch.id,
          title: `E2E Clone Assignment ${suffix}`,
          description: "assignment for clone flow",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          reviewCriteria: [],
          targetUserIds: [],
          targetCompanyIds: [],
        },
      });
      await prisma.session.create({
        data: {
          batchId: sourceBatch.id,
          title: `E2E Clone Session ${suffix}`,
          description: "session for clone flow",
          sessionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          startTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 11 * 60 * 60 * 1000),
          timezone: "Asia/Seoul",
          targetCompanyIds: [],
        },
      });

      const sourceCard = sourceHeading.locator('xpath=ancestor::*[contains(@class, "card")][1]');
      await sourceCard.getByRole("button", { name: "Clone Structure" }).click();
      const cloneModal = adminPage.locator("dialog[open]").first();
      await expect(cloneModal).toContainText("Clone Batch Structure");
      await cloneModal.getByLabel("New Batch Name").fill(firstCloneName);
      await cloneModal.getByRole("button", { name: "Clone Batch" }).click();

      const successModal = adminPage.locator("dialog[open]").first();
      await expect(successModal).toContainText("Batch cloned successfully", { timeout: 30000 });
      await expect(successModal).toContainText(firstCloneName);
      await expect(successModal).toContainText(/\d+ assignment/);
      await expect(successModal).toContainText(/\d+ session/);
      await expect(successModal.getByRole("button", { name: "Invite Members Now" })).toBeVisible();
      await expect(successModal.getByRole("button", { name: "Review Batch First" })).toBeVisible();
      await expect(successModal.getByRole("button", { name: "Close" })).toBeVisible();
      await successModal.getByRole("button", { name: "Close" }).click();
      await expect(successModal).not.toBeVisible({ timeout: 10000 });
      await expect(adminPage.locator("main h3").filter({ hasText: firstCloneName })).toBeVisible({ timeout: 10000 });

      await sourceCard.getByRole("button", { name: "Clone Structure" }).click();
      const cloneModal2 = adminPage.locator("dialog[open]").first();
      await cloneModal2.getByLabel("New Batch Name").fill(secondCloneName);
      await cloneModal2.getByRole("button", { name: "Clone Batch" }).click();
      const inviteSuccessModal = adminPage.locator("dialog[open]").first();
      await expect(inviteSuccessModal).toContainText(secondCloneName, { timeout: 30000 });
      await inviteSuccessModal.getByRole("button", { name: "Invite Members Now" }).click();
      await adminPage.waitForURL(/\/admin\/users\?batchId=.*sourceBatchId=.*openInvite=1/);
      const inviteModal = adminPage.locator("dialog[open]").first();
      await expect(inviteModal).toBeVisible({ timeout: 10000 });
      await expect(inviteModal).toContainText("Add Users");
      await expect(inviteModal).toContainText("Invite from source batch");
      await expect(inviteModal).toContainText(sourceBatchName);
      await expect(inviteModal).toContainText(secondCloneName);
      await expect(inviteModal).toContainText("3 selected");
      await expect(inviteModal).toContainText("test-admin@example.com");
      await expect(inviteModal).toContainText("test-founder@example.com");
      await expect(inviteModal).toContainText("test-mentor@example.com");
      await expect(inviteModal.getByRole("button", { name: "Invite Selected Members" })).toBeVisible();
      const inviteUrl = adminPage.url();
      const targetBatchId = new URL(inviteUrl).searchParams.get("batchId");
      if (!targetBatchId) throw new Error("Missing target batchId in invite handoff URL");

      await inviteModal.getByRole("button", { name: "Invite Selected Members" }).click();
      const resultsModal = adminPage.locator("dialog[open]").first();
      await expect(resultsModal).toContainText("Invitation Results", { timeout: 10000 });
      await expect(resultsModal).toContainText("Invited");
      await expect(resultsModal).toContainText("Skipped");
      await expect(resultsModal).toContainText("2");
      await expect(resultsModal).toContainText("1");
      await expect(resultsModal).toContainText("User already in this batch");

      const invitedMemberships = await prisma.userBatch.findMany({
        where: { batchId: targetBatchId, status: "active" },
        select: { role: true, user: { select: { email: true } } },
      });
      const invitedEmails = invitedMemberships.map((membership) => membership.user.email).sort();
      expect(invitedEmails).toEqual(expect.arrayContaining([
        "test-admin@example.com",
        "test-founder@example.com",
        "test-mentor@example.com",
      ]));

      await resultsModal.getByRole("button", { name: "Done" }).click();
      await expect(resultsModal).not.toBeVisible({ timeout: 10000 });


      await adminPage.goto("/admin/users?openInvite=1", { waitUntil: "networkidle" });
      await expect(adminPage.getByText("No batch selected")).toBeVisible();
      const fallbackInviteModal = adminPage.locator("dialog[open]").first();
      await expect(fallbackInviteModal).toContainText("Add Users");
      await expect(fallbackInviteModal).not.toContainText("Invite from source batch");

      await adminPage.goto("/admin/batches", { waitUntil: "networkidle" });
      const freshSourceHeading = adminPage.locator("main h3").filter({ hasText: sourceBatchName }).first();
      const freshSourceCard = freshSourceHeading.locator('xpath=ancestor::*[contains(@class, "card")][1]');
      await freshSourceCard.getByRole("button", { name: "Clone Structure" }).click();
      const cloneModal3 = adminPage.locator("dialog[open]").first();
      await cloneModal3.getByLabel("New Batch Name").fill(reviewCloneName);
      await cloneModal3.getByRole("button", { name: "Clone Batch" }).click();
      const reviewSuccessModal = adminPage.locator("dialog[open]").first();
      await expect(reviewSuccessModal).toContainText(reviewCloneName, { timeout: 30000 });
      await reviewSuccessModal.getByRole("button", { name: "Review Batch First" }).click();
      await adminPage.waitForURL(/\/admin\/users\?batchId=/);
      await expect(adminPage).toHaveURL(/\/admin\/users\?batchId=[^&]+$/);
      await expect(adminPage.locator("dialog[open]")).toHaveCount(0);
    } finally {
      const toDelete = [sourceBatchName, firstCloneName, secondCloneName, reviewCloneName];
      const batches = await prisma.batch.findMany({ where: { name: { in: toDelete } }, select: { id: true } });
      const batchIds = batches.map((batch) => batch.id);
      if (batchIds.length) {
        await prisma.userBatch.deleteMany({ where: { batchId: { in: batchIds } } }).catch(() => undefined);
        await prisma.session.deleteMany({ where: { batchId: { in: batchIds } } }).catch(() => undefined);
        await prisma.assignment.deleteMany({ where: { batchId: { in: batchIds } } }).catch(() => undefined);
        await prisma.batch.deleteMany({ where: { id: { in: batchIds } } }).catch(() => undefined);
      }
      await prisma.$disconnect();
      await pool.end();
    }
  });
});
