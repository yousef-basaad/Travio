"use client";

import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, InfoRow, Skeleton } from "@travio/ui";
import { formatCurrency, formatDate } from "@travio/utils";
import { useProfile } from "@/features/profile";
import { useBooking, BookingNotFoundError } from "../api/bookings.api";
import { BookingStatusBadge } from "./booking-status-badge";
import { TripServices } from "./trip-services";

function BackToBookingsLink() {
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/bookings">← Back to My Bookings</Link>
    </Button>
  );
}

function BookingDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading booking" className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function BookingNotFoundState() {
  return (
    <div className="space-y-4">
      <BackToBookingsLink />
      <Card>
        <CardContent className="pt-6">
          <EmptyState icon={<SearchX size={20} />} title="Booking not found" />
        </CardContent>
      </Card>
    </div>
  );
}

function BookingDetailsErrorState() {
  return (
    <div className="space-y-4">
      <BackToBookingsLink />
      <div
        role="alert"
        className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
      >
        Something went wrong loading this booking. Please try again later.
      </div>
    </div>
  );
}

// Reuses bookingsService.getById unchanged (GET /api/bookings/:id) -
// bookings_customer_access RLS makes a booking that isn't this
// customer's own indistinguishable from a nonexistent one, so a wrong/
// guessed id in the URL renders the same "not found" state as a real
// typo, never a leak. Read-only, this phase's explicit scope: no
// services/documents/invoices/timeline tabs yet - those reuse the exact
// same booking-scoped services the dashboard's own Booking 360 already
// does, just not wired into this app this phase.
export function BookingDetailsView({ id }: { id: string }) {
  const { data: booking, isLoading, error } = useBooking(id);
  // Reuses the same GET /api/profile the Profile page already calls
  // (react-query dedupes/caches by query key, so this isn't a second
  // network round trip once either page has loaded) - "Customer
  // information" on a trip overview is this customer's own contact
  // details, not a new lookup.
  const { data: customer } = useProfile();

  if (isLoading) {
    return <BookingDetailsSkeleton />;
  }

  if (error instanceof BookingNotFoundError) {
    return <BookingNotFoundState />;
  }

  if (error || !booking) {
    return <BookingDetailsErrorState />;
  }

  return (
    <div className="space-y-6">
      <BackToBookingsLink />

      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-heading-lg text-foreground">{booking.title}</h1>
        <BookingStatusBadge status={booking.status} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-medium">Trip Details</h2>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <InfoRow label="Booking Number" value={booking.bookingNumber} />
            <InfoRow label="Status" value={<BookingStatusBadge status={booking.status} />} />
            <InfoRow
              label="Start Date"
              value={booking.startDate ? formatDate(booking.startDate) : "—"}
            />
            <InfoRow label="End Date" value={booking.endDate ? formatDate(booking.endDate) : "—"} />
            <InfoRow label="Total Amount" value={formatCurrency(booking.totalAmount, booking.currency ?? undefined)} />
            {booking.notes ? <InfoRow label="Notes" value={booking.notes} /> : null}
          </dl>
        </CardContent>
      </Card>

      {customer ? (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Customer Information</h2>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Full Name" value={customer.fullName} />
              <InfoRow label="Email" value={customer.email ?? "—"} />
              <InfoRow label="Phone" value={customer.phone ?? "—"} />
            </dl>
          </CardContent>
        </Card>
      ) : null}

      <TripServices bookingId={booking.id} />
    </div>
  );
}
