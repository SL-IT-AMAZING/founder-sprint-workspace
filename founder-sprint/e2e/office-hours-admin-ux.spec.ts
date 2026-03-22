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

test.describe("Office hours admin UX", () => {
  test.describe.configure({ mode: "serial" });

  test("founder/admin cancel requests and admin grants credits by selected batch", async ({ adminPage, founderPage }) => {
    const { prisma, pool } = createPrisma();

    const admin = await prisma.user.findUnique({ where: { email: "test-admin@example.com" }, select: { id: true } });
    const founder = await prisma.user.findUnique({ where: { email: "test-founder@example.com" }, select: { id: true, name: true, email: true } });

    if (!admin || !founder) {
      throw new Error("Missing admin/founder test users");
    }

    const now = Date.now();
    const activeEndDate = new Date();
    activeEndDate.setDate(activeEndDate.getDate() + 30);

    const batchA = await prisma.batch.create({
      data: {
        name: `E2E OH Batch A ${now}`,
        startDate: new Date(),
        endDate: activeEndDate,
        status: "active",
      },
      select: { id: true },
    });

    const batchB = await prisma.batch.create({
      data: {
        name: `E2E OH Batch B ${now}`,
        startDate: new Date(),
        endDate: activeEndDate,
        status: "active",
      },
      select: { id: true },
    });

    const secondFounder = await prisma.user.create({
      data: {
        email: `e2e-second-founder-${now}@example.com`,
        name: "E2E Second Founder",
        status: "active",
      },
      select: { id: true, email: true },
    });

    await prisma.userBatch.createMany({
      data: [
        { userId: admin.id, batchId: batchA.id, role: "admin", status: "active", joinedAt: new Date() },
        { userId: admin.id, batchId: batchB.id, role: "admin", status: "active", joinedAt: new Date() },
        { userId: founder.id, batchId: batchA.id, role: "founder", status: "active", joinedAt: new Date() },
        { userId: secondFounder.id, batchId: batchB.id, role: "founder", status: "active", joinedAt: new Date() },
      ],
    });

    const pendingSlot = await prisma.officeHourSlot.create({
      data: {
        batchId: batchA.id,
        hostId: admin.id,
        startTime: new Date(Date.now() + 60 * 60 * 1000),
        endTime: new Date(Date.now() + 90 * 60 * 1000),
        timezone: "KST",
        status: "requested",
      },
      select: { id: true },
    });

    const approvedSlot = await prisma.officeHourSlot.create({
      data: {
        batchId: batchA.id,
        hostId: admin.id,
        startTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        endTime: new Date(Date.now() + 150 * 60 * 1000),
        timezone: "KST",
        status: "confirmed",
      },
      select: { id: true },
    });

    const pendingRequest = await prisma.officeHourRequest.create({
      data: {
        slotId: pendingSlot.id,
        requesterId: founder.id,
        agenda: "Pending office hour",
        status: "pending",
      },
      select: { id: true },
    });

    const approvedRequest = await prisma.officeHourRequest.create({
      data: {
        slotId: approvedSlot.id,
        requesterId: founder.id,
        agenda: "Approved office hour",
        status: "approved",
      },
      select: { id: true },
    });

    try {
      await founderPage.context().addCookies([{ name: "selected_batch_id", value: batchA.id, domain: "localhost", path: "/" }]);
      await founderPage.goto("/office-hours", { waitUntil: "domcontentloaded" });
      await expect(founderPage.getByRole("button", { name: "Cancel" }).first()).toBeVisible();
      founderPage.once("dialog", (dialog) => dialog.accept());
      await founderPage.getByRole("button", { name: "Cancel" }).first().click();
      await founderPage.waitForLoadState("networkidle");

      const pendingAfter = await prisma.officeHourRequest.findUnique({ where: { id: pendingRequest.id }, select: { status: true } });
      const pendingSlotAfter = await prisma.officeHourSlot.findUnique({ where: { id: pendingSlot.id }, select: { status: true } });
      console.log("founderCancel", JSON.stringify({ request: pendingAfter?.status, slot: pendingSlotAfter?.status }));

      await adminPage.context().addCookies([{ name: "selected_batch_id", value: batchA.id, domain: "localhost", path: "/" }]);
      await adminPage.goto("/office-hours", { waitUntil: "domcontentloaded" });
      await expect(adminPage.getByRole("button", { name: "Grant Credits" })).toBeVisible();
      const adminCancelButtons = adminPage.getByRole("button", { name: "Cancel" });
      await expect(adminCancelButtons.last()).toBeVisible();
      adminPage.once("dialog", (dialog) => dialog.accept());
      await adminCancelButtons.last().click();
      await adminPage.waitForLoadState("networkidle");

      const approvedAfter = await prisma.officeHourRequest.findUnique({ where: { id: approvedRequest.id }, select: { status: true } });
      const approvedSlotAfter = await prisma.officeHourSlot.findUnique({ where: { id: approvedSlot.id }, select: { status: true } });
      console.log("adminCancel", JSON.stringify({ request: approvedAfter?.status, slot: approvedSlotAfter?.status }));

      await adminPage.getByRole("button", { name: "Grant Credits" }).click();
      const modal = adminPage.locator("dialog[open]").first();
      await modal.locator("select").first().selectOption(batchB.id);
      await adminPage.waitForTimeout(600);
      await modal.getByRole("button", { name: /search founder/i }).click();
      await expect(modal.getByRole("button", { name: /E2E Second Founder/i })).toBeVisible();
      await modal.getByRole("button", { name: /E2E Second Founder/i }).click();
      await modal.getByLabel(/credits to add/i).fill("2");
      await modal.getByRole("button", { name: "Grant Credits" }).click();
      await adminPage.waitForLoadState("networkidle");
      await expect(modal).not.toBeVisible({ timeout: 5000 });

      const granted = await prisma.officeHourCredit.findFirst({
        where: { userId: secondFounder.id, batchId: batchB.id, credits: 2 },
        orderBy: { createdAt: "desc" },
        select: { batchId: true, userId: true, credits: true },
      });
      console.log("grantCredits", JSON.stringify(granted));

      expect(pendingAfter?.status).toBe("cancelled");
      expect(pendingSlotAfter?.status).toBe("available");
      expect(approvedAfter?.status).toBe("cancelled");
      expect(approvedSlotAfter?.status).toBe("cancelled");
      expect(granted?.batchId).toBe(batchB.id);
      expect(granted?.userId).toBe(secondFounder.id);
      expect(granted?.credits).toBe(2);
    } finally {
      await prisma.officeHourCredit.deleteMany({ where: { batchId: { in: [batchA.id, batchB.id] } } });
      await prisma.officeHourRequest.deleteMany({ where: { slotId: { in: [pendingSlot.id, approvedSlot.id] } } });
      await prisma.officeHourSlot.deleteMany({ where: { id: { in: [pendingSlot.id, approvedSlot.id] } } });
      await prisma.userBatch.deleteMany({ where: { batchId: { in: [batchA.id, batchB.id] } } });
      await prisma.batch.deleteMany({ where: { id: { in: [batchA.id, batchB.id] } } });
      await prisma.user.delete({ where: { id: secondFounder.id } }).catch(() => undefined);
      await prisma.$disconnect();
      await pool.end();
    }
  });
});
