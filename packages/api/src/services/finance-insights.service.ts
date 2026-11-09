import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { lastNMonthKeys, startOfMonth } from "./analytics.service";

const MONTHS = 12;
const OVERDUE_LIMIT = 5;

export interface MonthlyExpense {
  /** "YYYY-MM" */
  month: string;
  expenseTotal: number;
}

export interface ExpenseCategoryTotal {
  /** Empty for expenses without a category. */
  category: string;
  total: number;
}

export interface OverdueInvoice {
  invoiceId: string;
  invoiceNumber: string;
  customerName: string | null;
  dueDate: string;
  balance: number;
  daysOverdue: number;
}

export interface FinanceInsights {
  /** The trailing 12 months, oldest first, months without expenses as 0. */
  expensesByMonth: MonthlyExpense[];
  expensesByCategory: ExpenseCategoryTotal[];
  overdueInvoices: OverdueInvoice[];
}

// The Finance page's charts and overdue list (finance_* functions,
// 20261108120000) - computed in Postgres under the caller's RLS.
export const financeInsightsService = {
  async get(supabase: SupabaseClient<Database>): Promise<FinanceInsights> {
    const [byMonth, byCategory, overdue] = await Promise.all([
      supabase.rpc("finance_expenses_by_month", { range_start: startOfMonth(MONTHS - 1) }),
      supabase.rpc("finance_expenses_by_category"),
      supabase.rpc("finance_overdue_invoices", { limit_count: OVERDUE_LIMIT }),
    ]);
    if (byMonth.error) throw byMonth.error;
    if (byCategory.error) throw byCategory.error;
    if (overdue.error) throw overdue.error;

    const totals = new Map((byMonth.data ?? []).map((row) => [row.month, Number(row.expense_total)]));

    return {
      expensesByMonth: lastNMonthKeys(MONTHS).map((month) => ({ month, expenseTotal: totals.get(month) ?? 0 })),
      expensesByCategory: (byCategory.data ?? []).map((row) => ({
        category: row.category,
        total: Number(row.expense_total),
      })),
      overdueInvoices: (overdue.data ?? []).map((row) => ({
        invoiceId: row.invoice_id,
        invoiceNumber: row.invoice_number,
        customerName: row.customer_name,
        dueDate: row.due_date,
        balance: Number(row.balance),
        daysOverdue: row.days_overdue,
      })),
    };
  },
};
