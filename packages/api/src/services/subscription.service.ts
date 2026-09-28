import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import {
  toSubscription,
  toPlan,
  toPlanFeature,
  toTenantUsage,
  type Subscription,
  type Plan,
  type PlanFeature,
  type TenantUsage,
} from "./subscription.mapper";

// Service layer: raw Supabase queries live here, never inline in
// components/routes. Read-only, by this phase's own explicit scope ("Do
// not implement payments... read-only subscription view") - no
// create/update/delete methods exist here, matching notificationService
// having no delete() for the same "this domain doesn't support that
// action yet" reasoning.
export const subscriptionService = {
  // Most recent subscription row for the tenant, whatever its status -
  // deliberately not filtered to status = 'active' only, since a
  // 'past_due'/'cancelled'/'trialing' subscription is still the real,
  // relevant answer to "what's this tenant's subscription state" rather
  // than something to hide. Most tenants have zero rows today (nothing
  // in this codebase creates one yet - see the migration's own comment
  // and this phase's final report) - callers handle null as "no
  // subscription on file", not an error.
  async getLatestByTenant(
    supabase: SupabaseClient<Database>,
    tenantId: string,
  ): Promise<Subscription | null> {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data ? toSubscription(data) : null;
  },

  async getPlanById(supabase: SupabaseClient<Database>, id: string): Promise<Plan | null> {
    const { data, error } = await supabase
      .from("plans")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data ? toPlan(data) : null;
  },

  async listPlanFeatures(supabase: SupabaseClient<Database>, planId: string): Promise<PlanFeature[]> {
    const { data, error } = await supabase
      .from("plan_features")
      .select("*")
      .eq("plan_id", planId)
      .order("feature_key", { ascending: true });

    if (error) throw error;
    return data.map(toPlanFeature);
  },

  async listUsageByTenant(
    supabase: SupabaseClient<Database>,
    tenantId: string,
  ): Promise<TenantUsage[]> {
    const { data, error } = await supabase
      .from("tenant_usage")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("period_start", { ascending: false });

    if (error) throw error;
    return data.map(toTenantUsage);
  },
};
