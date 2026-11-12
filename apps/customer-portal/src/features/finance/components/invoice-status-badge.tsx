"use client";

import type { InvoiceStatus } from "@travio/api";
import { cn } from "@travio/utils";
import { useT } from "@/lib/i18n/i18n-provider";

// Mirrors apps/dashboard's INVOICE_STATUS_LABELS/STYLES (invoice-item.tsx)
// exactly - same per-app colocated status badge convention as
// BookingStatusBadge (Product-5).
const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  issued: "bg-accent text-accent-foreground",
  paid: "bg-primary text-primary-foreground",
  partially_paid: "bg-accent text-accent-foreground",
  cancelled: "bg-danger/10 text-danger",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const t = useT();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        INVOICE_STATUS_STYLES[status],
      )}
    >
      {t(`invoiceStatus.${status}`)}
    </span>
  );
}
