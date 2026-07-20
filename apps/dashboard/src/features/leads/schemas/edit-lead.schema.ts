import { z } from "zod";
import { CRM_LEAD_SOURCE_OPTIONS } from "./create-lead.schema";

// Reuses the same source values as create-lead.schema.ts (only one
// duplicate declaration of the literal list needed across both forms) but
// adds status, which the create form doesn't collect.
const crmLeadSourceSchema = z.enum(CRM_LEAD_SOURCE_OPTIONS);

const crmLeadStatusSchema = z.enum([
  "new",
  "contacted",
  "qualified",
  "proposal_sent",
  "won",
  "lost",
]);

function emptyToNull(value: unknown) {
  return value === "" ? null : value;
}

// Unlike the create form, edit submits the full current state of every
// editable field on every save rather than a sparse patch. Clearing a
// field must send an explicit null so the API/service layer actually
// clears the column - omitting the key (undefined) means "leave
// unchanged" there, which would silently keep the old value.
export const editLeadFormSchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  phone: z.preprocess(emptyToNull, z.string().nullable()),
  email: z.preprocess(emptyToNull, z.string().email("Enter a valid email").nullable()),
  source: z.preprocess(emptyToNull, crmLeadSourceSchema.nullable()),
  status: crmLeadStatusSchema,
  assignedTo: z.preprocess(emptyToNull, z.string().uuid("Enter a valid id").nullable()),
});

export type EditLeadFormValues = z.infer<typeof editLeadFormSchema>;
export const CRM_LEAD_STATUS_OPTIONS = crmLeadStatusSchema.options;
