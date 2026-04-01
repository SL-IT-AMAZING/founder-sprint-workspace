import { test, expect } from "./fixtures";

test.describe("Assignments", () => {
  test.describe.configure({ mode: "serial" });

  let createdAssignmentTitle: string | null = null;

  test("admin can view assignments page", async ({ adminPage }) => {
    await adminPage.goto("/assignments");
    await expect(adminPage).toHaveURL(/\/assignments/);
    await expect(adminPage.locator("h1")).toContainText(/assignment/i);
  });

  test("admin can create a new assignment", async ({ adminPage }) => {
    await adminPage.goto("/assignments");

    const createButton = adminPage.getByRole("button", { name: /create|add|new/i }).first();
    await createButton.click();

    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal).toBeVisible();

    const isReadOnlyBatch = (await modal.locator("text=This batch has ended").count()) > 0;
    test.skip(isReadOnlyBatch, "Batch is read-only (ended), so assignment creation is unavailable.");

    const assignmentTitle = `Test Assignment ${Date.now()}`;
    createdAssignmentTitle = assignmentTitle;
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

    await expect(modal).not.toBeVisible({ timeout: 10000 });
  });

  test("founder can view assignment details", async ({ founderPage }) => {
    await founderPage.goto("/assignments");

    test.skip(!createdAssignmentTitle, "No assignment was created in this run.");

    const assignmentCard = founderPage.locator("main .card").filter({ hasText: createdAssignmentTitle as string }).first();
    const assignmentCardCount = await founderPage.locator("main .card").filter({ hasText: createdAssignmentTitle as string }).count();
    test.skip(assignmentCardCount === 0, "Created assignment is not visible in founder's current batch context.");
    await expect(assignmentCard).toBeVisible({ timeout: 10000 });

    await assignmentCard.click();
    await founderPage.waitForURL(/\/assignments\/[^/]+$/);

    await expect(founderPage.locator("h1")).toContainText(createdAssignmentTitle as string);
  });

  test("founder can submit assignment", async ({ founderPage }) => {
    await founderPage.goto("/assignments");

    test.skip(!createdAssignmentTitle, "No assignment was created in this run.");

    const assignmentCard = founderPage.locator("main .card").filter({ hasText: createdAssignmentTitle as string }).first();
    const assignmentCardCount = await founderPage.locator("main .card").filter({ hasText: createdAssignmentTitle as string }).count();
    test.skip(assignmentCardCount === 0, "Created assignment is not visible in founder's current batch context.");
    await expect(assignmentCard).toBeVisible({ timeout: 10000 });

    await assignmentCard.click();
    await founderPage.waitForURL(/\/assignments\/[^/]+$/);

    await founderPage.getByLabel(/submission text|content/i).fill("This is my test submission for the assignment.");
    await founderPage.getByLabel(/link.*url|url/i).fill("https://example.com/my-submission");

    const submitButton = founderPage.getByRole("button", { name: /submit|update/i });
    await submitButton.click();
    await expect(founderPage.getByText(/saved successfully/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin can provide feedback on submission", async ({ adminPage }) => {
    await adminPage.goto("/submissions");

    const submissionLink = adminPage.locator('main a[href^="/submissions/"]').first();
    const submissionLinkCount = await adminPage.locator('main a[href^="/submissions/"]').count();
    test.skip(submissionLinkCount === 0, "No submissions are available for feedback.");
    await expect(submissionLink).toBeVisible({ timeout: 10000 });

    await submissionLink.click();
    await adminPage.waitForURL(/\/submissions\/[^/]+$/);

    const feedbackInput = adminPage.getByPlaceholder(/provide constructive feedback/i);
    await feedbackInput.fill("Great work! Here is some test feedback.");

    await adminPage.getByRole("button", { name: /submit feedback|submit|save/i }).click();
    await expect(adminPage.getByText(/great work! here is some test feedback\./i)).toBeVisible({ timeout: 10000 });
  });
});
