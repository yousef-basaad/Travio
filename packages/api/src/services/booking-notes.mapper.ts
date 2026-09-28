import type { Database } from "@travio/database";

type BookingNoteRow = Database["public"]["Tables"]["booking_notes"]["Row"];
type BookingNoteInsertRow = Database["public"]["Tables"]["booking_notes"]["Insert"];

export interface BookingNote {
  id: string;
  tenantId: string;
  bookingId: string;
  createdBy: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBookingNoteInput {
  tenantId: string;
  bookingId: string;
  body: string;
  createdBy?: string | null;
}

export function toBookingNote(row: BookingNoteRow): BookingNote {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bookingId: row.booking_id,
    createdBy: row.created_by,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBookingNoteInsert(input: CreateBookingNoteInput): BookingNoteInsertRow {
  return {
    tenant_id: input.tenantId,
    booking_id: input.bookingId,
    body: input.body,
    created_by: input.createdBy ?? null,
  };
}
