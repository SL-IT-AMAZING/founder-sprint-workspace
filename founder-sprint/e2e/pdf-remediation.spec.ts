import { test, expect } from "./fixtures";
import { format } from "date-fns";

function futureDateRange(daysFromNow: number) {
  const start = new Date();
  start.setDate(start.getDate() + daysFromNow);
  start.setHours(11, 0, 0, 0);

  const end = new Date(start);
  end.setHours(12, 0, 0, 0);

  return {
    start,
    end,
    startValue: start.toISOString().slice(0, 16),
    endValue: end.toISOString().slice(0, 16),
  };
}

test.describe("PDF remediation", () => {
  test.describe.configure({ mode: "serial" });

  test("schedule create flow matches PDF choices and filtered dates get highlighted", async ({ adminPage }) => {
    const { start, startValue, endValue } = futureDateRange(2);
    const expectedLabel = format(start, "EEEE, MMMM d, yyyy");

    await adminPage.goto("/schedule", { waitUntil: "domcontentloaded" });

    const createButton = adminPage.getByRole("button", { name: /create event/i }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();

    await expect(adminPage.getByRole("button", { name: "Event: In-person" })).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "Event: Virtual" })).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "General Session" }).nth(1)).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "Office Hour" }).nth(1)).toBeVisible();

    await adminPage.getByRole("button", { name: "Event: In-person" }).click();
    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal).toContainText(/create event: in-person/i);

    await modal.getByLabel(/title/i).fill(`PDF QA In-person ${Date.now()}`);
    await modal.getByLabel(/start time/i).fill(startValue);
    await modal.getByLabel(/end time/i).fill(endValue);
    await modal.getByLabel(/timezone/i).selectOption("Asia/Seoul");
    await modal.getByRole("button", { name: /^create event$/i }).click();
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    await adminPage.getByRole("button", { name: "In-person" }).click();
    await expect(adminPage).toHaveURL(/type=in_person/);
    await adminPage.waitForLoadState("networkidle");
    const highlightedCount = await adminPage.locator('button[aria-label]').evaluateAll((nodes) =>
      nodes.filter((node) => {
        const style = window.getComputedStyle(node as HTMLElement);
        return style.boxShadow !== "none" && style.borderRadius === "8px";
      }).length
    );

    expect(highlightedCount).toBeGreaterThan(0);
  });

  test("events page create modal and filters match PDF-facing categories", async ({ adminPage }) => {
    await adminPage.goto("/events", { waitUntil: "domcontentloaded" });

    await expect(adminPage.getByRole("button", { name: "In-person" })).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "Virtual" })).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "General Session" })).toBeVisible();
    await expect(adminPage.getByRole("button", { name: "Office Hour" })).toBeVisible();

    await adminPage.getByRole("button", { name: "Create Event" }).click();
    const modal = adminPage.locator("dialog[open]").first();
    await expect(modal.getByRole("button", { name: "Event: In-person" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Event: Virtual" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "General Session" })).toBeVisible();
    await expect(modal.getByRole("button", { name: "Office Hour" })).toBeVisible();
  });
});
