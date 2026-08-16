"use client";

import { Select } from "@travio/ui";
import { cn } from "@travio/utils";
import type { Booking, BookingStatus } from "../types/booking";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_STYLES } from "./booking-status-badge";
import { useUpdateBooking } from "../api/bookings.api";

const STATUS_OPTIONS: BookingStatus[] = [
  "draft",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

// Backend already fully supports this (PATCH /api/bookings/:id accepts
// `status`, and bookingsService.update already logs a status_changed
// timeline event + notification whenever it actually changes) - this was
// the only missing piece, a control to actually send it. Deliberately a
// plain <Select> next to the existing BookingStatusBadge rather than
// replacing it - the badge still shows the current value, this is only
// the control to change it. No transition guard here (e.g. blocking
// completed -> draft) - none exists anywhere in this codebase's status
// lifecycles today (bookings, visas, invoices all allow any enum value),
// so adding one here would be a new business rule, not a reuse of an
// existing one.
//
// Product-2: tinted with the same BOOKING_STATUS_STYLES map the badge
// itself uses, so the control reads as "the same status, made
// editable" rather than a disconnected plain-gray dropdown sitting next
// to a colored pill.
export function ChangeBookingStatus({ booking }: { booking: Booking }) {
  const updateBooking = useUpdateBooking();

  return (
    <Select
      aria-label="Change booking status"
      className={cn(
        "h-8 w-auto border-transparent text-xs font-medium",
        BOOKING_STATUS_STYLES[booking.status],
      )}
      value={booking.status}
      disabled={updateBooking.isPending}
      onChange={(event) => {
        const status = event.target.value as BookingStatus;
        if (status !== booking.status) {
          updateBooking.mutate({ id: booking.id, input: { status } });
        }
      }}
    >
      {STATUS_OPTIONS.map((status) => (
        <option key={status} value={status}>
          {BOOKING_STATUS_LABELS[status]}
        </option>
      ))}
    </Select>
  );
}
