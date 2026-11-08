"use client";

import type { ReactNode } from "react";
import { AlertCircle, CalendarCheck2, CircleCheckBig, TrendingUp, UserPlus, Wallet } from "lucide-react";
import { KpiCard, SkeletonCard } from "@travio/ui";
import { trendFrom } from "@/lib/analytics/trend";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import { useDashboardStats, useReportsOverview, useRevenueOverview } from "../api/analytics.api";
import { reportRatios } from "../utils/report-metrics";

const ICON_SIZE = 20;
const SPARK_MONTHS = 6;

// Fits five or six cards: the profit card is only there for finance roles.
export const REPORT_KPI_GRID = "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]";

// The Reports KPIs from the TRAVIO design (07): sales, bookings, new
// customers, average booking value and trip completion. `extra` is the
// finance-only profit card, passed in by the route.
export function ReportKpis({ extra }: { extra?: ReactNode }) {
  const t = useT();
  const format = useFormat();
  const stats = useDashboardStats();
  const revenue = useRevenueOverview();
  const reports = useReportsOverview();

  if (stats.isLoading || revenue.isLoading || reports.isLoading) {
    return (
      <div className={REPORT_KPI_GRID}>
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }
  if (stats.isError || reports.isError || !stats.data || !reports.data) {
    return (
      <div role="alert" className="flex items-center gap-2 rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
        <AlertCircle size={16} aria-hidden="true" />
        {t("reports.error")}
      </div>
    );
  }

  const vsLastMonth = t("home.kpi.vsLastMonth");
  const currency = t("common.currencySar");
  const withTrend = (series: number[]) => {
    const trend = trendFrom(series);
    return { sparkline: series, trend, trendContext: trend ? vsLastMonth : undefined };
  };
  const invoiced = (revenue.data?.months ?? []).slice(-SPARK_MONTHS).map((month) => month.invoiceTotal);
  const bookings = reports.data.bookingsByMonth.map((month) => month.total);
  const customers = reports.data.customersByMonth.map((month) => month.count);
  const ratios = reportRatios(reports.data);

  return (
    <div className={REPORT_KPI_GRID}>
      <KpiCard
        label={t("reports.kpi.sales")}
        value={format.number(stats.data.totalRevenue)}
        unit={currency}
        icon={<TrendingUp size={ICON_SIZE} />}
        tone="success"
        {...withTrend(invoiced)}
      />
      <KpiCard
        label={t("home.kpi.totalBookings")}
        value={format.number(stats.data.totalBookings)}
        icon={<CalendarCheck2 size={ICON_SIZE} />}
        tone="info"
        {...withTrend(bookings)}
      />
      <KpiCard
        label={t("reports.kpi.newCustomers")}
        value={format.number(customers[customers.length - 1] ?? 0)}
        icon={<UserPlus size={ICON_SIZE} />}
        tone="primary"
        {...withTrend(customers)}
      />
      <KpiCard
        label={t("reports.kpi.avgBookingValue")}
        value={ratios.avgBookingValue === null ? "—" : format.number(ratios.avgBookingValue)}
        unit={ratios.avgBookingValue === null ? undefined : currency}
        icon={<Wallet size={ICON_SIZE} />}
        tone="warning"
      />
      <KpiCard
        label={t("reports.kpi.completionRate")}
        value={ratios.completionRate === null ? "—" : `${ratios.completionRate}%`}
        icon={<CircleCheckBig size={ICON_SIZE} />}
        tone="success"
        trendContext={t("reports.kpi.completionContext")}
      />
      {extra}
    </div>
  );
}
