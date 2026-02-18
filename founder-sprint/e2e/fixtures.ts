import { test as base, expect, Page } from "@playwright/test";
import path from "path";

type TestUser = "admin" | "founder" | "mentor";

interface TestFixtures {
  adminPage: Page;
  founderPage: Page;
  mentorPage: Page;
}

function authFile(role: TestUser): string {
  return path.join(__dirname, ".auth", `${role}.json`);
}

export const test = base.extend<TestFixtures>({
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile("admin") });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  founderPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile("founder") });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  mentorPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: authFile("mentor") });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect };
