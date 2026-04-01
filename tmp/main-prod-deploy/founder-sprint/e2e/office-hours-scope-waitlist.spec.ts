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

test.describe("Office hour scope and waitlist", () => {
  test.describe.configure({ mode: "serial" });

  test("targeted founders can see slots and waitlist can be promoted manually", async ({ adminPage, founderPage }) => {
    const { prisma, pool } = createPrisma();
    const now = Date.now();
    let batchId: string | null = null;
    let hostId: string | null = null;
    let founderId: string | null = null;
    let requesterId: string | null = null;
    let companyId: string | null = null;
    let slotId: string | null = null;
    let approvedRequestId: string | null = null;
    let createdCreditIds: string[] = [];

    try {
      await prisma.$executeRawUnsafe(`ALTER TYPE "OfficeHourRequestStatus" ADD VALUE IF NOT EXISTS 'waitlisted'`);
      await prisma.$executeRawUnsafe(`ALTER TABLE office_hour_slots ADD COLUMN IF NOT EXISTS target_founder_ids TEXT[] DEFAULT ARRAY[]::TEXT[]`);

      const founder = await prisma.user.findUnique({
        where: { email: "test-founder@example.com" },
        include: {
          userBatches: { where: { status: "active" }, take: 1, select: { batchId: true } },
        },
      });
      const admin = await prisma.user.findUnique({ where: { email: "test-admin@example.com" }, select: { id: true } });
      if (!founder || founder.userBatches.length === 0 || !admin) throw new Error("Missing test users");

      batchId = founder.userBatches[0].batchId;
      founderId = founder.id;
      hostId = admin.id;

      const company = await prisma.company.create({
        data: { name: `E2E OH Co ${now}`, slug: `e2e-oh-co-${now}` },
        select: { id: true },
      });
      companyId = company.id;

      await prisma.companyBatch.create({ data: { companyId, batchId } });
      await prisma.companyMember.create({ data: { companyId, userId: founderId, isCurrent: true } });

      const requester = await prisma.user.create({
        data: { email: `e2e-requester-${now}@example.com`, name: "E2E Approved Founder", status: "active" },
        select: { id: true },
      });
      requesterId = requester.id;
      await prisma.userBatch.create({ data: { userId: requesterId, batchId, role: "founder", status: "active", joinedAt: new Date() } });
      await prisma.companyMember.create({ data: { companyId, userId: requesterId, isCurrent: true } });

      const slot = await prisma.officeHourSlot.create({
        data: {
          batchId,
          hostId,
          startTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000),
          timezone: "KST",
          status: "confirmed",
          companyId,
          targetFounderIds: [founderId, requesterId],
        },
        select: { id: true },
      });
      slotId = slot.id;

      const approvedRequest = await prisma.officeHourRequest.create({
        data: {
          slotId,
          requesterId,
          agenda: "Initial approved request",
          status: "approved",
          respondedAt: new Date(),
        },
        select: { id: true },
      });
      approvedRequestId = approvedRequest.id;

      await founderPage.goto("/office-hours", { waitUntil: "networkidle" });
      await expect(founderPage.getByRole("button", { name: "Join Waitlist" })).toBeVisible();
      await founderPage.getByRole("button", { name: "Join Waitlist" }).click();
      const waitlistModal = founderPage.locator("dialog[open]").first();
      await waitlistModal.getByLabel(/agenda/i).fill("Waitlist agenda");
      await waitlistModal.getByRole("button", { name: "Send Request" }).click();
      await expect(waitlistModal).not.toBeVisible({ timeout: 10000 });

      const waitlistedRequest = await prisma.officeHourRequest.findFirst({
        where: { slotId, requesterId: founderId, status: "waitlisted" },
        select: { id: true, status: true },
        orderBy: { createdAt: "desc" },
      });
      expect(waitlistedRequest?.status).toBe("waitlisted");

      await adminPage.goto("/office-hours", { waitUntil: "networkidle" });
      await expect(adminPage.getByText(/Waitlist/i)).toBeVisible();
      await expect(adminPage.getByRole("button", { name: "Promote" })).toBeVisible();

      adminPage.once("dialog", (dialog) => dialog.accept());
      await adminPage.getByRole("button", { name: "Cancel" }).last().click();
      await adminPage.waitForTimeout(1000);
      const slotAfterCancel = await prisma.officeHourSlot.findUnique({ where: { id: slotId }, select: { status: true } });
      expect(slotAfterCancel?.status).toBe("requested");

      await adminPage.getByRole("button", { name: "Promote" }).click();
      await adminPage.waitForTimeout(1000);
      const promotedRequest = await prisma.officeHourRequest.findUnique({ where: { id: waitlistedRequest!.id }, select: { status: true } });
      expect(promotedRequest?.status).toBe("pending");

      await prisma.officeHourSlot.update({ where: { id: slotId }, data: { targetFounderIds: [requesterId] } });
      await founderPage.goto("/office-hours", { waitUntil: "networkidle" });
      await expect(founderPage.getByText(/Waitlist agenda/i)).toHaveCount(0);
    } finally {
      if (slotId) await prisma.officeHourRequest.deleteMany({ where: { slotId } }).catch(() => undefined);
      if (slotId) await prisma.officeHourSlot.deleteMany({ where: { id: slotId } }).catch(() => undefined);
      if (companyId) await prisma.companyMember.deleteMany({ where: { companyId } }).catch(() => undefined);
      if (companyId && batchId) await prisma.companyBatch.deleteMany({ where: { companyId, batchId } }).catch(() => undefined);
      if (companyId) await prisma.company.deleteMany({ where: { id: companyId } }).catch(() => undefined);
      if (requesterId && batchId) await prisma.userBatch.deleteMany({ where: { userId: requesterId, batchId } }).catch(() => undefined);
      if (requesterId) await prisma.user.deleteMany({ where: { id: requesterId } }).catch(() => undefined);
      for (const creditId of createdCreditIds) {
        await prisma.officeHourCredit.deleteMany({ where: { id: creditId } }).catch(() => undefined);
      }
      await prisma.$disconnect();
      await pool.end();
    }
  });
});
