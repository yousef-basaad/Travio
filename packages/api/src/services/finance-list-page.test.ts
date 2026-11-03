import { describe, it, expect } from "vitest";
import { invoiceService } from "./invoice.service";
import { paymentService } from "./payment.service";
import { expenseService } from "./expense.service";
import { createFakeSupabaseClient, findCallsByMethod } from "../test-utils/fake-supabase";

// Finance lists are paged in the database (range + exact count) instead
// of loading every row; see list-page.test.ts for the shared behaviour.

describe("invoiceService.listPage", () => {
  it("embeds the customer name, pages newest first, and searches the invoice number", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      invoices: [
        {
          data: [
            {
              id: "i1",
              tenant_id: "t1",
              invoice_number: "INV-7",
              status: "issued",
              total: 120,
              currency: "SAR",
              customer: { full_name: "Sara Ali" },
            },
          ],
          count: 1500,
          error: null,
        } as never,
      ],
    });

    const page = await invoiceService.listPage(client, "t1", { page: 2, pageSize: 25, search: "inv-7" });

    expect(findCallsByMethod(allCalls, "invoices", "select")[0]?.args).toEqual([
      "*, customer:customers(full_name)",
      { count: "exact", head: false },
    ]);
    expect(findCallsByMethod(allCalls, "invoices", "is")).toContainEqual({ method: "is", args: ["deleted_at", null] });
    expect(findCallsByMethod(allCalls, "invoices", "range")[0]?.args).toEqual([25, 49]);
    expect(findCallsByMethod(allCalls, "invoices", "or")[0]?.args).toEqual(['invoice_number.ilike."*inv-7*"']);
    expect(page.total).toBe(1500);
    expect(page.items[0]).toMatchObject({ id: "i1", invoiceNumber: "INV-7", customerName: "Sara Ali" });
    expect(page.items[0]).not.toHaveProperty("customer");
  });

  it("customerName is null when the invoice has no visible customer", async () => {
    const { client } = createFakeSupabaseClient({
      invoices: [{ data: [{ id: "i2", invoice_number: "INV-8", customer: null }], count: 1, error: null } as never],
    });
    const page = await invoiceService.listPage(client, "t1", { page: 1, pageSize: 25 });
    expect(page.items[0]?.customerName).toBeNull();
  });

  it("a page past the end becomes an empty page with the real total", async () => {
    const { client } = createFakeSupabaseClient({
      invoices: [
        { data: null, error: { code: "PGRST103", message: "Requested range not satisfiable" } },
        { data: null, count: 3, error: null } as never,
      ],
    });
    const page = await invoiceService.listPage(client, "t1", { page: 4, pageSize: 25 });
    expect(page).toEqual({ items: [], total: 3, page: 4, pageSize: 25 });
  });
});

describe("paymentService.listPage", () => {
  it("embeds the invoice number and searches the reference", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      payments: [
        {
          data: [
            {
              id: "p1",
              tenant_id: "t1",
              invoice_id: "i1",
              amount: 50,
              method: "cash",
              paid_at: null,
              reference: "RCPT-1",
              created_at: "2026-11-01T00:00:00Z",
              invoice: { invoice_number: "INV-7" },
            },
          ],
          count: 1,
          error: null,
        } as never,
      ],
    });

    const page = await paymentService.listPage(client, "t1", { page: 1, pageSize: 8, search: "rcpt" });

    expect(findCallsByMethod(allCalls, "payments", "select")[0]?.args).toEqual([
      "*, invoice:invoices(invoice_number)",
      { count: "exact", head: false },
    ]);
    expect(findCallsByMethod(allCalls, "payments", "range")[0]?.args).toEqual([0, 7]);
    expect(findCallsByMethod(allCalls, "payments", "or")[0]?.args).toEqual(['reference.ilike."*rcpt*"']);
    expect(page.items[0]).toMatchObject({ id: "p1", amount: 50, invoiceNumber: "INV-7" });
    expect(page.items[0]).not.toHaveProperty("invoice");
  });
});

describe("expenseService", () => {
  it("listPage searches title and category", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      expenses: [
        {
          data: [{ id: "e1", tenant_id: "t1", title: "Rent", amount: 900, category: "Office" }],
          count: 1,
          error: null,
        } as never,
      ],
    });

    const page = await expenseService.listPage(client, "t1", { page: 1, pageSize: 25, search: "office" });

    expect(findCallsByMethod(allCalls, "expenses", "or")[0]?.args).toEqual([
      'title.ilike."*office*",category.ilike."*office*"',
    ]);
    expect(page.items[0]).toMatchObject({ id: "e1", title: "Rent", amount: 900 });
  });

  it("total comes from finance_expense_total, not a sum of rows", async () => {
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:finance_expense_total": [{ data: 2250, error: null }],
    });

    await expect(expenseService.total(client)).resolves.toBe(2250);
    expect(findCallsByMethod(allCalls, "rpc:finance_expense_total", "rpc")).toHaveLength(1);
  });

  it("total is 0 when there are no expenses visible", async () => {
    const { client } = createFakeSupabaseClient({
      "rpc:finance_expense_total": [{ data: null, error: null }],
    });
    await expect(expenseService.total(client)).resolves.toBe(0);
  });
});
