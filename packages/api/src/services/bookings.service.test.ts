import { describe, it, expect } from "vitest";
import { bookingsService } from "./bookings.service";
import {
  createFakeSupabaseClient,
  getInsertedRows,
  getUpdatedRows,
  findCallsByMethod,
  wasCalled,
} from "../test-utils/fake-supabase";

const BOOKING_ROW = {
  id: "booking-1",
  tenant_id: "tenant-1",
  customer_id: "customer-1",
  branch_id: null,
  booking_number: "BK-1001",
  status: "draft",
  title: "Umrah Package",
  start_date: "2026-08-01",
  end_date: "2026-08-10",
  total_amount: 5000,
  currency: "SAR",
  notes: null,
  created_by: "user-1",
  created_at: "2026-07-01T00:00:00.000Z",
  updated_at: "2026-07-01T00:00:00.000Z",
};

// Canned rows for services bookingsService calls as side effects - both
// booking_timeline and notifications have a runtime "fail loudly if the
// text+CHECK type column is unexpected" guard in their own mappers, so
// these must be validly-shaped, not `{}`, or the guard throws before the
// assertions we actually care about ever run.
const TIMELINE_ROW = {
  id: "timeline-1",
  tenant_id: "tenant-1",
  booking_id: "booking-1",
  created_by: "user-1",
  type: "booking_created",
  description: null,
  metadata: null,
  created_at: "2026-07-01T00:00:00.000Z",
};

const NOTIFICATION_ROW = {
  id: "notification-1",
  tenant_id: "tenant-1",
  user_id: "user-1",
  type: "booking_created",
  title: "Booking created",
  message: "Booking BK-1001 was created.",
  metadata: {},
  read_at: null,
  created_at: "2026-07-01T00:00:00.000Z",
};

describe("bookingsService", () => {
  describe("getById (mapper behavior)", () => {
    it("maps a booking row to its camelCase domain shape", async () => {
      const { client } = createFakeSupabaseClient({
        bookings: [{ data: BOOKING_ROW, error: null }],
      });

      const booking = await bookingsService.getById(client, "booking-1");

      expect(booking).toEqual({
        id: "booking-1",
        tenantId: "tenant-1",
        customerId: "customer-1",
        branchId: null,
        bookingNumber: "BK-1001",
        status: "draft",
        title: "Umrah Package",
        startDate: "2026-08-01",
        endDate: "2026-08-10",
        totalAmount: 5000,
        currency: "SAR",
        notes: null,
        createdBy: "user-1",
        createdAt: "2026-07-01T00:00:00.000Z",
        updatedAt: "2026-07-01T00:00:00.000Z",
      });
    });

    it("returns null when no row matches (never throws on a plain miss)", async () => {
      const { client } = createFakeSupabaseClient({
        bookings: [{ data: null, error: null }],
      });

      await expect(bookingsService.getById(client, "missing")).resolves.toBeNull();
    });

    it("propagates a query error rather than swallowing it", async () => {
      const { client } = createFakeSupabaseClient({
        bookings: [{ data: null, error: { message: "connection reset" } }],
      });

      await expect(bookingsService.getById(client, "booking-1")).rejects.toEqual({
        message: "connection reset",
      });
    });
  });

  describe("listByCustomer", () => {
    it("filters by customer_id, excludes soft-deleted rows, and orders newest-first", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [{ data: [BOOKING_ROW], error: null }],
      });

      const bookings = await bookingsService.listByCustomer(client, "customer-1");

      const eqCalls = findCallsByMethod(allCalls, "bookings", "eq");
      expect(eqCalls).toContainEqual({ method: "eq", args: ["customer_id", "customer-1"] });

      const isCalls = findCallsByMethod(allCalls, "bookings", "is");
      expect(isCalls).toContainEqual({ method: "is", args: ["deleted_at", null] });

      const orderCalls = findCallsByMethod(allCalls, "bookings", "order");
      expect(orderCalls).toContainEqual({
        method: "order",
        args: ["created_at", { ascending: false }],
      });

      expect(bookings).toHaveLength(1);
      expect(bookings[0]?.id).toBe("booking-1");
    });
  });

  describe("create", () => {
    it("stamps tenant_id and created_by on the insert row (the RLS insert-check assumption)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [{ data: BOOKING_ROW, error: null }],
        booking_timeline: [{ data: TIMELINE_ROW, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await bookingsService.create(client, {
        tenantId: "tenant-1",
        customerId: "customer-1",
        bookingNumber: "BK-1001",
        title: "Umrah Package",
        createdBy: "user-1",
      });

      const [insertedRow] = getInsertedRows(allCalls, "bookings") as Record<string, unknown>[];
      expect(insertedRow).toMatchObject({ tenant_id: "tenant-1", created_by: "user-1" });
    });

    it("raises a booking_created timeline event and notification when createdBy is set", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [{ data: BOOKING_ROW, error: null }],
        booking_timeline: [{ data: TIMELINE_ROW, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await bookingsService.create(client, {
        tenantId: "tenant-1",
        customerId: "customer-1",
        bookingNumber: "BK-1001",
        title: "Umrah Package",
        createdBy: "user-1",
      });

      expect(wasCalled(allCalls, "booking_timeline", "insert")).toBe(true);

      const [notification] = getInsertedRows(allCalls, "notifications") as Record<string, unknown>[];
      expect(notification).toMatchObject({
        tenant_id: "tenant-1",
        user_id: "user-1",
        type: "booking_created",
      });
    });

    it("generates a booking_number when the caller doesn't supply one", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [{ data: BOOKING_ROW, error: null }],
        booking_timeline: [{ data: TIMELINE_ROW, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      // No bookingNumber - the dashboard's CreateBookingForm never
      // collects one, since booking_number is globally unique (not
      // per-tenant), and this is the fix for that gap.
      await bookingsService.create(client, {
        tenantId: "tenant-1",
        customerId: "customer-1",
        title: "Umrah Package",
        createdBy: "user-1",
      });

      const [insertedRow] = getInsertedRows(allCalls, "bookings") as Record<string, unknown>[];
      expect(typeof insertedRow?.booking_number).toBe("string");
      expect((insertedRow?.booking_number as string).length).toBeGreaterThan(0);
    });

    it("does not fabricate a notification recipient when createdBy is null", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [{ data: { ...BOOKING_ROW, created_by: null }, error: null }],
        booking_timeline: [{ data: TIMELINE_ROW, error: null }],
      });

      await bookingsService.create(client, {
        tenantId: "tenant-1",
        customerId: "customer-1",
        bookingNumber: "BK-1001",
        title: "Umrah Package",
      });

      // Still logs the timeline event regardless...
      expect(wasCalled(allCalls, "booking_timeline", "insert")).toBe(true);
      // ...but never invents a user to notify.
      expect(wasCalled(allCalls, "notifications", "insert")).toBe(false);
    });
  });

  describe("update", () => {
    it("always logs a booking_updated timeline event", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [
          { data: { status: "draft" }, error: null }, // pre-fetch for the diff check
          { data: BOOKING_ROW, error: null }, // the update result (status unchanged)
        ],
        booking_timeline: [{ data: TIMELINE_ROW, error: null }],
      });

      await bookingsService.update(client, "booking-1", { title: "Renamed" });

      const timelineInserts = getInsertedRows(allCalls, "booking_timeline") as Record<
        string,
        unknown
      >[];
      expect(timelineInserts.some((row) => row.type === "booking_updated")).toBe(true);
    });

    it("raises status_changed + a notification only when status actually differs", async () => {
      const updatedRow = { ...BOOKING_ROW, status: "confirmed" };
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [
          { data: { status: "draft" }, error: null },
          { data: updatedRow, error: null },
        ],
        booking_timeline: [{ data: TIMELINE_ROW, error: null }],
        notifications: [{ data: NOTIFICATION_ROW, error: null }],
      });

      await bookingsService.update(client, "booking-1", { status: "confirmed" });

      const timelineInserts = getInsertedRows(allCalls, "booking_timeline") as Record<
        string,
        unknown
      >[];
      expect(timelineInserts.some((row) => row.type === "status_changed")).toBe(true);

      const [notification] = getInsertedRows(allCalls, "notifications") as Record<
        string,
        unknown
      >[];
      expect(notification).toMatchObject({ type: "booking_status_changed", user_id: "user-1" });
    });

    it("does not raise status_changed (or a notification) when status is unchanged", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [
          { data: { status: "draft" }, error: null },
          { data: BOOKING_ROW, error: null }, // still "draft"
        ],
        booking_timeline: [{ data: TIMELINE_ROW, error: null }],
      });

      await bookingsService.update(client, "booking-1", { title: "Renamed" });

      const timelineInserts = getInsertedRows(allCalls, "booking_timeline") as Record<
        string,
        unknown
      >[];
      expect(timelineInserts.some((row) => row.type === "status_changed")).toBe(false);
      expect(wasCalled(allCalls, "notifications", "insert")).toBe(false);
    });
  });

  describe("softDelete", () => {
    it("sets deleted_at rather than issuing a hard delete (no delete grant on bookings)", async () => {
      const { client, allCalls } = createFakeSupabaseClient({
        bookings: [{ data: { ...BOOKING_ROW, deleted_at: "2026-07-29T00:00:00.000Z" }, error: null }],
      });

      await bookingsService.softDelete(client, "booking-1");

      const [updatedRow] = getUpdatedRows(allCalls, "bookings") as Record<string, unknown>[];
      expect(updatedRow?.deleted_at).toEqual(expect.any(String));
    });
  });
});
