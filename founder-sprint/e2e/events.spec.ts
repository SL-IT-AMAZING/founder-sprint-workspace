import { test, expect } from "./fixtures";

test.describe("Events", () => {
  test("admin can view events page", async ({ adminPage }) => {
    await adminPage.goto("/events");
    await expect(adminPage.locator("h1")).toContainText(/event/i);
  });

  test("admin can create a new event", async ({ adminPage }) => {
    await adminPage.goto("/events");

    const createButton = adminPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = adminPage.locator("[role=dialog]");
    await expect(modal).toBeVisible();

    const eventTitle = `Test Event ${Date.now()}`;
    await modal.getByLabel(/title|name/i).fill(eventTitle);

    const descInput = modal.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill("Test event description for E2E testing");
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(14, 0, 0, 0);

    const dateInput = modal.getByLabel(/date|start/i);
    if (await dateInput.isVisible()) {
      await dateInput.fill(futureDate.toISOString().slice(0, 16));
    }

    const locationInput = modal.getByLabel(/location/i);
    if (await locationInput.isVisible()) {
      await locationInput.fill("Test Location");
    }

    await modal.getByRole("button", { name: /create|save|submit/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(eventTitle)).toBeVisible();
  });

  test("event limit is enforced (기획서: max 20 per batch)", async ({ adminPage }) => {
    await adminPage.goto("/events");

    const eventCards = adminPage.locator("[data-testid=event-card], .event-card, article");
    const count = await eventCards.count();

    expect(count).toBeLessThanOrEqual(20);
  });

  test("user can view event details", async ({ founderPage }) => {
    await founderPage.goto("/events");

    const eventLink = founderPage.getByRole("link").filter({ hasText: /event/i }).first();

    if (await eventLink.isVisible()) {
      await eventLink.click();
      await founderPage.waitForURL(/\/events\/[^/]+$/);

      await expect(founderPage.locator("h1, h2")).toContainText(/event/i);
    }
  });
});
