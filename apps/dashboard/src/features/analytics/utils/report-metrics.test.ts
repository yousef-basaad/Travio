import { describe, it, expect } from "vitest";
import type { ReportsOverview } from "@travio/api";
import { average, percent, reportRatios, staffCompletion } from "./report-metrics";

function overview(partial: Partial<ReportsOverview>): ReportsOverview {
  return {
    bookingsByMonth: [],
    customersByMonth: [],
    salesByService: [],
    salesByDestination: [],
    customersByNationality: { total: 0, items: [] },
    staff: [],
    liveBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    customersWithBookings: 0,
    repeatCustomers: 0,
    avgTripDays: null,
    flightTickets: 0,
    invoicedCustomers: 0,
    invoicedBookings: 0,
    invoicedTotal: 0,
    annualSales: { year: 2026, months: [] },
    ...partial,
  };
}

describe("report metrics", () => {
  it("percent and average have no value without a base", () => {
    expect(percent(1, 3)).toBe(33);
    expect(percent(0, 0)).toBeNull();
    expect(average(1000, 3)).toBe(333);
    expect(average(1000, 0)).toBeNull();
  });

  it("computes the ratios from real counts", () => {
    expect(
      reportRatios(
        overview({
          liveBookings: 99,
          completedBookings: 50,
          cancelledBookings: 11,
          customersWithBookings: 40,
          repeatCustomers: 21,
          invoicedBookings: 77,
          invoicedCustomers: 36,
          invoicedTotal: 523258,
        }),
      ),
    ).toEqual({ completionRate: 82, cancelRate: 11, repeatRate: 53, avgBookingValue: 6796, revenuePerCustomer: 14535 });
  });

  it("a new agency gets no ratios rather than zeros", () => {
    expect(reportRatios(overview({}))).toEqual({
      completionRate: null,
      cancelRate: null,
      repeatRate: null,
      avgBookingValue: null,
      revenuePerCustomer: null,
    });
  });

  it("staff completion ignores bookings still open", () => {
    expect(staffCompletion({ completed: 15, cancelled: 5 })).toBe(75);
    expect(staffCompletion({ completed: 0, cancelled: 0 })).toBeNull();
  });
});
