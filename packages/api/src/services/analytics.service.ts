import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@travio/database";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

const BOOKING_STATUSES: BookingStatus[] = [
  "draft",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

export interface DashboardStats {
  totalCustomers: number;
  totalBookings: number;
  totalRevenue: number;
  paidAmount: number;
  outstandingAmount: number;
  upcomingBookings: number;
}

export interface RevenueMonth {
  // "YYYY-MM" - machine-sortable, oldest to newest.
  month: string;
  invoiceTotal: number;
  paidTotal: number;
}

export interface RevenueOverview {
  months: RevenueMonth[];
}

export interface BookingAnalytics {
  totalBookings: number;
  byStatus: Record<BookingStatus, number>;
  serviceDistribution: {
    flights: number;
    hotels: number;
    transfers: number;
    visa: number;
  };
}

export interface TopCustomer {
  customerId: string;
  customerName: string;
  revenue: number;
}

export interface CustomerAnalytics {
  newCustomersThisMonth: number;
  newCustomersLastMonth: number;
  topCustomersByRevenue: TopCustomer[];
}

// "YYYY-MM" keys for the trailing `count` months, oldest first, always
// including the current month.
function lastNMonthKeys(count: number): string[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

// Exported (Product-7) - usageService reuses this exact "start of the
// current calendar month" calculation for its bookings-this-month count
// instead of redefining a second copy of the same date math.
export function startOfMonth(monthsAgo: number): string {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1))
    .toISOString()
    .slice(0, 10);
}

// Aggregation-only service - no single table this maps 1:1, so (unlike
// every other services/*.ts) there's no companion *.mapper.ts. All
// tenant isolation comes from RLS (tenant_id = current_tenant_id()) on
// the caller's own session-scoped client - never service_role, and no
// query here filters by tenant_id explicitly because RLS already does.
// Sums and group-bys run in Postgres (analytics_* functions,
// 20261027120000) - selecting rows and summing here was capped at
// PostgREST's max_rows (1000), so totals went silently wrong past that.
// The functions are SECURITY INVOKER, so RLS still scopes every number
// to what the caller may see. Plain counts stay as head-only count
// queries, which aren't affected by the row cap.
const TOP_CUSTOMERS_LIMIT = 5;

export const analyticsService = {
  async getDashboardStats(supabase: SupabaseClient<Database>): Promise<DashboardStats> {
    const today = new Date().toISOString().slice(0, 10);

    const [
      customersResult,
      bookingsResult,
      financeResult,
      upcomingBookingsResult,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null),
      supabase.from("bookings").select("*", { count: "exact", head: true }).is("deleted_at", null),
      supabase.rpc("analytics_finance_totals"),
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .neq("status", "cancelled")
        .gte("start_date", today),
    ]);

    if (customersResult.error) throw customersResult.error;
    if (bookingsResult.error) throw bookingsResult.error;
    if (financeResult.error) throw financeResult.error;
    if (upcomingBookingsResult.error) throw upcomingBookingsResult.error;

    const totals = financeResult.data[0];
    const totalRevenue = Number(totals?.total_revenue ?? 0);
    const paidAmount = Number(totals?.paid_amount ?? 0);

    return {
      totalCustomers: customersResult.count ?? 0,
      totalBookings: bookingsResult.count ?? 0,
      totalRevenue,
      paidAmount,
      outstandingAmount: totalRevenue - paidAmount,
      upcomingBookings: upcomingBookingsResult.count ?? 0,
    };
  },

  async getRevenueOverview(supabase: SupabaseClient<Database>): Promise<RevenueOverview> {
    const months = lastNMonthKeys(12);
    const rangeStart = startOfMonth(11);

    const { data, error } = await supabase.rpc("analytics_revenue_by_month", {
      range_start: rangeStart,
    });

    if (error) throw error;

    const byMonth = new Map(data.map((row) => [row.month, row]));

    return {
      months: months.map((month) => ({
        month,
        invoiceTotal: Number(byMonth.get(month)?.invoice_total ?? 0),
        paidTotal: Number(byMonth.get(month)?.paid_total ?? 0),
      })),
    };
  },

  async getBookingAnalytics(supabase: SupabaseClient<Database>): Promise<BookingAnalytics> {
    const [bookingsResult, flightsResult, hotelsResult, transfersResult, visaResult] =
      await Promise.all([
        supabase.rpc("analytics_booking_status_counts"),
        supabase.from("booking_flights").select("*", { count: "exact", head: true }),
        supabase.from("booking_hotels").select("*", { count: "exact", head: true }),
        supabase.from("booking_transfers").select("*", { count: "exact", head: true }),
        supabase.from("visa_applications").select("*", { count: "exact", head: true }),
      ]);

    if (bookingsResult.error) throw bookingsResult.error;
    if (flightsResult.error) throw flightsResult.error;
    if (hotelsResult.error) throw hotelsResult.error;
    if (transfersResult.error) throw transfersResult.error;
    if (visaResult.error) throw visaResult.error;

    const byStatus = BOOKING_STATUSES.reduce(
      (acc, status) => ({ ...acc, [status]: 0 }),
      {} as Record<BookingStatus, number>,
    );
    let totalBookings = 0;
    for (const row of bookingsResult.data) {
      const count = Number(row.booking_count);
      byStatus[row.status] += count;
      totalBookings += count;
    }

    return {
      totalBookings,
      byStatus,
      serviceDistribution: {
        flights: flightsResult.count ?? 0,
        hotels: hotelsResult.count ?? 0,
        transfers: transfersResult.count ?? 0,
        visa: visaResult.count ?? 0,
      },
    };
  },

  async getCustomerAnalytics(supabase: SupabaseClient<Database>): Promise<CustomerAnalytics> {
    const thisMonthStart = startOfMonth(0);
    const lastMonthStart = startOfMonth(1);

    const [thisMonthResult, lastMonthResult, invoicesResult] = await Promise.all([
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", thisMonthStart),
      supabase
        .from("customers")
        .select("*", { count: "exact", head: true })
        .is("deleted_at", null)
        .gte("created_at", lastMonthStart)
        .lt("created_at", thisMonthStart),
      supabase.rpc("analytics_top_customers", { limit_count: TOP_CUSTOMERS_LIMIT }),
    ]);

    if (thisMonthResult.error) throw thisMonthResult.error;
    if (lastMonthResult.error) throw lastMonthResult.error;
    if (invoicesResult.error) throw invoicesResult.error;

    const topEntries = invoicesResult.data.map(
      (row) => [row.customer_id, Number(row.revenue)] as const,
    );

    let topCustomersByRevenue: TopCustomer[] = [];
    if (topEntries.length > 0) {
      const { data: customers, error: customersError } = await supabase
        .from("customers")
        .select("id, full_name")
        .in(
          "id",
          topEntries.map(([customerId]) => customerId),
        );

      if (customersError) throw customersError;

      const nameById = new Map(customers.map((c) => [c.id, c.full_name]));
      topCustomersByRevenue = topEntries.map(([customerId, revenue]) => ({
        customerId,
        customerName: nameById.get(customerId) ?? "Unknown customer",
        revenue,
      }));
    }

    return {
      newCustomersThisMonth: thisMonthResult.count ?? 0,
      newCustomersLastMonth: lastMonthResult.count ?? 0,
      topCustomersByRevenue,
    };
  },
};
