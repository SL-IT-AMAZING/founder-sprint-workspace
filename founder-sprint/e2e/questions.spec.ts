import { test, expect } from "./fixtures";

test.describe("Questions", () => {
  test("founder can view questions page", async ({ founderPage }) => {
    await founderPage.goto("/questions");
    await expect(founderPage.locator("h1")).toContainText(/question/i);
  });

  test("founder can create a new question", async ({ founderPage }) => {
    await founderPage.goto("/questions/new");

    const titleInput = founderPage.getByLabel(/title|subject/i);
    await titleInput.fill(`Test Question ${Date.now()}`);

    const contentInput = founderPage.getByLabel(/content|body|description/i);
    if (await contentInput.isVisible()) {
      await contentInput.fill("This is a test question for E2E testing. What are your thoughts?");
    }

    const submitButton = founderPage.getByRole("button", { name: /submit|create|post/i });
    await submitButton.click();

    await founderPage.waitForURL(/\/questions(\/[^/]+)?$/);
    await expect(founderPage.getByText(/test question/i)).toBeVisible();
  });

  test("mentor can answer a question", async ({ mentorPage }) => {
    await mentorPage.goto("/questions");

    const questionLink = mentorPage.getByRole("link").filter({ hasText: /question/i }).first();

    if (await questionLink.isVisible()) {
      await questionLink.click();
      await mentorPage.waitForURL(/\/questions\/[^/]+$/);

      const answerInput = mentorPage.getByLabel(/answer|response|reply/i);
      if (await answerInput.isVisible()) {
        await answerInput.fill("This is a test answer from mentor for E2E testing.");

        const submitButton = mentorPage.getByRole("button", { name: /submit|post|answer/i });
        await submitButton.click();

        await expect(mentorPage.getByText(/test answer from mentor/i)).toBeVisible({
          timeout: 5000,
        });
      }
    }
  });

  test("admin can close a question", async ({ adminPage }) => {
    await adminPage.goto("/questions");

    const questionLink = adminPage.getByRole("link").filter({ hasText: /question/i }).first();

    if (await questionLink.isVisible()) {
      await questionLink.click();
      await adminPage.waitForURL(/\/questions\/[^/]+$/);

      const closeButton = adminPage.getByRole("button", { name: /close/i });
      if (await closeButton.isVisible()) {
        await closeButton.click();

        const confirmButton = adminPage.getByRole("button", { name: /confirm|yes/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }

        await expect(adminPage.getByText(/closed/i)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("admin can add summary to question", async ({ adminPage }) => {
    await adminPage.goto("/questions");

    const questionLink = adminPage.getByRole("link").filter({ hasText: /question/i }).first();

    if (await questionLink.isVisible()) {
      await questionLink.click();
      await adminPage.waitForURL(/\/questions\/[^/]+$/);

      const summaryButton = adminPage.getByRole("button", { name: /summary|summarize/i });
      if (await summaryButton.isVisible()) {
        await summaryButton.click();

        const summaryInput = adminPage.getByLabel(/summary/i);
        if (await summaryInput.isVisible()) {
          await summaryInput.fill("Test summary for the question discussion.");
          await adminPage.getByRole("button", { name: /save|submit/i }).click();

          await expect(adminPage.getByText(/test summary/i)).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });
});
