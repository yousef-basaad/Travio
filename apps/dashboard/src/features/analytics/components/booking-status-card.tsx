"use client";

import { Card, CardContent, CardHeader, DataTableState, BarList } from "@travio/ui";
import { BOOKING_STATUS_KEYS } from "@/features/bookings";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useBookingAnalytics } from "../api/analytics.api";
import { useT } from "@/lib/i18n/i18n-provider";

const SERVICE_KEYS: Record<string, MessageKey> = {
  flights: "services.flight.title",
  hotels: "services.hotel.title",
  transfers: "services.transfer.title",
  visa: "home.quickStats.visa",
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
  const t = useT();
  const { data: analytics, isLoading, isError } = useBookingAnalytics();

  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">{t("analytics.bookings.title")}</h2>
        <p className="text-xs text-muted-foreground">
          {isLoading || isError || !analytics
            ? t("analytics.bookings.description")
            : t("analytics.bookings.total", { count: analytics.totalBookings })}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoading}
          isError={isError}
          isEmpty={false}
          skeletonRows={4}
          loadingLabel={t("analytics.bookings.loading")}
          errorMessage={t("home.quickStats.error")}
        >
          {analytics ? (
            <div className="space-y-6">
              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("analytics.bookings.byStatus")}
                </h3>
                <BarList
                  rows={Object.entries(analytics.byStatus).map(([status, count]) => ({
                    label: status in BOOKING_STATUS_KEYS ? t(BOOKING_STATUS_KEYS[status as keyof typeof BOOKING_STATUS_KEYS]) : status,
                    value: count,
                    barClassName: STATUS_BAR_COLORS[status],
                  }))}
                />
              </div>

              <div>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("analytics.bookings.byService")}
                </h3>
                <BarList
                  rows={Object.entries(analytics.serviceDistribution).map(([service, count]) => ({
                    label: SERVICE_KEYS[service] ? t(SERVICE_KEYS[service]) : service,
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
