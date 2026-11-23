import { expect, test } from "@playwright/test";
import { DASHBOARD, PORTAL, fixture } from "../support/fixture";
import { signInAs } from "../support/session";

test.describe("sales agent", () => {
  test.beforeEach(async ({ page }) => {
    await signInAs(page, fixture().agent, DASHBOARD);
  });

  test("sees their own customer but no finance section", async ({ page }) => {
    const run = fixture();
    await page.goto(`${DASHBOARD}/customers`);
    await expect(page.getByText(run.customerName).first()).toBeVisible();

    const sidebar = page.getByRole("navigation").first();
    await expect(sidebar.getByRole("link", { name: "Bookings" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Finance" })).toHaveCount(0);
  });

  test("is refused by the finance and team APIs", async ({ page }) => {
    for (const path of ["/api/invoices", "/api/expenses", "/api/team"]) {
      const response = await page.request.get(`${DASHBOARD}${path}`);
      expect(response.status(), path).toBe(403);
    }
  });

  test("sees the assigned staff member's name, not an id", async ({ page }) => {
    const run = fixture();
    await page.goto(`${DASHBOARD}/customers/${run.customerId}`);
    await expect(page.getByText(run.agent.fullName).first()).toBeVisible();
    await expect(page.getByText(run.agent.id)).toHaveCount(0);
  });
});

test("agency staff can't use the customer portal", async ({ page }) => {
  await signInAs(page, fixture().owner, PORTAL);
  await expect(page).toHaveURL(/\/forbidden/);
});
