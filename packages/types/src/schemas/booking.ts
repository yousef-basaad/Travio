import { z } from "zod";

// Mirrors public.bookings (see packages/database/src/types/generated.ts).
// Keep in sync with the generated Row type - this is not an independent
// domain shape, just a camelCase view of the same columns.
export const bookingStatusSchema = z.enum([
  "draft",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

export const bookingSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  branchId: z.string().uuid().nullable(),
  bookingNumber: z.string(),
  status: bookingStatusSchema,
  totalAmount: z.number().nonnegative(),
  currency: z.string().nullable(),
  notes: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Booking = z.infer<typeof bookingSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
