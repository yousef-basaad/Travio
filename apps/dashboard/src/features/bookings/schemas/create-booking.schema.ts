import { z } from "zod";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

// tenantId/createdBy are intentionally absent - they're resolved from the
// authenticated session server-side (see app/api/bookings/route.ts),
// never trusted from this form.
export const createBookingFormSchema = z
  .object({
    customerId: z.string().trim().min(1, "Select a customer"),
    title: z.string().trim().min(1, "Title is required"),
    startDate: z.preprocess(emptyToUndefined, z.string().date("Enter a valid date").optional()),
    endDate: z.preprocess(emptyToUndefined, z.string().date("Enter a valid date").optional()),
    notes: z.preprocess(emptyToUndefined, z.string().optional()),
  })
  // Mirrors the server-side createBookingSchema's same check - catches it
  // client-side first so the error shows next to the End Date field
  // instead of round-tripping to the server.
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type CreateBookingFormValues = z.infer<typeof createBookingFormSchema>;
