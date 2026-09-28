import { StatsCard } from "@travio/ui";
import { formatDate } from "@travio/utils";
import type { Booking } from "../types/booking";
import { BOOKING_STATUS_LABELS } from "./booking-status-badge";

// Trip duration is derived purely from the booking's own start/end
// dates (already-fetched fields, no new data) - shown in whole nights,
// the same unit every travel-industry booking summary uses.
function tripDuration(startDate: string | null, endDate: string | null): string {
  if (!startDate || !endDate) return "—";
  const nights = Math.round(
    (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24),
  );
  if (nights <= 0) return "Same day";
  return `${nights} night${nights === 1 ? "" : "s"}`;
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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatsCard label="Customer" value={customerName ?? booking.customerId} />
      <StatsCard label="Trip Duration" value={tripDuration(booking.startDate, booking.endDate)} />
      <StatsCard label="Status" value={BOOKING_STATUS_LABELS[booking.status]} />
      <StatsCard label="Created" value={formatDate(booking.createdAt)} />
    </div>
  );
}
