import { test as base, expect, Page } from "@playwright/test";

type TestUser = "admin" | "founder" | "mentor";

interface TestFixtures {
  adminPage: Page;
  founderPage: Page;
  mentorPage: Page;
  loginAs: (page: Page, role: TestUser) => Promise<void>;
}

const TEST_EMAILS: Record<TestUser, string> = {
  admin: "test-admin@example.com",
  founder: "test-founder@example.com",
  mentor: "test-mentor@example.com",
};

async function loginAs(page: Page, role: TestUser): Promise<void> {
  const email = TEST_EMAILS[role];

  const response = await page.request.post("/api/test-auth", {
    data: { email, role },
  });

  if (!response.ok()) {
    const body = await response.json();
    throw new Error(`Login failed: ${body.error || response.statusText()}`);
  }

  await page.goto("/dashboard");
  await page.waitForURL(/\/(dashboard|no-batch)/);
}

export const test = base.extend<TestFixtures>({
  loginAs: async ({}, use) => {
    await use(loginAs);
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "admin");
    await use(page);
    await context.close();
  },

  founderPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "founder");
    await use(page);
    await context.close();
  },

  mentorPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "mentor");
    await use(page);
    await context.close();
  },
});

export { expect };
