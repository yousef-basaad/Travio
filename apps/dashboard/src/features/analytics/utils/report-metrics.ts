import type { ReportsOverview } from "@travio/api";

/** part / whole as a whole percentage; null when there is no base - never a made-up 0%. */
export function percent(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 100);
}

/** total / count; null without a count. */
export function average(total: number, count: number): number | null {
  if (count <= 0) return null;
  return Math.round(total / count);
}

export interface ReportRatios {
  /** Completed out of bookings that reached an end (completed or cancelled). */
  completionRate: number | null;
  /** Cancelled out of live (non-draft) bookings. */
  cancelRate: number | null;
  /** Customers with more than one booking, out of customers with any. */
  repeatRate: number | null;
  /** Invoiced total per invoiced booking. */
  avgBookingValue: number | null;
  /** Invoiced total per invoiced customer. */
  revenuePerCustomer: number | null;
}

export function reportRatios(overview: ReportsOverview): ReportRatios {
  return {
    completionRate: percent(overview.completedBookings, overview.completedBookings + overview.cancelledBookings),
    cancelRate: percent(overview.cancelledBookings, overview.liveBookings),
    repeatRate: percent(overview.repeatCustomers, overview.customersWithBookings),
    avgBookingValue: average(overview.invoicedTotal, overview.invoicedBookings),
    revenuePerCustomer: average(overview.invoicedTotal, overview.invoicedCustomers),
  };
}

/** A staff member's completed bookings out of those that reached an end. */
export function staffCompletion(member: { completed: number; cancelled: number }): number | null {
  return percent(member.completed, member.completed + member.cancelled);
}
