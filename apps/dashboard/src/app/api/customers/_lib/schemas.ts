import { z } from "zod";

function emptyToUndefined(value: unknown) {
  return value === "" ? undefined : value;
}

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

// tenantId is intentionally absent here - it's resolved from the
// authenticated session in the route handler, never trusted from the
// request body.
export const createCustomerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.preprocess(emptyToUndefined, z.string().optional()),
  email: z.preprocess(emptyToUndefined, z.string().email("Enter a valid email").optional()),
  passportExpiry: z.preprocess(emptyToUndefined, z.string().date().optional()),
  preferredLanguage: z.preprocess(emptyToUndefined, z.string().optional()),
});

// Unlike create, update submits the full current state of every editable
// field - clearing a field must send an explicit null, since
// customerService's update mapper treats an omitted/undefined key as
// "leave unchanged" (same reasoning as crm_leads' edit-lead.schema.ts).
export const updateCustomerSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required").optional(),
  phone: z.preprocess(emptyToNull, z.string().nullable().optional()),
  email: z.preprocess(emptyToNull, z.string().email("Enter a valid email").nullable().optional()),
  passportExpiry: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
  preferredLanguage: z.preprocess(emptyToNull, z.string().nullable().optional()),
});
