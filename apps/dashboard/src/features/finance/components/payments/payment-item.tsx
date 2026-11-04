"use client";

import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { cn } from "@travio/utils";
import type { Payment, PaymentMethod } from "@travio/api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";

// Message keys for the same methods, for translated display.
export const PAYMENT_METHOD_KEYS: Record<PaymentMethod, MessageKey> = {
  cash: "paymentMethod.cash",
  card: "paymentMethod.card",
  bank_transfer: "paymentMethod.bank_transfer",
  online: "paymentMethod.online",
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
  const t = useT();
  const format = useFormat();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{format.currency(payment.amount)}</span>
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
              PAYMENT_METHOD_STYLES[payment.method],
            )}
          >
            {t(PAYMENT_METHOD_KEYS[payment.method])}
          </span>
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(payment)}
            aria-label={t("finance.payments.editLabel")}
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(payment.id)}
            disabled={isDeleting}
            aria-label={t("finance.payments.deleteLabel")}
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        {payment.reference && (
          <p className="text-sm text-muted-foreground">Ref: {payment.reference}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {payment.paidAt ? t("finance.payments.paidOn", { date: format.date(payment.paidAt) }) : t("finance.payments.noPaidDate")}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
