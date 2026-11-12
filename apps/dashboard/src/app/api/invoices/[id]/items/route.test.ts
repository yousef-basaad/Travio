import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, ID, jsonRequest, params, TENANT_ID } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireFinanceAccess: vi.fn(),
  invoices: { getById: vi.fn() },
  items: { listByInvoice: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireFinanceAccess: mocks.requireFinanceAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  invoiceService: mocks.invoices,
  invoiceItemsService: mocks.items,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { POST } from "./route";

const valid = { description: "Hotel, 3 nights", quantity: 3, unitPrice: 200, total: 600 };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireFinanceAccess.mockResolvedValue(allowed());
  mocks.invoices.getById.mockResolvedValue({ id: ID });
  mocks.items.create.mockImplementation(async (_supabase: unknown, input: object) => ({ id: "new", ...input }));
});

describe("POST /api/invoices/:id/items", () => {
  it.each([
    ["a missing description", { ...valid, description: "" }],
    ["an over-long description", { ...valid, description: "x".repeat(1001) }],
    ["a zero quantity", { ...valid, quantity: 0 }],
    ["a fractional quantity", { ...valid, quantity: 1.5 }],
    ["a negative unit price", { ...valid, unitPrice: -1 }],
    ["an unknown item type", { ...valid, itemType: "cruise" }],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(jsonRequest("POST", body), params());
    expect(response.status).toBe(400);
    expect(mocks.items.create).not.toHaveBeenCalled();
  });

  it("returns 404 for an invoice the caller can't see", async () => {
    mocks.invoices.getById.mockResolvedValue(null);
    const response = await POST(jsonRequest("POST", valid), params());
    expect(response.status).toBe(404);
    expect(mocks.items.create).not.toHaveBeenCalled();
  });

  it("takes the tenant from the session and the invoice from the URL", async () => {
    const response = await POST(jsonRequest("POST", { ...valid, tenantId: "evil", invoiceId: "evil" }), params());
    expect(response.status).toBe(201);
    const input = mocks.items.create.mock.calls[0]![1];
    expect(input.tenantId).toBe(TENANT_ID);
    expect(input.invoiceId).toBe(ID);
  });

  it("reports a total that would drop below what's paid as 409", async () => {
    mocks.items.create.mockRejectedValue(dbError("PL002", "invoice_total_below_paid"));
    const response = await POST(jsonRequest("POST", valid), params());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "invoice_total_below_paid" });
  });
});
