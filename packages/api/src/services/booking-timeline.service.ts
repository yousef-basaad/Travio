import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toBookingTimelineEvent,
  toBookingTimelineEventInsert,
  type BookingTimelineEvent,
  type CreateBookingTimelineEventInput,
} from "./booking-timeline.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors crm-activities.service.ts's shape (its own
// dedicated table, not a read-only composition like crm-timeline.service.ts) -
// callers only ever see the mapped BookingTimelineEvent domain shape,
// never the generated Row type.
export const bookingTimelineService = {
  async listByBooking(
    supabase: SupabaseClient<Database>,
    bookingId: string,
  ): Promise<BookingTimelineEvent[]> {
    const { data, error } = await supabase
      .from("booking_timeline")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toBookingTimelineEvent);
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateBookingTimelineEventInput,
  ): Promise<BookingTimelineEvent> {
    const { data, error } = await supabase
      .from("booking_timeline")
      .insert(toBookingTimelineEventInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toBookingTimelineEvent(data);
  },
};
