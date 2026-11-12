import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, getRequest, ID, jsonRequest, params, refused } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireFinanceAccess: vi.fn(),
  payments: { getById: vi.fn(), update: vi.fn(), delete: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireFinanceAccess: mocks.requireFinanceAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  paymentService: mocks.payments,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { DELETE, PATCH } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireFinanceAccess.mockResolvedValue(allowed());
  mocks.payments.getById.mockResolvedValue({ id: ID, amount: 50 });
  mocks.payments.update.mockImplementation(async (_supabase: unknown, id: string, input: object) => ({ id, ...input }));
});

describe("PATCH /api/payments/:id", () => {
  it("passes an auth refusal through", async () => {
    mocks.requireFinanceAccess.mockResolvedValue(refused());
    const response = await PATCH(jsonRequest("PATCH", { amount: 10 }), params());
    expect(response.status).toBe(403);
    expect(mocks.payments.update).not.toHaveBeenCalled();
  });

  it("rejects a zero amount", async () => {
    const response = await PATCH(jsonRequest("PATCH", { amount: 0 }), params());
    expect(response.status).toBe(400);
    expect(mocks.payments.update).not.toHaveBeenCalled();
  });

  it("returns 404 for a payment the caller can't see", async () => {
    mocks.payments.getById.mockResolvedValue(null);
    const response = await PATCH(jsonRequest("PATCH", { amount: 10 }), params());
    expect(response.status).toBe(404);
    expect(mocks.payments.update).not.toHaveBeenCalled();
  });

  it("reports raising a payment above the balance as 409", async () => {
    mocks.payments.update.mockRejectedValue(dbError("PL002", "payment_exceeds_balance"));
    const response = await PATCH(jsonRequest("PATCH", { amount: 9999 }), params());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "payment_exceeds_balance" });
  });

  it("updates and returns the payment", async () => {
    const response = await PATCH(jsonRequest("PATCH", { amount: 20 }), params());
    expect(response.status).toBe(200);
    expect(mocks.payments.update).toHaveBeenCalledWith({}, ID, { amount: 20 });
  });
});

describe("DELETE /api/payments/:id", () => {
  it("returns 404 for a payment the caller can't see", async () => {
    mocks.payments.getById.mockResolvedValue(null);
    const response = await DELETE(getRequest(), params());
    expect(response.status).toBe(404);
    expect(mocks.payments.delete).not.toHaveBeenCalled();
  });

  it("deletes and returns 204", async () => {
    const response = await DELETE(getRequest(), params());
    expect(response.status).toBe(204);
    expect(mocks.payments.delete).toHaveBeenCalledWith({}, ID);
  });
});
