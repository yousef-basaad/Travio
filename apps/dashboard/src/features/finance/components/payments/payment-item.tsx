import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { cn, formatDate, formatSar } from "@travio/utils";
import type { Payment, PaymentMethod } from "@travio/api";

// Single source of truth for payment method labels - exported so
// create-payment-dialog.tsx/edit-payment-dialog.tsx reuse it for their
// <select> options instead of duplicating it. Matches the real
// payment_method enum (cash/card/bank_transfer/online).
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Cash",
  card: "Card",
  bank_transfer: "Bank Transfer",
  online: "Online",
};

// Reuses only existing design tokens, matching InvoiceItemRow/
// InvoiceItem's approach - no new colors introduced. Exported so
// PaymentStatus (finance workspace) reuses the same map instead of
// duplicating it.
export const PAYMENT_METHOD_STYLES: Record<PaymentMethod, string> = {
  cash: "bg-secondary text-secondary-foreground",
  card: "bg-accent text-accent-foreground",
  bank_transfer: "bg-accent text-accent-foreground",
  online: "bg-accent text-accent-foreground",
};

type PaymentItemProps = {
  payment: Payment;
  onEdit: (payment: Payment) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function PaymentItem({ payment, onEdit, onDelete, isDeleting }: PaymentItemProps) {
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{formatSar(payment.amount)}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              PAYMENT_METHOD_STYLES[payment.method],
            )}
          >
            {PAYMENT_METHOD_LABELS[payment.method]}
          </span>
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(payment)}
            aria-label="Edit payment"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(payment.id)}
            disabled={isDeleting}
            aria-label="Delete payment"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        {payment.reference && (
          <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {payment.paidAt ? `Paid ${formatDate(payment.paidAt)}` : "Paid date not set"}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
