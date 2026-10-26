import { describe, it, expect } from "vitest";
import { analyticsService, startOfMonth } from "./analytics.service";
import { createFakeSupabaseClient, findCallsByMethod, wasCalled } from "../test-utils/fake-supabase";

// The sums themselves are computed in Postgres (analytics_* functions -
// covered by supabase/tests/analytics_aggregates.test.sql against a real
// database). These tests cover what the service does with the results.

function currentMonthKey(): string {
  return startOfMonth(0).slice(0, 7);
}

describe("analyticsService", () => {
  it("getDashboardStats uses the finance totals function and never selects invoice/payment rows", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      customers: [{ data: null, count: 3, error: null } as never],
      bookings: [{ data: null, count: 7, error: null } as never],
      "rpc:analytics_finance_totals": [
        { data: [{ total_revenue: 1600, paid_amount: 25 }], error: null },
      ],
    });

    const stats = await analyticsService.getDashboardStats(client);

    expect(stats).toMatchObject({ totalRevenue: 1600, paidAmount: 25, outstandingAmount: 1575 });
    expect(wasCalled(allCalls, "invoices", "select")).toBe(false);
    expect(wasCalled(allCalls, "payments", "select")).toBe(false);
  });

  it("getDashboardStats treats an empty result as zero", async () => {
    const { client } = createFakeSupabaseClient({
      "rpc:analytics_finance_totals": [{ data: [], error: null }],
    });

    const stats = await analyticsService.getDashboardStats(client);
    expect(stats).toMatchObject({ totalRevenue: 0, paidAmount: 0, outstandingAmount: 0 });
  });

  it("getRevenueOverview returns 12 months oldest-first, filling months without data with 0", async () => {
    const thisMonth = currentMonthKey();
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:analytics_revenue_by_month": [
        { data: [{ month: thisMonth, invoice_total: 1600, paid_total: 20 }], error: null },
      ],
    });

    const { months } = await analyticsService.getRevenueOverview(client);

    expect(months).toHaveLength(12);
    expect(months[11]).toEqual({ month: thisMonth, invoiceTotal: 1600, paidTotal: 20 });
    expect(months[0]).toMatchObject({ invoiceTotal: 0, paidTotal: 0 });
    expect(findCallsByMethod(allCalls, "rpc:analytics_revenue_by_month", "rpc")[0]?.args[1]).toEqual({
      range_start: startOfMonth(11),
    });
  });

  it("getBookingAnalytics fills every status and totals the counts", async () => {
    const { client } = createFakeSupabaseClient({
      "rpc:analytics_booking_status_counts": [
        {
          data: [
            { status: "confirmed", booking_count: 1200 },
            { status: "pending", booking_count: 3 },
          ],
          error: null,
        },
      ],
      booking_flights: [{ data: null, count: 4, error: null } as never],
    });

    const analytics = await analyticsService.getBookingAnalytics(client);

    expect(analytics.totalBookings).toBe(1203);
    expect(analytics.byStatus).toEqual({
      draft: 0,
      pending: 3,
      confirmed: 1200,
      completed: 0,
      cancelled: 0,
    });
  });

  it("getCustomerAnalytics asks for the top 5 and attaches names (hidden customers become 'Unknown customer')", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:analytics_top_customers": [
        {
          data: [
            { customer_id: "c1", revenue: 1500 },
            { customer_id: "c2", revenue: 100 },
          ],
          error: null,
        },
      ],
      customers: [
        { data: null, count: 2, error: null } as never,
        { data: null, count: 1, error: null } as never,
        { data: [{ id: "c1", full_name: "Big Customer" }], error: null },
      ],
    });

    const analytics = await analyticsService.getCustomerAnalytics(client);

    expect(analytics.topCustomersByRevenue).toEqual([
      { customerId: "c1", customerName: "Big Customer", revenue: 1500 },
      { customerId: "c2", customerName: "Unknown customer", revenue: 100 },
    ]);
    expect(findCallsByMethod(allCalls, "rpc:analytics_top_customers", "rpc")[0]?.args[1]).toEqual({
      limit_count: 5,
    });
  });
});
