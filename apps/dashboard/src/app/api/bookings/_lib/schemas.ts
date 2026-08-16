import { z } from "zod";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

const bookingStatusSchema = z.enum(["draft", "pending", "confirmed", "completed", "cancelled"]);

// tenantId and createdBy are intentionally absent - tenantId is resolved
// from the authenticated session and createdBy from the authenticated
// user id in the route handler, neither is ever trusted from the request
// body (same reasoning as createCustomerSchema).
//
// bookingNumber is optional here (was required) - bookingsService.create
// generates one when omitted (see that file's generateBookingNumber()).
// The dashboard's CreateBookingForm never collected this field, so
// requiring it meant every booking created through the UI failed
// server-side validation; a caller that already has its own number
// (e.g. a future import flow) can still supply one explicitly.
export const createBookingSchema = z.object({
  customerId: z.string().uuid(),
  bookingNumber: z.string().trim().min(1, "Booking number is required").optional(),
  title: z.string().trim().min(1, "Title is required"),
  branchId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  status: bookingStatusSchema.optional(),
  startDate: z.preprocess(emptyToUndefined, z.string().date().optional()),
  endDate: z.preprocess(emptyToUndefined, z.string().date().optional()),
  totalAmount: z.number().nonnegative().optional(),
  currency: z.preprocess(emptyToUndefined, z.string().optional()),
  notes: z.preprocess(emptyToUndefined, z.string().optional()),
})
  // Cross-field check - endDate before startDate is nonsensical for a
  // travel booking. Only runs when both are present (either can be
  // omitted independently, per the fields above).
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

// Unlike create, update submits the full current state of every editable
// field - clearing a field must send an explicit null, since
// bookingsService's update mapper treats an omitted/undefined key as
// "leave unchanged" (same reasoning as updateCustomerSchema).
export const updateBookingSchema = z.object({
  customerId: z.string().uuid().optional(),
  bookingNumber: z.string().trim().min(1, "Booking number is required").optional(),
  title: z.string().trim().min(1, "Title is required").optional(),
  branchId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  status: bookingStatusSchema.optional(),
  startDate: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
  endDate: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
  totalAmount: z.number().nonnegative().optional(),
  currency: z.preprocess(emptyToNull, z.string().nullable().optional()),
  notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
})
  // Same cross-field check as createBookingSchema - only runs when both
  // are present in this particular PATCH payload (the update form always
  // submits full current state, so both are normally present together).
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

// bookingId/tenantId/createdBy are never accepted from the request body -
// the route derives them from the URL param and the authenticated
// session, same as createCrmNoteSchema.
export const createBookingNoteSchema = z.object({
  body: z.string().min(1),
});

// Matches booking_flights_cabin_class_check exactly.
const cabinClassSchema = z.enum(["economy", "business", "first"]);

// tenantId/bookingId/createdBy are intentionally absent - tenantId and
// createdBy are resolved from the authenticated session and bookingId
// from the URL param, never trusted from the request body. Every field
// here is genuinely optional (booking_flights has no NOT NULL constraint
// beyond tenant_id/booking_id) - a flight can be added before all its
// details are known.
export const createFlightSchema = z.object({
  airline: z.preprocess(emptyToUndefined, z.string().optional()),
  flightNumber: z.preprocess(emptyToUndefined, z.string().optional()),
  departureAirport: z.preprocess(emptyToUndefined, z.string().optional()),
  arrivalAirport: z.preprocess(emptyToUndefined, z.string().optional()),
  departureTime: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
  arrivalTime: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
  cabinClass: z.preprocess(emptyToUndefined, cabinClassSchema.optional()),
});

// Unlike create, update submits the full current state of every editable
// field - clearing a field must send an explicit null, same reasoning as
// updateBookingSchema/updateCustomerSchema.
export const updateFlightSchema = z.object({
  airline: z.preprocess(emptyToNull, z.string().nullable().optional()),
  flightNumber: z.preprocess(emptyToNull, z.string().nullable().optional()),
  departureAirport: z.preprocess(emptyToNull, z.string().nullable().optional()),
  arrivalAirport: z.preprocess(emptyToNull, z.string().nullable().optional()),
  departureTime: z.preprocess(emptyToNull, z.string().datetime().nullable().optional()),
  arrivalTime: z.preprocess(emptyToNull, z.string().datetime().nullable().optional()),
  cabinClass: z.preprocess(emptyToNull, cabinClassSchema.nullable().optional()),
});

// Matches booking_hotels_board_type_check exactly.
const boardTypeSchema = z.enum([
  "room_only",
  "bed_breakfast",
  "half_board",
  "full_board",
  "all_inclusive",
]);

// tenantId/bookingId/createdBy are intentionally absent - same reasoning
// as createFlightSchema. Every field here is genuinely optional
// (booking_hotels has no NOT NULL constraint beyond tenant_id/booking_id).
export const createHotelSchema = z.object({
  hotelName: z.preprocess(emptyToUndefined, z.string().optional()),
  city: z.preprocess(emptyToUndefined, z.string().optional()),
  country: z.preprocess(emptyToUndefined, z.string().optional()),
  checkIn: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
  checkOut: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
  rooms: z.preprocess(emptyToUndefined, z.number().int().min(1).optional()),
  roomType: z.preprocess(emptyToUndefined, z.string().optional()),
  boardType: z.preprocess(emptyToUndefined, boardTypeSchema.optional()),
  confirmationNumber: z.preprocess(emptyToUndefined, z.string().optional()),
});

// Unlike create, update submits the full current state of every editable
// field - clearing a field must send an explicit null, same reasoning as
// updateFlightSchema.
export const updateHotelSchema = z.object({
  hotelName: z.preprocess(emptyToNull, z.string().nullable().optional()),
  city: z.preprocess(emptyToNull, z.string().nullable().optional()),
  country: z.preprocess(emptyToNull, z.string().nullable().optional()),
  checkIn: z.preprocess(emptyToNull, z.string().datetime().nullable().optional()),
  checkOut: z.preprocess(emptyToNull, z.string().datetime().nullable().optional()),
  rooms: z.preprocess(emptyToNull, z.number().int().min(1).nullable().optional()),
  roomType: z.preprocess(emptyToNull, z.string().nullable().optional()),
  boardType: z.preprocess(emptyToNull, boardTypeSchema.nullable().optional()),
  confirmationNumber: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

// Matches booking_transfers_type_check exactly.
const transferTypeSchema = z.enum([
  "airport_transfer",
  "hotel_transfer",
  "private_transfer",
  "shared_transfer",
]);

// tenantId/bookingId/createdBy are intentionally absent - same reasoning
// as createFlightSchema/createHotelSchema. Every field here is genuinely
// optional (booking_transfers has no NOT NULL constraint beyond
// tenant_id/booking_id).
export const createTransferSchema = z.object({
  transferType: z.preprocess(emptyToUndefined, transferTypeSchema.optional()),
  providerName: z.preprocess(emptyToUndefined, z.string().optional()),
  vehicleType: z.preprocess(emptyToUndefined, z.string().optional()),
  pickupLocation: z.preprocess(emptyToUndefined, z.string().optional()),
  dropoffLocation: z.preprocess(emptyToUndefined, z.string().optional()),
  pickupTime: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
  // No min() here (unlike hotels' rooms) - this issue's spec lists no
  // constraint on passenger_count, only transfer_type has a CHECK.
  passengerCount: z.preprocess(emptyToUndefined, z.number().int().optional()),
  confirmationNumber: z.preprocess(emptyToUndefined, z.string().optional()),
});

// Unlike create, update submits the full current state of every editable
// field - clearing a field must send an explicit null, same reasoning as
// updateFlightSchema/updateHotelSchema.
export const updateTransferSchema = z.object({
  transferType: z.preprocess(emptyToNull, transferTypeSchema.nullable().optional()),
  providerName: z.preprocess(emptyToNull, z.string().nullable().optional()),
  vehicleType: z.preprocess(emptyToNull, z.string().nullable().optional()),
  pickupLocation: z.preprocess(emptyToNull, z.string().nullable().optional()),
  dropoffLocation: z.preprocess(emptyToNull, z.string().nullable().optional()),
  pickupTime: z.preprocess(emptyToNull, z.string().datetime().nullable().optional()),
  passengerCount: z.preprocess(emptyToNull, z.number().int().nullable().optional()),
  confirmationNumber: z.preprocess(emptyToNull, z.string().nullable().optional()),
});
