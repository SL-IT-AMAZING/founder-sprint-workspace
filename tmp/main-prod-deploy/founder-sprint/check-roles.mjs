import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
  max: 10,
  min: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function checkRoles() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
      orderBy: [
        { role: 'asc' },
        { email: 'asc' }
      ]
    });

    console.log('Total users found:', users.length);
    console.log('\nUser Roles Breakdown:');
    console.log('='.repeat(80));

    // Group by role
    const roleCount = {};
    users.forEach(user => {
      const role = user.role || 'null';
      roleCount[role] = (roleCount[role] || 0) + 1;
    });

    console.log('\nRole Distribution:');
    Object.entries(roleCount).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('Detailed User List:');
    console.log('='.repeat(80));

    users.forEach(user => {
      console.log(JSON.stringify({
        email: user.email,
        name: user.name,
        role: user.role,
        id: user.id.substring(0, 8) + '...'
      }, null, 2));
    });

  } catch (error) {
    console.error('Error querying database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkRoles();
