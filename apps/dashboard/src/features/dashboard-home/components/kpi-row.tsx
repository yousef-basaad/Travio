"use client";

import { Luggage, UserPlus, Wallet, CircleDollarSign, CalendarClock } from "lucide-react";
import { KpiCard, SkeletonCard } from "@travio/ui";
import { formatCurrency } from "@travio/utils";
import { useDashboardStats, useCustomerAnalytics, useRevenueOverview } from "@/features/analytics";
import { useBookings } from "@/features/bookings";

const ICON_SIZE = 18;
const TREND_MONTHS = 6;

// "YYYY-MM" for the trailing `count` months, oldest first, always
// including the current month - same bucketing shape
// analyticsService.getRevenueOverview already uses server-side, done
// here client-side since no per-month bookings/customers-count endpoint
// exists (out of scope: "no new APIs").
function lastNMonthKeys(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

function countsByMonth(dates: string[], months: string[]): number[] {
  const counts = new Map(months.map((month) => [month, 0]));
  for (const date of dates) {
    const key = date.slice(0, 7);
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return months.map((month) => counts.get(month) ?? 0);
}

// Real month-over-month delta, never a fabricated one - returns
// undefined (renders no trend chip) rather than a divide-by-zero
// percentage when the previous period was zero.
function trendFrom(series: number[]): { value: string; direction: "up" | "down" } | undefined {
  if (series.length < 2) return undefined;
  const current = series[series.length - 1] ?? 0;
  const previous = series[series.length - 2] ?? 0;
  if (previous === 0) return undefined;
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return undefined;
  return { value: `${Math.abs(change)}%`, direction: change > 0 ? "up" : "down" };
}

// Design System v2.7 (Product-8.2 Reference Fidelity Pass): the
// reference's 5-KPI row (Total Bookings, New Customers, Visa Requests,
// Total Sales, Overdue Payments), reordered here to Bookings / Customers
// / Upcoming Bookings / Sales / Outstanding so the two currency cards
// stay adjacent at the end exactly as the reference has Sales next to
// Overdue. "Visa Requests" has no backing data anywhere in this
// codebase (visa applications are only ever fetched per-customer, never
// tenant-wide - see the existing Visa Center page's own comment), so
// that slot is "Upcoming Bookings" (dashboardStats.upcomingBookings,
// already real and already used elsewhere) rather than a fabricated
// count - a known, intentional content gap vs. the reference, not a
// fidelity miss. Every trend chip carries the real "vs last month"
// context text the reference always pairs with its arrows. Every
// sparkline is a real, client-side-bucketed trailing series from
// already-fetched data (bookings/revenue-overview) - "Outstanding
// Payments" and "Upcoming Bookings" are snapshots with no natural
// monthly series, so they render without a sparkline rather than a
// fabricated flat line.
export function KpiRow() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: customerAnalytics, isLoading: isLoadingCustomers } = useCustomerAnalytics();
  const { data: revenue, isLoading: isLoadingRevenue } = useRevenueOverview();
  const { data: bookings, isLoading: isLoadingBookings } = useBookings();

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

  const months = lastNMonthKeys(TREND_MONTHS);
  const bookingsPerMonth = countsByMonth((bookings ?? []).map((b) => b.createdAt), months);
  const salesPerMonth = (revenue?.months ?? []).slice(-TREND_MONTHS).map((m) => m.paidTotal);

  const bookingsTrend = trendFrom(bookingsPerMonth);
  const customersTrend = customerAnalytics
    ? trendFrom([customerAnalytics.newCustomersLastMonth, customerAnalytics.newCustomersThisMonth])
    : undefined;
  const salesTrend = trendFrom(salesPerMonth);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <KpiCard
        label="Total Bookings"
        value={String(stats?.totalBookings ?? 0)}
        icon={<Luggage size={ICON_SIZE} />}
        tone="primary"
        trend={bookingsTrend}
        trendContext={bookingsTrend ? "vs last month" : undefined}
        sparkline={bookingsPerMonth}
      />
      <KpiCard
        label="New Customers"
        value={String(customerAnalytics?.newCustomersThisMonth ?? 0)}
        icon={<UserPlus size={ICON_SIZE} />}
        tone="info"
        trend={customersTrend}
        trendContext={customersTrend ? "vs last month" : undefined}
      />
      <KpiCard
        label="Upcoming Bookings"
        value={String(stats?.upcomingBookings ?? 0)}
        icon={<CalendarClock size={ICON_SIZE} />}
        tone="info"
      />
      <KpiCard
        label="Total Sales"
        value={formatCurrency(stats?.totalRevenue ?? 0)}
        icon={<CircleDollarSign size={ICON_SIZE} />}
        tone="success"
        trend={salesTrend}
        trendContext={salesTrend ? "vs last month" : undefined}
        sparkline={salesPerMonth}
      />
      <KpiCard
        label="Outstanding Payments"
        value={formatCurrency(stats?.outstandingAmount ?? 0)}
        icon={<Wallet size={ICON_SIZE} />}
        tone={(stats?.outstandingAmount ?? 0) > 0 ? "danger" : "success"}
      />
    </div>
  );
}
