import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: path.resolve('e2e/.auth/admin.json') });
  const page = await context.newPage();
  await page.goto('http://localhost:3001/schedule', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Create Event' }).click();
  await page.getByRole('button', { name: 'Event: Virtual' }).click();
  const modal = page.locator('dialog[open]').first();
  let text = await modal.innerText();
  console.log(text);
  if (!text.includes('All Active Batches')) throw new Error('All Active Batches not present in Schedule create modal');
  if (!text.includes('Specific Batches')) throw new Error('Specific Batches not present in Schedule create modal');
  await modal.getByRole('button', { name: /All Active Batches/i }).click();
  const specificCompaniesButton = modal.getByRole('button', { name: 'Specific Companies' });
  await specificCompaniesButton.waitFor({ state: 'visible' });
  const isDisabled = await specificCompaniesButton.isDisabled();
  console.log('specificCompaniesDisabled=', isDisabled);
  if (!isDisabled) throw new Error('Specific Companies button should be disabled in all-batches mode');
  await browser.close();
})();
