import { z } from "zod";

export const bookingStatusSchema = z.enum([
  "draft",
  "confirmed",
  "cancelled",
  "completed",
  "refunded",
]);

export const bookingSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  customerId: z.string().uuid(),
  status: bookingStatusSchema,
  destination: z.string().min(1),
  departureDate: z.string().datetime(),
  returnDate: z.string().datetime().nullable(),
  totalAmountSar: z.number().nonnegative(),
  createdAt: z.string().datetime(),
});

export type Booking = z.infer<typeof bookingSchema>;
export type BookingStatus = z.infer<typeof bookingStatusSchema>;
