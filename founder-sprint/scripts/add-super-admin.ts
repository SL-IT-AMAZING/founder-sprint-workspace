import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Get first active batch
  const batch = await prisma.batch.findFirst({ where: { status: "active" } });
  if (!batch) {
    console.error("No active batch found");
    return;
  }

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email: "peter@outsome.co" },
    create: { email: "peter@outsome.co", name: "Peter" },
    update: {},
  });

  // Check existing userBatch
  const existing = await prisma.userBatch.findUnique({
    where: { userId_batchId: { userId: user.id, batchId: batch.id } },
  });

  if (existing) {
    // Update to super_admin
    await prisma.userBatch.update({
      where: { id: existing.id },
      data: { role: "super_admin", status: "active" },
    });
    console.log("Updated peter@outsome.co to super_admin");
  } else {
    // Create new userBatch
    await prisma.userBatch.create({
      data: {
        userId: user.id,
        batchId: batch.id,
        role: "super_admin",
        status: "active",
        joinedAt: new Date(),
      },
    });
    console.log("Added peter@outsome.co as super_admin");
  }

  // Verify
  const result = await prisma.user.findUnique({
    where: { email: "peter@outsome.co" },
    include: { userBatches: { include: { batch: true } } },
  });
  console.log("Result:", JSON.stringify(result, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
