import { test, expect } from "./fixtures";

test.describe("Assignments", () => {
  test("admin can view assignments page", async ({ adminPage }) => {
    await adminPage.goto("/assignments");
    await expect(adminPage.locator("h1")).toContainText(/assignment/i);
  });

  test("admin can create a new assignment", async ({ adminPage }) => {
    await adminPage.goto("/assignments");

    const createButton = adminPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = adminPage.locator("[role=dialog]");
    await expect(modal).toBeVisible();

    const assignmentTitle = `Test Assignment ${Date.now()}`;
    await modal.getByLabel(/title|name/i).fill(assignmentTitle);

    const descInput = modal.getByLabel(/description/i);
    if (await descInput.isVisible()) {
      await descInput.fill("This is a test assignment description.");
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const dueDateInput = modal.getByLabel(/due.*date|deadline/i);
    if (await dueDateInput.isVisible()) {
      await dueDateInput.fill(dueDate.toISOString().slice(0, 16));
    }

    await modal.getByRole("button", { name: /create|save|submit/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(assignmentTitle)).toBeVisible();
  });

  test("founder can view assignment details", async ({ founderPage }) => {
    await founderPage.goto("/assignments");

    const assignmentLink = founderPage.getByRole("link").filter({ hasText: /assignment/i }).first();

    if (await assignmentLink.isVisible()) {
      await assignmentLink.click();
      await founderPage.waitForURL(/\/assignments\/[^/]+$/);

      await expect(founderPage.locator("h1, h2")).toContainText(/assignment/i);
    }
  });

  test("founder can submit assignment", async ({ founderPage }) => {
    await founderPage.goto("/assignments");

    const assignmentLink = founderPage.getByRole("link").filter({ hasText: /assignment/i }).first();

    if (await assignmentLink.isVisible()) {
      await assignmentLink.click();
      await founderPage.waitForURL(/\/assignments\/[^/]+$/);

      const submitButton = founderPage.getByRole("button", { name: /submit/i });

      if (await submitButton.isVisible()) {
        const contentInput = founderPage.getByLabel(/content|submission|answer/i);
        if (await contentInput.isVisible()) {
          await contentInput.fill("This is my test submission for the assignment.");
        }

        const linkInput = founderPage.getByLabel(/link|url/i);
        if (await linkInput.isVisible()) {
          await linkInput.fill("https://example.com/my-submission");
        }

        await submitButton.click();
        await expect(founderPage.getByText(/submitted/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("admin can provide feedback on submission", async ({ adminPage }) => {
    await adminPage.goto("/submissions");

    const submissionLink = adminPage.getByRole("link").first();

    if (await submissionLink.isVisible()) {
      await submissionLink.click();
      await adminPage.waitForURL(/\/submissions\/[^/]+$/);

      const feedbackInput = adminPage.getByLabel(/feedback|comment/i);
      if (await feedbackInput.isVisible()) {
        await feedbackInput.fill("Great work! Here is some test feedback.");

        const submitButton = adminPage.getByRole("button", { name: /submit|save/i });
        await submitButton.click();

        await expect(adminPage.getByText(/feedback/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });
});
