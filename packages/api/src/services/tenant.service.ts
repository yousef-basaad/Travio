import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { toTenant, toTenantUpdate, type Tenant, type UpdateTenantInput } from "./tenant.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. tenants has no tenant_id column on itself (it IS
// the tenant) - RLS (tenants_select_own_or_admin) already scopes select
// to the caller's own tenant, same reasoning invoiceService.list() gives
// for relying on RLS alone rather than an app-level filter.
export const tenantService = {
  async getById(supabase: SupabaseClient<Database>, id: string): Promise<Tenant | null> {
    const { data, error } = await supabase
      .from("tenants")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toTenant(data) : null;
  },

  async update(
    supabase: SupabaseClient<Database>,
    id: string,
    input: UpdateTenantInput,
  ): Promise<Tenant> {
    const { data, error } = await supabase
      .from("tenants")
      .update(toTenantUpdate(input))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toTenant(data);
  },
};
