"use client";

import { useState } from "react";
import { Receipt } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@travio/ui";
import type { Payment } from "@travio/api";
import { useInvoicePayments, useDeletePayment } from "../../api/invoices.api";
import { PaymentItem } from "./payment-item";
import { CreatePaymentDialog } from "./create-payment-dialog";
import { EditPaymentDialog } from "./edit-payment-dialog";

function PaymentsSkeleton() {
  return (
    <div role="status" aria-label="Loading payments" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-12 w-full" />
      ))}
    </div>
  );
}

function PaymentsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading payments. Please try again later.
    </div>
  );
}

type PaymentsListProps = {
  invoiceId: string;
};

// Bare - no Card wrapper, matching InvoiceItemsList's shape. Nested
// inside invoice-item.tsx's own ServiceItemContent (the invoice row
// itself), which already provides the outer Card via ServiceItem.
export function PaymentsList({ invoiceId }: PaymentsListProps) {
  const { data: payments, isLoading, isError } = useInvoicePayments(invoiceId);
  const deletePayment = useDeletePayment();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);

  const hasPayments = !isLoading && !isError && !!payments && payments.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Payments</h3>
        <Button size="sm" variant="outline" onClick={() => setIsCreateOpen(true)}>
          Add Payment
        </Button>
      </div>

      {isLoading ? (
        <PaymentsSkeleton />
      ) : isError ? (
        <PaymentsErrorState />
      ) : !hasPayments ? (
        <EmptyState icon={<Receipt size={20} />} message="No payments yet" />
      ) : (
        <ul className="space-y-2">
          {payments.map((payment) => (
            <PaymentItem
              key={payment.id}
              payment={payment}
              onEdit={setEditingPayment}
              onDelete={(id) => deletePayment.mutate({ id, invoiceId })}
              isDeleting={deletePayment.isPending && deletePayment.variables?.id === payment.id}
            />
          ))}
        </ul>
      )}

      <CreatePaymentDialog
        invoiceId={invoiceId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <EditPaymentDialog
        payment={editingPayment}
        invoiceId={invoiceId}
        open={editingPayment !== null}
        onOpenChange={(open) => {
          if (!open) setEditingPayment(null);
        }}
      />
    </div>
  );
}
