import { z } from "zod";

// Digits, spaces and + ( ) - . only: a phone number, not free text.
const PHONE_PATTERN = /^[0-9+()\-.\s]{3,32}$/;

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

const crmLeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
]);

// tenantId is intentionally absent here - it's resolved from the
// authenticated profile in the route handler, never trusted from the
// request body.
export const createCrmLeadSchema = z.object({
  fullName: z.string().max(200).min(1),
  branchId: z.guid().nullable().optional(),
  assignedTo: z.guid().nullable().optional(),
  phone: z.string().max(32).regex(PHONE_PATTERN, "validation.invalidPhone").nullable().optional(),
  email: z.string().max(254).email().nullable().optional(),
  source: crmLeadSourceSchema.nullable().optional(),
  status: crmLeadStatusSchema.optional(),
  lostReason: z.string().max(5000).nullable().optional(),
});

export const updateCrmLeadSchema = z.object({
  fullName: z.string().max(200).min(1).optional(),
  branchId: z.guid().nullable().optional(),
  assignedTo: z.guid().nullable().optional(),
  convertedCustomerId: z.guid().nullable().optional(),
  phone: z.string().max(32).regex(PHONE_PATTERN, "validation.invalidPhone").nullable().optional(),
  email: z.string().max(254).email().nullable().optional(),
  source: crmLeadSourceSchema.nullable().optional(),
  status: crmLeadStatusSchema.optional(),
  lostReason: z.string().max(5000).nullable().optional(),
});

// Body is entirely optional - an empty POST is valid and means
// force_create_new: false, matching convert_crm_lead's own default.
export const convertCrmLeadSchema = z.object({
  forceCreateNew: z.boolean().optional().default(false),
});

// leadId/customerId/createdBy/tenantId are never accepted from the
// request body - the route derives them from the URL param and the
// authenticated session.
export const createCrmNoteSchema = z.object({
  body: z.string().max(5000).min(1),
});

// Matches crm_activities_type_check exactly.
const crmActivityTypeSchema = z.enum([
  "call",
  "email",
  "meeting",
  "whatsapp",
  "task",
  "follow_up",
]);

// tenantId/leadId/performedBy are never accepted from the request body -
// the route derives them from the URL param and the authenticated
// session, same as createCrmNoteSchema.
export const createCrmActivitySchema = z.object({
  type: crmActivityTypeSchema,
  title: z.string().max(200).min(1),
  description: z.string().max(1000).nullable().optional(),
  performedAt: z.string().datetime().optional(),
});

// leadId/tenantId/performedBy are immutable after creation - not
// accepted here either.
export const updateCrmActivitySchema = z.object({
  type: crmActivityTypeSchema.optional(),
  title: z.string().max(200).min(1).optional(),
  description: z.string().max(1000).nullable().optional(),
  performedAt: z.string().datetime().optional(),
});
