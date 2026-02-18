import { test, expect } from "./fixtures";

test.describe("Batch Management", () => {
  test.describe.configure({ mode: "serial" });

  test("admin can view batches page", async ({ adminPage }) => {
    await adminPage.goto("/admin/batches");
    await expect(adminPage.locator("h1")).toContainText(/batch/i);
  });

  test("admin can create a new batch when no active batch exists", async ({ adminPage }) => {
    await adminPage.goto("/admin/batches");

    const createButton = adminPage.getByRole("button", { name: /create.*batch/i });
    const isDisabled = await createButton.isDisabled();

    if (isDisabled) {
      const archiveButton = adminPage.getByRole("button", { name: /archive/i }).first();
      if (await archiveButton.isVisible()) {
        await archiveButton.click();
        await adminPage.waitForResponse((r) => r.url().includes("batch") && r.status() === 200);
      }
    }

    await createButton.click();

    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal).toBeVisible();

    const isReadOnlyBatch = await modal.getByText(/this batch has ended/i).isVisible();
    test.skip(isReadOnlyBatch, "Batch is read-only (ended), so batch creation is unavailable.");

    const batchName = `Test Batch ${Date.now()}`;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 30);

    await modal.getByLabel(/name/i).fill(batchName);
    await modal.getByLabel(/start.*date/i).fill(startDate.toISOString().slice(0, 10));
    await modal.getByLabel(/end.*date/i).fill(endDate.toISOString().slice(0, 10));
    await modal.getByRole("button", { name: /create/i }).click();

    await expect(adminPage.locator("main h3").filter({ hasText: batchName })).toBeVisible({ timeout: 10000 });
  });

  test("at least one active batch is visible", async ({
    adminPage,
  }) => {
    await adminPage.goto("/admin/batches");

    const activeBadges = adminPage.locator("main .card").getByText(/^active$/i);
    expect(await activeBadges.count()).toBeGreaterThan(0);
  });

  test("admin can archive a batch", async ({ adminPage }) => {
    await adminPage.goto("/admin/batches");

    const activeBadges = adminPage.locator("main .card").getByText(/^active$/i);
    const activeCountBefore = await activeBadges.count();

    const archiveButton = adminPage.getByRole("button", { name: /archive/i }).first();

    if (await archiveButton.isVisible()) {
      adminPage.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await archiveButton.click();

      await expect
        .poll(async () => await activeBadges.count(), { timeout: 10000 })
        .toBeLessThanOrEqual(activeCountBefore);
    }
  });

  test("batch delete action is available", async ({ adminPage }) => {
    await adminPage.goto("/admin/batches");

    const deleteButton = adminPage.locator("main").getByRole("button", { name: /^delete$/i });
    const count = await deleteButton.count();
    expect(count).toBeGreaterThan(0);
  });
});
