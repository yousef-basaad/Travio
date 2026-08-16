"use client";

import { CreditCard, Users, Contact, CalendarCheck, FileText, HardDrive } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  EmptyState,
  PageHeader,
  Skeleton,
  StatsCard,
  type StatsCardTone,
} from "@travio/ui";
import { cn, formatDate } from "@travio/utils";
import type { SubscriptionStatus, LimitCheck } from "@travio/api";
import { useSubscription, type SubscriptionResponse } from "../api/subscription.api";

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: "Trialing",
  active: "Active",
  past_due: "Past Due",
  cancelled: "Cancelled",
  expired: "Expired",
};

// Reuses only existing design tokens, matching every other status badge
// in this app - no new colors introduced.
const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  trialing: "bg-accent text-accent-foreground",
  active: "bg-success/10 text-success",
  past_due: "bg-warning/10 text-warning",
  cancelled: "bg-danger/10 text-danger",
  expired: "bg-danger/10 text-danger",
};

function SubscriptionSkeleton() {
  return (
    <div role="status" aria-label="Loading subscription" className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function SubscriptionErrorState() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
    >
      Something went wrong loading your subscription. Please try again later.
    </div>
  );
}

// Humanizes plan_features.feature_key (e.g. "max_users" ->
// "Max Users") - a plain text column with no label lookup table of its
// own (see the seed migration), so this is display-only formatting, not
// a fabricated label map.
function humanizeFeatureKey(key: string): string {
  return key
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// "5 / 10" when a limit is configured, "5 / Unlimited" when the plan
// explicitly says so, or just "5" when the feature key isn't configured
// at all (LimitCheck.isConfigured === false) - never a fabricated
// denominator, matching planLimitsService's own isConfigured contract.
function formatCountValue(used: number, limit: LimitCheck | undefined): string {
  if (!limit || limit.limit === null) {
    return limit?.isConfigured ? `${used} / Unlimited` : `${used}`;
  }
  return `${used} / ${limit.limit}`;
}

function formatMb(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatStorageValue(usedBytes: number, limit: LimitCheck | undefined): string {
  const used = formatBytes(usedBytes);
  if (!limit || limit.limit === null) {
    return limit?.isConfigured ? `${used} / Unlimited` : used;
  }
  return `${used} / ${formatMb(limit.limit)}`;
}

// primary by default, warning inside the last 20% of a configured
// limit, danger once actually at the limit - a metric with no
// configured limit (unlimited or untracked) always stays primary, since
// there's nothing to warn about.
function toneForLimit(limit: LimitCheck | undefined): StatsCardTone {
  if (!limit || limit.limit === null) return "primary";
  if (limit.isAtLimit) return "danger";
  if (limit.limit > 0 && limit.used / limit.limit >= 0.8) return "warning";
  return "primary";
}

// Product-7: live-calculated usage against the current plan's
// plan_features limits (packages/api's usageService + planLimitsService)
// - every number here comes from a real, RLS-scoped count/sum query,
// never a fabricated or cached figure. "Customers" has no configured
// limit key (only max_users/max_bookings_monthly/max_documents/
// max_storage_mb are tracked - see plan-limits.service.ts), so it always
// renders as a plain count, matching the same isConfigured contract
// every other card uses. Read-only, matching the rest of this page - no
// action is offered here even at 100% usage.
function UsageAndLimits({
  usageSnapshot,
  limits,
}: {
  usageSnapshot: SubscriptionResponse["usageSnapshot"];
  limits: SubscriptionResponse["limits"];
}) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">Usage & Limits</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            label="Team Members"
            value={formatCountValue(usageSnapshot.teamMembers, limits.max_users)}
            icon={<Users size={18} />}
            tone={toneForLimit(limits.max_users)}
          />
          <StatsCard
            label="Customers"
            value={`${usageSnapshot.customers}`}
            icon={<Contact size={18} />}
          />
          <StatsCard
            label="Bookings This Month"
            value={formatCountValue(usageSnapshot.bookingsThisMonth, limits.max_bookings_monthly)}
            icon={<CalendarCheck size={18} />}
            tone={toneForLimit(limits.max_bookings_monthly)}
          />
          <StatsCard
            label="Documents"
            value={formatCountValue(usageSnapshot.documents, limits.max_documents)}
            icon={<FileText size={18} />}
            tone={toneForLimit(limits.max_documents)}
          />
          <StatsCard
            label="Storage"
            value={formatStorageValue(usageSnapshot.storageBytes, limits.max_storage_mb)}
            icon={<HardDrive size={18} />}
            tone={toneForLimit(limits.max_storage_mb)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

// Read-only, per this phase's explicit scope ("Do not implement
// payments... read-only subscription view") - no plan picker, no
// upgrade/downgrade action, no payment form anywhere on this page.
export function SubscriptionPage() {
  const { data, isLoading, isError } = useSubscription();

  return (
    <div className="space-y-6">
      <PageHeader title="Subscription" description="Your agency's current plan and usage" />

      {isLoading ? (
        <SubscriptionSkeleton />
      ) : isError || !data ? (
        <SubscriptionErrorState />
      ) : !data.subscription || !data.plan ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<CreditCard size={20} />}
              title="No active subscription"
              description="This agency doesn't have a subscription on file yet. Contact Travio to set one up."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <h2 className="text-sm font-medium">Current Plan</h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_STYLES[data.subscription.status],
                )}
              >
                {STATUS_LABELS[data.subscription.status]}
              </span>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-heading-md font-semibold text-foreground">{data.plan.name}</p>
                {data.plan.description ? (
                  <p className="text-sm text-muted-foreground">{data.plan.description}</p>
                ) : null}
              </div>
              <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground">Price</dt>
                  <dd className="font-medium text-foreground">
                    {data.plan.price > 0
                      ? `${data.plan.price.toLocaleString()} / ${data.plan.interval}`
                      : "Custom"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Started</dt>
                  <dd className="font-medium text-foreground">
                    {formatDate(data.subscription.startsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Renews / Ends</dt>
                  <dd className="font-medium text-foreground">
                    {data.subscription.endsAt ? formatDate(data.subscription.endsAt) : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {data.features.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-medium">Plan Features</h2>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">
                        {humanizeFeatureKey(feature.featureKey)}
                      </dt>
                      <dd className="text-sm font-medium text-foreground">
                        {feature.featureValue ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          {data.usage.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-medium">Usage</h2>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.usage.map((usage) => (
                    <div key={usage.id} className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">
                        {humanizeFeatureKey(usage.metric)}
                      </dt>
                      <dd className="text-sm font-medium text-foreground">{usage.value}</dd>
                    </div>
                  ))}
                </dl>
              </CardContent>
            </Card>
          )}

          <UsageAndLimits
            usageSnapshot={data.usageSnapshot}
            limits={data.limits}
          />
        </>
      )}
    </div>
  );
}
