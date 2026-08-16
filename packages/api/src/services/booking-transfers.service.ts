import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toBookingTransfer,
  toBookingTransferInsert,
  toBookingTransferUpdate,
  type BookingTransfer,
  type CreateBookingTransferInput,
  type UpdateBookingTransferInput,
} from "./booking-transfers.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors bookingFlightsService/bookingHotelsService's
// shape - callers only ever see the mapped BookingTransfer domain shape,
// never the generated Row type.
export const bookingTransfersService = {
  async listByBooking(
    supabase: SupabaseClient<Database>,
    bookingId: string,
  ): Promise<BookingTransfer[]> {
    const { data, error } = await supabase
      .from("booking_transfers")
      .select("*")
      .eq("booking_id", bookingId)
      .order("pickup_time", { ascending: true });

    if (error) throw error;
    return data.map(toBookingTransfer);
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateBookingTransferInput,
  ): Promise<BookingTransfer> {
    const { data, error } = await supabase
      .from("booking_transfers")
      .insert(toBookingTransferInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toBookingTransfer(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateBookingTransferInput,
  ): Promise<BookingTransfer> {
    const { data, error } = await supabase
      .from("booking_transfers")
      .update(toBookingTransferUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toBookingTransfer(data);
  },

  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("booking_transfers").delete().eq("id", id);

    if (error) throw error;
  },
};
