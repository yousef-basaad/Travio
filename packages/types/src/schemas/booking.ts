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
  id: z.guid(),
  tenantId: z.guid(),
  customerId: z.guid(),
  branchId: z.guid().nullable(),
  assignedTo: z.guid().nullable(),
  bookingNumber: z.string(),
  status: bookingStatusSchema,
  title: z.string(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  totalAmount: z.number().nonnegative(),
  /** ISO 3166-1 alpha-2, e.g. "TR". */
  destinationCountry: z.string().nullable(),
  destinationCity: z.string().nullable(),
  adults: z.number().int().nullable(),
  children: z.number().int().nullable(),
  currency: z.string().nullable(),
  notes: z.string().nullable(),
  createdBy: z.guid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Booking = z.infer<typeof bookingSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
