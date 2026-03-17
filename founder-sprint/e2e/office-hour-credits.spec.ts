import { config } from "dotenv";
import path from "path";
import pg from "pg";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { test, expect } from "./fixtures";

config({ path: path.resolve(__dirname, "../.env.local") });
config({ path: path.resolve(__dirname, "../.env") });

const { Pool } = pg;

function createPrisma() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, min: 0 });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
  return { prisma, pool };
}

test.describe("Office hour credits", () => {
  test.describe.configure({ mode: "serial" });

  test("founder sees unlimited during active batch and numeric credits after batch end", async ({ founderPage }) => {
    const { prisma, pool } = createPrisma();
    const founder = await prisma.user.findUnique({
      where: { email: "test-founder@example.com" },
      select: { id: true },
    });

    if (!founder) {
      throw new Error("Missing founder test user");
    }

    const activeEndDate = new Date();
    activeEndDate.setDate(activeEndDate.getDate() + 14);
    const endedEndDate = new Date();
    endedEndDate.setDate(endedEndDate.getDate() - 14);

    const activeBatch = await prisma.batch.create({
      data: {
        name: `E2E Active Credit Batch ${Date.now()}`,
        startDate: new Date(),
        endDate: activeEndDate,
        status: "active",
      },
      select: { id: true },
    });

    const endedBatch = await prisma.batch.create({
      data: {
        name: `E2E Ended Credit Batch ${Date.now()}`,
        startDate: endedEndDate,
        endDate: endedEndDate,
        status: "active",
      },
      select: { id: true },
    });

    await prisma.userBatch.createMany({
      data: [
        { userId: founder.id, batchId: activeBatch.id, role: "founder", status: "active", joinedAt: new Date() },
        { userId: founder.id, batchId: endedBatch.id, role: "founder", status: "active", joinedAt: new Date() },
      ],
    });

    const granted = await prisma.officeHourCredit.create({
      data: {
        userId: founder.id,
        batchId: endedBatch.id,
        credits: 1,
        reason: "E2E credit grant",
      },
      select: { id: true },
    });

    try {
      const context = founderPage.context();

      await context.addCookies([{ name: "selected_batch_id", value: activeBatch.id, domain: "localhost", path: "/" }]);
      await founderPage.goto("/office-hours", { waitUntil: "domcontentloaded" });
      await expect(founderPage.getByText(/Unlimited during active batch/i)).toBeVisible();

      await context.addCookies([{ name: "selected_batch_id", value: endedBatch.id, domain: "localhost", path: "/" }]);
      await founderPage.goto("/office-hours", { waitUntil: "domcontentloaded" });
      await expect(founderPage.getByText(/Credits 2\/2/i)).toBeVisible();
    } finally {
      await prisma.officeHourCredit.delete({ where: { id: granted.id } }).catch(() => undefined);
      await prisma.userBatch.deleteMany({ where: { userId: founder.id, batchId: { in: [activeBatch.id, endedBatch.id] } } });
      await prisma.batch.deleteMany({ where: { id: { in: [activeBatch.id, endedBatch.id] } } });
      await prisma.$disconnect();
      await pool.end();
    }
  });
});
