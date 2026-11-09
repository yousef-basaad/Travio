"use client";

import { Users, CalendarClock, CalendarCheck2, Wallet, CircleCheck, CircleDollarSign } from "lucide-react";
import { StatsCard } from "@travio/ui";
import { useDashboardStats } from "../api/analytics.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

const ICON_SIZE = 16;

function MetricsErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      {t("analytics.metrics.error")}
    </div>
  );
}

// Overview cards - the six headline metrics for the whole tenant, all
// pre-aggregated by analyticsService.getDashboardStats (packages/api).
// Renamed from the original DashboardStats - AnalyticsMetrics reads more
// clearly once this lives alongside RevenueOverview/BookingStatusCard/
// CustomerInsights as one of several analytics-feature components, not
// the page's only one. Phase UI-2: each card now uses StatsCard's icon
// slot and isLoading (SkeletonCard) instead of a hand-rolled skeleton
// grid - same real numbers, no new data.
export function AnalyticsMetrics() {
  const t = useT();
  const format = useFormat();
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isError) return <MetricsErrorState />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        label={t("analytics.metrics.totalCustomers")}
        value={String(stats?.totalCustomers ?? 0)}
        icon={<Users size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="info"
      />
      <StatsCard
        label={t("home.kpi.totalBookings")}
        value={String(stats?.totalBookings ?? 0)}
        icon={<CalendarCheck2 size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="primary"
      />
      <StatsCard
        label={t("home.kpi.upcomingBookings")}
        value={String(stats?.upcomingBookings ?? 0)}
        icon={<CalendarClock size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="warning"
      />
      <StatsCard
        label={t("analytics.metrics.totalRevenue")}
        value={format.currency(stats?.totalRevenue ?? 0)}
        icon={<Wallet size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="success"
      />
      <StatsCard
        label={t("analytics.metrics.paid")}
        value={format.currency(stats?.paidAmount ?? 0)}
        icon={<CircleCheck size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="success"
      />
      <StatsCard
        label={t("analytics.metrics.outstanding")}
        value={format.currency(stats?.outstandingAmount ?? 0)}
        icon={<CircleDollarSign size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="danger"
      />
    </div>
  );
}
