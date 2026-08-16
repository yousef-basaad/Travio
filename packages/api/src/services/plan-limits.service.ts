import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { subscriptionService } from "./subscription.service";
import { usageService, type TenantUsageSnapshot } from "./usage.service";

// The four feature_key values this phase tracks. Deliberately not
// "every key that might ever exist" - a plan_features row with some
// other key (e.g. a future feature flag) is simply not surfaced as a
// limit here; that's a different concern from usage/limit checking.
export const TRACKED_FEATURE_KEYS = [
  "max_users",
  "max_bookings_monthly",
  "max_documents",
  "max_storage_mb",
] as const;
export type TrackedFeatureKey = (typeof TRACKED_FEATURE_KEYS)[number];

export interface LimitCheck {
  featureKey: TrackedFeatureKey;
  /** null covers both "unlimited" and "not configured" - see isConfigured. */
  limit: number | null;
  /**
   * true + limit === null  -> plan_features explicitly says "unlimited"
   * false + limit === null -> no plan_features row for this key at all
   * (or its value couldn't be parsed as a number) - "not configured",
   * never a thrown error.
   */
  isConfigured: boolean;
  used: number;
  /** null whenever limit is null (nothing to subtract from). */
  remaining: number | null;
  isAtLimit: boolean;
}

function parseFeatureValue(value: string | null | undefined): {
  limit: number | null;
  isConfigured: boolean;
} {
  if (value === null || value === undefined) {
    return { limit: null, isConfigured: false };
  }
  if (value.trim().toLowerCase() === "unlimited") {
    return { limit: null, isConfigured: true };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    // Malformed feature_value (plan_features.feature_value is a plain
    // text column, no CHECK constraint) - treated the same as "missing"
    // rather than thrown, matching "missing feature keys should still
    // safely return unlimited/not configured rather than failing."
    return { limit: null, isConfigured: false };
  }
  return { limit: parsed, isConfigured: true };
}

function toLimitCheck(featureKey: TrackedFeatureKey, value: string | undefined, used: number): LimitCheck {
  const { limit, isConfigured } = parseFeatureValue(value);
  return {
    featureKey,
    limit,
    isConfigured,
    used,
    remaining: limit === null ? null : Math.max(limit - used, 0),
    isAtLimit: limit !== null && used >= limit,
  };
}

const BYTES_PER_MB = 1024 * 1024;

// Reusable "can this agency do X" surface - the single place limit
// numbers are computed, so no route/component hardcodes a threshold.
// Read-only: nothing here enforces anything, it only answers the
// question. This phase wires it into the subscription page's own API
// route only - no creation flow (booking/team/document) calls this yet,
// per this phase's explicit "do not enforce limits everywhere" scope.
export const planLimitsService = {
  async getAllLimits(
    supabase: SupabaseClient<Database>,
    tenantId: string,
  ): Promise<{ usage: TenantUsageSnapshot; limits: Record<TrackedFeatureKey, LimitCheck> }> {
    const [subscription, usage] = await Promise.all([
      subscriptionService.getLatestByTenant(supabase, tenantId),
      usageService.getSnapshot(supabase, tenantId),
    ]);

    const features = subscription
      ? await subscriptionService.listPlanFeatures(supabase, subscription.planId)
      : [];
    const valueByKey = new Map(features.map((feature) => [feature.featureKey, feature.featureValue ?? undefined]));

    const usedByKey: Record<TrackedFeatureKey, number> = {
      max_users: usage.teamMembers,
      max_bookings_monthly: usage.bookingsThisMonth,
      max_documents: usage.documents,
      max_storage_mb: usage.storageBytes / BYTES_PER_MB,
    };

    const limits = Object.fromEntries(
      TRACKED_FEATURE_KEYS.map((key) => [key, toLimitCheck(key, valueByKey.get(key), usedByKey[key])]),
    ) as Record<TrackedFeatureKey, LimitCheck>;

    return { usage, limits };
  },
};
