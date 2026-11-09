"use client";

import { StatsCard, SkeletonCard } from "@travio/ui";
import { useDashboardStats } from "@/features/analytics";
import { useExpenseTotal } from "../api/expenses.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

function MetricsSkeleton() {
  const t = useT();
  return (
    <div
      role="status"
      aria-label={t("finance.metrics.loading")}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

function MetricsErrorState() {
  const t = useT();
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      {t("finance.metrics.error")}
    </div>
  );
}

// Headline finance metrics. Revenue/paid/outstanding are reused directly
// from analyticsService.getDashboardStats() (via @/features/analytics) -
// no second aggregation of the same numbers. Total Expenses comes from
// Postgres too (useExpenseTotal -> finance_expense_total): summing the
// fetched expenses list stopped at the 1000-row response cap.
export function FinanceMetrics() {
  const t = useT();
  const format = useFormat();
  const { data: stats, isLoading: isLoadingStats, isError: isStatsError } = useDashboardStats();
  const { data: totalExpenses, isLoading: isLoadingExpenses, isError: isExpensesError } = useExpenseTotal();

  if (isLoadingStats || isLoadingExpenses) return <MetricsSkeleton />;
  if (isStatsError || isExpensesError || !stats || totalExpenses === undefined) return <MetricsErrorState />;

  const netIncome = stats.paidAmount - totalExpenses;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatsCard label={t("finance.metrics.totalRevenue")} value={format.currency(stats.totalRevenue)} />
      <StatsCard label={t("finance.metrics.paidAmount")} value={format.currency(stats.paidAmount)} />
      <StatsCard label={t("bookings.finance.outstanding")} value={format.currency(stats.outstandingAmount)} />
      <StatsCard label={t("finance.metrics.totalExpenses")} value={format.currency(totalExpenses)} />
      <StatsCard label={t("finance.metrics.netIncome")} value={format.currency(netIncome)} />
    </div>
  );
}
