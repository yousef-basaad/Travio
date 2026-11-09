import type { createServerSupabaseClient } from "@travio/database/server";

type ServerClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

// True when the caller's agency has been deactivated by Travio. RLS hides
// an inactive agency's own tenants row from its staff (current_tenant_id,
// 20261109120000), so "the lookup worked and found nothing" means
// inactive. A failed lookup is not treated as inactive: it would lock a
// whole agency out on a passing fault, and RLS still applies either way.
export async function isAgencyInactive(supabase: ServerClient, tenantId: string): Promise<boolean> {
  const { data, error } = await supabase.from("tenants").select("id").eq("id", tenantId).maybeSingle();
  return !error && !data;
}
