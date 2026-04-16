import { chromium } from 'playwright';
import path from 'path';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: path.resolve('e2e/.auth/admin.json') });
  const page = await context.newPage();
  await page.goto('http://localhost:3000/admin/batches', { waitUntil: 'networkidle' });
  console.log(await page.locator('body').innerText());
  await browser.close();
})();
