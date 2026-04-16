import { chromium } from 'playwright';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const founderContext = await browser.newContext({ storageState: path.resolve('e2e/.auth/founder.json') });
  const founderPage = await founderContext.newPage();
  const adminContext = await browser.newContext({ storageState: path.resolve('e2e/.auth/admin.json') });
  const adminPage = await adminContext.newPage();
  const companyName = `RequestCo ${Date.now()}`;

  try {
    await founderPage.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
    await founderPage.getByRole('button', { name: 'Request new company' }).click();
    const modal = founderPage.locator('dialog[open]').first();
    await modal.getByLabel('Company name').fill(companyName);
    await modal.getByRole('button', { name: 'Submit request' }).click();
    await founderPage.waitForTimeout(1000);
    const bodyText = await founderPage.locator('body').innerText();
    if (!bodyText.includes('New company request submitted')) throw new Error('Founder request success message missing');

    const req = await pool.query(`select id, status, target_type, requested_company_name from company_change_requests where requested_company_name = $1 order by created_at desc limit 1`, [companyName]);
    if (req.rows.length !== 1) throw new Error('Request row not created');
    if (req.rows[0].status !== 'pending' || req.rows[0].target_type !== 'new_company') throw new Error('Request row has wrong state');

    const adminNotif = await pool.query(`select id from notifications where type = 'company_request_new' and entity_id = $1`, [req.rows[0].id]);
    if (adminNotif.rows.length === 0) throw new Error('Admin notification missing');

    await adminPage.goto('http://localhost:3000/admin/companies', { waitUntil: 'networkidle' });
    const adminText = await adminPage.locator('body').innerText();
    if (!adminText.includes('Pending company requests')) throw new Error('Admin request section missing');
    if (!adminText.includes(companyName)) throw new Error('Admin request item missing');
    await adminPage.getByRole('button', { name: 'Approve' }).first().click();
    await adminPage.waitForTimeout(1000);

    const company = await pool.query(`select id from companies where name = $1`, [companyName]);
    if (company.rows.length !== 1) throw new Error('Company not created');
    const companyId = company.rows[0].id;

    const founder = await pool.query(`select id from users where email = 'test-founder@example.com'`);
    const founderId = founder.rows[0].id;
    const membership = await pool.query(`select id from company_members where user_id = $1 and company_id = $2 and is_current = true`, [founderId, companyId]);
    if (membership.rows.length !== 1) throw new Error('Company membership not created');
    const requesterNotif = await pool.query(`select id from notifications where type = 'company_request_approved' and entity_id = $1`, [req.rows[0].id]);
    if (requesterNotif.rows.length !== 1) throw new Error('Requester approval notification missing');

    console.log(JSON.stringify({ companyRequestCreated: true, adminNotified: true, adminReviewVisible: true, companyCreated: true, membershipCreated: true, requesterNotified: true }, null, 2));
  } finally {
    await founderPage.close();
    await founderContext.close();
    await adminPage.close();
    await adminContext.close();
    await browser.close();
    await pool.end();
  }
})().catch(async (err) => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
