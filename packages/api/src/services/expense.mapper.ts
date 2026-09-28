import type { Database } from "@travio/database";

type ExpenseRow = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsertRow = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdateRow = Database["public"]["Tables"]["expenses"]["Update"];

// category is plain nullable text - no enum, no CHECK constraint exists
// on it (confirmed in the original finance_system migration), so it's
// typed as a free-form string here rather than a guessed literal union.
export interface Expense {
  id: string;
  tenantId: string;
  title: string;
  description: string | null;
  amount: number;
  category: string | null;
  expenseDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateExpenseInput {
  tenantId: string;
  title: string;
  description?: string | null;
  amount: number;
  category?: string | null;
  expenseDate?: string | null;
}

export interface UpdateExpenseInput {
  title?: string;
  description?: string | null;
  amount?: number;
  category?: string | null;
  expenseDate?: string | null;
}

export function toExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    description: row.description,
    amount: row.amount,
    category: row.category,
    expenseDate: row.expense_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toExpenseInsert(input: CreateExpenseInput): ExpenseInsertRow {
  return {
    tenant_id: input.tenantId,
    title: input.title,
    description: input.description ?? null,
    amount: input.amount,
    category: input.category ?? null,
    expense_date: input.expenseDate,
  };
}

export function toExpenseUpdate(input: UpdateExpenseInput): ExpenseUpdateRow {
  return {
    title: input.title,
    description: input.description,
    amount: input.amount,
    category: input.category,
    expense_date: input.expenseDate,
  };
}
