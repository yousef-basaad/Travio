import { expect, test } from "@playwright/test";
import { DASHBOARD, fixture } from "../support/fixture";
import { signInAs } from "../support/session";

test.describe("dashboard sign-in", () => {
  test("a wrong password stays on the login page with an error", async ({ page }) => {
    const run = fixture();
    await page.goto(`${DASHBOARD}/login`);
    await page.locator('input[name="email"]').fill(run.owner.email);
    await page.locator('input[name="password"]').fill("not-the-password");
    await page.locator('form button[type="submit"]').click();

    await expect(page.getByRole("alert")).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("the owner signs in and lands on their agency's dashboard", async ({ page }) => {
    const run = fixture();
    await signInAs(page, run.owner, DASHBOARD);

    await expect(page.getByText(run.owner.fullName).first()).toBeVisible();
    await expect(page.getByText(run.bookingTitle).first()).toBeVisible();
  });

  test("a page behind sign-in sends a visitor to /login", async ({ page }) => {
    await page.goto(`${DASHBOARD}/customers`);
    await expect(page).toHaveURL(/\/login/);
  });
});
