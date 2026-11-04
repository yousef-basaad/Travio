"use client";

import { useState } from "react";
import { DetailLayout, InfoRow } from "@travio/ui";
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
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Phase UI-3: Booking 360 tabs, matching the spec's lettered sections
// A-E exactly. "Invoices" and "Payments" (previously two tabs, the
// second just pointing back at the first) are merged into one
// "Finance" tab, mirroring the same consolidation on Customer 360.
const TABS = ["Overview", "Services", "Finance", "Documents", "Timeline"] as const;

type BookingTab = (typeof TABS)[number];

const TAB_LABELS: Record<BookingTab, MessageKey> = {
  Overview: "bookings.tab.overview",
  Services: "bookings.tab.services",
  Finance: "bookings.tab.finance",
  Documents: "bookings.tab.documents",
  Timeline: "bookings.tab.timeline",
};

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
  const t = useT();
  const format = useFormat();
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("common.customer")}
        </p>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label={t("common.customer")} value={customerName ?? booking.customerId} />
          {/* Raw id, not a resolved name - no profiles join exists yet. */}
          <InfoRow label={t("bookings.field.assignedAgent")} value={booking.assignedTo ?? t("common.unassigned")} />
        </dl>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("bookings.details")}
        </p>
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <InfoRow label={t("bookings.field.number")} value={booking.bookingNumber} />
          <InfoRow label={t("bookingField.title")} value={booking.title} />
          <InfoRow label={t("common.status")} value={<BookingStatusBadge status={booking.status} />} />
          <InfoRow
            label={t("bookings.field.startDate")}
            value={booking.startDate ? format.date(booking.startDate) : "—"}
          />
          <InfoRow label={t("bookings.field.endDate")} value={booking.endDate ? format.date(booking.endDate) : "—"} />
          <InfoRow label={t("bookings.field.totalAmount")} value={format.currency(booking.totalAmount)} />
          <InfoRow label={t("bookings.field.createdAt")} value={format.date(booking.createdAt)} />
          <InfoRow label={t("bookings.field.updatedAt")} value={format.date(booking.updatedAt)} />
        </dl>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {t("common.notes")}
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
  const t = useT();

  return (
    <DetailLayout
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(tab) => setActiveTab(tab as BookingTab)}
      ariaLabel={t("bookings.sections")}
      tabLabel={(tab) => t(TAB_LABELS[tab as BookingTab])}
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
        <p className="text-sm text-muted-foreground">{t("common.comingSoon")}</p>
      )}
    </DetailLayout>
  );
}
