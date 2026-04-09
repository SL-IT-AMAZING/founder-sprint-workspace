import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Diagnose current state
const user = await prisma.user.findUnique({
  where: { email: 'hanjisang0914@gmail.com' },
  include: { userBatches: { include: { batch: true } } },
});

if (!user) {
  console.log('User not found');
  await prisma.$disconnect();
  await pool.end();
  process.exit(1);
}

console.log('User global_role:', user.role);
console.log('UserBatch records:', user.userBatches.map(ub => ({
  id: ub.id, batchId: ub.batchId, batchName: ub.batch.name, role: ub.role, status: ub.status,
})));

// Fix: set active UserBatch roles to super_admin
const result = await prisma.userBatch.updateMany({
  where: {
    user: { email: 'hanjisang0914@gmail.com' },
    role: { not: 'super_admin' },
  },
  data: { role: 'super_admin' },
});

console.log(`UserBatch roles updated to super_admin (${result.count} records changed)`);

await prisma.$disconnect();
await pool.end();
