import type { Database } from "@travio/database";

type CrmLeadRow = Database["public"]["Tables"]["crm_leads"]["Row"];
type CrmLeadInsertRow = Database["public"]["Tables"]["crm_leads"]["Insert"];
type CrmLeadUpdateRow = Database["public"]["Tables"]["crm_leads"]["Update"];

export type CrmLeadStatus = Database["public"]["Enums"]["crm_lead_status"];
export type CrmLeadSource = Database["public"]["Enums"]["crm_lead_source"];

export interface CrmLead {
  id: string;
  tenantId: string;
  branchId: string | null;
  assignedTo: string | null;
  convertedCustomerId: string | null;
  fullName: string;
  phone: string | null;
  email: string | null;
  source: CrmLeadSource | null;
  status: CrmLeadStatus;
  lostReason: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  deletedAt: string | null;
}

export interface CreateCrmLeadInput {
  tenantId: string;
  fullName: string;
  branchId?: string | null;
  assignedTo?: string | null;
  phone?: string | null;
  email?: string | null;
  source?: CrmLeadSource | null;
  status?: CrmLeadStatus;
  lostReason?: string | null;
}

export interface UpdateCrmLeadInput {
  branchId?: string | null;
  assignedTo?: string | null;
  convertedCustomerId?: string | null;
  fullName?: string;
  phone?: string | null;
  email?: string | null;
  source?: CrmLeadSource | null;
  status?: CrmLeadStatus;
  lostReason?: string | null;
}

export function toCrmLead(row: CrmLeadRow): CrmLead {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    branchId: row.branch_id,
    assignedTo: row.assigned_to,
    convertedCustomerId: row.converted_customer_id,
    fullName: row.full_name,
    phone: row.phone,
    email: row.email,
    source: row.source,
    status: row.status,
    lostReason: row.lost_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at,
  };
}

export function toCrmLeadInsert(input: CreateCrmLeadInput): CrmLeadInsertRow {
  return {
    tenant_id: input.tenantId,
    full_name: input.fullName,
    branch_id: input.branchId,
    assigned_to: input.assignedTo,
    phone: input.phone,
    email: input.email,
    source: input.source,
    status: input.status,
    lost_reason: input.lostReason,
  };
}

export function toCrmLeadUpdate(input: UpdateCrmLeadInput): CrmLeadUpdateRow {
  return {
    branch_id: input.branchId,
    assigned_to: input.assignedTo,
    converted_customer_id: input.convertedCustomerId,
    full_name: input.fullName,
    phone: input.phone,
    email: input.email,
    source: input.source,
    status: input.status,
    lost_reason: input.lostReason,
  };
}
