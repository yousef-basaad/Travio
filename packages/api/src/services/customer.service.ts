import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { UserRole } from "@travio/types";
import {
  toCustomer,
  toCustomerInsert,
  toCustomerUpdate,
  type Customer,
  type CreateCustomerInput,
  type UpdateCustomerInput,
} from "./customer.mapper";

export interface ListCustomersOptions {
  role: UserRole;
  userId: string;
}

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors crm-leads.service.ts's shape exactly -
// callers only ever see the mapped Customer domain shape, never the
// generated Row type. Tenant isolation relies on RLS
// (customers_tenant_access) - every method takes the caller's own
// authenticated SupabaseClient, never service_role.
export const customerService = {
  // The explicit .eq("tenant_id", ...) below is defense-in-depth, not the
  // real enforcement point (RLS is) - same convention already used
  // everywhere else. The sales_agent branch is the same story: RLS
  // (customers_tenant_access, Phase 4C.1) already restricts the rows a
  // sales_agent's session can see to assigned-to-them-or-unassigned, so
  // this .or() is a second, application-layer expression of the same
  // rule, not the only thing standing between a sales_agent and another
  // agent's customers.
  async list(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options?: ListCustomersOptions,
  ): Promise<Customer[]> {
    let query = supabase
      .from("customers")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (options?.role === "sales_agent") {
      query = query.or(`assigned_to.eq.${options.userId},assigned_to.is.null`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toCustomer);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? toCustomer(data) : null;
  },

  async create(supabase: SupabaseClient<Database>, input: CreateCustomerInput): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .insert(toCustomerInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toCustomer(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update(toCustomerUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toCustomer(data);
  },

  // Soft delete only, despite the plain "delete" name - customers.deleted_at
  // already exists (0002_core_tables.sql), and bookings.customer_id
  // references customers with `on delete restrict`, so a hard delete
  // would fail the moment any booking exists anyway. Matches crm_leads'
  // softDelete convention.
  async delete(supabase: SupabaseClient<Database>, id: string): Promise<Customer> {
    const { data, error } = await supabase
      .from("customers")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toCustomer(data);
  },
};
