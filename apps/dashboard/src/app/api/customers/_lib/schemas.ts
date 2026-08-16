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
  assignedTo: z.string().uuid().nullable().optional(),
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
  assignedTo: z.string().uuid().nullable().optional(),
  phone: z.preprocess(emptyToNull, z.string().nullable().optional()),
  email: z.preprocess(emptyToNull, z.string().email("Enter a valid email").nullable().optional()),
  passportExpiry: z.preprocess(emptyToNull, z.string().date().nullable().optional()),
  preferredLanguage: z.preprocess(emptyToNull, z.string().nullable().optional()),
});

// Matches the real visa_status enum exactly (draft/submitted/approved/
// rejected) - not "pending", which packages/types' stale visa.ts schema
// incorrectly assumed.
const visaStatusSchema = z.enum(["draft", "submitted", "approved", "rejected"]);

// tenantId/customerId/createdBy are intentionally absent - tenantId and
// createdBy are resolved from the authenticated session and customerId
// from the URL param, never trusted from the request body. bookingId is
// optional - a visa application doesn't have to be tied to a specific
// booking.
export const createVisaSchema = z.object({
  bookingId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  country: z.preprocess(emptyToUndefined, z.string().optional()),
  visaType: z.preprocess(emptyToUndefined, z.string().optional()),
  status: z.preprocess(emptyToUndefined, visaStatusSchema.optional()),
  submittedAt: z.preprocess(emptyToUndefined, z.string().datetime().optional()),
});

// Unlike create, update submits the full current state of every editable
// field - clearing a field must send an explicit null, same reasoning as
// updateCustomerSchema. status is left non-nullable (optional only) -
// there's no "unset" status, only a change from one valid value to
// another, same as updateBookingSchema's status.
export const updateVisaSchema = z.object({
  bookingId: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  assignedTo: z.preprocess(emptyToNull, z.string().uuid().nullable().optional()),
  country: z.preprocess(emptyToNull, z.string().nullable().optional()),
  visaType: z.preprocess(emptyToNull, z.string().nullable().optional()),
  status: z.preprocess(emptyToUndefined, visaStatusSchema.optional()),
  submittedAt: z.preprocess(emptyToNull, z.string().datetime().nullable().optional()),
});
