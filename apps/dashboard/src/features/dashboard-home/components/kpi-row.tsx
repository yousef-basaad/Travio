"use client";

import { Luggage, UserPlus, Wallet, CircleDollarSign, Stamp } from "lucide-react";
import { KpiCard, SkeletonCard } from "@travio/ui";
import { useDashboardStats, useCustomerAnalytics, useRevenueOverview } from "@/features/analytics";
import { useBookings } from "@/features/bookings";
import { useCustomers, useVisaApplications } from "@/features/customers";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import { trendFrom } from "@/lib/analytics/trend";

const ICON_SIZE = 20;
const TREND_MONTHS = 6;

// "YYYY-MM" for the trailing `count` months, oldest first, always
// including the current month - same bucketing shape
// analyticsService.getRevenueOverview already uses server-side, done
// here client-side from lists the home page already loads.
function lastNMonthKeys(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function countsByMonth(dates: (string | null | undefined)[], months: string[]): number[] {
  const counts = new Map(months.map((month) => [month, 0]));
  for (const date of dates) {
    const key = date?.slice(0, 7);
    if (key && counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map((month) => counts.get(month) ?? 0);
}

// The design's five KPIs: Total Bookings, New Customers, Visa Requests,
// Total Sales, Overdue Payments. Every number is real: counts and sums
// come from the dashboard stats (sums in Postgres), sparklines and
// trends are month buckets of lists the page already loads. A card with
// no real series (Overdue Payments is a snapshot) shows no sparkline.
// Visa applications may be hidden from some roles; the card then shows
// the stats count without a sparkline.
export function KpiRow() {
  const { t, locale } = useI18n();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: customerAnalytics, isLoading: isLoadingCustomers } = useCustomerAnalytics();
  const { data: revenue, isLoading: isLoadingRevenue } = useRevenueOverview();
  const { data: bookings, isLoading: isLoadingBookings } = useBookings();
  const { data: customers } = useCustomers();
  const { data: visas } = useVisaApplications();

  const isLoading = isLoadingStats || isLoadingCustomers || isLoadingRevenue || isLoadingBookings;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  // Whole amounts with a small currency label, as in the design.
  const amount = new Intl.NumberFormat(intlLocale(locale), { maximumFractionDigits: 0 });
  const vsLastMonth = t("home.kpi.vsLastMonth");

  const months = lastNMonthKeys(TREND_MONTHS);
  const bookingsPerMonth = countsByMonth((bookings ?? []).map((b) => b.createdAt), months);
  const customersPerMonth = customers ? countsByMonth(customers.map((c) => c.createdAt), months) : undefined;
  const visasPerMonth = visas ? countsByMonth(visas.map((v) => v.createdAt), months) : undefined;
  const salesPerMonth = (revenue?.months ?? []).slice(-TREND_MONTHS).map((m) => m.paidTotal);

  const bookingsTrend = trendFrom(bookingsPerMonth);
  const customersTrend = customerAnalytics
    ? trendFrom([customerAnalytics.newCustomersLastMonth, customerAnalytics.newCustomersThisMonth])
    : undefined;
  const visasTrend = visasPerMonth ? trendFrom(visasPerMonth) : undefined;
  const salesTrend = trendFrom(salesPerMonth);
  const overdue = stats?.overdueAmount ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label={t("home.kpi.totalBookings")}
        value={amount.format(stats?.totalBookings ?? 0)}
        icon={<Luggage size={ICON_SIZE} />}
        tone="primary"
        trend={bookingsTrend}
        trendContext={bookingsTrend ? vsLastMonth : undefined}
        sparkline={bookingsPerMonth}
      />
      <KpiCard
        label={t("home.kpi.newCustomers")}
        value={amount.format(customerAnalytics?.newCustomersThisMonth ?? 0)}
        icon={<UserPlus size={ICON_SIZE} />}
        tone="info"
        trend={customersTrend}
        trendContext={customersTrend ? vsLastMonth : undefined}
        sparkline={customersPerMonth}
      />
      <KpiCard
        label={t("home.kpi.visaRequests")}
        value={amount.format(stats?.openVisaApplications ?? 0)}
        icon={<Stamp size={ICON_SIZE} />}
        tone="success"
        trend={visasTrend}
        trendContext={visasTrend ? vsLastMonth : undefined}
        sparkline={visasPerMonth}
      />
      <KpiCard
        label={t("home.kpi.totalSales")}
        value={amount.format(stats?.totalRevenue ?? 0)}
        unit={t("home.kpi.currency")}
        icon={<CircleDollarSign size={ICON_SIZE} />}
        tone="warning"
        trend={salesTrend}
        trendContext={salesTrend ? vsLastMonth : undefined}
        sparkline={salesPerMonth}
      />
      <KpiCard
        label={t("home.kpi.overdue")}
        value={amount.format(overdue)}
        unit={t("home.kpi.currency")}
        icon={<Wallet size={ICON_SIZE} />}
        tone={overdue > 0 ? "danger" : "success"}
        trendContext={
          stats && stats.overdueInvoices > 0 ? t("home.kpi.overdueInvoices", { count: stats.overdueInvoices }) : undefined
        }
      />
    </div>
  );
}
