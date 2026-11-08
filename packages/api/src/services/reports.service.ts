import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";
import { lastNMonthKeys, startOfMonth } from "./analytics.service";

/** Monthly series on the Reports page cover this many months. */
export const REPORT_MONTHS = 6;

export interface ReportBookingMonth {
  /** "YYYY-MM" */
  month: string;
  total: number;
  /** Confirmed or completed. */
  confirmed: number;
  cancelled: number;
}

export interface ReportCustomerMonth {
  month: string;
  count: number;
}

export interface ReportServiceSales {
  /** invoice_items.item_type: flight, hotel, transfer, visa or manual. */
  type: string;
  total: number;
}

export interface ReportDestinationSales {
  /** ISO 3166-1 alpha-2. */
  country: string;
  bookings: number;
  total: number;
}

export interface ReportLabelCount {
  label: string;
  count: number;
}

export interface ReportStaffMember {
  profileId: string;
  name: string;
  bookings: number;
  completed: number;
  cancelled: number;
  sales: number;
}

export interface ReportYearMonth {
  /** 1-12 */
  month: number;
  current: number;
  previous: number;
}

export interface ReportsOverview {
  /** The last REPORT_MONTHS months, oldest first, missing months as 0. */
  bookingsByMonth: ReportBookingMonth[];
  customersByMonth: ReportCustomerMonth[];
  salesByService: ReportServiceSales[];
  salesByDestination: ReportDestinationSales[];
  customersByNationality: { total: number; items: ReportLabelCount[] };
  staff: ReportStaffMember[];
  liveBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  customersWithBookings: number;
  repeatCustomers: number;
  /** Null when no booking has both dates. */
  avgTripDays: number | null;
  flightTickets: number;
  invoicedCustomers: number;
  invoicedBookings: number;
  invoicedTotal: number;
  /** Invoiced per calendar month, this year against last year. */
  annualSales: { year: number; months: ReportYearMonth[] };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function asList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function toNumber(value: unknown): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

// Maps reports_overview's jsonb (20261108130000). Anything missing or
// malformed reads as zero / empty, and the monthly series are filled to
// the last REPORT_MONTHS months.
export function toReportsOverview(data: unknown, annualRows: { month: string; invoice_total: number | string }[] = []): ReportsOverview {
  const raw = asRecord(data);
  const months = lastNMonthKeys(REPORT_MONTHS);

  const bookings = new Map(asList(raw.bookings_by_month).map((row) => [toText(row.month), row]));
  const customers = new Map(asList(raw.customers_by_month).map((row) => [toText(row.month), row]));
  const nationality = asRecord(raw.customers_by_nationality);
  const avg = raw.avg_trip_days;

  const year = new Date().getUTCFullYear();
  const annual = new Map(annualRows.map((row) => [row.month, toNumber(row.invoice_total)]));
  const key = (y: number, m: number) => `${y}-${String(m).padStart(2, "0")}`;

  return {
    bookingsByMonth: months.map((month) => {
      const row = bookings.get(month) ?? {};
      return { month, total: toNumber(row.total), confirmed: toNumber(row.confirmed), cancelled: toNumber(row.cancelled) };
    }),
    customersByMonth: months.map((month) => ({ month, count: toNumber(customers.get(month)?.count) })),
    salesByService: asList(raw.sales_by_service).map((row) => ({ type: toText(row.type), total: toNumber(row.total) })),
    salesByDestination: asList(raw.sales_by_destination).map((row) => ({
      country: toText(row.country),
      bookings: toNumber(row.bookings),
      total: toNumber(row.total),
    })),
    customersByNationality: {
      total: toNumber(nationality.total),
      items: asList(nationality.items).map((row) => ({ label: toText(row.label), count: toNumber(row.count) })),
    },
    staff: asList(raw.staff).map((row) => ({
      profileId: toText(row.profile_id),
      name: toText(row.name),
      bookings: toNumber(row.bookings),
      completed: toNumber(row.completed),
      cancelled: toNumber(row.cancelled),
      sales: toNumber(row.sales),
    })),
    liveBookings: toNumber(raw.live_bookings),
    completedBookings: toNumber(raw.completed_bookings),
    cancelledBookings: toNumber(raw.cancelled_bookings),
    customersWithBookings: toNumber(raw.customers_with_bookings),
    repeatCustomers: toNumber(raw.repeat_customers),
    avgTripDays: avg === null || avg === undefined ? null : toNumber(avg),
    flightTickets: toNumber(raw.flight_tickets),
    invoicedCustomers: toNumber(raw.invoiced_customers),
    invoicedBookings: toNumber(raw.invoiced_bookings),
    invoicedTotal: toNumber(raw.invoiced_total),
    annualSales: {
      year,
      months: Array.from({ length: 12 }, (_, index) => ({
        month: index + 1,
        current: annual.get(key(year, index + 1)) ?? 0,
        previous: annual.get(key(year - 1, index + 1)) ?? 0,
      })),
    },
  };
}

// The Reports page (TRAVIO design 07): one reports_overview call plus the
// existing monthly revenue function for this year vs last year. Both run
// under the caller's RLS.
export const reportsService = {
  async getOverview(supabase: SupabaseClient<Database>): Promise<ReportsOverview> {
    const lastYearStart = `${new Date().getUTCFullYear() - 1}-01-01`;
    const [overview, annual] = await Promise.all([
      supabase.rpc("reports_overview", { range_start: startOfMonth(REPORT_MONTHS - 1) }),
      supabase.rpc("analytics_revenue_by_month", { range_start: lastYearStart }),
    ]);
    if (overview.error) throw overview.error;
    if (annual.error) throw annual.error;
    return toReportsOverview(overview.data, annual.data ?? []);
  },
};
