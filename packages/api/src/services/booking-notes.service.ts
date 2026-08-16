import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toBookingNote,
  toBookingNoteInsert,
  type BookingNote,
  type CreateBookingNoteInput,
} from "./booking-notes.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components. Mirrors crm-notes.service.ts's shape exactly (list/create/
// delete, no update - notes are added and removed, never edited in
// place), retargeted at booking_notes' single booking_id FK instead of
// crm_notes' lead_id/customer_id pair.
export const bookingNotesService = {
  async listByBooking(
    supabase: SupabaseClient<Database>,
    bookingId: string,
  ): Promise<BookingNote[]> {
    const { data, error } = await supabase
      .from("booking_notes")
      .select("*")
      .eq("booking_id", bookingId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toBookingNote);
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateBookingNoteInput,
  ): Promise<BookingNote> {
    const { data, error } = await supabase
      .from("booking_notes")
      .insert(toBookingNoteInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toBookingNote(data);
  },

  // Hard delete - booking_notes has no deleted_at column, same reasoning
  // as crm-notes.service.ts's delete().
  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("booking_notes").delete().eq("id", id);

    if (error) throw error;
  },
};
