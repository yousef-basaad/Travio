"use client";

import { Card, CardContent, CardHeader, DataTableState, BarList } from "@travio/ui";
import { BOOKING_STATUS_LABELS } from "@/features/bookings";
import { useBookingAnalytics } from "../api/analytics.api";

const SERVICE_LABELS: Record<string, string> = {
  flights: "Flights",
  hotels: "Hotels",
  transfers: "Transfers",
  visa: "Visa",
};

// Booking status is a state field, not a free categorical dimension, so
// it uses the design system's reserved status palette (not a
// categorical hue) - draft is neutral, pending is warning, confirmed is
// info, completed is success, cancelled is danger. Falls back to the
// neutral accent bar (BarList's default) for any status without an
// explicit mapping.
const STATUS_BAR_COLORS: Record<string, string> = {
  draft: "bg-muted-foreground/40",
  pending: "bg-warning",
  confirmed: "bg-info",
  completed: "bg-success",
  cancelled: "bg-danger",
};

// Design System v2.4 (Product-8.1): BarList moved to @travio/ui (was
// defined locally here) - the Product-8 audit flagged this as a
// generically useful pattern kept feature-local for no real reason.
// Same markup/behavior, now shared.

// Renamed from BookingChart - the card is specifically about booking
// status/service mix (not a generic chart), and "status" is what it
// actually leads with. Reuses BOOKING_STATUS_LABELS from
// booking-status-badge.tsx (bookings feature) instead of duplicating a
// second label map, same reasoning as every other *_LABELS export in
// this codebase.
export function BookingStatusCard() {
  const { data: analytics, isLoading, isError } = useBookingAnalytics();

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">Booking Analytics</h2>
        <p className="text-xs text-muted-foreground">
          {isLoading || isError || !analytics
            ? "Status and service mix"
            : `${analytics.totalBookings} total bookings`}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={false}
          skeletonRows={4}
          loadingLabel="Loading booking analytics"
          errorMessage="Something went wrong loading booking analytics. Please try again later."
        >
          {analytics ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Status Distribution
                </h3>
                <BarList
                  rows={Object.entries(analytics.byStatus).map(([status, count]) => ({
                    label: BOOKING_STATUS_LABELS[status as keyof typeof BOOKING_STATUS_LABELS] ?? status,
                    value: count,
                    barClassName: STATUS_BAR_COLORS[status],
                  }))}
                />
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Service Distribution
                </h3>
                <BarList
                  rows={Object.entries(analytics.serviceDistribution).map(([service, count]) => ({
                    label: SERVICE_LABELS[service] ?? service,
                    value: count,
                  }))}
                />
              </div>
            </div>
          ) : null}
        </DataTableState>
      </CardContent>
    </Card>
  );
}
