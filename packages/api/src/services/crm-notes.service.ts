import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toCrmNote,
  toCrmNoteInsert,
  type CrmNote,
  type CreateCrmNoteInput,
} from "./crm-notes.mapper";

// Service layer: raw Supabase queries live here, never inline in components.
// Mirrors crm-leads.service.ts's shape - callers only ever see the mapped
// CrmNote domain shape, never the generated Row type.
export const crmNotesService = {
  async listByLead(supabase: SupabaseClient<Database>, leadId: string): Promise<CrmNote[]> {
    const { data, error } = await supabase
      .from("crm_notes")
      .select("*")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toCrmNote);
  },

  async listByCustomer(
    supabase: SupabaseClient<Database>,
    customerId: string,
  ): Promise<CrmNote[]> {
    const { data, error } = await supabase
      .from("crm_notes")
      .select("*")
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data.map(toCrmNote);
  },

  async create(supabase: SupabaseClient<Database>, input: CreateCrmNoteInput): Promise<CrmNote> {
    const { data, error } = await supabase
      .from("crm_notes")
      .insert(toCrmNoteInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toCrmNote(data);
  },

  // Hard delete - crm_notes has no deleted_at column (unlike crm_leads,
  // notes carry no "never deleted" invariant from ADR-0004).
  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("crm_notes").delete().eq("id", id);

    if (error) throw error;
  },
};
