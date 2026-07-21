import type { Database } from "@travio/database";

type CrmActivityRow = Database["public"]["Tables"]["crm_activities"]["Row"];
type CrmActivityInsertRow = Database["public"]["Tables"]["crm_activities"]["Insert"];
type CrmActivityUpdateRow = Database["public"]["Tables"]["crm_activities"]["Update"];

// crm_activities.type is plain text + a CHECK constraint
// (crm_activities_type_check), not a Postgres enum like
// crm_lead_status/crm_lead_source - so unlike those, the generated Row
// type has no literal union to reuse. This array is the single source of
// truth for the domain-level type and the runtime guard below.
const CRM_ACTIVITY_TYPES = [
  "call",
  "email",
  "meeting",
  "whatsapp",
  "task",
  "follow_up",
] as const;

export type CrmActivityType = (typeof CRM_ACTIVITY_TYPES)[number];

function isCrmActivityType(value: string): value is CrmActivityType {
  return (CRM_ACTIVITY_TYPES as readonly string[]).includes(value);
}

export interface CrmActivity {
  id: string;
  tenantId: string;
  leadId: string;
  performedBy: string | null;
  type: CrmActivityType;
  title: string;
  description: string | null;
  performedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateCrmActivityInput {
  tenantId: string;
  leadId: string;
  type: CrmActivityType;
  title: string;
  description?: string | null;
  performedBy?: string | null;
  performedAt?: string;
}

export interface UpdateCrmActivityInput {
  type?: CrmActivityType;
  title?: string;
  description?: string | null;
  performedAt?: string;
}

export function toCrmActivity(row: CrmActivityRow): CrmActivity {
  if (!isCrmActivityType(row.type)) {
    // Should be unreachable given crm_activities_type_check, but the DB
    // column is untyped text - fail loudly rather than silently lying
    // about the type to callers.
    throw new Error(`Unexpected crm_activities.type value: ${row.type}`);
  }

  return {
    id: row.id,
    tenantId: row.tenant_id,
    leadId: row.lead_id,
    performedBy: row.performed_by,
    type: row.type,
    title: row.title,
    description: row.description,
    performedAt: row.performed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toCrmActivityInsert(input: CreateCrmActivityInput): CrmActivityInsertRow {
  return {
    tenant_id: input.tenantId,
    lead_id: input.leadId,
    type: input.type,
    title: input.title,
    description: input.description ?? null,
    performed_by: input.performedBy ?? null,
    performed_at: input.performedAt,
  };
}

export function toCrmActivityUpdate(input: UpdateCrmActivityInput): CrmActivityUpdateRow {
  return {
    type: input.type,
    title: input.title,
    description: input.description,
    performed_at: input.performedAt,
  };
}
