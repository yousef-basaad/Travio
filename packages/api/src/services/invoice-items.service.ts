import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toInvoiceItem,
  toInvoiceItemInsert,
  toInvoiceItemUpdate,
  type InvoiceItem,
  type CreateInvoiceItemInput,
  type UpdateInvoiceItemInput,
} from "./invoice-items.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors bookingFlightsService/bookingHotelsService's
// shape - callers only ever see the mapped InvoiceItem domain shape,
// never the generated Row type.
export const invoiceItemsService = {
  // Ascending (oldest first) - unlike most other lists in this app, line
  // items read top-to-bottom in the order they were added to the
  // invoice, not newest-first.
  async listByInvoice(
    supabase: SupabaseClient<Database>,
    invoiceId: string,
  ): Promise<InvoiceItem[]> {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(toInvoiceItem);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<InvoiceItem | null> {
    const { data, error } = await supabase
      .from("invoice_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toInvoiceItem(data) : null;
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateInvoiceItemInput,
  ): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from("invoice_items")
      .insert(toInvoiceItemInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toInvoiceItem(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateInvoiceItemInput,
  ): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from("invoice_items")
      .update(toInvoiceItemUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toInvoiceItem(data);
  },

  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("invoice_items").delete().eq("id", id);

    if (error) throw error;
  },
};
