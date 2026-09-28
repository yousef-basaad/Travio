"use client";

import { Wallet, CircleCheck, CircleDollarSign } from "lucide-react";
import { MiniStat } from "@travio/ui";
import { formatCurrency } from "@travio/utils";
import type { InvoiceStatus } from "@travio/api";
import { useBookingInvoices } from "@/features/finance";

const ICON_SIZE = 16;

// Reuses useBookingInvoices (the same hook InvoiceList already fetches
// with, in the same tab) - no new endpoint, no new aggregate service.
// "Paid"/"Outstanding" are derived from each invoice's own `status`
// (draft/issued/paid/partially_paid/cancelled), not from summing real
// Payment rows - invoices carry no numeric "amount paid" column, and
// getting an exact currency figure would mean fetching payments for
// every invoice individually (a new N+1 aggregate, out of this phase's
// "avoid unnecessary API changes" scope). Outstanding is defined as
// Total - Paid, so the three numbers are always internally consistent
// (no double-counting) even though a partially_paid invoice's own
// not-yet-collected portion is counted as outstanding in full rather
// than split out precisely - an honest simplification, not a fabricated
// number. Cancelled invoices are excluded entirely from all three
// figures (matching how analyticsService's own dashboard stats already
// treat cancelled invoices as not counting toward revenue).
function isCancelled(status: InvoiceStatus): boolean {
  return status === "cancelled";
}

function isPaid(status: InvoiceStatus): boolean {
  return status === "paid";
}

export function BookingFinancialSummary({ bookingId }: { bookingId: string }) {
  const { data: invoices, isLoading } = useBookingInvoices(bookingId);

  const activeInvoices = (invoices ?? []).filter((invoice) => !isCancelled(invoice.status));
  const totalInvoiced = activeInvoices.reduce((sum, invoice) => sum + invoice.total, 0);
  const paidAmount = activeInvoices
    .filter((invoice) => isPaid(invoice.status))
    .reduce((sum, invoice) => sum + invoice.total, 0);
  const outstandingAmount = totalInvoiced - paidAmount;

  return (
    <div className="grid grid-cols-1 gap-4 rounded-lg border border-border/60 bg-surface-muted/40 p-4 sm:grid-cols-3">
      <MiniStat
        label="Total Invoiced"
        value={formatCurrency(totalInvoiced)}
        isLoading={isLoading}
        icon={<Wallet size={ICON_SIZE} />}
        tone="primary"
      />
      <MiniStat
        label="Paid"
        value={formatCurrency(paidAmount)}
        isLoading={isLoading}
        icon={<CircleCheck size={ICON_SIZE} />}
        tone="success"
      />
      <MiniStat
        label="Outstanding"
        value={formatCurrency(outstandingAmount)}
        isLoading={isLoading}
        icon={<CircleDollarSign size={ICON_SIZE} />}
        tone={outstandingAmount > 0 ? "warning" : "success"}
      />
    </div>
  );
}
