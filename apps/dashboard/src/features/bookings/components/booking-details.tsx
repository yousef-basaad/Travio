"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@travio/ui";
import { useCustomer } from "@/features/customers";
import { useBooking, BookingNotFoundError } from "../api/bookings.api";
import { ChangeBookingStatus } from "./change-booking-status";
import { BookingSummaryCards } from "./booking-summary-cards";
import { BookingProfileCard } from "./booking-profile-card";
import { BookingTabs } from "./booking-tabs";
import { EditBookingDialog } from "./edit-booking-dialog";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

function BackToBookingsLink() {
  const t = useT();
  return (
    <Button asChild variant="outline" size="sm">
      <Link href="/bookings">{t("bookings.back")}</Link>
    </Button>
  );
}

function BookingDetailsSkeleton() {
  const t = useT();
  return (
    <div role="status" aria-label={t("bookings.loadingOne")} className="space-y-4">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

function BookingNotFoundState() {
  const t = useT();
  return (
    <EmptyState
      className="p-12"
      icon={<SearchX size={20} />}
      title={t("bookings.notFound")}
      action={<BackToBookingsLink />}
    />
  );
}

function BookingDetailsErrorState() {
  const t = useT();
  return (
    <div className="space-y-4">
      <BackToBookingsLink />
      <div
        role="alert"
        className="rounded-lg border border-danger/50 bg-danger/10 p-6 text-sm text-danger"
      >
        {t("bookings.loadOneError")}
      </div>
    </div>
  );
}

// Booking 360 shell, per this issue's explicit scope - Delete remains a
// disabled placeholder (no such flow exists yet), and BookingTabs'
// non-Overview tabs are empty placeholders for future modules to plug
// into, matching CustomerDetails' shape exactly.
export function BookingDetails({ id }: { id: string }) {
  const { data: booking, isLoading, error } = useBooking(id);
  // Booking only carries customerId - the customer's name is resolved
  // once the booking itself has loaded, via the customers feature's own
  // useCustomer (same real-data-only reasoning as bookings-table.tsx's
  // list-wide lookup, scoped to a single customer here).
  const { data: customer } = useCustomer(booking?.customerId ?? "");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const t = useT();
  const format = useFormat();

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
    <div className="space-y-8">
      <BackToBookingsLink />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-heading-lg text-foreground">{booking.title}</h1>
            {/* Product-2: ChangeBookingStatus is now tinted with the same
                per-status color BookingStatusBadge uses, so it already
                displays the current status - a separate static badge
                right next to it would just repeat the same pill twice. */}
            <ChangeBookingStatus booking={booking} />
          </div>
          <p className="text-sm text-muted-foreground">
            {booking.bookingNumber} · {customer?.fullName ?? booking.customerId}
            {booking.startDate ? ` · ${format.date(booking.startDate)}` : ""}
            {booking.endDate ? ` – ${format.date(booking.endDate)}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setIsEditOpen(true)}>
            {t("common.edit")}
          </Button>
          <Button
            variant="destructive"
            disabled
            aria-disabled="true"
            title={t("bookings.deleteUnavailable")}
          >
            {t("common.delete")}
          </Button>
        </div>
      </div>

      <BookingSummaryCards booking={booking} customerName={customer?.fullName ?? null} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <BookingProfileCard booking={booking} customer={customer ?? null} />
        </div>
        <div className="lg:col-span-2">
          <BookingTabs booking={booking} customerName={customer?.fullName ?? null} />
        </div>
      </div>

      <EditBookingDialog booking={booking} open={isEditOpen} onOpenChange={setIsEditOpen} />
    </div>
  );
}
