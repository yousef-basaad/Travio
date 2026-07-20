import { z } from "zod";

export const inquirySchema = z.object({
  agencyName: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(10),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;
