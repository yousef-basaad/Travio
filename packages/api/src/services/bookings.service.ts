import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { Booking } from "@travio/types";

type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    customerId: row.customer_id,
    branchId: row.branch_id,
    bookingNumber: row.booking_number,
    status: row.status,
    totalAmount: row.total_amount,
    currency: row.currency,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Service layer: raw Supabase queries live here, never inline in components.
// Each app's feature hooks (e.g. features/bookings/api) call these, wired
// with either the browser or server client depending on context.
export const bookingsService = {
  async list(supabase: SupabaseClient<Database>, tenantId: string): Promise<Booking[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toBooking);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Booking | null> {
    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();

    if (error) throw error;
    return data ? toBooking(data) : null;
  },
};
