import { describe, it, expect } from "vitest";
import { homeOverviewService, toHomeOverview } from "./home-overview.service";
import { createFakeSupabaseClient } from "../test-utils/fake-supabase";

// The counting and RLS scope are covered by performance_functions.test.sql.
describe("home overview", () => {
  it("maps the function and fills months with no data", () => {
    const overview = toHomeOverview(
      {
        bookings_by_month: { "2026-11": 4 },
        customers_by_month: { "2026-10": 2 },
        visas_by_month: {},
        board: [
          { status: "draft", total: 30, items: [{ id: "b1", booking_number: "BK-1", title: "Trip", start_date: "2026-12-01", customer_name: null }] },
        ],
        today: [{ id: "b2", title: "T", booking_number: "BK-2", kind: "return" }],
        team: { p1: "3" },
      },
      ["2026-10", "2026-11"],
    );

    expect(overview.bookingsPerMonth).toEqual([0, 4]);
    expect(overview.customersPerMonth).toEqual([2, 0]);
    expect(overview.visasPerMonth).toEqual([0, 0]);
    expect(overview.board).toEqual([
      { status: "draft", total: 30, cards: [{ id: "b1", bookingNumber: "BK-1", title: "Trip", startDate: "2026-12-01", customerName: null }] },
    ]);
    expect(overview.today).toEqual([{ id: "b2", title: "T", bookingNumber: "BK-2", kind: "return" }]);
    expect(overview.bookingsByMember).toEqual({ p1: 3 });
  });

  it("reads anything missing as empty", () => {
    const overview = toHomeOverview(null, ["2026-11"]);
    expect(overview.bookingsPerMonth).toEqual([0]);
    expect(overview.board).toEqual([]);
    expect(overview.today).toEqual([]);
  });

  it("throws the database error", async () => {
    const { client } = createFakeSupabaseClient({ "rpc:home_overview": [{ data: null, error: { message: "boom" } }] });
    await expect(homeOverviewService.get(client)).rejects.toEqual({ message: "boom" });
  });
});
