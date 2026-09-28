import type { Database } from "@travio/database";

type BookingTransferRow = Database["public"]["Tables"]["booking_transfers"]["Row"];
type BookingTransferInsertRow = Database["public"]["Tables"]["booking_transfers"]["Insert"];
type BookingTransferUpdateRow = Database["public"]["Tables"]["booking_transfers"]["Update"];

// transfer_type is plain text + a CHECK constraint
// (booking_transfers_type_check), not a Postgres enum - same reasoning
// as CabinClass/BoardType. Nullable: a transfer can be added before its
// type is known.
const TRANSFER_TYPES = [
  "airport_transfer",
  "hotel_transfer",
  "private_transfer",
  "shared_transfer",
] as const;

export type TransferType = (typeof TRANSFER_TYPES)[number];

function isTransferType(value: string): value is TransferType {
  return (TRANSFER_TYPES as readonly string[]).includes(value);
}

function toTransferType(value: string | null): TransferType | null {
  if (value === null) return null;
  if (!isTransferType(value)) {
    // Should be unreachable given booking_transfers_type_check, but the
    // DB column is untyped text - fail loudly rather than silently
    // lying about the type to callers.
    throw new Error(`Unexpected booking_transfers.transfer_type value: ${value}`);
  }
  return value;
}

export interface BookingTransfer {
  id: string;
  tenantId: string;
  bookingId: string;
  transferType: TransferType | null;
  providerName: string | null;
  vehicleType: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  pickupTime: string | null;
  passengerCount: number | null;
  confirmationNumber: string | null;
  createdBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateBookingTransferInput {
  tenantId: string;
  bookingId: string;
  transferType?: TransferType | null;
  providerName?: string | null;
  vehicleType?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  pickupTime?: string | null;
  passengerCount?: number | null;
  confirmationNumber?: string | null;
  createdBy?: string | null;
}

export interface UpdateBookingTransferInput {
  transferType?: TransferType | null;
  providerName?: string | null;
  vehicleType?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  pickupTime?: string | null;
  passengerCount?: number | null;
  confirmationNumber?: string | null;
}

export function toBookingTransfer(row: BookingTransferRow): BookingTransfer {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    bookingId: row.booking_id,
    transferType: toTransferType(row.transfer_type),
    providerName: row.provider_name,
    vehicleType: row.vehicle_type,
    pickupLocation: row.pickup_location,
    dropoffLocation: row.dropoff_location,
    pickupTime: row.pickup_time,
    passengerCount: row.passenger_count,
    confirmationNumber: row.confirmation_number,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toBookingTransferInsert(
  input: CreateBookingTransferInput,
): BookingTransferInsertRow {
  return {
    tenant_id: input.tenantId,
    booking_id: input.bookingId,
    transfer_type: input.transferType ?? null,
    provider_name: input.providerName ?? null,
    vehicle_type: input.vehicleType ?? null,
    pickup_location: input.pickupLocation ?? null,
    dropoff_location: input.dropoffLocation ?? null,
    pickup_time: input.pickupTime ?? null,
    passenger_count: input.passengerCount ?? null,
    confirmation_number: input.confirmationNumber ?? null,
    created_by: input.createdBy ?? null,
  };
}

export function toBookingTransferUpdate(
  input: UpdateBookingTransferInput,
): BookingTransferUpdateRow {
  return {
    transfer_type: input.transferType,
    provider_name: input.providerName,
    vehicle_type: input.vehicleType,
    pickup_location: input.pickupLocation,
    dropoff_location: input.dropoffLocation,
    pickup_time: input.pickupTime,
    passenger_count: input.passengerCount,
    confirmation_number: input.confirmationNumber,
  };
}
