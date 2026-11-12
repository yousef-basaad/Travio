"use client";

import { Dialog, Button, EmptyState, Skeleton } from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { Invoice } from "@travio/api";
import { useInvoicePayments } from "../api/finance.api";

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
  const { t, format } = useI18n();
  const { data: payments, isLoading, isError } = useInvoicePayments(invoice?.id ?? "", open);

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange} aria-labelledby="invoice-payments-title">
      <div className="space-y-4 p-6">
        <div>
          <h2 id="invoice-payments-title" className="text-lg font-semibold">
            {t("payments.title", { number: invoice.invoiceNumber })}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("payments.total", { amount: format.currency(invoice.total, invoice.currency) })}
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-2" role="status" aria-label={t("payments.loading")}>
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : isError ? (
          <p role="alert" className="text-sm text-danger">
            {t("payments.error")}
          </p>
        ) : !payments || payments.length === 0 ? (
          <EmptyState message={t("payments.empty")} />
        ) : (
          <ul className="space-y-2">
            {payments.map((payment) => (
              <li key={payment.id} className="space-y-1 rounded-md border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {format.currency(payment.amount, invoice.currency)}
                  </span>
                  <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
                    {t(`paymentMethod.${payment.method}`)}
                  </span>
                </div>
                {payment.reference ? (
                  <p className="text-sm text-muted-foreground">{t("payments.reference", { reference: payment.reference })}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">
                  {payment.paidAt ? t("payments.paidOn", { date: format.date(payment.paidAt) }) : t("payments.noDate")}
                </p>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.close")}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
