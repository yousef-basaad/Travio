import { z } from "zod";

// Mirrors app/api/crm/leads/_lib/schemas.ts's crm_lead_source values. Zod
// enums need the literal list; it can't be derived from the CrmLeadSource
// type at runtime, so this is duplicated deliberately (same reasoning as
// the API route's own schema file).
const crmLeadSourceSchema = z.enum([
  "walk_in",
  "website",
  "whatsapp",
  "instagram",
  "snapchat",
  "tiktok",
  "referral",
  "phone",
  "other",
]);

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

export const createLeadFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  email: z.preprocess(emptyToUndefined, z.string().email("Enter a valid email").optional()),
  source: z.preprocess(emptyToUndefined, crmLeadSourceSchema.optional()),
});

export type CreateLeadFormValues = z.infer<typeof createLeadFormSchema>;
export const CRM_LEAD_SOURCE_OPTIONS = crmLeadSourceSchema.options;
