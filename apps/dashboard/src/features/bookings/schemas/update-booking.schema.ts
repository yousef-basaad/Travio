import { z } from "zod";

// Error messages are i18n message keys (lib/i18n/messages); the form
// translates them when it shows the error.

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}


// Trip fields (booking-trip-fields.tsx). Same limits as the database
// checks on bookings (20261105140000).
function toCount(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  return typeof value === "number" ? value : Number(value);
}
const countSchema = z
  .number({ error: "validation.travelerCount" })
  .int("validation.travelerCount")
  .min(0, "validation.travelerCount")
  .max(999, "validation.travelerCount");
const countrySchema = z.string().regex(/^[A-Z]{2}$/, "validation.invalidCountry");
const citySchema = z.string().trim().max(120, "validation.cityTooLong");

// Matches the server's updateBookingSchema/bookings.booking_status enum
// exactly - status has no "unset" (a booking always has one), so this
// stays plain optional (omitted means leave unchanged), same convention
// as the server schema's own status field.
const bookingStatusSchema = z.enum(["draft", "pending", "confirmed", "completed", "cancelled"]);

// Every field is optional here, per this issue's explicit spec -
// PATCH /api/bookings/:id already treats an omitted key as "leave
// unchanged" (updateBookingSchema in app/api/bookings/_lib/schemas.ts).
// customerId/title use emptyToUndefined (they can't be cleared to null -
// a booking always needs both), while startDate/endDate/notes use
// emptyToNull since those columns are genuinely nullable and clearing
// them should send an explicit null, same convention as
// updateCustomerSchema/editLeadFormSchema.
// assignedTo uses emptyToNull (like startDate/endDate/notes) rather than
// emptyToUndefined - it's genuinely nullable (an unassigned booking is a
// valid state), same reasoning as editLeadFormSchema's assignedTo field.
export const updateBookingFormSchema = z
  .object({
    customerId: z.preprocess(emptyToUndefined, z.string().trim().min(1).optional()),
    title: z.preprocess(
      emptyToUndefined,
      z.string().trim().min(1, "validation.titleRequired").optional(),
    ),
    startDate: z.preprocess(emptyToNull, z.string().date("validation.invalidDate").nullable().optional()),
    endDate: z.preprocess(emptyToNull, z.string().date("validation.invalidDate").nullable().optional()),
    notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    assignedTo: z.preprocess(emptyToNull, z.guid("validation.invalidId").nullable().optional()),
    status: bookingStatusSchema.optional(),
    destinationCountry: z.preprocess(emptyToNull, countrySchema.nullable().optional()),
    destinationCity: z.preprocess(emptyToNull, citySchema.nullable().optional()),
    adults: z.preprocess(toCount, countSchema.nullable().optional()),
    children: z.preprocess(toCount, countSchema.nullable().optional()),
  })
  // Mirrors the server-side updateBookingSchema's same check - catches it
  // client-side first so the error shows next to the End Date field
  // instead of round-tripping to the server.
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "validation.endBeforeStart",
    path: ["endDate"],
  });

export type UpdateBookingFormValues = z.infer<typeof updateBookingFormSchema>;
