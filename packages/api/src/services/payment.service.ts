import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toPayment,
  toPaymentInsert,
  toPaymentUpdate,
  type Payment,
  type CreatePaymentInput,
  type UpdatePaymentInput,
} from "./payment.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors invoiceItemsService's shape - callers only
// ever see the mapped Payment domain shape, never the generated Row type.
export const paymentService = {
  // Tenant-wide - no invoice_id filter. RLS scopes this, same as every
  // other list method. Descending (newest first) - unlike
  // listByInvoice's ledger-order, this is a tenant-wide activity view
  // where the most recent payment is what an operator wants to see
  // first, matching invoiceService.list()'s own ordering.
  async list(supabase: SupabaseClient<Database>): Promise<Payment[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toPayment);
  },

  // Ascending (oldest first) - a payment ledger reads top-to-bottom in
  // the order payments were recorded, same reasoning as
  // invoiceItemsService.listByInvoice.
  async listByInvoice(
    supabase: SupabaseClient<Database>,
    invoiceId: string,
  ): Promise<Payment[]> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return data.map(toPayment);
  },

  // payments has no booking_id column (only invoice_id) - a booking's
  // payments are reached by first collecting its (non-deleted) invoice
  // ids, then filtering payments by that set, same two-step .in() shape
  // analyticsService.getCustomerAnalytics already uses for its top-
  // customers-by-id lookup. Descending (newest first), matching list()'s
  // own tenant-wide activity ordering - this is a booking-scoped
  // activity view, not a ledger someone reads top-to-bottom.
  async listByBooking(supabase: SupabaseClient<Database>, bookingId: string): Promise<Payment[]> {
    const { data: invoices, error: invoicesError } = await supabase
      .from("invoices")
      .select("id")
      .eq("booking_id", bookingId)
      .is("deleted_at", null);

    if (invoicesError) throw invoicesError;
    if (invoices.length === 0) return [];

    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .in(
        "invoice_id",
        invoices.map((invoice) => invoice.id),
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toPayment);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Payment | null> {
    const { data, error } = await supabase
      .from("payments")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toPayment(data) : null;
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreatePaymentInput,
  ): Promise<Payment> {
    const { data, error } = await supabase
      .from("payments")
      .insert(toPaymentInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toPayment(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdatePaymentInput,
  ): Promise<Payment> {
    const { data, error } = await supabase
      .from("payments")
      .update(toPaymentUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toPayment(data);
  },

  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("payments").delete().eq("id", id);

    if (error) throw error;
  },
};
