"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { Payment, PaymentMethod } from "@travio/api";
import { useUpdatePayment } from "../../api/invoices.api";
import { PAYMENT_METHOD_LABELS } from "./payment-item";
import { isPaymentMethod } from "./create-payment-dialog";

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ["cash", "card", "bank_transfer", "online"];

const EMPTY_FORM = {
  amount: "",
  method: "cash" as PaymentMethod,
  reference: "",
  paidAt: "",
};

function toFormValues(payment: Payment): typeof EMPTY_FORM {
  return {
    amount: String(payment.amount),
    method: payment.method,
    reference: payment.reference ?? "",
    // paidAt is a full timestamptz string - the date input only needs
    // the yyyy-mm-dd prefix, matching create-payment-dialog's precision.
    paidAt: payment.paidAt ? payment.paidAt.slice(0, 10) : "",
  };
}

type EditPaymentDialogProps = {
  payment: Payment | null;
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Mirrors CreatePaymentDialog's shape - modal mechanics live in the
// shared Dialog primitive, amount stays required and positive. `payment`
// is only meaningfully non-null while `open` is true.
export function EditPaymentDialog({
  payment,
  invoiceId,
  open,
  onOpenChange,
}: EditPaymentDialogProps) {
  const updatePayment = useUpdatePayment();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open && payment) {
      setForm(toFormValues(payment));
      setValidationError(null);
      updatePayment.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, payment]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!payment) return;

    const trimmedAmount = form.amount.trim();
    const parsedAmount = trimmedAmount === "" ? Number.NaN : Number(trimmedAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Enter a valid payment amount.");
      return;
    }

    setValidationError(null);

    updatePayment.mutate(
      {
        id: payment.id,
        invoiceId,
        amount: parsedAmount,
        method: form.method,
        reference: form.reference.trim() || null,
        paidAt: form.paidAt || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // updatePayment.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={updatePayment.isPending}
      aria-labelledby="edit-payment-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-payment-title" className="text-lg font-semibold">
          Edit Payment
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="edit-payment-amount" className="text-sm font-medium">
              Amount
            </label>
            <input
              id="edit-payment-amount"
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.amount}
              onChange={(event) => setForm({ ...form, amount: event.target.value })}
              aria-invalid={validationError ? "true" : "false"}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-payment-method" className="text-sm font-medium">
              Payment Method
            </label>
            <select
              id="edit-payment-method"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              value={form.method}
              onChange={(event) => {
                const value = event.target.value;
                if (isPaymentMethod(value)) {
                  setForm({ ...form, method: value });
                }
              }}
            >
              {PAYMENT_METHOD_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {PAYMENT_METHOD_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-payment-reference" className="text-sm font-medium">
              Reference
            </label>
            <input
              id="edit-payment-reference"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.reference}
              onChange={(event) => setForm({ ...form, reference: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-payment-paid-at" className="text-sm font-medium">
              Paid Date
            </label>
            <input
              id="edit-payment-paid-at"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.paidAt}
              onChange={(event) => setForm({ ...form, paidAt: event.target.value })}
            />
          </div>
        </div>

        {validationError && (
          <p role="alert" className="text-sm text-danger">
            {validationError}
          </p>
        )}

        {updatePayment.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updatePayment.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updatePayment.isPending}>
            {updatePayment.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
