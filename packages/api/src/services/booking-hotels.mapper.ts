import type { Database } from "@travio/database";

type BookingHotelRow = Database["public"]["Tables"]["booking_hotels"]["Row"];
type BookingHotelInsertRow = Database["public"]["Tables"]["booking_hotels"]["Insert"];
type BookingHotelUpdateRow = Database["public"]["Tables"]["booking_hotels"]["Update"];

// board_type is plain text + a CHECK constraint
// (booking_hotels_board_type_check), not a Postgres enum - same
// reasoning as CabinClass/BookingTimelineEventType. Nullable: a hotel can
// be added before its board type is known.
const BOARD_TYPES = [
  "room_only",
  "bed_breakfast",
  "half_board",
  "full_board",
  "all_inclusive",
] as const;

export type BoardType = (typeof BOARD_TYPES)[number];

function isBoardType(value: string): value is BoardType {
  return (BOARD_TYPES as readonly string[]).includes(value);
}

function toBoardType(value: string | null): BoardType | null {
  if (value === null) return null;
  if (!isBoardType(value)) {
    // Should be unreachable given booking_hotels_board_type_check, but
    // the DB column is untyped text - fail loudly rather than silently
    // lying about the type to callers.
    throw new Error(`Unexpected booking_hotels.board_type value: ${value}`);
  }
  return value;
}

export interface BookingHotel {
  id: string;
  tenantId: string;
  bookingId: string;
  hotelName: string | null;
  city: string | null;
  country: string | null;
  checkIn: string | null;
  checkOut: string | null;
  rooms: number | null;
  roomType: string | null;
  boardType: BoardType | null;
  confirmationNumber: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateBookingHotelInput {
  tenantId: string;
  bookingId: string;
  hotelName?: string | null;
  city?: string | null;
  country?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number | null;
  roomType?: string | null;
  boardType?: BoardType | null;
  confirmationNumber?: string | null;
  createdBy?: string | null;
}

export interface UpdateBookingHotelInput {
  hotelName?: string | null;
  city?: string | null;
  country?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number | null;
  roomType?: string | null;
  boardType?: BoardType | null;
  confirmationNumber?: string | null;
}

export function toBookingHotel(row: BookingHotelRow): BookingHotel {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bookingId: row.booking_id,
    hotelName: row.hotel_name,
    city: row.city,
    country: row.country,
    checkIn: row.check_in,
    checkOut: row.check_out,
    rooms: row.rooms,
    roomType: row.room_type,
    boardType: toBoardType(row.board_type),
    confirmationNumber: row.confirmation_number,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBookingHotelInsert(input: CreateBookingHotelInput): BookingHotelInsertRow {
  return {
    tenant_id: input.tenantId,
    booking_id: input.bookingId,
    hotel_name: input.hotelName ?? null,
    city: input.city ?? null,
    country: input.country ?? null,
    check_in: input.checkIn ?? null,
    check_out: input.checkOut ?? null,
    rooms: input.rooms ?? null,
    room_type: input.roomType ?? null,
    board_type: input.boardType ?? null,
    confirmation_number: input.confirmationNumber ?? null,
    created_by: input.createdBy ?? null,
  };
}

export function toBookingHotelUpdate(input: UpdateBookingHotelInput): BookingHotelUpdateRow {
  return {
    hotel_name: input.hotelName,
    city: input.city,
    country: input.country,
    check_in: input.checkIn,
    check_out: input.checkOut,
    rooms: input.rooms,
    room_type: input.roomType,
    board_type: input.boardType,
    confirmation_number: input.confirmationNumber,
  };
}
