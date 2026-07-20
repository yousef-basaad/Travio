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
