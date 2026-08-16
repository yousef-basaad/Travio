import Link from "next/link";
import { Card, CardContent, CardHeader, InfoRow } from "@travio/ui";
import { formatDate } from "@travio/utils";
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
  return (
    <Card>
      <CardHeader>
        <h2 className="text-sm font-medium">Profile</h2>
      </CardHeader>
      <CardContent>
        <dl className="space-y-4">
          <InfoRow label="Booking Number" value={booking.bookingNumber} />
          <InfoRow label="Title" value={booking.title} />
          <InfoRow label="Status" value={<BookingStatusBadge status={booking.status} />} />
          <InfoRow
            label="Start Date"
            value={booking.startDate ? formatDate(booking.startDate) : "—"}
          />
          <InfoRow label="End Date" value={booking.endDate ? formatDate(booking.endDate) : "—"} />
          <InfoRow
            label="Customer"
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
          {customer?.email ? <InfoRow label="Email" value={customer.email} /> : null}
          {customer?.phone ? <InfoRow label="Phone" value={customer.phone} /> : null}
        </dl>
      </CardContent>
    </Card>
  );
}
