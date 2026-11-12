"use client";

import { Select } from "@travio/ui";
import { cn } from "@travio/utils";
import type { Booking, BookingStatus } from "../types/booking";
import { BOOKING_STATUS_KEYS, BOOKING_STATUS_STYLES } from "./booking-status-badge";
import { useT } from "@/lib/i18n/i18n-provider";
import { useUpdateBooking } from "../api/bookings.api";
import { statusOptions } from "../utils/status-transitions";

// Backend already fully supports this (PATCH /api/bookings/:id accepts
// `status`, and bookingsService.update already logs a status_changed
// timeline event + notification whenever it actually changes) - this was
// the only missing piece, a control to actually send it. Deliberately a
// plain <Select> next to the existing BookingStatusBadge rather than
// replacing it - the badge still shows the current value, this is only
// the control to change it. It offers only the moves the database allows
// (see utils/status-transitions.ts).
//
// Product-2: tinted with the same BOOKING_STATUS_STYLES map the badge
// itself uses, so the control reads as "the same status, made
// editable" rather than a disconnected plain-gray dropdown sitting next
// to a colored pill.
export function ChangeBookingStatus({ booking }: { booking: Booking }) {
  const updateBooking = useUpdateBooking();
  const t = useT();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Select
        aria-label={t("bookings.changeStatus")}
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
        {statusOptions(booking.status).map((status) => (
          <option key={status} value={status}>
            {t(BOOKING_STATUS_KEYS[status])}
          </option>
        ))}
      </Select>
      {updateBooking.isError ? (
        <span role="alert" className="text-danger text-xs">
          {t("bookings.statusChangeError")}
        </span>
      ) : null}
    </span>
  );
}
