"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { PaymentMethod } from "@travio/api";
import { useCreatePayment } from "../../api/invoices.api";
import { PAYMENT_METHOD_LABELS } from "./payment-item";

const PAYMENT_METHOD_OPTIONS: PaymentMethod[] = ["cash", "card", "bank_transfer", "online"];

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHOD_OPTIONS as readonly string[]).includes(value);
}

const EMPTY_FORM = {
  amount: "",
  method: "cash" as PaymentMethod,
  reference: "",
  paidAt: "",
};

type CreatePaymentDialogProps = {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. amount is required and
// must be positive (matching createPaymentSchema) - a payment recording
// 0 money received isn't a meaningful ledger entry.
export function CreatePaymentDialog({ invoiceId, open, onOpenChange }: CreatePaymentDialogProps) {
  const createPayment = useCreatePayment();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setValidationError(null);
      createPayment.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedAmount = form.amount.trim();
    const parsedAmount = trimmedAmount === "" ? Number.NaN : Number(trimmedAmount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setValidationError("Enter a valid payment amount.");
      return;
    }

    setValidationError(null);

    createPayment.mutate(
      {
        invoiceId,
        amount: parsedAmount,
        method: form.method,
        reference: form.reference.trim() || undefined,
        paidAt: form.paidAt || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // createPayment.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createPayment.isPending}
      aria-labelledby="create-payment-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-payment-title" className="text-lg font-semibold">
          Add Payment
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="payment-amount" className="text-sm font-medium">
              Amount
            </label>
            <input
              id="payment-amount"
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
            <label htmlFor="payment-method" className="text-sm font-medium">
              Payment Method
            </label>
            <select
              id="payment-method"
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
            <label htmlFor="payment-reference" className="text-sm font-medium">
              Reference
            </label>
            <input
              id="payment-reference"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.reference}
              onChange={(event) => setForm({ ...form, reference: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="payment-paid-at" className="text-sm font-medium">
              Paid Date
            </label>
            <input
              id="payment-paid-at"
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

        {createPayment.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the payment. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createPayment.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createPayment.isPending}>
            {createPayment.isPending ? "Adding…" : "Add Payment"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
