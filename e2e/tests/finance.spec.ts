import { expect, test, type Page } from "@playwright/test";
import { DASHBOARD, fixture } from "../support/fixture";
import { signInAs } from "../support/session";

// An invoice on the fixture booking, paid in two parts. The database keeps
// the status in step with payments and refuses paying more than is owed.
test.describe.configure({ mode: "serial" });

let page: Page;
const run = () => fixture();
const invoiceNumber = () => `INV-E2E-${run().runId}`.toUpperCase();

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  page = await browser.newPage();
  await signInAs(page, run().owner, DASHBOARD);
  await page.goto(`${DASHBOARD}/bookings/${run().bookingId}`);
  await page.getByRole("tab", { name: "Finance" }).click();
});

test.afterAll(async () => {
  await page.close();
});

async function addPayment(amount: string) {
  await page.getByRole("button", { name: "Add Payment" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("#payment-amount").fill(amount);
  await dialog.locator("#payment-method").selectOption("cash");
  await dialog.getByRole("button", { name: "Add Payment" }).click();
  return dialog;
}

test("the owner issues an invoice for the booking", async () => {
  await page.getByRole("button", { name: "Add Invoice" }).first().click();
  const dialog = page.getByRole("dialog");
  await dialog.locator("#invoice-number").fill(invoiceNumber());
  await dialog.locator("#invoice-total").fill("1000");
  await dialog.getByRole("button", { name: "Add Invoice" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(invoiceNumber())).toBeVisible();
});

test("a part payment marks the invoice partially paid", async () => {
  const dialog = await addPayment("400");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Partially Paid").first()).toBeVisible();
});

test("paying more than the remaining balance is refused with a clear message", async () => {
  const dialog = await addPayment("700");
  await expect(dialog.getByText("This payment is more than the invoice's remaining balance.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Partially Paid").first()).toBeVisible();
});

test("paying the rest marks the invoice paid", async () => {
  const dialog = await addPayment("600");
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Paid", { exact: true }).first()).toBeVisible();
});
