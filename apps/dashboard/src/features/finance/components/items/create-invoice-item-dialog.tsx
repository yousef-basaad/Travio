"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import { formatSar } from "@travio/utils";
import type { InvoiceItemType } from "@travio/api";
import { useCreateInvoiceItem } from "../../api/invoices.api";
import { ITEM_TYPE_LABELS } from "./invoice-item";

const ITEM_TYPE_OPTIONS: InvoiceItemType[] = ["flight", "hotel", "transfer", "visa", "manual"];

export function isInvoiceItemType(value: string): value is InvoiceItemType {
  return (ITEM_TYPE_OPTIONS as readonly string[]).includes(value);
}

const EMPTY_FORM = {
  itemType: "manual" as InvoiceItemType,
  description: "",
  quantity: "1",
  unitPrice: "0",
};

type CreateInvoiceItemDialogProps = {
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. description is required
// (client-side validated, matching CreateActivityDialog's "title
// required" precedent). Total is never typed directly - it's computed
// live from quantity * unitPrice and submitted as-is, so it can never
// drift from the two numbers that produced it. referenceId isn't
// exposed here - no service picker (flight/hotel/transfer/visa) exists
// yet to select one from, so it stays unset via this dialog.
export function CreateInvoiceItemDialog({
  invoiceId,
  open,
  onOpenChange,
}: CreateInvoiceItemDialogProps) {
  const createItem = useCreateInvoiceItem();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setValidationError(null);
      createItem.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const parsedQuantity = Number(form.quantity);
  const parsedUnitPrice = Number(form.unitPrice);
  const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;
  const unitPrice = Number.isFinite(parsedUnitPrice) && parsedUnitPrice >= 0 ? parsedUnitPrice : 0;
  const computedTotal = quantity * unitPrice;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedDescription = form.description.trim();
    if (trimmedDescription.length === 0) {
      setValidationError("Description is required.");
      return;
    }

    setValidationError(null);

    createItem.mutate(
      {
        invoiceId,
        itemType: form.itemType,
        description: trimmedDescription,
        quantity,
        unitPrice,
        total: computedTotal,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // createItem.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createItem.isPending}
      aria-labelledby="create-invoice-item-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-invoice-item-title" className="text-lg font-semibold">
          Add Item
        </h2>

        <div className="space-y-1">
          <label htmlFor="invoice-item-description" className="text-sm font-medium">
            Description
          </label>
          <input
            id="invoice-item-description"
            className="w-full rounded-md border px-3 py-2 text-sm"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            aria-invalid={validationError ? "true" : "false"}
          />
          {validationError && (
            <p role="alert" className="text-sm text-danger">
              {validationError}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="invoice-item-quantity" className="text-sm font-medium">
              Quantity
            </label>
            <input
              id="invoice-item-quantity"
              type="number"
              min={1}
              step="1"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="invoice-item-unit-price" className="text-sm font-medium">
              Unit Price
            </label>
            <input
              id="invoice-item-unit-price"
              type="number"
              min={0}
              step="0.01"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.unitPrice}
              onChange={(event) => setForm({ ...form, unitPrice: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="invoice-item-type" className="text-sm font-medium">
            Item Type
          </label>
          <select
            id="invoice-item-type"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.itemType}
            onChange={(event) => {
              const value = event.target.value;
              if (isInvoiceItemType(value)) {
                setForm({ ...form, itemType: value });
              }
            }}
          >
            {ITEM_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ITEM_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {/* Computed, not editable - see the file comment above. */}
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-medium">{formatSar(computedTotal)}</span>
        </div>

        {createItem.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the item. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createItem.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createItem.isPending}>
            {createItem.isPending ? "Adding…" : "Add Item"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
