import { z } from "zod";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

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
      z.string().trim().min(1, "Title is required").optional(),
    ),
    startDate: z.preprocess(emptyToNull, z.string().date("Enter a valid date").nullable().optional()),
    endDate: z.preprocess(emptyToNull, z.string().date("Enter a valid date").nullable().optional()),
    notes: z.preprocess(emptyToNull, z.string().nullable().optional()),
    assignedTo: z.preprocess(emptyToNull, z.string().uuid("Enter a valid id").nullable().optional()),
    status: bookingStatusSchema.optional(),
  })
  // Mirrors the server-side updateBookingSchema's same check - catches it
  // client-side first so the error shows next to the End Date field
  // instead of round-tripping to the server.
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type UpdateBookingFormValues = z.infer<typeof updateBookingFormSchema>;
