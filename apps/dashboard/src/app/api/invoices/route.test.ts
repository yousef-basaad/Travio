import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, ID, jsonRequest, OTHER_ID, refused, TENANT_ID } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireFinanceAccess: vi.fn(),
  invoices: { list: vi.fn(), listPage: vi.fn(), create: vi.fn() },
  customers: { getById: vi.fn() },
  bookings: { getById: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireFinanceAccess: mocks.requireFinanceAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  invoiceService: mocks.invoices,
  customerService: mocks.customers,
  bookingsService: mocks.bookings,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { POST } from "./route";

const valid = { invoiceNumber: "INV-1", total: 100, issueDate: "2026-11-01", dueDate: "2026-11-30" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireFinanceAccess.mockResolvedValue(allowed("accountant"));
  mocks.customers.getById.mockResolvedValue({ id: ID });
  mocks.bookings.getById.mockResolvedValue({ id: OTHER_ID });
  mocks.invoices.create.mockImplementation(async (_supabase: unknown, input: object) => ({ id: "new", ...input }));
});

describe("POST /api/invoices", () => {
  it("passes an auth refusal through", async () => {
    mocks.requireFinanceAccess.mockResolvedValue(refused());
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(403);
    expect(mocks.invoices.create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(jsonRequest("POST", "{"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_json");
  });

  it.each([
    ["a due date before the issue date", { ...valid, dueDate: "2026-10-31" }],
    ["a negative total", { ...valid, total: -5 }],
    ["a missing invoice number", { ...valid, invoiceNumber: "" }],
    ["an over-long invoice number", { ...valid, invoiceNumber: "x".repeat(61) }],
    ["an unknown status", { ...valid, status: "lost" }],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(jsonRequest("POST", body));
    expect(response.status).toBe(400);
    expect(mocks.invoices.create).not.toHaveBeenCalled();
  });

  it("rejects a customer the caller can't see", async () => {
    mocks.customers.getById.mockResolvedValue(null);
    const response = await POST(jsonRequest("POST", { ...valid, customerId: ID }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_customer" });
  });

  it("rejects a booking the caller can't see", async () => {
    mocks.bookings.getById.mockResolvedValue(null);
    const response = await POST(jsonRequest("POST", { ...valid, bookingId: OTHER_ID }));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_booking" });
  });

  it("takes the tenant from the session, not the body", async () => {
    const response = await POST(jsonRequest("POST", { ...valid, tenantId: "evil" }));
    expect(response.status).toBe(201);
    expect(mocks.invoices.create.mock.calls[0]![1].tenantId).toBe(TENANT_ID);
  });

  it("reports a number already used in the agency as 409", async () => {
    mocks.invoices.create.mockRejectedValue(dbError("23505", "invoice_number_taken"));
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "invoice_number_taken" });
  });
});
