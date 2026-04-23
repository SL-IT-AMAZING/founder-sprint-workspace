import { chromium } from "playwright";
import path from "path";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: path.resolve("e2e/.auth/admin.json") });
  const page = await context.newPage();
  await page.goto("http://localhost:3000/events", { waitUntil: "networkidle" });
  console.log('URL:', page.url());
  console.log('TITLE:', await page.title());
  console.log('H1:', await page.locator('h1').first().textContent().catch(() => null));
  console.log('BODY_SNIPPET:', (await page.locator('body').innerText()).slice(0, 1200));
  await browser.close();
})();
