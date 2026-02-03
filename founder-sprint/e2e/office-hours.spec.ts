import { test, expect } from "./fixtures";

test.describe("Office Hours", () => {
  test("mentor can view office hours page", async ({ mentorPage }) => {
    await mentorPage.goto("/office-hours");
    await expect(mentorPage.locator("h1")).toContainText(/office.*hour/i);
  });

  test("mentor can create an office hour slot in the future", async ({ mentorPage }) => {
    await mentorPage.goto("/office-hours");

    const createButton = mentorPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = mentorPage.locator("[role=dialog]");
    await expect(modal).toBeVisible();

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(14, 0, 0, 0);
    const dateStr = tomorrow.toISOString().slice(0, 16);

    await modal.getByLabel(/start.*time|date.*time/i).fill(dateStr);

    const durationInput = modal.getByLabel(/duration/i);
    if (await durationInput.isVisible()) {
      await durationInput.fill("30");
    }

    await modal.getByRole("button", { name: /create|save|submit/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 5000 });

    await expect(mentorPage.getByText(/14:00|2:00.*pm/i)).toBeVisible();
  });

  test("cannot create office hour slot in the past", async ({ mentorPage }) => {
    await mentorPage.goto("/office-hours");

    const createButton = mentorPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = mentorPage.locator("[role=dialog]");
    await expect(modal).toBeVisible();

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().slice(0, 16);

    await modal.getByLabel(/start.*time|date.*time/i).fill(dateStr);
    await modal.getByRole("button", { name: /create|save|submit/i }).click();

    const errorMessage = mentorPage.getByText(/past|cannot.*create/i);
    await expect(errorMessage).toBeVisible();
  });

  test("founder can request an available office hour slot", async ({ founderPage }) => {
    await founderPage.goto("/office-hours");

    const requestButton = founderPage.getByRole("button", { name: /request/i }).first();

    if (await requestButton.isVisible()) {
      await requestButton.click();

      const topicInput = founderPage.getByLabel(/topic|subject|agenda/i);
      if (await topicInput.isVisible()) {
        await topicInput.fill("Test meeting topic");
      }

      const submitButton = founderPage.getByRole("button", { name: /submit|request|confirm/i });
      await submitButton.click();

      await expect(founderPage.getByText(/requested|pending/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("mentor can approve office hour request", async ({ mentorPage }) => {
    await mentorPage.goto("/office-hours");

    const approveButton = mentorPage.getByRole("button", { name: /approve|accept/i }).first();

    if (await approveButton.isVisible()) {
      await approveButton.click();

      const confirmButton = mentorPage.getByRole("button", { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await expect(mentorPage.getByText(/confirmed|approved/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("mentor can cancel office hour slot", async ({ mentorPage }) => {
    await mentorPage.goto("/office-hours");

    const cancelButton = mentorPage.getByRole("button", { name: /cancel/i }).first();

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      const confirmButton = mentorPage.getByRole("button", { name: /confirm|yes/i });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
      }

      await mentorPage.waitForResponse((r) => r.url().includes("office-hour") && r.ok());
    }
  });
});
