import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { cn, formatDate, formatSar } from "@travio/utils";
import type { Invoice, InvoiceStatus } from "@travio/api";
import { useInvoiceItems, useInvoicePayments } from "../api/invoices.api";
import { InvoiceItemsList } from "./items/invoice-items-list";
import { PaymentsList } from "./payments/payments-list";

// Single source of truth for invoice status labels - exported so
// create-invoice-dialog.tsx/edit-invoice-dialog.tsx reuse it for their
// <select> options instead of duplicating it. Matches the real
// invoice_status enum (draft/issued/paid/partially_paid/cancelled).
export const INVOICE_STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: "Draft",
  issued: "Issued",
  paid: "Paid",
  partially_paid: "Partially Paid",
  cancelled: "Cancelled",
};

// Reuses only existing design tokens, matching LeadStatusBadge/
// BookingStatusBadge's approach - no new colors introduced. Exported
// (like INVOICE_STATUS_LABELS above) so InvoiceTable (finance workspace)
// reuses the same map instead of duplicating it - its 5-tier progression
// (draft/issued/paid/partially_paid/cancelled) uses an "accent" tier and
// a solid-primary tier neither of which is one of the design system's 5
// generic Badge tones, same reasoning as BookingStatusBadge staying
// bespoke rather than being forced through Badge/StatusBadge.
export const INVOICE_STATUS_STYLES: Record<InvoiceStatus, string> = {
  draft: "bg-secondary text-secondary-foreground",
  issued: "bg-accent text-accent-foreground",
  paid: "bg-primary text-primary-foreground",
  partially_paid: "bg-accent text-accent-foreground",
  cancelled: "bg-danger/10 text-danger",
};

type InvoiceItemProps = {
  invoice: Invoice;
  onEdit: (invoice: Invoice) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function InvoiceItem({ invoice, onEdit, onDelete, isDeleting }: InvoiceItemProps) {
  // Items are fetched here (not just inside InvoiceItemsList) so the
  // Subtotal in the summary reflects the same data the list below
  // renders. This subtotal is display-only - it is never written back to
  // invoices.subtotal; invoice.tax/invoice.total remain the separately
  // managed columns from v1.1.0, unchanged by invoice_items.
  const { data: items } = useInvoiceItems(invoice.id);
  const itemsSubtotal = (items ?? []).reduce((sum, item) => sum + item.total, 0);

  // Same reasoning as itemsSubtotal above - fetched here so Paid/
  // Remaining reflect the same data PaymentsList renders below. Also
  // display-only: paidAmount is never written back to any invoice
  // column, and invoice.status is not auto-updated from it yet (no
  // schema support for that decision this iteration).
  const { data: payments } = useInvoicePayments(invoice.id);
  const paidAmount = (payments ?? []).reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = invoice.total - paidAmount;

  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{invoice.invoiceNumber}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              INVOICE_STATUS_STYLES[invoice.status],
            )}
          >
            {INVOICE_STATUS_LABELS[invoice.status]}
          </span>
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(invoice)}
            aria-label="Edit invoice"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(invoice.id)}
            disabled={isDeleting}
            aria-label="Delete invoice"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent className="space-y-4">
        <div>
          <p className="text-xs text-muted-foreground">
            {invoice.issueDate ? `Issued ${formatDate(invoice.issueDate)}` : "Issue date not set"}
            {invoice.dueDate ? ` · Due ${formatDate(invoice.dueDate)}` : ""}
          </p>

          <dl className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd>{formatSar(itemsSubtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tax</dt>
              <dd>{formatSar(invoice.tax)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Total</dt>
              <dd>{formatSar(invoice.total)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Paid</dt>
              <dd>{formatSar(paidAmount)}</dd>
            </div>
            <div className="flex justify-between font-medium">
              <dt>Remaining</dt>
              <dd>{formatSar(remainingAmount)}</dd>
            </div>
          </dl>
        </div>

        <InvoiceItemsList invoiceId={invoice.id} />
        <PaymentsList invoiceId={invoice.id} />
      </ServiceItemContent>
    </ServiceItem>
  );
}
