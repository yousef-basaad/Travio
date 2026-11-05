import { describe, it, expect } from "vitest";
import { customerService } from "./customer.service";
import { createFakeSupabaseClient, findCallsByMethod } from "../test-utils/fake-supabase";

function customerRow(id: string) {
  return {
    id,
    tenant_id: "t1",
    branch_id: null,
    assigned_to: null,
    full_name: `Customer ${id}`,
    email: null,
    phone: null,
    nationality: null,
    date_of_birth: null,
    passport_number: null,
    passport_expiry: null,
    preferred_language: null,
    notes: null,
    created_at: "2026-11-01T00:00:00Z",
    updated_at: "2026-11-01T00:00:00Z",
    deleted_at: null,
  };
}

// The numbers themselves come from customer_list_stats() - covered by
// supabase/tests/customer_list_stats.test.sql against a real database.
describe("customerService.listPageWithStats", () => {
  it("asks for stats of just the ids on the page and attaches them", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      customers: [{ data: [customerRow("c1"), customerRow("c2")], count: 2, error: null } as never],
      "rpc:customer_list_stats": [
        {
          data: [{ customer_id: "c1", bookings_count: 3, total_spent: "1250.50", last_activity_at: "2026-10-01T00:00:00Z" }],
          error: null,
        },
      ],
    });

    const page = await customerService.listPageWithStats(client, "t1", { page: 1, pageSize: 25 });

    expect(findCallsByMethod(allCalls, "rpc:customer_list_stats", "rpc")[0]?.args).toEqual([
      "customer_list_stats",
      { customer_ids: ["c1", "c2"] },
    ]);
    expect(page.items.map((item) => [item.id, item.stats])).toEqual([
      ["c1", { bookingsCount: 3, totalSpent: 1250.5, lastActivityAt: "2026-10-01T00:00:00Z" }],
      // No stats row (e.g. hidden by RLS) -> zeros, never a guess.
      ["c2", { bookingsCount: 0, totalSpent: 0, lastActivityAt: null }],
    ]);
    expect(page.total).toBe(2);
  });

  it("skips the stats query for an empty page", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      customers: [{ data: [], count: 0, error: null } as never],
    });

    const page = await customerService.listPageWithStats(client, "t1", { page: 1, pageSize: 25 });

    expect(page.items).toEqual([]);
    expect(findCallsByMethod(allCalls, "rpc:customer_list_stats", "rpc")).toHaveLength(0);
  });
});
