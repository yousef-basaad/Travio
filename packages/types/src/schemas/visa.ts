import { z } from "zod";

export const visaStatusSchema = z.enum([
  "pending",
  "submitted",
  "approved",
  "rejected",
]);

export const visaApplicationSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  bookingId: z.string().uuid(),
  passportNumber: z.string().min(4),
  nationality: z.string().min(2),
  status: visaStatusSchema,
  submittedAt: z.string().datetime().nullable(),
});

export type VisaApplication = z.infer<typeof visaApplicationSchema>;
export type VisaStatus = z.infer<typeof visaStatusSchema>;
