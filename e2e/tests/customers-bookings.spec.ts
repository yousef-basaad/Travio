import { expect, test, type Page } from "@playwright/test";
import { DASHBOARD, fixture } from "../support/fixture";
import { signInAs } from "../support/session";

// The owner's core loop: add a customer, book a trip for them, move the
// booking through its statuses.
test.describe.configure({ mode: "serial" });

let page: Page;
const run = () => fixture();
const customerName = () => `E2E Customer ${run().runId}`;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(120_000);
  page = await browser.newPage();
  await signInAs(page, run().owner, DASHBOARD);
});

test.afterAll(async () => {
  await page.close();
});

test("the owner adds a customer", async () => {
  await page.goto(`${DASHBOARD}/customers`);
  await page.getByRole("button", { name: "New Customer" }).first().click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full Name").fill(customerName());
  await dialog.getByLabel("Phone").fill("+966 50 000 0000");
  await dialog.getByLabel("Email").fill(`e2e-${run().runId}-new@local.test`);
  await dialog.getByRole("button", { name: "Create Customer" }).click();

  await expect(dialog).toBeHidden();
  await expect(page.getByText(customerName()).first()).toBeVisible();
});

test("a phone number with letters is refused", async () => {
  await page.goto(`${DASHBOARD}/customers`);
  await page.getByRole("button", { name: "New Customer" }).first().click();

  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full Name").fill("Should Not Exist");
  await dialog.getByLabel("Phone").fill("call me maybe");
  await dialog.getByRole("button", { name: "Create Customer" }).click();

  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Enter a valid phone number.")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("a booking can't end before it starts, and is created once fixed", async () => {
  await page.goto(`${DASHBOARD}/bookings/new`);
  await page.getByLabel("Customer").selectOption({ label: customerName() });
  await page.getByLabel("Title").fill(`E2E Booking ${run().runId}`);
  await page.getByLabel("Start Date").fill("2027-03-10");
  await page.getByLabel("End Date").fill("2027-03-05");
  await page.getByRole("button", { name: "Create Booking" }).click();

  await expect(page).toHaveURL(/\/bookings\/new/);
  await expect(page.locator("#booking-end-date-error, [id$='end-date-error']").first()).toBeVisible();

  await page.getByLabel("End Date").fill("2027-03-15");
  await page.getByRole("button", { name: "Create Booking" }).click();

  await expect(page).toHaveURL(/\/bookings\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { name: /^#BK-/ })).toBeVisible();
  await expect(page.getByText(`E2E Booking ${run().runId}`).first()).toBeVisible();
});

test("the status picker offers only allowed moves, and a change sticks", async () => {
  const status = page.getByLabel("Change booking status");
  await expect(status).toHaveValue("draft");

  // A draft can't jump straight to completed (database rule, mirrored here).
  const options = await status.locator("option").evaluateAll((els) => els.map((el) => (el as HTMLOptionElement).value));
  expect(options).toEqual(["draft", "pending", "confirmed", "cancelled"]);

  await status.selectOption("confirmed");
  await expect(status).toHaveValue("confirmed");

  await page.reload();
  await expect(page.getByLabel("Change booking status")).toHaveValue("confirmed");
});
