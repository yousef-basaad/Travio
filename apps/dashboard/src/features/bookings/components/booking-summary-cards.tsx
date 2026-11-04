"use client";

import { StatsCard } from "@travio/ui";
import type { Booking } from "../types/booking";
import { BOOKING_STATUS_KEYS } from "./booking-status-badge";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { Translate } from "@/lib/i18n/translate";

// Trip duration is derived purely from the booking's own start/end
// dates (already-fetched fields, no new data) - shown in whole nights,
// the same unit every travel-industry booking summary uses.
function tripDuration(startDate: string | null, endDate: string | null, t: Translate): string {
  if (!startDate || !endDate) return "—";
  const nights = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (nights <= 0) return t("bookings.sameDay");
  if (nights === 1) return t("bookings.oneNight");
  return t("bookings.nights", { count: nights });
}

// The four Booking 360 "summary cards" (Customer / Trip Duration /
// Status / Created date) - a quick-glance strip above the full
// BookingProfileCard, which still carries the complete detail. customer
// name is resolved by the caller the same way BookingProfileCard
// already does (customerName is null until useCustomer resolves - never
// fabricated).
export function BookingSummaryCards({
  booking,
  customerName,
}: {
  booking: Booking;
  customerName: string | null;
}) {
  const t = useT();
  const format = useFormat();
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard label={t("common.customer")} value={customerName ?? booking.customerId} />
      <StatsCard label={t("bookings.tripDuration")} value={tripDuration(booking.startDate, booking.endDate, t)} />
      <StatsCard label={t("common.status")} value={t(BOOKING_STATUS_KEYS[booking.status])} />
      <StatsCard label={t("common.created")} value={format.date(booking.createdAt)} />
    </div>
  );
}
