import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, getRequest, ID, jsonRequest, params, refused, TENANT_ID } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireFinanceAccess: vi.fn(),
  invoices: { getById: vi.fn() },
  payments: { listByInvoice: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireFinanceAccess: mocks.requireFinanceAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  invoiceService: mocks.invoices,
  paymentService: mocks.payments,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { GET, POST } from "./route";

const valid = { amount: 50, method: "cash", paidAt: "2026-11-05" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireFinanceAccess.mockResolvedValue(allowed("accountant"));
  mocks.invoices.getById.mockResolvedValue({ id: ID, total: 100 });
  mocks.payments.create.mockImplementation(async (_supabase: unknown, input: object) => ({ id: "new", ...input }));
});

describe("GET /api/invoices/:id/payments", () => {
  it("returns 404 for an invoice the caller can't see", async () => {
    mocks.invoices.getById.mockResolvedValue(null);
    const response = await GET(getRequest(), params());
    expect(response.status).toBe(404);
    expect(mocks.payments.listByInvoice).not.toHaveBeenCalled();
  });

  it("lists the invoice's payments", async () => {
    mocks.payments.listByInvoice.mockResolvedValue([{ id: "p1" }]);
    const response = await GET(getRequest(), params());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([{ id: "p1" }]);
  });
});

describe("POST /api/invoices/:id/payments", () => {
  it("passes an auth refusal through", async () => {
    mocks.requireFinanceAccess.mockResolvedValue(refused());
    const response = await POST(jsonRequest("POST", valid), params());
    expect(response.status).toBe(403);
    expect(mocks.payments.create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(jsonRequest("POST", "nope"), params());
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_json");
  });

  it.each([
    ["a zero amount", { ...valid, amount: 0 }],
    ["a negative amount", { ...valid, amount: -10 }],
    ["an unknown method", { ...valid, method: "cheque" }],
    ["an over-long reference", { ...valid, reference: "x".repeat(61) }],
    ["a date that isn't a date", { ...valid, paidAt: "yesterday" }],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(jsonRequest("POST", body), params());
    expect(response.status).toBe(400);
    expect(mocks.payments.create).not.toHaveBeenCalled();
  });

  it("returns 404 for an invoice the caller can't see", async () => {
    mocks.invoices.getById.mockResolvedValue(null);
    const response = await POST(jsonRequest("POST", valid), params());
    expect(response.status).toBe(404);
    expect(mocks.payments.create).not.toHaveBeenCalled();
  });

  it("takes the tenant from the session and the invoice from the URL", async () => {
    const response = await POST(jsonRequest("POST", { ...valid, tenantId: "evil", invoiceId: "evil" }), params());
    expect(response.status).toBe(201);
    const input = mocks.payments.create.mock.calls[0]![1];
    expect(input.tenantId).toBe(TENANT_ID);
    expect(input.invoiceId).toBe(ID);
  });

  it("reports a payment above the balance as 409", async () => {
    mocks.payments.create.mockRejectedValue(dbError("PL002", "payment_exceeds_balance"));
    const response = await POST(jsonRequest("POST", { ...valid, amount: 500 }), params());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "payment_exceeds_balance" });
  });

  it("hides an unexpected database error behind a 500", async () => {
    mocks.payments.create.mockRejectedValue(dbError("XX000", "disk on fire"));
    const response = await POST(jsonRequest("POST", valid), params());
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "internal_error" });
  });
});
