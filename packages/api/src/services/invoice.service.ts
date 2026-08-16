import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toInvoice,
  toInvoiceInsert,
  toInvoiceUpdate,
  type Invoice,
  type CreateInvoiceInput,
  type UpdateInvoiceInput,
} from "./invoice.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors crm-leads.service.ts's soft-delete shape
// (invoices has deleted_at, unlike booking_flights/hotels/transfers) -
// callers only ever see the mapped Invoice domain shape, never the
// generated Row type.
export const invoiceService = {
  // Tenant-wide - no customer_id/booking_id filter. RLS
  // (tenant_id = current_tenant_id()) is what actually scopes this, same
  // as every other list method; unlike listByCustomer/listByBooking this
  // has no required id param, so a caller can't accidentally scope it to
  // the wrong tenant by passing the wrong id - there's no id at all.
  async list(supabase: SupabaseClient<Database>): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toInvoice);
  },

  async listByCustomer(
    supabase: SupabaseClient<Database>,
    customerId: string,
  ): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("customer_id", customerId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toInvoice);
  },

  async listByBooking(supabase: SupabaseClient<Database>, bookingId: string): Promise<Invoice[]> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("booking_id", bookingId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toInvoice);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? toInvoice(data) : null;
  },

  async create(supabase: SupabaseClient<Database>, input: CreateInvoiceInput): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .insert(toInvoiceInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toInvoice(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateInvoiceInput,
  ): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .update(toInvoiceUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toInvoice(data);
  },

  async softDelete(supabase: SupabaseClient<Database>, id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toInvoice(data);
  },

  async restore(supabase: SupabaseClient<Database>, id: string): Promise<Invoice> {
    const { data, error } = await supabase
      .from("invoices")
      .update({ deleted_at: null })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toInvoice(data);
  },
};
