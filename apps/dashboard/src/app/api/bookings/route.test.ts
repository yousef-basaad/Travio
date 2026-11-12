import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, getRequest, ID, jsonRequest, refused, TENANT_ID, USER_ID } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireBookingsAccess: vi.fn(),
  bookings: { list: vi.fn(), listPage: vi.fn(), create: vi.fn() },
  customers: { getById: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireBookingsAccess: mocks.requireBookingsAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  bookingsService: mocks.bookings,
  customerService: mocks.customers,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { GET, POST } from "./route";

const valid = { customerId: ID, title: "Umrah trip", startDate: "2026-12-01", endDate: "2026-12-10" };

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireBookingsAccess.mockResolvedValue(allowed());
  mocks.customers.getById.mockResolvedValue({ id: ID });
  mocks.bookings.create.mockImplementation(async (_supabase: unknown, input: object) => ({ id: "new", ...input }));
});

describe("GET /api/bookings", () => {
  it("passes an auth refusal through", async () => {
    mocks.requireBookingsAccess.mockResolvedValue(refused(401));
    const response = await GET(getRequest("http://localhost/api/bookings"));
    expect(response.status).toBe(401);
    expect(mocks.bookings.list).not.toHaveBeenCalled();
  });

  it("scopes the list by the caller's role and user", async () => {
    mocks.requireBookingsAccess.mockResolvedValue(allowed("sales_agent"));
    mocks.bookings.list.mockResolvedValue([]);
    const response = await GET(getRequest("http://localhost/api/bookings"));
    expect(response.status).toBe(200);
    expect(mocks.bookings.list).toHaveBeenCalledWith({}, TENANT_ID, { role: "sales_agent", userId: USER_ID });
  });

  it("rejects an unknown status filter", async () => {
    const response = await GET(getRequest("http://localhost/api/bookings?status=lost"));
    expect(response.status).toBe(400);
    expect(mocks.bookings.list).not.toHaveBeenCalled();
  });
});

describe("POST /api/bookings", () => {
  it("rejects malformed JSON", async () => {
    const response = await POST(jsonRequest("POST", "{nope"));
    expect(response.status).toBe(400);
  });

  it.each([
    ["an end date before the start", { ...valid, endDate: "2026-11-30" }],
    ["a missing title", { ...valid, title: " " }],
    ["an over-long title", { ...valid, title: "x".repeat(201) }],
    ["a negative amount", { ...valid, totalAmount: -1 }],
    ["a lower-case country", { ...valid, destinationCountry: "sa" }],
    ["a customer id that isn't a uuid", { ...valid, customerId: "1" }],
  ])("rejects %s", async (_label, body) => {
    const response = await POST(jsonRequest("POST", body));
    expect(response.status).toBe(400);
    expect(mocks.bookings.create).not.toHaveBeenCalled();
  });

  it("rejects a customer the caller can't see", async () => {
    mocks.customers.getById.mockResolvedValue(null);
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_customer" });
    expect(mocks.bookings.create).not.toHaveBeenCalled();
  });

  it("takes the tenant and creator from the session, not the body", async () => {
    const response = await POST(jsonRequest("POST", { ...valid, tenantId: "evil", createdBy: "evil" }));
    expect(response.status).toBe(201);
    const input = mocks.bookings.create.mock.calls[0]![1];
    expect(input.tenantId).toBe(TENANT_ID);
    expect(input.createdBy).toBe(USER_ID);
  });

  it.each([
    ["23505", 409, "conflict"],
    ["PL001", 403, "plan_limit_reached"],
    ["23514", 400, "invalid_input"],
    ["XX000", 500, "internal_error"],
  ])("maps database error %s to %i", async (code, status, error) => {
    mocks.bookings.create.mockRejectedValue(dbError(code));
    const response = await POST(jsonRequest("POST", valid));
    expect(response.status).toBe(status);
    expect((await response.json()).error).toBe(error);
  });
});
