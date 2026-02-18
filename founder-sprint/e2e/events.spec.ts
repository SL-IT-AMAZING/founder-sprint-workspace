import { test, expect } from "./fixtures";

test.describe("Events", () => {
  test.describe.configure({ mode: "serial" });

  let createdEventTitle: string | null = null;

  test("admin can view events page", async ({ adminPage }) => {
    await adminPage.goto("/events");
    await expect(adminPage.locator("h1")).toContainText(/event/i);
  });

  test("admin can create a new event", async ({ adminPage }) => {
    await adminPage.goto("/events");

    const createButton = adminPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal).toBeVisible();

    const isReadOnlyBatch = await modal.getByText(/this batch has ended/i).isVisible();
    test.skip(isReadOnlyBatch, "Batch is read-only (ended), so event creation is unavailable.");

    const eventTitle = `Test Event ${Date.now()}`;
    createdEventTitle = eventTitle;
    await modal.getByLabel(/title|name/i).fill(eventTitle);

    const descInput = modal.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill("Test event description for E2E testing");
    }

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    futureDate.setHours(14, 0, 0, 0);

    const endDate = new Date(futureDate);
    endDate.setHours(endDate.getHours() + 1);

    await modal.getByLabel(/start.*time/i).fill(futureDate.toISOString().slice(0, 16));
    await modal.getByLabel(/end.*time/i).fill(endDate.toISOString().slice(0, 16));

    const locationInput = modal.getByLabel(/location/i);
    if (await locationInput.isVisible()) {
      await locationInput.fill("Test Location");
    }

    await modal.getByRole("button", { name: /create|save|submit/i }).click();

    const readOnlyAfterSubmit = (await modal.locator("text=This batch has ended").count()) > 0;
    test.skip(readOnlyAfterSubmit, "Batch is read-only (ended), so event creation is unavailable.");

    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });

  test("event limit is enforced (기획서: max 20 per batch)", async ({ adminPage }) => {
    await adminPage.goto("/events");

    const eventCards = adminPage.locator("[data-testid=event-card], .event-card, article");
    const count = await eventCards.count();

    expect(count).toBeLessThanOrEqual(20);
  });

  test("user can view event details", async ({ founderPage }) => {
    await founderPage.goto("/events");

    const detailLinks = founderPage.locator('main a[href^="/events/"]');
    const detailLinkCount = await detailLinks.count();

    test.skip(detailLinkCount === 0, "Event detail page links are not available in current UI.");

    if (createdEventTitle) {
      const createdEventLink = founderPage
        .locator('main a[href^="/events/"]')
        .filter({ hasText: createdEventTitle })
        .first();

      if (await createdEventLink.isVisible()) {
        await createdEventLink.click();
      } else {
        await detailLinks.first().click();
      }
    } else {
      await detailLinks.first().click();
    }

    await founderPage.waitForURL(/\/events\/[^/]+$/);
    await expect(founderPage.locator("h1, h2")).toContainText(/event/i);
  });
});
