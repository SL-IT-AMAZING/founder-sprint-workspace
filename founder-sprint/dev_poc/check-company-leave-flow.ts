import { chromium } from 'playwright';
import path from 'path';
import pg from 'pg';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });

(async () => {
  const companyName = `LeaveCo ${Date.now()}`;
  const founderEmail = 'test-founder@example.com';
  let companyId: string | null = null;

  try {
    const founder = await pool.query(`select u.id as user_id, ub.batch_id from user_batches ub join users u on u.id = ub.user_id where u.email = $1 and ub.status = 'active' limit 1`, [founderEmail]);
    if (founder.rows.length !== 1) throw new Error('Founder active batch membership missing');
    const founderId = founder.rows[0].user_id;
    const batchId = founder.rows[0].batch_id;

    const company = await pool.query(`insert into companies (id, name, slug, created_at, updated_at, tags) values (gen_random_uuid(), $1, $2, now(), now(), '{}') returning id`, [companyName, `leave-co-${Date.now()}`]);
    companyId = company.rows[0].id;
    await pool.query(`insert into company_batches (id, company_id, batch_id, created_at) values (gen_random_uuid(), $1, $2, now())`, [companyId, batchId]);
    await pool.query(`insert into company_members (id, company_id, user_id, is_current, created_at) values (gen_random_uuid(), $1, (select id from users where email = $2), true, now())`, [companyId, founderEmail]);
    await pool.query(`update users set company = $1 where email = $2`, [companyName, founderEmail]);

    const browser = await chromium.launch({ headless: true });
    const founderContext = await browser.newContext({ storageState: path.resolve('e2e/.auth/founder.json') });
    const founderPage = await founderContext.newPage();
    const adminContext = await browser.newContext({ storageState: path.resolve('e2e/.auth/admin.json') });
    const adminPage = await adminContext.newPage();

    try {
      await founderPage.goto('http://localhost:3000/settings', { waitUntil: 'networkidle' });
      await founderPage.getByRole('button', { name: 'Leave current company' }).click();
      const modal = founderPage.locator('dialog[open]').first();
      await modal.getByRole('button', { name: 'Submit request' }).click();
      await founderPage.waitForTimeout(1000);
      const founderBody = await founderPage.locator('body').innerText();
      if (!founderBody.includes('Leave request submitted')) throw new Error('Founder leave request success message missing');

      const req = await pool.query(`select id, status, target_type, current_company_id from company_change_requests where target_type = 'leave_company' and current_company_id = $1 order by created_at desc limit 1`, [companyId]);
      if (req.rows.length !== 1) throw new Error('Leave request not created');
      if (req.rows[0].status !== 'pending') throw new Error('Leave request is not pending');

      const notif = await pool.query(`select id from notifications where type in ('company_request_leave','company_request_founder_restructure') and entity_id = $1`, [req.rows[0].id]);
      if (notif.rows.length === 0) throw new Error('Admin notification for leave request missing');

      await adminPage.goto('http://localhost:3000/admin/companies', { waitUntil: 'networkidle' });
      const adminText = await adminPage.locator('body').innerText();
      if (!adminText.includes('Pending company requests')) throw new Error('Admin request list missing');
      await adminPage.getByRole('button', { name: 'Approve' }).first().click();
      await adminPage.waitForTimeout(1000);

      const activeMembership = await pool.query(`select id from company_members where user_id = (select id from users where email = $1) and is_current = true and company_id = $2`, [founderEmail, companyId]);
      if (activeMembership.rows.length !== 0) throw new Error('Founder still has active company membership after approval');
      const approvedNotif = await pool.query(`select id from notifications where type = 'company_request_approved' and entity_id = $1`, [req.rows[0].id]);
      if (approvedNotif.rows.length !== 1) throw new Error('Requester approval notification missing for leave request');

      console.log(JSON.stringify({ leaveRequestCreated: true, adminNotified: true, adminReviewVisible: true, companyMembershipCleared: true, requesterNotified: true }, null, 2));
    } finally {
      await founderPage.close();
      await founderContext.close();
      await adminPage.close();
      await adminContext.close();
      await browser.close();
    }
  } finally {
    if (companyId) {
      await pool.query(`delete from notifications where entity_id in (select id from company_change_requests where current_company_id = $1)`, [companyId]).catch(()=>{});
      await pool.query(`delete from company_change_requests where current_company_id = $1`, [companyId]).catch(()=>{});
      await pool.query(`delete from company_members where company_id = $1`, [companyId]).catch(()=>{});
      await pool.query(`delete from company_batches where company_id = $1`, [companyId]).catch(()=>{});
      await pool.query(`delete from companies where id = $1`, [companyId]).catch(()=>{});
      await pool.query(`update users set company = null where email = $1`, [founderEmail]).catch(()=>{});
    }
    await pool.end();
  }
})().catch(async (err) => {
  console.error(err);
  await pool.end().catch(()=>{});
  process.exit(1);
});
