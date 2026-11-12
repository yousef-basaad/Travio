import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, jsonRequest, refused, TENANT_ID } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireFinanceAccess: vi.fn(),
  expenses: { list: vi.fn(), listPage: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireFinanceAccess: mocks.requireFinanceAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  expenseService: mocks.expenses,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { POST } from "./route";

const valid = { title: "Office rent", amount: 3000, category: "rent", expenseDate: "2026-11-01" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireFinanceAccess.mockResolvedValue(allowed("accountant"));
  mocks.expenses.create.mockImplementation(async (_supabase: unknown, input: object) => ({ id: "new", ...input }));
});

describe("POST /api/expenses", () => {
  it("passes an auth refusal through", async () => {
    mocks.requireFinanceAccess.mockResolvedValue(refused());
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(403);
    expect(mocks.expenses.create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(jsonRequest("POST", "{"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_json");
  });

  it.each([
    ["a missing title", { ...valid, title: "" }],
    ["a zero amount", { ...valid, amount: 0 }],
    ["an amount sent as text", { ...valid, amount: "3000" }],
    ["an over-long description", { ...valid, description: "x".repeat(1001) }],
    ["a date that isn't a date", { ...valid, expenseDate: "2026-13-01" }],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(jsonRequest("POST", body));
    expect(response.status).toBe(400);
    expect(mocks.expenses.create).not.toHaveBeenCalled();
  });

  it("takes the tenant from the session, not the body", async () => {
    const response = await POST(jsonRequest("POST", { ...valid, tenantId: "evil" }));
    expect(response.status).toBe(201);
    expect(mocks.expenses.create.mock.calls[0]![1].tenantId).toBe(TENANT_ID);
  });

  it("maps a check-constraint failure to 400", async () => {
    mocks.expenses.create.mockRejectedValue(dbError("23514"));
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_input");
  });
});
