import type { Database } from "@travio/database";

type BookingFlightRow = Database["public"]["Tables"]["booking_flights"]["Row"];
type BookingFlightInsertRow = Database["public"]["Tables"]["booking_flights"]["Insert"];
type BookingFlightUpdateRow = Database["public"]["Tables"]["booking_flights"]["Update"];

// cabin_class is plain text + a CHECK constraint
// (booking_flights_cabin_class_check), not a Postgres enum - same
// reasoning as CrmActivityType/BookingTimelineEventType. Unlike those,
// it's nullable: a flight can be added before its cabin class is known.
const CABIN_CLASSES = ["economy", "business", "first"] as const;

export type CabinClass = (typeof CABIN_CLASSES)[number];

function isCabinClass(value: string): value is CabinClass {
  return (CABIN_CLASSES as readonly string[]).includes(value);
}

function toCabinClass(value: string | null): CabinClass | null {
  if (value === null) return null;
  if (!isCabinClass(value)) {
    // Should be unreachable given booking_flights_cabin_class_check, but
    // the DB column is untyped text - fail loudly rather than silently
    // lying about the type to callers.
    throw new Error(`Unexpected booking_flights.cabin_class value: ${value}`);
  }
  return value;
}

export interface BookingFlight {
  id: string;
  tenantId: string;
  bookingId: string;
  airline: string | null;
  flightNumber: string | null;
  departureAirport: string | null;
  arrivalAirport: string | null;
  departureTime: string | null;
  arrivalTime: string | null;
  cabinClass: CabinClass | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateBookingFlightInput {
  tenantId: string;
  bookingId: string;
  airline?: string | null;
  flightNumber?: string | null;
  departureAirport?: string | null;
  arrivalAirport?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  cabinClass?: CabinClass | null;
  createdBy?: string | null;
}

export interface UpdateBookingFlightInput {
  airline?: string | null;
  flightNumber?: string | null;
  departureAirport?: string | null;
  arrivalAirport?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  cabinClass?: CabinClass | null;
}

export function toBookingFlight(row: BookingFlightRow): BookingFlight {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bookingId: row.booking_id,
    airline: row.airline,
    flightNumber: row.flight_number,
    departureAirport: row.departure_airport,
    arrivalAirport: row.arrival_airport,
    departureTime: row.departure_time,
    arrivalTime: row.arrival_time,
    cabinClass: toCabinClass(row.cabin_class),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBookingFlightInsert(input: CreateBookingFlightInput): BookingFlightInsertRow {
  return {
    tenant_id: input.tenantId,
    booking_id: input.bookingId,
    airline: input.airline ?? null,
    flight_number: input.flightNumber ?? null,
    departure_airport: input.departureAirport ?? null,
    arrival_airport: input.arrivalAirport ?? null,
    departure_time: input.departureTime ?? null,
    arrival_time: input.arrivalTime ?? null,
    cabin_class: input.cabinClass ?? null,
    created_by: input.createdBy ?? null,
  };
}

export function toBookingFlightUpdate(input: UpdateBookingFlightInput): BookingFlightUpdateRow {
  return {
    airline: input.airline,
    flight_number: input.flightNumber,
    departure_airport: input.departureAirport,
    arrival_airport: input.arrivalAirport,
    departure_time: input.departureTime,
    arrival_time: input.arrivalTime,
    cabin_class: input.cabinClass,
  };
}
