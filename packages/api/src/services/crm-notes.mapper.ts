import type { Database } from "@travio/database";

type CrmNoteRow = Database["public"]["Tables"]["crm_notes"]["Row"];
type CrmNoteInsertRow = Database["public"]["Tables"]["crm_notes"]["Insert"];

export interface CrmNote {
  id: string;
  tenantId: string;
  leadId: string | null;
  customerId: string | null;
  createdBy: string | null;
  body: string;
  createdAt: string;
  updatedAt: string;
}

// Exactly one of leadId/customerId must be set - enforced authoritatively
// by crm_notes_single_subject (the DB check constraint), not duplicated
// here.
export interface CreateCrmNoteInput {
  tenantId: string;
  leadId?: string | null;
  customerId?: string | null;
  body: string;
  createdBy?: string | null;
}

export function toCrmNote(row: CrmNoteRow): CrmNote {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    leadId: row.lead_id,
    customerId: row.customer_id,
    createdBy: row.created_by,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCrmNoteInsert(input: CreateCrmNoteInput): CrmNoteInsertRow {
  return {
    tenant_id: input.tenantId,
    lead_id: input.leadId ?? null,
    customer_id: input.customerId ?? null,
    body: input.body,
    created_by: input.createdBy ?? null,
  };
}
