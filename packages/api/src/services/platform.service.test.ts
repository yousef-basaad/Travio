import { describe, it, expect } from "vitest";
import { platformService, toPlatformOverview } from "./platform.service";
import { createFakeSupabaseClient, findCallsByMethod } from "../test-utils/fake-supabase";

// The counting and the admin-only check are covered by
// supabase/tests/platform_overview.test.sql.
describe("platform overview", () => {
  it("maps the database function's jsonb", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:platform_overview": [
        {
          data: {
            agencies: 3,
            active_agencies: 2,
            users: 7,
            customers: 50,
            bookings: 1114,
            revenue: "524758.00",
            collected: "429956.00",
            this_month: { agencies: 2, customers: 5, bookings: 14, revenue: "57028.00", collected: "1000" },
            last_month: { agencies: 0, customers: 4, bookings: 9, revenue: "30975.00", collected: "26481.00" },
            daily: [{ day: "2026-11-08", revenue: "25622.00", bookings: 3 }],
            by_plan: [{ plan: "business", agencies: 1 }, { plan: "none", agencies: 2 }],
            bookings_by_status: { confirmed: 27, draft: 11 },
            recent_agencies: [
              { id: "t1", name: "Alpha", is_active: true, created_at: "2026-11-01T10:00:00Z", plan: "business", customers: 48, bookings: 110, revenue: "523258.00" },
            ],
            activity: [
              { kind: "payment_received", agency: "Alpha", amount: "300", at: "2026-11-08T09:00:00Z" },
              { kind: "unknown", agency: "Alpha", amount: null, at: "2026-11-08T08:00:00Z" },
            ],
          },
          error: null,
        },
      ],
    });

    const overview = await platformService.getOverview(client);

    expect(overview.agencies).toBe(3);
    expect(overview.revenue).toBe(524758);
    expect(overview.thisMonth).toEqual({ agencies: 2, customers: 5, bookings: 14, revenue: 57028, collected: 1000 });
    expect(overview.daily).toEqual([{ day: "2026-11-08", revenue: 25622, bookings: 3 }]);
    expect(overview.byPlan).toEqual([{ plan: "business", agencies: 1 }, { plan: "none", agencies: 2 }]);
    expect(overview.bookingsByStatus).toEqual({ confirmed: 27, draft: 11 });
    expect(overview.recentAgencies).toEqual([
      { id: "t1", name: "Alpha", isActive: true, createdAt: "2026-11-01T10:00:00Z", plan: "business", customers: 48, bookings: 110, revenue: 523258 },
    ]);
    expect(overview.activity).toEqual([{ kind: "payment_received", agency: "Alpha", amount: 300, at: "2026-11-08T09:00:00Z" }]);
    expect(findCallsByMethod(allCalls, "rpc:platform_overview", "rpc")).toHaveLength(1);
  });

  it("reads anything missing as zero / empty", () => {
    const overview = toPlatformOverview(null);
    expect(overview.agencies).toBe(0);
    expect(overview.thisMonth).toEqual({ agencies: 0, customers: 0, bookings: 0, revenue: 0, collected: 0 });
    expect(overview.daily).toEqual([]);
    expect(overview.recentAgencies).toEqual([]);
    expect(overview.bookingsByStatus).toEqual({});
  });

  it("throws the database error (e.g. not a Travio admin)", async () => {
    const { client } = createFakeSupabaseClient({
      "rpc:platform_overview": [{ data: null, error: { code: "42501", message: "forbidden" } }],
    });
    await expect(platformService.getOverview(client)).rejects.toEqual({ code: "42501", message: "forbidden" });
  });
});
