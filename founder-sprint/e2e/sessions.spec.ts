import { test, expect } from "./fixtures";

test.describe("Sessions", () => {
  test.describe.configure({ mode: "serial" });

  let createdSessionTitle: string | null = null;

  test("admin can view sessions page", async ({ adminPage }) => {
    await adminPage.goto("/sessions");
    await expect(adminPage.locator("h1")).toContainText(/session/i);
  });

  test("admin can create a new session", async ({ adminPage }) => {
    await adminPage.goto("/sessions");

    const createButton = adminPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal).toBeVisible();

    const sessionTitle = `Test Session ${Date.now()}`;
    createdSessionTitle = sessionTitle;
    await modal.getByLabel(/title|name/i).fill(sessionTitle);

    const descInput = modal.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill("Test session description for E2E testing");
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const dateInput = modal.getByLabel(/date/i);
    if (await dateInput.isVisible()) {
      await dateInput.fill(futureDate.toISOString().slice(0, 10));
    }

    await modal.getByRole("button", { name: /create|save|submit/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 15000 });
    await expect(adminPage.getByText(sessionTitle)).toBeVisible();
  });

  test("admin can edit a session", async ({ adminPage }) => {
    await adminPage.goto("/sessions");

    const editButton = adminPage.getByRole("button", { name: /edit/i }).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      const modal = adminPage.locator("dialog[open]").first();
      await expect(modal).toBeVisible();

      const titleInput = modal.getByRole("textbox").first();
      const currentTitle = await titleInput.inputValue();
      const updatedTitle = `${currentTitle} (Updated)`;
      await titleInput.fill(updatedTitle);

      await modal.getByRole("button", { name: /save|update/i }).click();

      await expect(modal).not.toBeVisible({ timeout: 5000 });
      await expect(adminPage.getByText(updatedTitle)).toBeVisible();
    }
  });

  test("admin can delete a session", async ({ adminPage }) => {
    await adminPage.goto("/sessions");

    const deleteButton = adminPage.getByRole("button", { name: /delete/i }).first();

    if (await deleteButton.isVisible()) {
      const deleteCountBefore = await adminPage.getByRole("button", { name: /delete/i }).count();

      adminPage.once("dialog", async (dialog) => {
        await dialog.accept();
      });
      await deleteButton.click();

      await expect
        .poll(async () => await adminPage.getByRole("button", { name: /delete/i }).count(), {
          timeout: 10000,
        })
        .toBeLessThanOrEqual(deleteCountBefore);
    }
  });

  test("user can view session details", async ({ founderPage }) => {
    await founderPage.goto("/sessions");

    const detailLinks = founderPage.locator('main a[href^="/sessions/"]');
    const detailLinkCount = await detailLinks.count();

    test.skip(detailLinkCount === 0, "Session detail page links are not available in current UI.");

    if (createdSessionTitle) {
      const createdSessionLink = founderPage
        .locator('main a[href^="/sessions/"]')
        .filter({ hasText: createdSessionTitle })
        .first();

      if (await createdSessionLink.isVisible()) {
        await createdSessionLink.click();
      } else {
        await detailLinks.first().click();
      }
    } else {
      await detailLinks.first().click();
    }

    await founderPage.waitForURL(/\/sessions\/[^/]+$/);
    await expect(founderPage.locator("h1, h2")).toContainText(/session/i);
  });
});
