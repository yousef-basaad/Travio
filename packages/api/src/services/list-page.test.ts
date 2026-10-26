import { describe, it, expect } from "vitest";
import { customerService } from "./customer.service";
import { crmLeadsService } from "./crm-leads.service";
import { bookingsService } from "./bookings.service";
import { createFakeSupabaseClient, findCallsByMethod } from "../test-utils/fake-supabase";

// listPage() builds one bounded query (range + exact count) instead of
// loading every row. Which rows match is Postgres's job (RLS + the
// filters); these tests check the query each service builds and how the
// result is mapped.

const CUSTOMER_ROW = {
  id: "c1",
  tenant_id: "t1",
  branch_id: null,
  assigned_to: null,
  full_name: "Sara Ali",
  phone: null,
  email: "sara@mail.test",
  nationality: null,
  passport_number: null,
  passport_expiry: null,
  date_of_birth: null,
  preferred_language: null,
  notes: null,
  created_at: "2026-10-01T00:00:00Z",
  updated_at: "2026-10-01T00:00:00Z",
  deleted_at: null,
};

describe("customerService.listPage", () => {
  it("asks for an exact count and the requested page's range, newest first", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      customers: [{ data: [CUSTOMER_ROW], count: 1234, error: null } as never],
    });

    const page = await customerService.listPage(client, "t1", { page: 3, pageSize: 25 });

    expect(findCallsByMethod(allCalls, "customers", "select")[0]?.args).toEqual(["*", { count: "exact", head: false }]);
    expect(findCallsByMethod(allCalls, "customers", "range")[0]?.args).toEqual([50, 74]);
    expect(findCallsByMethod(allCalls, "customers", "order")[0]?.args).toEqual(["created_at", { ascending: false }]);
    expect(page).toMatchObject({ total: 1234, page: 3, pageSize: 25 });
    expect(page.items[0]).toMatchObject({ id: "c1", fullName: "Sara Ali" });
  });

  it("adds the search filter over name, email and phone", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      customers: [{ data: [], count: 0, error: null } as never],
    });

    await customerService.listPage(client, "t1", { page: 1, pageSize: 25, search: "sara" });

    expect(findCallsByMethod(allCalls, "customers", "or")).toContainEqual({
      method: "or",
      args: ['full_name.ilike."*sara*",email.ilike."*sara*",phone.ilike."*sara*"'],
    });
  });

  it("keeps the sales agent ownership filter alongside search", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      customers: [{ data: [], count: 0, error: null } as never],
    });

    await customerService.listPage(
      client,
      "t1",
      { page: 1, pageSize: 25, search: "sara" },
      { role: "sales_agent", userId: "agent-1" },
    );

    const orArgs = findCallsByMethod(allCalls, "customers", "or").map((call) => call.args[0]);
    expect(orArgs).toEqual([
      "assigned_to.eq.agent-1,assigned_to.is.null",
      'full_name.ilike."*sara*",email.ilike."*sara*",phone.ilike."*sara*"',
    ]);
  });

  it("reports total 0 when Postgres returns no count", async () => {
    const { client } = createFakeSupabaseClient({
      customers: [{ data: [], error: null }],
    });
    const page = await customerService.listPage(client, "t1", { page: 1, pageSize: 25 });
    expect(page.total).toBe(0);
  });

  it("a page past the end (PGRST103) becomes an empty page with the real total, not an error", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      customers: [
        { data: null, error: { code: "PGRST103", message: "Requested range not satisfiable" } },
        { data: null, count: 11, error: null } as never,
      ],
    });

    const page = await customerService.listPage(client, "t1", { page: 2, pageSize: 25, search: "lead 110" });

    expect(page).toEqual({ items: [], total: 11, page: 2, pageSize: 25 });
    // The count query repeats the same filters, head-only, without a range.
    const countSelect = findCallsByMethod(allCalls, "customers", "select")[1];
    expect(countSelect?.args).toEqual(["*", { count: "exact", head: true }]);
  });

  it("other errors are still thrown", async () => {
    const { client } = createFakeSupabaseClient({
      customers: [{ data: null, error: { code: "42501", message: "permission denied" } }],
    });
    await expect(customerService.listPage(client, "t1", { page: 1, pageSize: 25 })).rejects.toMatchObject({
      code: "42501",
    });
  });
});

describe("crmLeadsService.listPage", () => {
  it("pages and searches leads the same way", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      crm_leads: [{ data: [], count: 40, error: null } as never],
    });

    const page = await crmLeadsService.listPage(client, "t1", { page: 2, pageSize: 25, search: "omar" });

    expect(findCallsByMethod(allCalls, "crm_leads", "range")[0]?.args).toEqual([25, 49]);
    expect(findCallsByMethod(allCalls, "crm_leads", "or")[0]?.args).toEqual([
      'full_name.ilike."*omar*",email.ilike."*omar*",phone.ilike."*omar*"',
    ]);
    expect(page.total).toBe(40);
  });
});

describe("bookingsService.listPage", () => {
  it("embeds the customer name, filters by status, and searches number/title", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      bookings: [
        {
          data: [
            {
              id: "b1",
              tenant_id: "t1",
              customer_id: "c1",
              booking_number: "BK-1",
              title: "Umrah trip",
              status: "confirmed",
              start_date: null,
              end_date: null,
              total_amount: 0,
              currency: "SAR",
              assigned_to: null,
              notes: null,
              created_by: null,
              created_at: "2026-10-01T00:00:00Z",
              updated_at: "2026-10-01T00:00:00Z",
              deleted_at: null,
              customer: { full_name: "Sara Ali" },
            },
          ],
          count: 1,
          error: null,
        } as never,
      ],
    });

    const page = await bookingsService.listPage(client, "t1", {
      page: 1,
      pageSize: 25,
      search: "umrah",
      status: "confirmed",
    });

    expect(findCallsByMethod(allCalls, "bookings", "select")[0]?.args).toEqual([
      "*, customer:customers(full_name)",
      { count: "exact", head: false },
    ]);
    expect(findCallsByMethod(allCalls, "bookings", "eq")).toContainEqual({ method: "eq", args: ["status", "confirmed"] });
    expect(findCallsByMethod(allCalls, "bookings", "or")[0]?.args).toEqual([
      'booking_number.ilike."*umrah*",title.ilike."*umrah*"',
    ]);
    expect(page.items[0]).toMatchObject({ id: "b1", bookingNumber: "BK-1", customerName: "Sara Ali" });
    expect(page.items[0]).not.toHaveProperty("customer");
  });

  it("customerName is null when RLS hides the customer", async () => {
    const { client } = createFakeSupabaseClient({
      bookings: [
        {
          data: [
            {
              id: "b2",
              tenant_id: "t1",
              customer_id: "c9",
              booking_number: "BK-2",
              title: "x",
              status: "draft",
              customer: null,
            },
          ],
          count: 1,
          error: null,
        } as never,
      ],
    });
    const page = await bookingsService.listPage(client, "t1", { page: 1, pageSize: 25 });
    expect(page.items[0]?.customerName).toBeNull();
  });
});
