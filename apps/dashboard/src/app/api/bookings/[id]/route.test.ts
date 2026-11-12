import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as TravioApi from "@travio/api";
import { allowed, dbError, getRequest, ID, jsonRequest, OTHER_ID, params, refused } from "@/test/route-helpers";

const mocks = vi.hoisted(() => ({
  requireBookingsAccess: vi.fn(),
  bookings: { getById: vi.fn(), update: vi.fn(), softDelete: vi.fn() },
  customers: { getById: vi.fn() },
}));

vi.mock("@/lib/auth/require-domain-access", () => ({ requireBookingsAccess: mocks.requireBookingsAccess }));
vi.mock("@travio/api", async (importOriginal) => ({
  ...(await importOriginal<typeof TravioApi>()),
  bookingsService: mocks.bookings,
  customerService: mocks.customers,
}));
vi.mock("@travio/logger", () => ({ logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() } }));

import { DELETE, GET, PATCH } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireBookingsAccess.mockResolvedValue(allowed());
  mocks.bookings.getById.mockResolvedValue({ id: ID, status: "draft" });
  mocks.customers.getById.mockResolvedValue({ id: OTHER_ID });
  mocks.bookings.update.mockImplementation(async (_supabase: unknown, id: string, input: object) => ({ id, ...input }));
});

describe("GET /api/bookings/:id", () => {
  it("returns 404 for a booking the caller can't see", async () => {
    mocks.bookings.getById.mockResolvedValue(null);
    const response = await GET(getRequest(), params());
    expect(response.status).toBe(404);
  });

  it("maps a malformed id to 400", async () => {
    mocks.bookings.getById.mockRejectedValue(dbError("22P02"));
    const response = await GET(getRequest(), params("not-a-uuid"));
    expect(response.status).toBe(400);
    expect((await response.json()).error).toBe("invalid_id");
  });
});

describe("PATCH /api/bookings/:id", () => {
  it("passes an auth refusal through", async () => {
    mocks.requireBookingsAccess.mockResolvedValue(refused());
    const response = await PATCH(jsonRequest("PATCH", { title: "x" }), params());
    expect(response.status).toBe(403);
    expect(mocks.bookings.update).not.toHaveBeenCalled();
  });

  it("rejects an end date before the start", async () => {
    const response = await PATCH(jsonRequest("PATCH", { startDate: "2026-12-10", endDate: "2026-12-01" }), params());
    expect(response.status).toBe(400);
    expect(mocks.bookings.update).not.toHaveBeenCalled();
  });

  it("returns 404 before updating a missing booking", async () => {
    mocks.bookings.getById.mockResolvedValue(null);
    const response = await PATCH(jsonRequest("PATCH", { title: "x" }), params());
    expect(response.status).toBe(404);
    expect(mocks.bookings.update).not.toHaveBeenCalled();
  });

  it("rejects moving the booking to a customer the caller can't see", async () => {
    mocks.customers.getById.mockResolvedValue(null);
    const response = await PATCH(jsonRequest("PATCH", { customerId: OTHER_ID }), params());
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ error: "invalid_customer" });
    expect(mocks.bookings.update).not.toHaveBeenCalled();
  });

  it("reports a status change the database refuses as 409", async () => {
    mocks.bookings.update.mockRejectedValue(dbError("PL003", "invalid_status_change"));
    const response = await PATCH(jsonRequest("PATCH", { status: "completed" }), params());
    expect(response.status).toBe(409);
    expect(await response.json()).toEqual({ error: "invalid_status_change" });
  });

  it("updates and returns the booking", async () => {
    const response = await PATCH(jsonRequest("PATCH", { status: "pending" }), params());
    expect(response.status).toBe(200);
    expect(mocks.bookings.update).toHaveBeenCalledWith({}, ID, { status: "pending" });
  });
});

describe("DELETE /api/bookings/:id", () => {
  it("returns 404 for a missing booking", async () => {
    mocks.bookings.getById.mockResolvedValue(null);
    const response = await DELETE(getRequest(), params());
    expect(response.status).toBe(404);
    expect(mocks.bookings.softDelete).not.toHaveBeenCalled();
  });

  it("soft-deletes and returns 204", async () => {
    const response = await DELETE(getRequest(), params());
    expect(response.status).toBe(204);
    expect(mocks.bookings.softDelete).toHaveBeenCalledWith({}, ID);
  });
});
