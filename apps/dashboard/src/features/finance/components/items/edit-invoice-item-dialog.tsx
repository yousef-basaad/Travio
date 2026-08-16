"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import { formatSar } from "@travio/utils";
import type { InvoiceItem, InvoiceItemType } from "@travio/api";
import { useUpdateInvoiceItem } from "../../api/invoices.api";
import { ITEM_TYPE_LABELS } from "./invoice-item";
import { isInvoiceItemType } from "./create-invoice-item-dialog";

const ITEM_TYPE_OPTIONS: InvoiceItemType[] = ["flight", "hotel", "transfer", "visa", "manual"];

const EMPTY_FORM = {
  itemType: "manual" as InvoiceItemType,
  description: "",
  quantity: "1",
  unitPrice: "0",
};

function toFormValues(item: InvoiceItem): typeof EMPTY_FORM {
  return {
    itemType: item.itemType,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
  };
}

type EditInvoiceItemDialogProps = {
  item: InvoiceItem | null;
  invoiceId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Mirrors CreateInvoiceItemDialog's shape - modal mechanics live in the
// shared Dialog primitive, total stays computed (quantity * unitPrice),
// referenceId stays untouched (no service picker exists yet). `item` is
// only meaningfully non-null while `open` is true.
export function EditInvoiceItemDialog({
  item,
  invoiceId,
  open,
  onOpenChange,
}: EditInvoiceItemDialogProps) {
  const updateItem = useUpdateInvoiceItem();
  const [form, setForm] = useState(EMPTY_FORM);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (open && item) {
      setForm(toFormValues(item));
      setValidationError(null);
      updateItem.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, item]);

  const parsedQuantity = Number(form.quantity);
  const parsedUnitPrice = Number(form.unitPrice);
  const quantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0 ? parsedQuantity : 0;
  const unitPrice = Number.isFinite(parsedUnitPrice) && parsedUnitPrice >= 0 ? parsedUnitPrice : 0;
  const computedTotal = quantity * unitPrice;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!item) return;

    const trimmedDescription = form.description.trim();
    if (trimmedDescription.length === 0) {
      setValidationError("Description is required.");
      return;
    }

    setValidationError(null);

    updateItem.mutate(
      {
        id: item.id,
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
        // updateItem.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={updateItem.isPending}
      aria-labelledby="edit-invoice-item-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-invoice-item-title" className="text-lg font-semibold">
          Edit Item
        </h2>

        <div className="space-y-1">
          <label htmlFor="edit-invoice-item-description" className="text-sm font-medium">
            Description
          </label>
          <input
            id="edit-invoice-item-description"
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
            <label htmlFor="edit-invoice-item-quantity" className="text-sm font-medium">
              Quantity
            </label>
            <input
              id="edit-invoice-item-quantity"
              type="number"
              min={1}
              step="1"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-invoice-item-unit-price" className="text-sm font-medium">
              Unit Price
            </label>
            <input
              id="edit-invoice-item-unit-price"
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
          <label htmlFor="edit-invoice-item-type" className="text-sm font-medium">
            Item Type
          </label>
          <select
            id="edit-invoice-item-type"
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

        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <span className="text-muted-foreground">Total: </span>
          <span className="font-medium">{formatSar(computedTotal)}</span>
        </div>

        {updateItem.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateItem.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateItem.isPending}>
            {updateItem.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
