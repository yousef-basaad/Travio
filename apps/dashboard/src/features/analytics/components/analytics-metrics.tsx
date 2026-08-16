"use client";

import { Users, CalendarClock, CalendarCheck2, Wallet, CircleCheck, CircleDollarSign } from "lucide-react";
import { StatsCard } from "@travio/ui";
import { formatCurrency } from "@travio/utils";
import { useDashboardStats } from "../api/analytics.api";

const ICON_SIZE = 16;

function MetricsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading dashboard stats. Please try again later.
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
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isError) return <MetricsErrorState />;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatsCard
        label="Total Customers"
        value={String(stats?.totalCustomers ?? 0)}
        icon={<Users size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="info"
      />
      <StatsCard
        label="Total Bookings"
        value={String(stats?.totalBookings ?? 0)}
        icon={<CalendarCheck2 size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="primary"
      />
      <StatsCard
        label="Upcoming Bookings"
        value={String(stats?.upcomingBookings ?? 0)}
        icon={<CalendarClock size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="warning"
      />
      <StatsCard
        label="Total Revenue"
        value={formatCurrency(stats?.totalRevenue ?? 0)}
        icon={<Wallet size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="success"
      />
      <StatsCard
        label="Paid Amount"
        value={formatCurrency(stats?.paidAmount ?? 0)}
        icon={<CircleCheck size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="success"
      />
      <StatsCard
        label="Outstanding Amount"
        value={formatCurrency(stats?.outstandingAmount ?? 0)}
        icon={<CircleDollarSign size={ICON_SIZE} />}
        isLoading={isLoading}
        tone="danger"
      />
    </div>
  );
}
