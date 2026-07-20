import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { Booking } from "@travio/types";

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
    return data as Booking[];
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Booking | null> {
    const { data, error } = await supabase.from("bookings").select("*").eq("id", id).single();

    if (error) throw error;
    return data as Booking;
  },
};
