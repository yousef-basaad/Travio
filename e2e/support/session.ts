import { expect, type Page } from "@playwright/test";
import { PASSWORD, type Account } from "./fixture";

// Signs in through the real login form of the dashboard or the portal
// (both post to the same signInWithPassword action) and waits until the
// app has moved past /login.
export async function signInAs(page: Page, account: Account, baseUrl: string, password = PASSWORD): Promise<void> {
  await page.goto(`${baseUrl}/login`);
  await page.locator('input[name="email"]').fill(account.email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}
