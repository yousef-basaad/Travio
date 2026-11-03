import { z } from "zod";

// Error messages are i18n message keys (lib/i18n/messages); the form
// translates them when it shows the error.

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

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
  })
  // Mirrors the server-side createBookingSchema's same check - catches it
  // client-side first so the error shows next to the End Date field
  // instead of round-tripping to the server.
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "validation.endBeforeStart",
    path: ["endDate"],
  });

export type CreateBookingFormValues = z.infer<typeof createBookingFormSchema>;
