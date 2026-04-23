import { chromium } from "playwright";
import path from "path";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ storageState: path.resolve("e2e/.auth/admin.json") });
  const page = await context.newPage();
  try {
    await page.goto("http://localhost:3000/admin/batches", { waitUntil: "networkidle" });
    page.on("dialog", async (dialog) => { await dialog.accept(); });
    const batchCard = page.locator("main .card").filter({ hasText: /Delete Guard Batch/ }).first();
    await batchCard.getByRole("button", { name: "Delete" }).click();
    await page.waitForTimeout(1500);
    const body = await page.locator("body").innerText();
    console.log(body);
    if (body.includes("Runtime PrismaClientKnownRequestError")) {
      throw new Error("Runtime Prisma crash still surfaced");
    }
  } finally {
    await browser.close();
  }
})().catch((err) => { console.error(err); process.exit(1); });
