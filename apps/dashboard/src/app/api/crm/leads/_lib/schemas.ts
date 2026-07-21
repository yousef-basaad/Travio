import { z } from "zod";

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
  fullName: z.string().min(1),
  branchId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  source: crmLeadSourceSchema.nullable().optional(),
  status: crmLeadStatusSchema.optional(),
  lostReason: z.string().nullable().optional(),
});

export const updateCrmLeadSchema = z.object({
  fullName: z.string().min(1).optional(),
  branchId: z.string().uuid().nullable().optional(),
  assignedTo: z.string().uuid().nullable().optional(),
  convertedCustomerId: z.string().uuid().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email().nullable().optional(),
  source: crmLeadSourceSchema.nullable().optional(),
  status: crmLeadStatusSchema.optional(),
  lostReason: z.string().nullable().optional(),
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
  body: z.string().min(1),
});
