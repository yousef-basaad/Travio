import { describe, it, expect, vi, afterEach } from "vitest";
import { reportsService, toReportsOverview } from "./reports.service";
import { createFakeSupabaseClient, findCallsByMethod } from "../test-utils/fake-supabase";

// The counting itself is covered by supabase/tests/reports_overview.test.sql.
describe("reports overview", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps the database function and fills the last six months", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-08T10:00:00Z"));

    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:reports_overview": [
        {
          data: {
            bookings_by_month: [{ month: "2026-10", total: 9, confirmed: 6, cancelled: 1 }],
            customers_by_month: [{ month: "2026-11", count: 4 }],
            sales_by_service: [{ type: "flight", total: "6000.00" }],
            sales_by_destination: [{ country: "TR", bookings: 27, total: "116986.00" }],
            customers_by_nationality: { total: 48, items: [{ label: "السعودية", count: 20 }] },
            staff: [{ profile_id: "p1", name: "سارة", bookings: 22, completed: 10, cancelled: 0, sales: "111866.00" }],
            live_bookings: 99,
            completed_bookings: 50,
            cancelled_bookings: 11,
            customers_with_bookings: 40,
            repeat_customers: 21,
            avg_trip_days: 6.4,
            flight_tickets: 88,
            invoiced_customers: 36,
            invoiced_bookings: 77,
            invoiced_total: "523258.00",
          },
          error: null,
        },
      ],
      "rpc:analytics_revenue_by_month": [
        {
          data: [
            { month: "2025-03", invoice_total: "1000", paid_total: "0" },
            { month: "2026-03", invoice_total: "2500", paid_total: "0" },
          ],
          error: null,
        },
      ],
    });

    const overview = await reportsService.getOverview(client);

    expect(overview.bookingsByMonth.map((m) => m.month)).toEqual(["2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11"]);
    expect(overview.bookingsByMonth[4]).toEqual({ month: "2026-10", total: 9, confirmed: 6, cancelled: 1 });
    expect(overview.bookingsByMonth[0]).toEqual({ month: "2026-06", total: 0, confirmed: 0, cancelled: 0 });
    expect(overview.customersByMonth[5]).toEqual({ month: "2026-11", count: 4 });
    expect(overview.salesByService).toEqual([{ type: "flight", total: 6000 }]);
    expect(overview.salesByDestination).toEqual([{ country: "TR", bookings: 27, total: 116986 }]);
    expect(overview.customersByNationality).toEqual({ total: 48, items: [{ label: "السعودية", count: 20 }] });
    expect(overview.staff).toEqual([{ profileId: "p1", name: "سارة", bookings: 22, completed: 10, cancelled: 0, sales: 111866 }]);
    expect(overview.avgTripDays).toBe(6.4);
    expect(overview.invoicedTotal).toBe(523258);
    expect(overview.invoicedBookings).toBe(77);
    expect(overview.annualSales.year).toBe(2026);
    expect(overview.annualSales.months[2]).toEqual({ month: 3, current: 2500, previous: 1000 });
    expect(overview.annualSales.months).toHaveLength(12);

    const [call] = findCallsByMethod(allCalls, "rpc:reports_overview", "rpc");
    expect(call?.args).toEqual(["reports_overview", { range_start: "2026-06-01" }]);
    const [annualCall] = findCallsByMethod(allCalls, "rpc:analytics_revenue_by_month", "rpc");
    expect(annualCall?.args).toEqual(["analytics_revenue_by_month", { range_start: "2025-01-01" }]);
  });

  it("reads anything missing or malformed as zero / empty", () => {
    const overview = toReportsOverview(null);
    expect(overview.bookingsByMonth).toHaveLength(6);
    expect(overview.bookingsByMonth.every((m) => m.total === 0)).toBe(true);
    expect(overview.salesByService).toEqual([]);
    expect(overview.staff).toEqual([]);
    expect(overview.customersByNationality).toEqual({ total: 0, items: [] });
    expect(overview.avgTripDays).toBeNull();
    expect(overview.liveBookings).toBe(0);
    expect(toReportsOverview({ staff: "nope", live_bookings: "x" }).staff).toEqual([]);
  });

  it("throws the database error", async () => {
    const { client } = createFakeSupabaseClient({
      "rpc:reports_overview": [{ data: null, error: { message: "boom" } }],
      "rpc:analytics_revenue_by_month": [{ data: [], error: null }],
    });
    await expect(reportsService.getOverview(client)).rejects.toEqual({ message: "boom" });
  });
});
