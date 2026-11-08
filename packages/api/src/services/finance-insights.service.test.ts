import { describe, it, expect } from "vitest";
import { financeInsightsService } from "./finance-insights.service";
import { startOfMonth } from "./analytics.service";
import { createFakeSupabaseClient, findCallsByMethod, wasCalled } from "../test-utils/fake-supabase";

// The sums themselves are covered by supabase/tests/finance_insights.test.sql.
describe("financeInsightsService", () => {
  it("fills 12 months, maps categories and overdue invoices", async () => {
    const thisMonth = startOfMonth(0).slice(0, 7);
    const { client, allCalls } = createFakeSupabaseClient({
      "rpc:finance_expenses_by_month": [{ data: [{ month: thisMonth, expense_total: "130.5" }], error: null }],
      "rpc:finance_expenses_by_category": [
        { data: [{ category: "Flights", expense_total: 100 }, { category: "", expense_total: 30.5 }], error: null },
      ],
      "rpc:finance_overdue_invoices": [
        {
          data: [
            {
              invoice_id: "i1",
              invoice_number: "INV-1",
              customer_name: "Sara",
              due_date: "2026-11-01",
              balance: "750",
              days_overdue: 7,
            },
          ],
          error: null,
        },
      ],
    });

    const insights = await financeInsightsService.get(client);

    expect(insights.expensesByMonth).toHaveLength(12);
    expect(insights.expensesByMonth.at(-1)).toEqual({ month: thisMonth, expenseTotal: 130.5 });
    expect(insights.expensesByMonth[0]?.expenseTotal).toBe(0);
    expect(insights.expensesByCategory).toEqual([
      { category: "Flights", total: 100 },
      { category: "", total: 30.5 },
    ]);
    expect(insights.overdueInvoices).toEqual([
      { invoiceId: "i1", invoiceNumber: "INV-1", customerName: "Sara", dueDate: "2026-11-01", balance: 750, daysOverdue: 7 },
    ]);
    expect(findCallsByMethod(allCalls, "rpc:finance_expenses_by_month", "rpc")[0]?.args).toEqual([
      "finance_expenses_by_month",
      { range_start: startOfMonth(11) },
    ]);
    expect(wasCalled(allCalls, "expenses", "select")).toBe(false);
  });

  it("returns zeros and empty lists when nothing comes back", async () => {
    const { client } = createFakeSupabaseClient({
      "rpc:finance_expenses_by_month": [{ data: [], error: null }],
      "rpc:finance_expenses_by_category": [{ data: [], error: null }],
      "rpc:finance_overdue_invoices": [{ data: [], error: null }],
    });

    const insights = await financeInsightsService.get(client);
    expect(insights.expensesByMonth.every((month) => month.expenseTotal === 0)).toBe(true);
    expect(insights.expensesByCategory).toEqual([]);
    expect(insights.overdueInvoices).toEqual([]);
  });
});
