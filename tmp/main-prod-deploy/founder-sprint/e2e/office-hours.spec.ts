import { test, expect } from "./fixtures";

function futureDateRange(daysFromNow: number) {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(14, 0, 0, 0);

  const end = new Date(start);
  end.setMinutes(end.getMinutes() + 30);

  return {
    start: start.toISOString().slice(0, 16),
    end: end.toISOString().slice(0, 16),
  };
}

test.describe("Office Hours", () => {
  test.describe.configure({ mode: "serial" });

  test("admin can view office hours page", async ({ adminPage }) => {
    test.slow();
    await adminPage.goto("/office-hours", { waitUntil: "domcontentloaded" });
    await expect(adminPage).toHaveURL(/\/office-hours/);
    await expect(adminPage.locator("h1")).toContainText(/office.*hour/i);
    await expect(adminPage.getByRole("button", { name: /schedule office hour/i }).first()).toBeVisible();
  });

  test("admin can schedule an individual office hour for a founder", async ({ adminPage }) => {
    await adminPage.goto("/office-hours", { waitUntil: "domcontentloaded" });

    await adminPage.getByRole("button", { name: /schedule office hour/i }).first().click();

    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal).toBeVisible();
    await expect(modal.getByText(/schedule office hour/i)).toBeVisible();

    await modal.getByRole("button", { name: /primary founder/i }).click();
    await modal.getByRole("button", { name: /search by founder name or email/i }).click();
    await modal.getByPlaceholder("Search...").fill("@");
    await modal.locator("button").filter({ hasText: /@/ }).first().click();

    const { start, end } = futureDateRange(1);
    await modal.getByLabel(/start time/i).fill(start);
    await modal.getByLabel(/end time/i).fill(end);
    await modal.getByRole("button", { name: /schedule & send invite/i }).click();

    await expect(modal).not.toBeVisible({ timeout: 5000 });
    await expect(adminPage.getByText(/confirmed/i).first()).toBeVisible();
  });

  test("admin cannot schedule office hours in the past", async ({ adminPage }) => {
    await adminPage.goto("/office-hours", { waitUntil: "domcontentloaded" });

    await adminPage.getByRole("button", { name: /schedule office hour/i }).first().click();

    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal).toBeVisible();

    const companySelect = modal.getByLabel(/company/i);
    const optionCount = await companySelect.locator("option").count();
    test.skip(optionCount <= 1, "No company options available for admin scheduling.");
    await companySelect.selectOption({ index: 1 });

    const start = new Date();
    start.setDate(start.getDate() - 1);
    start.setHours(14, 0, 0, 0);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + 30);

    await modal.getByLabel(/start time/i).fill(start.toISOString().slice(0, 16));
    await modal.getByLabel(/end time/i).fill(end.toISOString().slice(0, 16));
    await modal.getByRole("button", { name: /schedule & send invites/i }).click();

    await expect(adminPage.getByText(/past|cannot schedule/i).first()).toBeVisible();
  });

  test("founder does not see create or schedule admin actions", async ({ founderPage }) => {
    await founderPage.goto("/office-hours", { waitUntil: "domcontentloaded" });

    await expect(founderPage.getByRole("button", { name: /create slot/i })).toHaveCount(0);
    await expect(founderPage.getByRole("button", { name: /schedule office hour/i })).toHaveCount(0);
  });
});
