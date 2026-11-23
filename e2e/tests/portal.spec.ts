import { expect, test } from "@playwright/test";
import { PORTAL, fixture } from "../support/fixture";
import { signInAs } from "../support/session";

// The portal is Arabic by default; this browser context starts with no
// language cookie, so it sees what a new customer sees.
test.describe("customer portal", () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    await signInAs(page, fixture().portalUser, PORTAL);
  });

  test("opens in Arabic, right to left, with the customer's booking", async ({ page }) => {
    const run = fixture();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.getByRole("heading", { name: "حجوزاتي" })).toBeVisible();
    await expect(page.getByText(run.bookingTitle)).toBeVisible();
  });

  test("shows the booking's details", async ({ page }) => {
    const run = fixture();
    await page.goto(`${PORTAL}/bookings/${run.bookingId}`);
    await expect(page.getByRole("heading", { name: run.bookingTitle })).toBeVisible();
    await expect(page.getByText("تفاصيل الرحلة")).toBeVisible();
  });

  test("switches to English and back", async ({ page }) => {
    await page.getByRole("button", { name: "Switch to English" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { name: "My Bookings" })).toBeVisible();

    await page.getByRole("button", { name: "التبديل إلى العربية" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("another customer's booking looks like it doesn't exist", async ({ page }) => {
    // A random id: RLS makes someone else's booking indistinguishable.
    await page.goto(`${PORTAL}/bookings/00000000-0000-4000-8000-000000000000`);
    await expect(page.getByText("الحجز غير موجود")).toBeVisible();
  });
});
