"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { Invoice, InvoiceStatus } from "@travio/api";
import { useUpdateInvoice } from "../api/invoices.api";
import { INVOICE_STATUS_KEYS } from "./invoice-item";
import { isInvoiceStatus } from "./create-invoice-dialog";
import { useT } from "@/lib/i18n/i18n-provider";
import { ruleMessage } from "@/lib/api/rule-error";

const INVOICE_STATUS_OPTIONS: InvoiceStatus[] = [
  "draft",
  "issued",
  "paid",
  "partially_paid",
  "cancelled",
];

const EMPTY_FORM = {
  invoiceNumber: "",
  status: "" as InvoiceStatus | "",
  total: "",
  currency: "",
  issueDate: "",
  dueDate: "",
  notes: "",
};

function toFormValues(invoice: Invoice): typeof EMPTY_FORM {
  return {
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    total: String(invoice.total),
    currency: invoice.currency,
    issueDate: invoice.issueDate ?? "",
    dueDate: invoice.dueDate ?? "",
    notes: invoice.notes ?? "",
  };
}

type EditInvoiceDialogProps = {
  invoice: Invoice | null;
  customerId?: string;
  bookingId?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Mirrors EditHotelDialog/EditTransferDialog's native <dialog> pattern -
// always mounted (not conditionally rendered by the parent). `invoice`
// is only meaningfully non-null while `open` is true. customerId/
// bookingId are only used for cache invalidation (see invoices.api.ts),
// never sent to the server.
export function EditInvoiceDialog({
  invoice,
  customerId,
  bookingId,
  open,
  onOpenChange,
}: EditInvoiceDialogProps) {
  const t = useT();
  const updateInvoice = useUpdateInvoice();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open && invoice) {
      setForm(toFormValues(invoice));
      setValidationError(null);
      updateInvoice.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!invoice) return;

    const trimmedNumber = form.invoiceNumber.trim();
    if (trimmedNumber.length === 0) {
      setValidationError(t("finance.invoices.numberRequired"));
      return;
    }

    const trimmedTotal = form.total.trim();
    const parsedTotal = trimmedTotal === "" ? Number.NaN : Number(trimmedTotal);
    if (!Number.isFinite(parsedTotal) || parsedTotal < 0) {
      setValidationError(t("finance.invoices.invalidTotal"));
      return;
    }

    setValidationError(null);

    // Full-state submit - clearing a nullable field sends an explicit
    // null so invoiceService's update mapper actually clears the
    // column, same reasoning as EditFlightDialog/EditHotelDialog.
    // invoiceNumber/status/total/currency stay non-nullable-but-required-
    // or-optional (no "unset"), matching updateBookingSchema's status.
    updateInvoice.mutate(
      {
        id: invoice.id,
        customerId,
        bookingId,
        invoiceNumber: trimmedNumber,
        status: form.status || undefined,
        total: parsedTotal,
        currency: form.currency.trim() || undefined,
        issueDate: form.issueDate || null,
        dueDate: form.dueDate || null,
        notes: form.notes.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // updateInvoice.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={updateInvoice.isPending}
      aria-labelledby="edit-invoice-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-invoice-title" className="text-lg font-semibold">
          {t("finance.invoices.edit")}
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="edit-invoice-number" className="text-sm font-medium">
              {t("finance.invoices.number")}
            </label>
            <input
              id="edit-invoice-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.invoiceNumber}
              onChange={(event) => setForm({ ...form, invoiceNumber: event.target.value })}
              aria-invalid={validationError ? "true" : "false"}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-invoice-total" className="text-sm font-medium">
              {t("bookings.field.totalAmount")}
            </label>
            <input
              id="edit-invoice-total"
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
            <label htmlFor="edit-invoice-currency" className="text-sm font-medium">
              {t("finance.invoices.currency")}
            </label>
            <input
              id="edit-invoice-currency"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.currency}
              onChange={(event) => setForm({ ...form, currency: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-invoice-issue-date" className="text-sm font-medium">
              {t("finance.invoices.issueDate")}
            </label>
            <input
              id="edit-invoice-issue-date"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.issueDate}
              onChange={(event) => setForm({ ...form, issueDate: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-invoice-due-date" className="text-sm font-medium">
              {t("finance.invoices.dueDate")}
            </label>
            <input
              id="edit-invoice-due-date"
              type="date"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.dueDate}
              onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-invoice-status" className="text-sm font-medium">
            {t("common.status")}
          </label>
          <select
            id="edit-invoice-status"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.status}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || isInvoiceStatus(value)) {
                setForm({ ...form, status: value as InvoiceStatus | "" });
              }
            }}
          >
            <option value="">{t("common.selectStatus")}</option>
            {INVOICE_STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(INVOICE_STATUS_KEYS[option])}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-invoice-notes" className="text-sm font-medium">
            {t("common.notes")}
          </label>
          <textarea
            id="edit-invoice-notes"
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

        {updateInvoice.isError && (
          <p role="alert" className="text-sm text-danger">
            {t(ruleMessage(updateInvoice.error, "common.saveError"))}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateInvoice.isPending}
          >
            {t("common.cancel")}
          </Button>
          <Button type="submit" disabled={updateInvoice.isPending}>
            {updateInvoice.isPending ? t("common.saving") : t("common.saveChanges")}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
