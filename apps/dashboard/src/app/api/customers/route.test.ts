import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, jsonRequest, refused, TENANT_ID } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireCustomersAccess: vi.fn(),
  customers: { list: vi.fn(), listPage: vi.fn(), create: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireCustomersAccess: mocks.requireCustomersAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  customerService: mocks.customers,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { POST } from "./route";

const valid = { fullName: "Sara Ali", phone: "+966 50 123 4567", email: "sara@example.com" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireCustomersAccess.mockResolvedValue(allowed("sales_agent"));
  mocks.customers.create.mockImplementation(async (_supabase: unknown, input: object) => ({ id: "new", ...input }));
});

describe("POST /api/customers", () => {
  it("passes an auth refusal through", async () => {
    mocks.requireCustomersAccess.mockResolvedValue(refused());
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(403);
    expect(mocks.customers.create).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(jsonRequest("POST", "{"));
    expect(response.status).toBe(400);
  });

  it.each([
    ["a missing name", { ...valid, fullName: "  " }],
    ["an over-long name", { ...valid, fullName: "x".repeat(201) }],
    ["a phone with letters", { ...valid, phone: "call me" }],
    ["an over-long phone", { ...valid, phone: "1".repeat(33) }],
    ["a bad email", { ...valid, email: "not-an-email" }],
    ["a passport expiry that isn't a date", { ...valid, passportExpiry: "soon" }],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(jsonRequest("POST", body));
    expect(response.status).toBe(400);
    expect(mocks.customers.create).not.toHaveBeenCalled();
  });

  it("accepts empty optional fields", async () => {
    const response = await POST(jsonRequest("POST", { fullName: "Sara Ali", phone: "", email: "" }));
    expect(response.status).toBe(201);
  });

  it("takes the tenant from the session, not the body", async () => {
    const response = await POST(jsonRequest("POST", { ...valid, tenantId: "evil" }));
    expect(response.status).toBe(201);
    expect(mocks.customers.create.mock.calls[0]![1].tenantId).toBe(TENANT_ID);
  });

  it("reports the plan's customer limit as 403", async () => {
    mocks.customers.create.mockRejectedValue(dbError("PL001", "plan_limit_reached"));
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(403);
    expect((await response.json()).error).toBe("plan_limit_reached");
  });
});
