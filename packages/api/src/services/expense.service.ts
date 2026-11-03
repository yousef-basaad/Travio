import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toExpense,
  toExpenseInsert,
  type Expense,
  type CreateExpenseInput,
} from "./expense.mapper";
import { ilikeAny, toRange, RANGE_NOT_SATISFIABLE, type Page, type PageRequest } from "./pagination";

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

  // One page of the tenant's expenses, newest first, searchable by title
  // and category. Same shape as bookingsService.listPage.
  async listPage(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    request: PageRequest,
  ): Promise<Page<Expense>> {
    // head: true -> count only (used when the page is past the end).
    const filtered = (head: boolean) => {
      let query = supabase
        .from("expenses")
        .select("*", { count: "exact", head })
        .eq("tenant_id", tenantId);

      if (request.search) {
        query = query.or(ilikeAny(["title", "category"], request.search));
      }
      return query;
    };

    const [from, to] = toRange(request);
    const { data, count, error } = await filtered(false)
      .order("created_at", { ascending: false })
      .order("id", { ascending: true })
      .range(from, to);

    if (error?.code === RANGE_NOT_SATISFIABLE) {
      const { count: total, error: countError } = await filtered(true);
      if (countError) throw countError;
      return { items: [], total: total ?? 0, page: request.page, pageSize: request.pageSize };
    }
    if (error) throw error;
    return { items: data.map(toExpense), total: count ?? 0, page: request.page, pageSize: request.pageSize };
  },

  // Sum of every expense the caller can see, computed in Postgres
  // (finance_expense_total, 20261104120000) - summing the list in
  // JavaScript stopped at PostgREST's 1000-row cap.
  async total(supabase: SupabaseClient<Database>): Promise<number> {
    const { data, error } = await supabase.rpc("finance_expense_total");
    if (error) throw error;
    return Number(data ?? 0);
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
