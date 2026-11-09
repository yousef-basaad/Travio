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
import { cn } from "@travio/utils";
import type { SubscriptionStatus, LimitCheck } from "@travio/api";
import { useSubscription, type SubscriptionResponse } from "../api/subscription.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

const STATUS_KEYS: Record<SubscriptionStatus, MessageKey> = {
  trialing: "subscriptionStatus.trialing",
  active: "subscriptionStatus.active",
  past_due: "subscriptionStatus.past_due",
  cancelled: "subscriptionStatus.cancelled",
  expired: "subscriptionStatus.expired",
};

const FEATURE_KEYS: Record<string, MessageKey> = {
  max_users: "planFeature.max_users",
  max_bookings_monthly: "planFeature.max_bookings_monthly",
  max_documents: "planFeature.max_documents",
  max_storage_mb: "planFeature.max_storage_mb",
};

const INTERVAL_KEYS: Record<string, MessageKey> = {
  monthly: "subscription.interval.monthly",
  yearly: "subscription.interval.yearly",
};

// "5 / 10" has neutral separators, so an RTL page would flip it to
// "10 / 5" - isolate it as one left-to-right run.
const ltr = (value: string) => `\u2066${value}\u2069`;

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
  const t = useT();
  return (
    <div role="status" aria-label={t("subscription.loading")} className="space-y-4">
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  );
}

function SubscriptionErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
    >
      {t("subscription.error")}
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
function formatCountValue(used: number, limit: LimitCheck | undefined, unlimited: string): string {
  if (!limit || limit.limit === null) {
    return limit?.isConfigured ? ltr(`${used} / ${unlimited}`) : `${used}`;
  }
  return ltr(`${used} / ${limit.limit}`);
}

function formatMb(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb.toFixed(0)} MB`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function formatStorageValue(usedBytes: number, limit: LimitCheck | undefined, unlimited: string): string {
  const used = formatBytes(usedBytes);
  if (!limit || limit.limit === null) {
    return ltr(limit?.isConfigured ? `${used} / ${unlimited}` : used);
  }
  return ltr(`${used} / ${formatMb(limit.limit)}`);
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
  const t = useT();
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">{t("subscription.usageLimits")}</h2>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatsCard
            label={t("subscription.teamMembers")}
            value={formatCountValue(usageSnapshot.teamMembers, limits.max_users, t("subscription.unlimited"))}
            icon={<Users size={18} />}
            tone={toneForLimit(limits.max_users)}
          />
          <StatsCard
            label={t("subscription.customers")}
            value={`${usageSnapshot.customers}`}
            icon={<Contact size={18} />}
          />
          <StatsCard
            label={t("subscription.bookingsThisMonth")}
            value={formatCountValue(usageSnapshot.bookingsThisMonth, limits.max_bookings_monthly, t("subscription.unlimited"))}
            icon={<CalendarCheck size={18} />}
            tone={toneForLimit(limits.max_bookings_monthly)}
          />
          <StatsCard
            label={t("nav.documents")}
            value={formatCountValue(usageSnapshot.documents, limits.max_documents, t("subscription.unlimited"))}
            icon={<FileText size={18} />}
            tone={toneForLimit(limits.max_documents)}
          />
          <StatsCard
            label={t("subscription.storage")}
            value={formatStorageValue(usageSnapshot.storageBytes, limits.max_storage_mb, t("subscription.unlimited"))}
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
  const t = useT();
  const format = useFormat();
  const { data, isLoading, isError } = useSubscription();

  return (
    <div className="space-y-6">
      <PageHeader title={t("nav.subscription")} description={t("subscription.description")} />

      {isLoading ? (
        <SubscriptionSkeleton />
      ) : isError || !data ? (
        <SubscriptionErrorState />
      ) : !data.subscription || !data.plan ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={<CreditCard size={20} />}
              title={t("subscription.none")}
              description={t("subscription.noneHint")}
            />
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <h2 className="text-sm font-medium">{t("subscription.currentPlan")}</h2>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  STATUS_STYLES[data.subscription.status],
                )}
              >
                {t(STATUS_KEYS[data.subscription.status])}
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
                  <dt className="text-muted-foreground">{t("subscription.price")}</dt>
                  <dd className="font-medium text-foreground">
                    {data.plan.price > 0
                      ? t("subscription.pricePer", {
                          price: data.plan.price.toLocaleString(),
                          interval: INTERVAL_KEYS[data.plan.interval] ? t(INTERVAL_KEYS[data.plan.interval]!) : data.plan.interval,
                        })
                      : t("subscription.custom")}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("subscription.started")}</dt>
                  <dd className="font-medium text-foreground">
                    {format.date(data.subscription.startsAt)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">{t("subscription.renews")}</dt>
                  <dd className="font-medium text-foreground">
                    {data.subscription.endsAt ? format.date(data.subscription.endsAt) : "—"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {data.features.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-sm font-medium">{t("subscription.features")}</h2>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {data.features.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between gap-4">
                      <dt className="text-sm text-muted-foreground">
                        {FEATURE_KEYS[feature.featureKey] ? t(FEATURE_KEYS[feature.featureKey]!) : humanizeFeatureKey(feature.featureKey)}
                      </dt>
                      <dd className="text-sm font-medium text-foreground">
                        {feature.featureValue === "unlimited" ? t("subscription.unlimited") : (feature.featureValue ?? "—")}
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
                <h2 className="text-sm font-medium">{t("subscription.usage")}</h2>
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
