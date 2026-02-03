import { test, expect } from "./fixtures";

test.describe("Batch Management", () => {
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

    const modal = adminPage.locator("[role=dialog]");
    await expect(modal).toBeVisible();

    const batchName = `Test Batch ${Date.now()}`;
    await modal.getByLabel(/name/i).fill(batchName);
    await modal.getByRole("button", { name: /create/i }).click();

    await expect(adminPage.getByText(batchName)).toBeVisible({ timeout: 10000 });
  });

  test("cannot create batch when active batch exists (기획서 constraint)", async ({
    adminPage,
  }) => {
    await adminPage.goto("/admin/batches");

    const createButton = adminPage.getByRole("button", { name: /create.*batch/i });

    const hasActiveBatch = await adminPage.getByText(/active/i).first().isVisible();

    if (hasActiveBatch) {
      const isDisabled = await createButton.isDisabled();
      expect(isDisabled).toBe(true);

      const helperText = adminPage.getByText(/archive.*first|only one.*active/i);
      await expect(helperText).toBeVisible();
    }
  });

  test("admin can archive a batch", async ({ adminPage }) => {
    await adminPage.goto("/admin/batches");

    const archiveButton = adminPage.getByRole("button", { name: /archive/i }).first();

    if (await archiveButton.isVisible()) {
      await archiveButton.click();

      const confirmButton = adminPage.getByRole("button", { name: /confirm|yes|archive/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await adminPage.waitForResponse(
        (r) => r.url().includes("batch") && r.ok(),
        { timeout: 5000 }
      );
    }
  });

  test("batch delete is not allowed (기획서 constraint)", async ({ adminPage }) => {
    await adminPage.goto("/admin/batches");

    const deleteButton = adminPage.getByRole("button", { name: /delete/i });
    const count = await deleteButton.count();
    expect(count).toBe(0);
  });
});
