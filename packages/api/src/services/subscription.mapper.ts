import type { Database } from "@travio/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];
type PlanRow = Database["public"]["Tables"]["plans"]["Row"];
type PlanFeatureRow = Database["public"]["Tables"]["plan_features"]["Row"];
type TenantUsageRow = Database["public"]["Tables"]["tenant_usage"]["Row"];

export type SubscriptionStatus = Database["public"]["Enums"]["subscription_status"];
export type PlanInterval = Database["public"]["Enums"]["plan_interval"];

export interface Subscription {
  id: string;
  tenantId: string;
  planId: string;
  status: SubscriptionStatus;
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  interval: PlanInterval;
  isActive: boolean;
}

export interface PlanFeature {
  id: string;
  planId: string;
  featureKey: string;
  featureValue: string | null;
}

export interface TenantUsage {
  id: string;
  tenantId: string;
  metric: string;
  value: number;
  periodStart: string;
  periodEnd: string | null;
}

export function toSubscription(row: SubscriptionRow): Subscription {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    planId: row.plan_id,
    status: row.status,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPlan(row: PlanRow): Plan {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    price: row.price,
    interval: row.interval,
    isActive: row.is_active,
  };
}

export function toPlanFeature(row: PlanFeatureRow): PlanFeature {
  return {
    id: row.id,
    planId: row.plan_id,
    featureKey: row.feature_key,
    featureValue: row.feature_value,
  };
}

export function toTenantUsage(row: TenantUsageRow): TenantUsage {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    metric: row.metric,
    value: row.value,
    periodStart: row.period_start,
    periodEnd: row.period_end,
  };
}
