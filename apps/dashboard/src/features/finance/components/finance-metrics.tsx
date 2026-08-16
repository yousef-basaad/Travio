"use client";

import { StatsCard, SkeletonCard } from "@travio/ui";
import { formatCurrency } from "@travio/utils";
import { useDashboardStats } from "@/features/analytics";
import { useExpenses } from "../api/expenses.api";

function MetricsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading finance metrics"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
    >
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

function MetricsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading finance metrics. Please try again later.
    </div>
  );
}

// Headline finance metrics. Revenue/paid/outstanding are reused directly
// from analyticsService.getDashboardStats() (via @/features/analytics) -
// no second aggregation of the same numbers. Total Expenses/Net Income
// are the two genuinely new figures this workspace adds, computed from
// the real expenses list (useExpenses()) rather than a new aggregate
// endpoint - a client-side sum of already-fetched rows, same reasoning
// analyticsService itself uses (aggregate in JS after a bounded select).
export function FinanceMetrics() {
  const { data: stats, isLoading: isLoadingStats, isError: isStatsError } = useDashboardStats();
  const { data: expenses, isLoading: isLoadingExpenses, isError: isExpensesError } = useExpenses();

  if (isLoadingStats || isLoadingExpenses) return <MetricsSkeleton />;
  if (isStatsError || isExpensesError || !stats) return <MetricsErrorState />;

  const totalExpenses = (expenses ?? []).reduce((sum, expense) => sum + expense.amount, 0);
  const netIncome = stats.paidAmount - totalExpenses;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatsCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} />
      <StatsCard label="Paid Amount" value={formatCurrency(stats.paidAmount)} />
      <StatsCard label="Outstanding" value={formatCurrency(stats.outstandingAmount)} />
      <StatsCard label="Total Expenses" value={formatCurrency(totalExpenses)} />
      <StatsCard label="Net Income" value={formatCurrency(netIncome)} />
    </div>
  );
}
