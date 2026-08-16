"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { BookingTransfer, TransferType } from "../../types/booking";
import { useUpdateTransfer } from "../../api/bookings.api";
import { TRANSFER_TYPE_LABELS } from "./transfer-item";
import { isTransferType } from "./create-transfer-dialog";

const TRANSFER_TYPE_OPTIONS: TransferType[] = [
  "airport_transfer",
  "hotel_transfer",
  "private_transfer",
  "shared_transfer",
];

// datetime-local wants "YYYY-MM-DDTHH:mm" in local time - built from the
// Date object's own local getters (not toISOString(), which is UTC) so
// the value shown matches what the user would expect to see/edit.
function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

const EMPTY_FORM = {
  transferType: "" as TransferType | "",
  providerName: "",
  vehicleType: "",
  pickupLocation: "",
  dropoffLocation: "",
  pickupTime: "",
  passengerCount: "",
  confirmationNumber: "",
};

function toFormValues(transfer: BookingTransfer): typeof EMPTY_FORM {
  return {
    transferType: transfer.transferType ?? "",
    providerName: transfer.providerName ?? "",
    vehicleType: transfer.vehicleType ?? "",
    pickupLocation: transfer.pickupLocation ?? "",
    dropoffLocation: transfer.dropoffLocation ?? "",
    pickupTime: toDateTimeLocalValue(transfer.pickupTime),
    passengerCount: transfer.passengerCount !== null ? String(transfer.passengerCount) : "",
    confirmationNumber: transfer.confirmationNumber ?? "",
  };
}

type EditTransferDialogProps = {
  transfer: BookingTransfer | null;
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics live in the shared Dialog primitive (packages/ui) -
// this only owns form state and field markup. `transfer` is only
// meaningfully non-null while `open` is true.
export function EditTransferDialog({
  transfer,
  bookingId,
  open,
  onOpenChange,
}: EditTransferDialogProps) {
  const updateTransfer = useUpdateTransfer();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open && transfer) {
      setForm(toFormValues(transfer));
      updateTransfer.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transfer]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!transfer) return;

    const trimmedPassengerCount = form.passengerCount.trim();
    const parsedPassengerCount = trimmedPassengerCount === "" ? null : Number(trimmedPassengerCount);

    // Full-state submit - clearing a field sends an explicit null so
    // bookingTransfersService's update mapper actually clears the
    // column, same reasoning as EditFlightDialog/EditHotelDialog.
    updateTransfer.mutate(
      {
        id: transfer.id,
        bookingId,
        transferType: form.transferType || null,
        providerName: form.providerName.trim() || null,
        vehicleType: form.vehicleType.trim() || null,
        pickupLocation: form.pickupLocation.trim() || null,
        dropoffLocation: form.dropoffLocation.trim() || null,
        pickupTime: form.pickupTime ? new Date(form.pickupTime).toISOString() : null,
        passengerCount:
          parsedPassengerCount !== null && Number.isFinite(parsedPassengerCount)
            ? parsedPassengerCount
            : null,
        confirmationNumber: form.confirmationNumber.trim() || null,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // updateTransfer.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={updateTransfer.isPending}
      aria-labelledby="edit-transfer-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="edit-transfer-title" className="text-lg font-semibold">
          Edit Transfer
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="edit-transfer-provider-name" className="text-sm font-medium">
              Provider Name
            </label>
            <input
              id="edit-transfer-provider-name"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.providerName}
              onChange={(event) => setForm({ ...form, providerName: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-transfer-vehicle-type" className="text-sm font-medium">
              Vehicle Type
            </label>
            <input
              id="edit-transfer-vehicle-type"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.vehicleType}
              onChange={(event) => setForm({ ...form, vehicleType: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-transfer-pickup-location" className="text-sm font-medium">
              Pickup Location
            </label>
            <input
              id="edit-transfer-pickup-location"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.pickupLocation}
              onChange={(event) => setForm({ ...form, pickupLocation: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-transfer-dropoff-location" className="text-sm font-medium">
              Dropoff Location
            </label>
            <input
              id="edit-transfer-dropoff-location"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.dropoffLocation}
              onChange={(event) => setForm({ ...form, dropoffLocation: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-transfer-pickup-time" className="text-sm font-medium">
              Pickup Time
            </label>
            <input
              id="edit-transfer-pickup-time"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.pickupTime}
              onChange={(event) => setForm({ ...form, pickupTime: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-transfer-passenger-count" className="text-sm font-medium">
              Passenger Count
            </label>
            <input
              id="edit-transfer-passenger-count"
              type="number"
              min={1}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.passengerCount}
              onChange={(event) => setForm({ ...form, passengerCount: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="edit-transfer-confirmation-number" className="text-sm font-medium">
              Confirmation Number
            </label>
            <input
              id="edit-transfer-confirmation-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.confirmationNumber}
              onChange={(event) => setForm({ ...form, confirmationNumber: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="edit-transfer-type" className="text-sm font-medium">
            Transfer Type
          </label>
          <select
            id="edit-transfer-type"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={form.transferType}
            onChange={(event) => {
              const value = event.target.value;
              if (value === "" || isTransferType(value)) {
                setForm({ ...form, transferType: value as TransferType | "" });
              }
            }}
          >
            <option value="">Select a transfer type</option>
            {TRANSFER_TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {TRANSFER_TYPE_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        {updateTransfer.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't save changes. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={updateTransfer.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateTransfer.isPending}>
            {updateTransfer.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
