"use client";

import { Luggage, UserPlus, Wallet, CircleDollarSign, Stamp } from "lucide-react";
import { KpiCard, SkeletonCard } from "@travio/ui";
import { useDashboardStats, useCustomerAnalytics, useRevenueOverview } from "@/features/analytics";
import { useHomeOverview } from "../api/home-overview.api";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import { trendFrom } from "@/lib/analytics/trend";

const ICON_SIZE = 20;
const TREND_MONTHS = 6;

// The design's five KPIs: Total Bookings, New Customers, Visa Requests,
// Total Sales, Overdue Payments. Every number is real: counts and sums
// come from the dashboard stats (sums in Postgres), sparklines and
// trends are monthly counts from home_overview. A card with
// no real series (Overdue Payments is a snapshot) shows no sparkline.
// Visa applications may be hidden from some roles; the card then shows
// the stats count without a sparkline.
export function KpiRow() {
  const { t, locale } = useI18n();
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: customerAnalytics, isLoading: isLoadingCustomers } = useCustomerAnalytics();
  const { data: revenue, isLoading: isLoadingRevenue } = useRevenueOverview();
  const { data: home, isLoading: isLoadingHome } = useHomeOverview();

  const isLoading = isLoadingStats || isLoadingCustomers || isLoadingRevenue || isLoadingHome;

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

  const bookingsPerMonth = home?.bookingsPerMonth ?? [];
  const customersPerMonth = home?.customersPerMonth;
  const visasPerMonth = home?.visasPerMonth;
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
