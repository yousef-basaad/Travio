"use client";

import { AlertCircle, CircleDollarSign, Receipt, TrendingUp, Wallet, WalletCards } from "lucide-react";
import { KpiCard, SkeletonCard } from "@travio/ui";
import { useDashboardStats, useRevenueOverview } from "@/features/analytics";
import { useExpenseTotal } from "../api/expenses.api";
import { useFinanceInsights } from "../api/finance-insights.api";
import { trendFrom } from "@/lib/analytics/trend";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

const ICON_SIZE = 20;
const SPARK_MONTHS = 6;

function MetricsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}

function MetricsErrorState() {
  const t = useT();
  return (
    <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
      <AlertCircle size={16} aria-hidden="true" />
      {t("finance.metrics.error")}
    </div>
  );
}

// The Finance KPIs from the TRAVIO design (06): revenue, payments, net
// profit, receivables and expenses. Totals are all-time (summed in
// Postgres); sparklines and trends are the last 6 months (invoiced,
// paid, expenses per month, and paid minus expenses for net profit).
export function FinanceMetrics() {
  const t = useT();
  const format = useFormat();
  const stats = useDashboardStats();
  const expenseTotal = useExpenseTotal();
  const revenue = useRevenueOverview();
  const insights = useFinanceInsights();

  if (stats.isLoading || expenseTotal.isLoading || revenue.isLoading || insights.isLoading) return <MetricsSkeleton />;
  if (stats.isError || expenseTotal.isError || !stats.data || expenseTotal.data === undefined) return <MetricsErrorState />;

  const months = (revenue.data?.months ?? []).slice(-SPARK_MONTHS);
  const invoiced = months.map((month) => month.invoiceTotal);
  const paid = months.map((month) => month.paidTotal);
  const expensesByMonth = new Map((insights.data?.expensesByMonth ?? []).map((month) => [month.month, month.expenseTotal]));
  const expenses = insights.data ? months.map((month) => expensesByMonth.get(month.month) ?? 0) : undefined;
  const net = expenses ? paid.map((value, index) => value - (expenses[index] ?? 0)) : undefined;

  const vsLastMonth = t("home.kpi.vsLastMonth");
  const currency = t("common.currencySar");
  const totalExpenses = expenseTotal.data;
  const netIncome = stats.data.paidAmount - totalExpenses;
  const withContext = (series: number[] | undefined) => {
    const trend = series ? trendFrom(series) : undefined;
    return { trend, trendContext: trend ? vsLastMonth : undefined };
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label={t("finance.metrics.totalRevenue")}
        value={format.number(stats.data.totalRevenue)}
        unit={currency}
        icon={<TrendingUp size={ICON_SIZE} />}
        tone="success"
        sparkline={invoiced}
        {...withContext(invoiced)}
      />
      <KpiCard
        label={t("finance.metrics.paidAmount")}
        value={format.number(stats.data.paidAmount)}
        unit={currency}
        icon={<WalletCards size={ICON_SIZE} />}
        tone="info"
        sparkline={paid}
        {...withContext(paid)}
      />
      <KpiCard
        label={t("finance.metrics.netIncome")}
        value={format.number(netIncome)}
        unit={currency}
        icon={<CircleDollarSign size={ICON_SIZE} />}
        tone="primary"
        sparkline={net}
        {...withContext(net)}
      />
      <KpiCard
        label={t("bookings.finance.outstanding")}
        value={format.number(stats.data.outstandingAmount)}
        unit={currency}
        icon={<Wallet size={ICON_SIZE} />}
        tone="warning"
        trendContext={
          stats.data.overdueAmount > 0
            ? t("finance.metrics.overduePart", { amount: format.number(stats.data.overdueAmount) })
            : undefined
        }
      />
      <KpiCard
        label={t("finance.metrics.totalExpenses")}
        value={format.number(totalExpenses)}
        unit={currency}
        icon={<Receipt size={ICON_SIZE} />}
        tone="danger"
        invertTrendColor
        sparkline={expenses}
        {...withContext(expenses)}
      />
    </div>
  );
}
