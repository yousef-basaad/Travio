import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import type { UserRole } from "@travio/types";
import {
  toCrmLead,
  toCrmLeadInsert,
  toCrmLeadUpdate,
  type CrmLead,
  type CreateCrmLeadInput,
  type UpdateCrmLeadInput,
} from "./crm-leads.mapper";

export interface ListCrmLeadsOptions {
  role: UserRole;
  userId: string;
}

// Service layer: raw Supabase queries live here, never inline in components.
// Mirrors bookings.service.ts's shape - callers only ever see the mapped
// CrmLead domain shape, never the generated Row type.
export const crmLeadsService = {
  // See customer.service.ts's list() comment - the sales_agent .or()
  // clause here mirrors what crm_leads_tenant_access (RLS, Phase 4C.1)
  // already enforces at the database level; this is defense-in-depth,
  // not the sole gate.
  async list(
    supabase: SupabaseClient<Database>,
    tenantId: string,
    options?: ListCrmLeadsOptions,
  ): Promise<CrmLead[]> {
    let query = supabase
      .from("crm_leads")
      .select("*")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null);

    if (options?.role === "sales_agent") {
      query = query.or(`assigned_to.eq.${options.userId},assigned_to.is.null`);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toCrmLead);
  },

  async getById(supabase: SupabaseClient<Database>, id: string): Promise<CrmLead | null> {
    const { data, error } = await supabase
      .from("crm_leads")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) throw error;
    return data ? toCrmLead(data) : null;
  },

  async create(supabase: SupabaseClient<Database>, input: CreateCrmLeadInput): Promise<CrmLead> {
    const { data, error } = await supabase
      .from("crm_leads")
      .insert(toCrmLeadInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toCrmLead(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateCrmLeadInput,
  ): Promise<CrmLead> {
    const { data, error } = await supabase
      .from("crm_leads")
      .update(toCrmLeadUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toCrmLead(data);
  },

  // Soft delete only - crm_leads rows are never hard-deleted (ADR-0004:
  // a lead is never removed, so pipeline/conversion history stays intact).
  async softDelete(supabase: SupabaseClient<Database>, id: string): Promise<CrmLead> {
    const { data, error } = await supabase
      .from("crm_leads")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toCrmLead(data);
  },
};
