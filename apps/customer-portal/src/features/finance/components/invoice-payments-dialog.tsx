"use client";

import { Dialog, Button, EmptyState, Skeleton } from "@travio/ui";
import { formatCurrency, formatDate } from "@travio/utils";
import type { Invoice, PaymentMethod } from "@travio/api";
import { useInvoicePayments } from "../api/finance.api";

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  online: "Online",
};

export interface InvoicePaymentsDialogProps {
  invoice: Invoice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Read-only payment ledger for a single invoice - reuses
// paymentService.listByInvoice (via GET /api/invoices/:id/payments)
// unchanged. No amounts are editable and there is no "Pay now" action
// anywhere in this dialog; this phase has no online payment.
export function InvoicePaymentsDialog({ invoice, open, onOpenChange }: InvoicePaymentsDialogProps) {
  const { data: payments, isLoading, isError } = useInvoicePayments(invoice?.id ?? "", open);

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby="invoice-payments-title">
      <div className="space-y-4 p-6">
        <div>
          <h2 id="invoice-payments-title" className="text-lg font-semibold">
            Payments — {invoice.invoiceNumber}
          </h2>
          <p className="text-sm text-muted-foreground">
            Total {formatCurrency(invoice.total, invoice.currency)}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2" role="status" aria-label="Loading payments">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <p role="alert" className="text-sm text-danger">
            Something went wrong loading payments. Please try again later.
          </p>
        ) : !payments || payments.length === 0 ? (
          <EmptyState message="No payments recorded yet" />
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li key={payment.id} className="space-y-1 rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {formatCurrency(payment.amount, invoice.currency)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </span>
                </div>
                {payment.reference ? (
                  <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {payment.paidAt ? `Paid ${formatDate(payment.paidAt)}` : "Paid date not set"}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
