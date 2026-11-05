import { z } from "zod";

// Error messages are i18n message keys (lib/i18n/messages); the form
// translates them when it shows the error.

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}


// Trip fields (booking-trip-fields.tsx). Same limits as the database
// checks on bookings (20261105140000).
function toCount(value: unknown) {
  if (value === "" || value === null || value === undefined) return undefined;
  return typeof value === "number" ? value : Number(value);
}
const countSchema = z
  .number({ invalid_type_error: "validation.travelerCount" })
  .int("validation.travelerCount")
  .min(0, "validation.travelerCount")
  .max(999, "validation.travelerCount");
const countrySchema = z.string().regex(/^[A-Z]{2}$/, "validation.invalidCountry");
const citySchema = z.string().trim().max(120, "validation.cityTooLong");

// tenantId/createdBy are intentionally absent - they're resolved from the
// authenticated session server-side (see app/api/bookings/route.ts),
// never trusted from this form.
export const createBookingFormSchema = z
  .object({
    customerId: z.string().trim().min(1, "validation.selectCustomer"),
    title: z.string().trim().min(1, "validation.titleRequired"),
    startDate: z.preprocess(emptyToUndefined, z.string().date("validation.invalidDate").optional()),
    endDate: z.preprocess(emptyToUndefined, z.string().date("validation.invalidDate").optional()),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
    destinationCountry: z.preprocess(emptyToUndefined, countrySchema.optional()),
    destinationCity: z.preprocess(emptyToUndefined, citySchema.optional()),
    adults: z.preprocess(toCount, countSchema.optional()),
    children: z.preprocess(toCount, countSchema.optional()),
  })
  // Mirrors the server-side createBookingSchema's same check - catches it
  // client-side first so the error shows next to the End Date field
  // instead of round-tripping to the server.
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "validation.endBeforeStart",
    path: ["endDate"],
  });

export type CreateBookingFormValues = z.infer<typeof createBookingFormSchema>;
