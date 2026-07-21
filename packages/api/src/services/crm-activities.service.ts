import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toCrmActivity,
  toCrmActivityInsert,
  toCrmActivityUpdate,
  type CrmActivity,
  type CreateCrmActivityInput,
  type UpdateCrmActivityInput,
} from "./crm-activities.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Mirrors crm-leads.service.ts/crm-notes.service.ts's
// shape - callers only ever see the mapped CrmActivity domain shape,
// never the generated Row type.
export const crmActivitiesService = {
  async listByLead(supabase: SupabaseClient<Database>, leadId: string): Promise<CrmActivity[]> {
    const { data, error } = await supabase
      .from("crm_activities")
      .select("*")
      .eq("lead_id", leadId)
      .order("performed_at", { ascending: false });

    if (error) throw error;
    return data.map(toCrmActivity);
  },

  async create(
    supabase: SupabaseClient<Database>,
    input: CreateCrmActivityInput,
  ): Promise<CrmActivity> {
    const { data, error } = await supabase
      .from("crm_activities")
      .insert(toCrmActivityInsert(input))
      .select()
      .single();

    if (error) throw error;
    return toCrmActivity(data);
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateCrmActivityInput,
  ): Promise<CrmActivity> {
    const { data, error } = await supabase
      .from("crm_activities")
      .update(toCrmActivityUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toCrmActivity(data);
  },

  // Hard delete - crm_activities has no deleted_at column (same as
  // crm_notes; no "never deleted" invariant applies here).
  async delete(supabase: SupabaseClient<Database>, id: string): Promise<void> {
    const { error } = await supabase.from("crm_activities").delete().eq("id", id);

    if (error) throw error;
  },
};
