import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "hanjisang0914@gmail.com" },
    include: { userBatches: { include: { batch: true } } }
  });
  
  console.log("USER:", JSON.stringify(user, null, 2));
  
  const batches = await prisma.batch.findMany({ select: { id: true, name: true, status: true } });
  console.log("\nBATCHES:", JSON.stringify(batches, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
