"use client";

import { MiniStat, InfoRow } from "@travio/ui";
import type { Customer } from "@travio/api";
import { useCustomerBookings, useCustomerTimeline } from "../api/customers.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// "Total Bookings"/"Total Booking Value" are derived client-side from
// useCustomerBookings (already fetched by the Bookings tab) - no new
// endpoint, no invented metric. "Total Booking Value" sums each
// booking's own totalAmount (booking-level, not invoice/payment
// revenue - there's no per-customer invoiced-revenue aggregate to reuse
// without a new endpoint, which is out of this phase's scope). "Last
// Activity" reuses useCustomerTimeline, already sorted newest-first by
// customerTimelineService - the first item's createdAt, nothing sorted
// here.
export function CustomerOverviewTab({ customer }: { customer: Customer }) {
  const { data: bookings, isLoading: isLoadingBookings } = useCustomerBookings(customer.id);
  const { data: timeline, isLoading: isLoadingTimeline } = useCustomerTimeline(customer.id);
  const t = useT();
  const format = useFormat();

  const totalBookings = bookings?.length ?? 0;
  const totalBookingValue = (bookings ?? []).reduce((sum, booking) => sum + booking.totalAmount, 0);
  const lastActivity = timeline?.[0]?.createdAt ?? null;

  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoRow label={t("field.nationality")} value={customer.nationality ?? "—"} />
        <InfoRow label={t("field.passportNumber")} value={customer.passportNumber ?? "—"} />
        {/* Raw id, not a resolved name - no profiles join exists yet. */}
        <InfoRow label={t("field.assignedOwner")} value={customer.assignedTo ?? t("common.unassigned")} />
        <InfoRow label={t("field.customerSince")} value={format.date(customer.createdAt)} />
      </dl>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("customers.statistics")}
        </p>
        <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-surface-muted/40 p-4 sm:grid-cols-3">
          <MiniStat
            label={t("customers.totalBookings")}
            value={String(totalBookings)}
            isLoading={isLoadingBookings}
          />
          <MiniStat
            label={t("customers.totalBookingValue")}
            value={format.currency(totalBookingValue)}
            isLoading={isLoadingBookings}
          />
          <MiniStat
            label={t("customers.lastActivity")}
            value={lastActivity ? format.relativeTime(lastActivity) : "—"}
            isLoading={isLoadingTimeline}
          />
        </div>
      </div>
    </div>
  );
}
