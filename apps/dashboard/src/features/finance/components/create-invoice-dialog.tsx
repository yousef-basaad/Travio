"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { InvoiceStatus } from "@travio/api";
import { useCreateInvoice } from "../api/invoices.api";
import { INVOICE_STATUS_LABELS } from "./invoice-item";

const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = [
  "draft",
  "issued",
  "paid",
  "partially_paid",
  "cancelled",
];

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUS_OPTIONS as readonly string[]).includes(value);
}

const EMPTY_FORM = {
  invoiceNumber: "",
  status: "" as InvoiceStatus | "",
  total: "",
  currency: "",
  issueDate: "",
  dueDate: "",
  notes: "",
};

type CreateInvoiceDialogProps = {
  customerId?: string;
  bookingId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics (showModal/close/backdrop/cancel-prevention) live in
// the shared Dialog primitive (packages/ui) - this only owns form state
// and field markup. Unlike the booking-services dialogs, invoiceNumber
// and total ARE required here (client-side validated, matching
// CreateActivityDialog's "title required" precedent) - total is entered
// manually until invoice_items (v1.2.0) exists to compute it.
export function CreateInvoiceDialog({
  customerId,
  bookingId,
  open,
  onOpenChange,
}: CreateInvoiceDialogProps) {
  const createInvoice = useCreateInvoice();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setValidationError(null);
      createInvoice.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedNumber = form.invoiceNumber.trim();
    if (trimmedNumber.length === 0) {
      setValidationError("Invoice number is required.");
      return;
    }

    const trimmedTotal = form.total.trim();
    const parsedTotal = trimmedTotal === "" ? Number.NaN : Number(trimmedTotal);
    if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
      setValidationError("Enter a valid total amount.");
      return;
    }

    setValidationError(null);

    createInvoice.mutate(
      {
        customerId,
        bookingId,
        invoiceNumber: trimmedNumber,
        status: form.status || undefined,
        total: parsedTotal,
        currency: form.currency.trim() || undefined,
        issueDate: form.issueDate || undefined,
        dueDate: form.dueDate || undefined,
        notes: form.notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // createInvoice.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createInvoice.isPending}
      aria-labelledby="create-invoice-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-invoice-title" className="text-lg font-semibold">
          Add Invoice
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="invoice-number" className="text-sm font-medium">
              Invoice Number
            </label>
            <input
              id="invoice-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.invoiceNumber}
              onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })}
              aria-invalid={validationError ? "true" : "false"}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="invoice-total" className="text-sm font-medium">
              Total Amount
            </label>
            <input
              id="invoice-total"
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.total}
              onChange={(event) => setForm({ ...form, total: event.target.value })}
              aria-invalid={validationError ? "true" : "false"}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="invoice-currency" className="text-sm font-medium">
              Currency
            </label>
            <input
              id="invoice-currency"
              placeholder="SAR"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="invoice-issue-date" className="text-sm font-medium">
              Issue Date
            </label>
            <input
              id="invoice-issue-date"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.issueDate}
              onChange={(event) => setForm({ ...form, issueDate: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="invoice-due-date" className="text-sm font-medium">
              Due Date
            </label>
            <input
              id="invoice-due-date"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="invoice-status" className="text-sm font-medium">
            Status
          </label>
          <select
            id="invoice-status"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.status}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || isInvoiceStatus(value)) {
                setForm({ ...form, status: value as InvoiceStatus | "" });
              }
            }}
          >
            <option value="">Select a status</option>
            {INVOICE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {INVOICE_STATUS_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="invoice-notes" className="text-sm font-medium">
            Notes
          </label>
          <textarea
            id="invoice-notes"
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
          />
        </div>

        {validationError && (
          <p role="alert" className="text-sm text-danger">
            {validationError}
          </p>
        )}

        {createInvoice.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the invoice. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createInvoice.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createInvoice.isPending}>
            {createInvoice.isPending ? "Adding…" : "Add Invoice"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
