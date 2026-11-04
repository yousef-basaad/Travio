"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, InfoRow, LtrText } from "@travio/ui";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { Customer } from "@travio/api";
import type { Booking } from "../types/booking";
import { BookingStatusBadge } from "./booking-status-badge";

// Persistent identity summary (left column, always visible regardless of
// active tab). `customer` is resolved by the caller (BookingDetails) via
// the customers feature's useCustomer - Booking itself only carries
// customerId, and falls back to the raw id if the lookup hasn't resolved
// yet rather than showing a fabricated name.
//
// Product-2: takes the full Customer (was just its fullName as a plain
// string) so this card - the one persistent "Customer summary" surface
// in Booking 360 - can also surface email/phone and a link to the full
// profile, instead of an agent having to leave Booking 360 to find them.
// BookingSummaryCards/OverviewTab still only need the name, so they keep
// receiving customerName as before - this is the only call site that
// needed the richer object.
export function BookingProfileCard({
  booking,
  customer,
}: {
  booking: Booking;
  customer: Customer | null;
}) {
  const t = useT();
  const format = useFormat();
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">{t("bookings.profile")}</h2>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <InfoRow label={t("bookings.field.number")} value={booking.bookingNumber} />
          <InfoRow label={t("bookingField.title")} value={booking.title} />
          <InfoRow label={t("common.status")} value={<BookingStatusBadge status={booking.status} />} />
          <InfoRow
            label={t("bookings.field.startDate")}
            value={booking.startDate ? format.date(booking.startDate) : "—"}
          />
          <InfoRow label={t("bookings.field.endDate")} value={booking.endDate ? format.date(booking.endDate) : "—"} />
          <InfoRow
            label={t("common.customer")}
            value={
              customer ? (
                <Link href={`/customers/${customer.id}`} className="underline hover:text-foreground">
                  {customer.fullName}
                </Link>
              ) : (
                booking.customerId
              )
            }
          />
          {customer?.email ? <InfoRow label={t("field.email")} value={customer.email} /> : null}
          {customer?.phone ? <InfoRow label={t("field.phone")} value={<LtrText>{customer.phone}</LtrText>} /> : null}
        </dl>
      </CardContent>
    </Card>
  );
}
