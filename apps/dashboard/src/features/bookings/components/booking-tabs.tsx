"use client";

import { useState } from "react";
import { DetailLayout, InfoRow } from "@travio/ui";
import { formatDate, formatCurrency } from "@travio/utils";
import type { Booking } from "../types/booking";
import { BookingStatusBadge } from "./booking-status-badge";
import { BookingTimeline } from "./timeline/booking-timeline";
import { BookingNotes } from "./notes/booking-notes";
import { BookingFinancialSummary } from "./booking-financial-summary";
import { BookingPaymentHistory } from "./booking-payment-history";
import { FlightList } from "./services/flight-list";
import { HotelList } from "./services/hotel-list";
import { TransferList } from "./services/transfer-list";
import { InvoiceList } from "@/features/finance";
import { DocumentsPage } from "@/features/documents";
import { VisaList } from "@/features/customers";

// Phase UI-3: Booking 360 tabs, matching the spec's lettered sections
// A-E exactly. "Invoices" and "Payments" (previously two tabs, the
// second just pointing back at the first) are merged into one
// "Finance" tab, mirroring the same consolidation on Customer 360.
const TABS = ["Overview", "Services", "Finance", "Documents", "Timeline"] as const;

type BookingTab = (typeof TABS)[number];

// Grouped Customer info / Booking details / Notes / Assigned agent, in
// that order, per the Booking 360 Overview spec - same fields as
// before, just organized into labeled groups instead of one flat grid.
function OverviewTab({
  booking,
  customerName,
}: {
  booking: Booking;
  customerName: string | null;
}) {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Customer
        </p>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="Customer" value={customerName ?? booking.customerId} />
          {/* Raw id, not a resolved name - no profiles join exists yet. */}
          <InfoRow label="Assigned Agent" value={booking.assignedTo ?? "Unassigned"} />
        </dl>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Booking Details
        </p>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label="Booking Number" value={booking.bookingNumber} />
          <InfoRow label="Title" value={booking.title} />
          <InfoRow label="Status" value={<BookingStatusBadge status={booking.status} />} />
          <InfoRow
            label="Start Date"
            value={booking.startDate ? formatDate(booking.startDate) : "—"}
          />
          <InfoRow label="End Date" value={booking.endDate ? formatDate(booking.endDate) : "—"} />
          <InfoRow label="Total Amount" value={formatCurrency(booking.totalAmount)} />
          <InfoRow label="Created At" value={formatDate(booking.createdAt)} />
          <InfoRow label="Updated At" value={formatDate(booking.updatedAt)} />
        </dl>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Notes
        </p>
        <p className="text-sm text-foreground">{booking.notes ?? "—"}</p>
      </div>
    </div>
  );
}

// Uses the design system's shared DetailLayout (Card + Tabs) instead of
// the raw role="tablist" markup this file previously defined for
// itself.
export function BookingTabs({
  booking,
  customerName,
}: {
  booking: Booking;
  customerName: string | null;
}) {
  const [activeTab, setActiveTab] = useState<BookingTab>("Overview");

  return (
    <DetailLayout
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as BookingTab)}
      ariaLabel="Booking sections"
    >
      {activeTab === "Overview" ? (
        <OverviewTab booking={booking} customerName={customerName} />
      ) : activeTab === "Services" ? (
        <div className="space-y-4">
          <FlightList bookingId={booking.id} />
          <HotelList bookingId={booking.id} />
          <TransferList bookingId={booking.id} />
          <VisaList bookingId={booking.id} />
        </div>
      ) : activeTab === "Finance" ? (
        <div className="space-y-4">
          <BookingFinancialSummary bookingId={booking.id} />
          <BookingPaymentHistory bookingId={booking.id} />
          <InvoiceList bookingId={booking.id} />
        </div>
      ) : activeTab === "Documents" ? (
        <DocumentsPage ownerType="booking" ownerId={booking.id} />
      ) : activeTab === "Timeline" ? (
        <div className="space-y-4">
          <BookingNotes bookingId={booking.id} />
          <BookingTimeline bookingId={booking.id} />
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Coming soon</p>
      )}
    </DetailLayout>
  );
}
