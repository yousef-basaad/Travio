import { z } from "zod";

// Form-level schema (react-hook-form + zod resolver). Distinct from the
// DB-shape schema in @travio/types - this one governs what the create/edit
// form accepts before it's mapped to a DB row.
export const customerFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(9, "Enter a valid Saudi phone number"),
  nationalId: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof customerFormSchema>;
