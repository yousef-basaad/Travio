import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toBookingHotel,
  toBookingHotelInsert,
  toBookingHotelUpdate,
  type BookingHotel,
  type CreateBookingHotelInput,
  type UpdateBookingHotelInput,
} from "./booking-hotels.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors bookingFlightsService's shape - callers
// only ever see the mapped BookingHotel domain shape, never the
// generated Row type.
export const bookingHotelsService = {
  async listByBooking(
    supabase: SupabaseClient<Database>,
    bookingId: string,
  ): Promise<BookingHotel[]> {
    const { data, error } = await supabase
      .from("booking_hotels")
      .select("*")
      .eq("booking_id", bookingId)
      .order("check_in", { ascending: true });

    if (error) throw error;
    return data.map(toBookingHotel);
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateBookingHotelInput,
  ): Promise<BookingHotel> {
    const { data, error } = await supabase
      .from("booking_hotels")
      .insert(toBookingHotelInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toBookingHotel(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateBookingHotelInput,
  ): Promise<BookingHotel> {
    const { data, error } = await supabase
      .from("booking_hotels")
      .update(toBookingHotelUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toBookingHotel(data);
  },

  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("booking_hotels").delete().eq("id", id);

    if (error) throw error;
  },
};
