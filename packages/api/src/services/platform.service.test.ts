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

  it("lists agencies with the given filters", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:platform_agencies": [
        {
          data: {
            total: 21,
            items: [
              {
                id: "t1", name: "Alpha", slug: "alpha", cr_number: "111", email: null, phone: "", is_active: false,
                created_at: "2026-11-01T10:00:00Z", plan: "starter", subscription_status: "trialing",
                owner_name: "Owner", owner_email: "o@a.test", staff: 2, customers: 3, bookings: 4, revenue: "750.00",
              },
            ],
          },
          error: null,
        },
      ],
    });

    await expect(platformService.listAgencies(client, { search: "al", status: "inactive", page: 2, pageSize: 20 })).resolves.toEqual({
      total: 21,
      items: [
        {
          id: "t1", name: "Alpha", slug: "alpha", crNumber: "111", email: null, phone: null, isActive: false,
          createdAt: "2026-11-01T10:00:00Z", plan: "starter", subscriptionStatus: "trialing",
          ownerName: "Owner", ownerEmail: "o@a.test", staff: 2, customers: 3, bookings: 4, revenue: 750,
        },
      ],
    });
    const [call] = findCallsByMethod(allCalls, "rpc:platform_agencies", "rpc");
    expect(call?.args).toEqual(["platform_agencies", { search_text: "al", status_filter: "inactive", page_number: 2, page_size: 20 }]);
  });

  it("lists users with the given filters", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:platform_users": [
        {
          data: {
            total: 1,
            items: [
              {
                id: "u1", full_name: "Sara", email: "s@a.test", role: "sales_agent", agency_id: null, agency_name: null,
                agency_active: null, created_at: "2026-11-01T10:00:00Z", last_sign_in_at: null, email_confirmed: true,
              },
            ],
          },
          error: null,
        },
      ],
    });

    await expect(platformService.listUsers(client, { search: "sa", role: "sales_agent", page: 2, pageSize: 20 })).resolves.toEqual({
      total: 1,
      items: [
        {
          id: "u1", fullName: "Sara", email: "s@a.test", role: "sales_agent", agencyId: null, agencyName: null,
          agencyActive: null, createdAt: "2026-11-01T10:00:00Z", lastSignInAt: null, emailConfirmed: true,
        },
      ],
    });
    const [call] = findCallsByMethod(allCalls, "rpc:platform_users", "rpc");
    expect(call?.args).toEqual(["platform_users", { search_text: "sa", role_filter: "sales_agent", page_number: 2, page_size: 20 }]);
  });

  it("lists subscriptions with the given filters", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:platform_subscriptions": [
        {
          data: {
            total: 2,
            summary: { expected_mrr: "700.00", active: 3, trialing: 1, past_due: 1, cancelled: 0, expired: 1, none: 1 },
            items: [
              { id: "t1", name: "Alpha", is_active: true, plan: "starter", status: "active", price: "99.00", billing_interval: "monthly", starts_at: "2026-01-02T00:00:00Z", ends_at: null },
              { id: "t2", name: "Beta", is_active: false, plan: null, status: null, price: null, billing_interval: null, starts_at: null, ends_at: null },
            ],
          },
          error: null,
        },
      ],
    });

    await expect(platformService.listSubscriptions(client, { search: "a", status: "none", page: 2, pageSize: 20 })).resolves.toEqual({
      total: 2,
      summary: { expectedMrr: 700, active: 3, trialing: 1, pastDue: 1, cancelled: 0, expired: 1, none: 1 },
      items: [
        { id: "t1", name: "Alpha", isActive: true, plan: "starter", status: "active", price: 99, billingInterval: "monthly", startsAt: "2026-01-02T00:00:00Z", endsAt: null },
        { id: "t2", name: "Beta", isActive: false, plan: null, status: null, price: null, billingInterval: null, startsAt: null, endsAt: null },
      ],
    });
    const [call] = findCallsByMethod(allCalls, "rpc:platform_subscriptions", "rpc");
    expect(call?.args).toEqual(["platform_subscriptions", { search_text: "a", status_filter: "none", page_number: 2, page_size: 20 }]);
  });

  it("lists plans and updates one", async () => {
    const listed = createFakeSupabaseClient({
      "rpc:platform_plans": [
        {
          data: [
            { id: "p1", name: "Starter", slug: "starter", price: "99.00", billing_interval: "monthly", is_active: true, limits: { max_users: "5", broken: null }, agencies: 2 },
          ],
          error: null,
        },
      ],
    });
    await expect(platformService.listPlans(listed.client)).resolves.toEqual([
      { id: "p1", name: "Starter", slug: "starter", price: 99, billingInterval: "monthly", isActive: true, limits: { max_users: "5" }, agencies: 2 },
    ]);

    const updated = createFakeSupabaseClient({ "rpc:platform_update_plan": [{ data: null, error: null }] });
    await platformService.updatePlan(updated.client, "p1", 120, { max_users: "unlimited" });
    const [call] = findCallsByMethod(updated.allCalls, "rpc:platform_update_plan", "rpc");
    expect(call?.args).toEqual(["platform_update_plan", { target_plan: "p1", new_price: 120, new_limits: { max_users: "unlimited" } }]);

    const denied = createFakeSupabaseClient({ "rpc:platform_update_plan": [{ data: null, error: { code: "42501", message: "forbidden" } }] });
    await expect(platformService.updatePlan(denied.client, "p1", 1, {})).rejects.toEqual({ code: "42501", message: "forbidden" });
  });

  it("maps audit entries", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:platform_audit_entries": [
        {
          data: {
            total: 1,
            items: [
              {
                id: 7, actor_email: "a@t.test", action: "plan_updated", target_label: "Starter", created_at: "2026-11-10T10:00:00Z",
                details: { before: { price: "99", limits: { max_users: "5" } }, after: { price: 120, limits: { max_users: "10" } } },
              },
              { id: 6, actor_email: null, action: "agency_activated", target_label: "Alpha", created_at: "2026-11-09T10:00:00Z", details: {} },
            ],
          },
          error: null,
        },
      ],
    });

    const page = await platformService.listAudit(client, 2, 25);
    expect(page.items[0]).toEqual({
      id: 7, actorEmail: "a@t.test", action: "plan_updated", targetLabel: "Starter", createdAt: "2026-11-10T10:00:00Z",
      before: { price: 99, limits: { max_users: "5" } }, after: { price: 120, limits: { max_users: "10" } },
    });
    expect(page.items[1]).toMatchObject({ actorEmail: null, before: null, after: null });
    const [call] = findCallsByMethod(allCalls, "rpc:platform_audit_entries", "rpc");
    expect(call?.args).toEqual(["platform_audit_entries", { page_number: 2, page_size: 25 }]);
  });

  it("sets an agency's status and surfaces a refusal", async () => {
    const ok = createFakeSupabaseClient({ "rpc:platform_set_agency_active": [{ data: null, error: null }] });
    await platformService.setAgencyActive(ok.client, "t1", false);
    const [call] = findCallsByMethod(ok.allCalls, "rpc:platform_set_agency_active", "rpc");
    expect(call?.args).toEqual(["platform_set_agency_active", { target_tenant: "t1", active: false }]);

    const denied = createFakeSupabaseClient({
      "rpc:platform_set_agency_active": [{ data: null, error: { code: "42501", message: "forbidden" } }],
    });
    await expect(platformService.setAgencyActive(denied.client, "t1", true)).rejects.toEqual({ code: "42501", message: "forbidden" });
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
