"use client";

import { useQuery } from "@tanstack/react-query";
import type {
  Subscription,
  Plan,
  PlanFeature,
  TenantUsage,
  TenantUsageSnapshot,
  TrackedFeatureKey,
  LimitCheck,
} from "@travio/api";

export const SUBSCRIPTION_QUERY_KEY = ["subscription"];

// Mirrors app/api/subscription/route.ts's response shape - declared here
// rather than imported, since Next.js route files may only export
// recognized handler functions/route config, never arbitrary types.
// `usage` (tenant_usage rows) is kept for response-shape stability even
// though that table is never written to (Product-7's design prefers
// live calculation - see usageSnapshot/limits below); `usage` is
// expected to always be an empty array today.
export interface SubscriptionResponse {
  subscription: Subscription | null;
  plan: Plan | null;
  features: PlanFeature[];
  usage: TenantUsage[];
  usageSnapshot: TenantUsageSnapshot;
  limits: Record<TrackedFeatureKey, LimitCheck>;
}

async function fetchSubscription(): Promise<SubscriptionResponse> {
  const response = await fetch("/api/subscription");

  if (!response.ok) {
    throw new Error(`Failed to load subscription (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/subscription");
  }

  return data as SubscriptionResponse;
}

export function useSubscription() {
  return useQuery({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchSubscription,
  });
}
