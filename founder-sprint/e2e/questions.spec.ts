import { test, expect } from "./fixtures";

test.describe("Questions", () => {
  test.describe.configure({ mode: "serial" });

  let createdQuestionTitle: string | null = null;
  let createdQuestionUrl: string | null = null;

  test("founder can view questions page", async ({ founderPage }) => {
    await founderPage.goto("/questions");
    await expect(founderPage.locator("h1")).toContainText(/question/i);
  });

  test("founder can create a new question", async ({ founderPage }) => {
    await founderPage.goto("/questions/new");

    const isReadOnlyBatch = (await founderPage.locator("text=This batch has ended").count()) > 0;
    test.skip(isReadOnlyBatch, "Batch is read-only (ended), so question creation is unavailable.");

    const titleInput = founderPage.getByLabel(/title|subject/i);
    const questionTitle = `Test Question ${Date.now()}`;
    createdQuestionTitle = questionTitle;
    await titleInput.fill(questionTitle);

    await founderPage.getByLabel(/details|content|body|description/i).fill(
      "This is a test question for E2E testing. What are your thoughts?"
    );

    const submitButton = founderPage.getByRole("button", { name: /submit|create|post/i });
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    const batchEnded = (await founderPage.locator("text=This batch has ended").count()) > 0;
    if (batchEnded) {
      test.skip(true, "Batch is read-only (ended)");
      return;
    }

    await founderPage.waitForURL(/\/questions\/(?!new)[^/]+$/);
    createdQuestionUrl = new URL(founderPage.url()).pathname;
    await expect(founderPage.getByText(questionTitle)).toBeVisible();
  });

  test("mentor can answer a question", async ({ mentorPage }) => {
    test.skip(!createdQuestionUrl, "No question was created in this run.");

    await mentorPage.goto(createdQuestionUrl!);

    const answerInput = mentorPage.getByPlaceholder(/write your answer/i);
    await expect(answerInput).toBeVisible({ timeout: 15000 });

    await answerInput.fill("This is a test answer from mentor for E2E testing.");

    await mentorPage.getByRole("button", { name: /submit answer|submit|answer/i }).click();
    await expect(mentorPage.getByText(/test answer from mentor/i)).toBeVisible({ timeout: 10000 });
  });

  test("admin can close a question", async ({ adminPage }) => {
    test.skip(!createdQuestionUrl, "No question was created in this run.");

    await adminPage.goto(createdQuestionUrl!);
    await adminPage.waitForLoadState("domcontentloaded");

    await adminPage.getByPlaceholder(/write a summary that closes this question/i).fill(
      "Closing this test question via summary from admin."
    );
    await adminPage.getByRole("button", { name: /create summary.*close question/i }).click();

    await expect(adminPage.getByText(/closed/i).first()).toBeVisible({ timeout: 10000 });
  });

  test("admin can add summary to question", async ({ adminPage }) => {
    await adminPage.goto("/questions");

    const closedQuestionLink = adminPage
      .locator('main a[href^="/questions/"]')
      .filter({ hasText: /closed/i })
      .first();

    const closedCount = await adminPage.locator('main a[href^="/questions/"]').filter({ hasText: /closed/i }).count();
    test.skip(closedCount === 0, "No closed questions with summaries are available.");

    await closedQuestionLink.click();
    await adminPage.waitForURL(/\/questions\/[^/]+$/);
    await expect(adminPage.getByText(/summary/i)).toBeVisible();
  });
});
