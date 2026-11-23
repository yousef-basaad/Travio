import { expect, test, type Page } from "@playwright/test";
import { DASHBOARD, PORTAL, fixture } from "../support/fixture";
import { signInAs } from "../support/session";

// On a phone-sized screen nothing should scroll sideways.
test.use({ viewport: { width: 390, height: 844 } });

async function expectNoSidewaysScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("dashboard pages fit a phone screen", async ({ page }) => {
  const run = fixture();
  await signInAs(page, run.owner, DASHBOARD);
  for (const path of ["/", "/customers", "/bookings", `/bookings/${run.bookingId}`, "/finance"]) {
    await page.goto(`${DASHBOARD}${path}`);
    await page.waitForLoadState("networkidle");
    await expectNoSidewaysScroll(page);
  }
});

test("portal pages fit a phone screen", async ({ page }) => {
  const run = fixture();
  await signInAs(page, run.portalUser, PORTAL);
  for (const path of ["/bookings", `/bookings/${run.bookingId}`, "/finance", "/profile"]) {
    await page.goto(`${PORTAL}${path}`);
    await page.waitForLoadState("networkidle");
    await expectNoSidewaysScroll(page);
  }
});
