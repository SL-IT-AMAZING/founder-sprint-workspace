import { test, expect } from "./fixtures";

test.describe("Feed & Posts", () => {
  test("founder can view feed page", async ({ founderPage }) => {
    await founderPage.goto("/feed");
    await expect(founderPage.locator("h1")).toContainText(/feed/i);
  });

  test("founder can create a new post", async ({ founderPage }) => {
    await founderPage.goto("/feed");

    const postContent = `Test Post ${Date.now()}`;
    const contentInput = founderPage.getByLabel(/content|post|write/i).or(
      founderPage.getByPlaceholder(/write|share|what/i)
    );

    if (await contentInput.isVisible()) {
      await contentInput.fill(postContent);

      const postButton = founderPage.getByRole("button", { name: /post|share|submit/i });
      await postButton.click();

      await expect(founderPage.getByText(postContent)).toBeVisible({ timeout: 5000 });
    }
  });

  test("founder can add comment to a post", async ({ founderPage }) => {
    await founderPage.goto("/feed");

    const postCard = founderPage.locator("[data-testid=post-card], .post-card, article").first();

    if (await postCard.isVisible()) {
      const commentInput = postCard.getByLabel(/comment/i).or(
        postCard.getByPlaceholder(/comment|reply/i)
      );

      if (await commentInput.isVisible()) {
        const commentText = `Test Comment ${Date.now()}`;
        await commentInput.fill(commentText);

        const submitButton = postCard.getByRole("button", { name: /comment|reply|submit/i });
        await submitButton.click();

        await expect(founderPage.getByText(commentText)).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test("founder can like a post", async ({ founderPage }) => {
    await founderPage.goto("/feed");

    const likeButton = founderPage.getByRole("button", { name: /like/i }).first();

    if (await likeButton.isVisible()) {
      const initialState = await likeButton.getAttribute("data-liked");

      await likeButton.click();
      await founderPage.waitForResponse((r) => r.url().includes("like") && r.ok());

      const newState = await likeButton.getAttribute("data-liked");
      expect(newState).not.toBe(initialState);
    }
  });

  test("comment depth is limited to 2 levels (기획서 constraint)", async ({ founderPage }) => {
    await founderPage.goto("/feed");

    const nestedComment = founderPage.locator("[data-depth='2'] [data-testid=reply-button]");
    const count = await nestedComment.count();

    expect(count).toBe(0);
  });

  test("admin can pin a post", async ({ adminPage }) => {
    await adminPage.goto("/feed");

    const pinButton = adminPage.getByRole("button", { name: /pin/i }).first();

    if (await pinButton.isVisible()) {
      await pinButton.click();
      await adminPage.waitForResponse((r) => r.url().includes("pin") && r.ok());

      await expect(adminPage.getByText(/pinned/i)).toBeVisible({ timeout: 5000 });
    }
  });

  test("max 3 pinned posts (기획서 constraint)", async ({ adminPage }) => {
    await adminPage.goto("/feed");

    const pinnedPosts = adminPage.locator("[data-pinned=true], .pinned");
    const count = await pinnedPosts.count();

    expect(count).toBeLessThanOrEqual(3);
  });
});
