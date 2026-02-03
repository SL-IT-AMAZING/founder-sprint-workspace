import { test, expect } from "./fixtures";

test.describe("Sessions", () => {
  test("admin can view sessions page", async ({ adminPage }) => {
    await adminPage.goto("/sessions");
    await expect(adminPage.locator("h1")).toContainText(/session/i);
  });

  test("admin can create a new session", async ({ adminPage }) => {
    await adminPage.goto("/sessions");

    const createButton = adminPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = adminPage.locator("[role=dialog]");
    await expect(modal).toBeVisible();

    const sessionTitle = `Test Session ${Date.now()}`;
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

    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(sessionTitle)).toBeVisible();
  });

  test("admin can edit a session", async ({ adminPage }) => {
    await adminPage.goto("/sessions");

    const editButton = adminPage.getByRole("button", { name: /edit/i }).first();

    if (await editButton.isVisible()) {
      await editButton.click();

      const modal = adminPage.locator("[role=dialog]");
      await expect(modal).toBeVisible();

      const titleInput = modal.getByLabel(/title|name/i);
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
      const sessionCard = deleteButton.locator("xpath=ancestor::*[contains(@class, 'card') or contains(@class, 'item')]").first();
      const sessionText = await sessionCard.textContent();

      await deleteButton.click();

      const confirmButton = adminPage.getByRole("button", { name: /confirm|yes|delete/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await adminPage.waitForResponse((r) => r.url().includes("session") && r.ok());
    }
  });

  test("user can view session details", async ({ founderPage }) => {
    await founderPage.goto("/sessions");

    const sessionLink = founderPage.getByRole("link").filter({ hasText: /session/i }).first();

    if (await sessionLink.isVisible()) {
      await sessionLink.click();
      await founderPage.waitForURL(/\/sessions\/[^/]+$/);

      await expect(founderPage.locator("h1, h2")).toContainText(/session/i);
    }
  });
});
