import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toExpense,
  toExpenseInsert,
  type Expense,
  type CreateExpenseInput,
} from "./expense.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors paymentService's shape - callers only ever
// see the mapped Expense domain shape, never the generated Row type.
// Only list/getById/create are wired up for this iteration
// (ExpenseOverview is a read-heavy summary view, not a full CRUD
// manager) - update/delete can be added when a real editing UI needs
// them, same as invoiceItemsService/paymentService already existing
// ahead of every one of their methods having a UI caller.
export const expenseService = {
  // Tenant-wide, same as invoiceService.list()/paymentService.list() -
  // RLS (tenant_id = current_tenant_id()) is what actually scopes this.
  async list(supabase: SupabaseClient<Database>): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toExpense);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toExpense(data) : null;
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateExpenseInput,
  ): Promise<Expense> {
    const { data, error } = await supabase
      .from("expenses")
      .insert(toExpenseInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toExpense(data);
  },
};
