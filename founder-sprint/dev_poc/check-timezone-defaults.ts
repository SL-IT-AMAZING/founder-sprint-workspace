import { chromium } from 'playwright';
import path from 'path';
import pg from 'pg';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, min: 0 });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

(async () => {
  const admin = await prisma.user.findUnique({ where: { email: 'test-admin@example.com' }, select: { id: true, timezone: true } });
  if (!admin) throw new Error('Missing test admin');
  const originalTimezone = admin.timezone;

  await prisma.user.update({ where: { id: admin.id }, data: { timezone: 'Asia/Seoul' } });
  await new Promise((resolve) => setTimeout(resolve, 31000));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: path.resolve('e2e/.auth/admin.json') });
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:3000/events', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByRole('button', { name: /create|add|new/i }).first().click();
    await page.getByRole('button', { name: 'Event: Virtual' }).click();
    const eventTimezone = await page.locator('dialog[open] select[name="timezone"]').inputValue();
    console.log('eventsTimezone=', eventTimezone);
    if (eventTimezone !== 'Asia/Seoul') throw new Error(`Events default timezone mismatch: ${eventTimezone}`);
    await page.locator('dialog[open]').getByRole('button', { name: 'Cancel' }).click();

    await page.goto('http://localhost:3000/sessions', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByRole('button', { name: /create|add|new/i }).first().click();
    const sessionTimezone = await page.locator('dialog[open] select[name="timezone"]').inputValue();
    console.log('sessionsTimezone=', sessionTimezone);
    if (sessionTimezone !== 'Asia/Seoul') throw new Error(`Sessions default timezone mismatch: ${sessionTimezone}`);
    await page.locator('dialog[open]').getByRole('button', { name: 'Cancel' }).click();

    await page.goto('http://localhost:3000/schedule', { waitUntil: 'networkidle', timeout: 60000 });
    await page.getByRole('button', { name: 'Create Event' }).click();
    await page.getByRole('button', { name: 'Event: Virtual' }).click();
    const scheduleTimezone = await page.locator('dialog[open] select[name="timezone"]').inputValue();
    console.log('scheduleTimezone=', scheduleTimezone);
    if (scheduleTimezone !== 'Asia/Seoul') throw new Error(`Schedule default timezone mismatch: ${scheduleTimezone}`);

    console.log('ALL TIMEZONE DEFAULT CHECKS PASSED');
  } finally {
    await browser.close();
    await prisma.user.update({ where: { id: admin.id }, data: { timezone: originalTimezone } });
    await prisma.$disconnect();
    await pool.end();
  }
})().catch(async (err) => {
  console.error(err);
  try { await prisma.$disconnect(); } catch {}
  try { await pool.end(); } catch {}
  process.exit(1);
});
