import { describe, it, expect, vi, afterEach } from "vitest";
import {
  createCustomer,
  CreateCustomerValidationError,
  toCreateCustomerErrors,
} from "./customers.api";

const GENERIC = "Couldn't create the customer. Please try again.";

describe("toCreateCustomerErrors", () => {
  it("maps each API issue to its field", () => {
    expect(
      toCreateCustomerErrors({
        error: "invalid_input",
        issues: [
          { path: ["fullName"], message: "Full name is required" },
          { path: ["email"], message: "Enter a valid email" },
        ],
      }),
    ).toEqual({
      fieldErrors: { fullName: "Full name is required", email: "Enter a valid email" },
      formError: null,
    });
  });

  it("keeps the first message when a field has several issues", () => {
    expect(
      toCreateCustomerErrors({
        issues: [
          { path: ["passportExpiry"], message: "Invalid date" },
          { path: ["passportExpiry"], message: "Second message" },
        ],
      }).fieldErrors,
    ).toEqual({ passportExpiry: "Invalid date" });
  });

  it("puts issues for fields the form doesn't show into the general message", () => {
    expect(
      toCreateCustomerErrors({
        issues: [
          { path: ["email"], message: "Enter a valid email" },
          { path: ["assignedTo"], message: "Invalid uuid" },
        ],
      }),
    ).toEqual({ fieldErrors: { email: "Enter a valid email" }, formError: GENERIC });
  });

  it("falls back to the general message when there are no usable issues", () => {
    expect(toCreateCustomerErrors({ error: "invalid_input" })).toEqual({
      fieldErrors: {},
      formError: GENERIC,
    });
    expect(toCreateCustomerErrors(null)).toEqual({ fieldErrors: {}, formError: GENERIC });
  });
});

describe("createCustomer", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function stubFetch(status: number, body: unknown) {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(body), { status }));
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  }

  it("POSTs the input as JSON to /api/customers and returns the created customer", async () => {
    const fetchMock = stubFetch(201, { id: "customer-1", fullName: "Sara Ali" });
    const input = { fullName: "Sara Ali", email: "sara@example.com", passportExpiry: "2030-01-31" };

    await expect(createCustomer(input)).resolves.toEqual({ id: "customer-1", fullName: "Sara Ali" });
    expect(fetchMock).toHaveBeenCalledWith("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
  });

  it("throws CreateCustomerValidationError with per-field messages on a 400", async () => {
    stubFetch(400, {
      error: "invalid_input",
      issues: [{ path: ["email"], message: "Enter a valid email" }],
    });

    const error = await createCustomer({ fullName: "Sara", email: "nope" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(CreateCustomerValidationError);
    expect((error as CreateCustomerValidationError).fieldErrors).toEqual({ email: "Enter a valid email" });
    expect((error as CreateCustomerValidationError).formError).toBeNull();
  });

  it("throws a plain error (not a validation error) for other failures", async () => {
    stubFetch(403, { error: "forbidden" });

    const error = await createCustomer({ fullName: "Sara" }).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(CreateCustomerValidationError);
    expect((error as Error).message).toBe("Failed to create customer (403)");
  });
});
