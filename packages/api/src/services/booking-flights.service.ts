import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toBookingFlight,
  toBookingFlightInsert,
  toBookingFlightUpdate,
  type BookingFlight,
  type CreateBookingFlightInput,
  type UpdateBookingFlightInput,
} from "./booking-flights.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors bookingTimelineService/bookings.service.ts's
// shape - callers only ever see the mapped BookingFlight domain shape,
// never the generated Row type.
export const bookingFlightsService = {
  async listByBooking(
    supabase: SupabaseClient<Database>,
    bookingId: string,
  ): Promise<BookingFlight[]> {
    const { data, error } = await supabase
      .from("booking_flights")
      .select("*")
      .eq("booking_id", bookingId)
      .order("departure_time", { ascending: true });

    if (error) throw error;
    return data.map(toBookingFlight);
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateBookingFlightInput,
  ): Promise<BookingFlight> {
    const { data, error } = await supabase
      .from("booking_flights")
      .insert(toBookingFlightInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toBookingFlight(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateBookingFlightInput,
  ): Promise<BookingFlight> {
    const { data, error } = await supabase
      .from("booking_flights")
      .update(toBookingFlightUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toBookingFlight(data);
  },

  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("booking_flights").delete().eq("id", id);

    if (error) throw error;
  },
};
