"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Button, Dialog } from "@travio/ui";
import type { TransferType } from "../../types/booking";
import { useCreateTransfer } from "../../api/bookings.api";
import { TRANSFER_TYPE_LABELS } from "./transfer-item";

const TRANSFER_TYPE_OPTIONS: TransferType[] = [
  "airport_transfer",
  "hotel_transfer",
  "private_transfer",
  "shared_transfer",
];

export function isTransferType(value: string): value is TransferType {
  return (TRANSFER_TYPE_OPTIONS as readonly string[]).includes(value);
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

type CreateTransferDialogProps = {
  bookingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

// Modal mechanics (showModal/close/backdrop/cancel-prevention) live in
// the shared Dialog primitive (packages/ui) - this only owns form state
// and field markup. Every field is genuinely optional (booking_transfers
// has no NOT NULL constraint beyond tenant/booking id), so there's no
// required-field validation to run client-side.
export function CreateTransferDialog({ bookingId, open, onOpenChange }: CreateTransferDialogProps) {
  const createTransfer = useCreateTransfer();
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      createTransfer.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const trimmedPassengerCount = form.passengerCount.trim();
    const parsedPassengerCount =
      trimmedPassengerCount === "" ? undefined : Number(trimmedPassengerCount);

    createTransfer.mutate(
      {
        bookingId,
        transferType: form.transferType || undefined,
        providerName: form.providerName.trim() || undefined,
        vehicleType: form.vehicleType.trim() || undefined,
        pickupLocation: form.pickupLocation.trim() || undefined,
        dropoffLocation: form.dropoffLocation.trim() || undefined,
        // datetime-local inputs yield "YYYY-MM-DDTHH:mm" (no timezone) -
        // converted to a full ISO string here, which is what the API's
        // zod schema (z.string().datetime()) and the timestamptz column
        // both expect.
        pickupTime: form.pickupTime ? new Date(form.pickupTime).toISOString() : undefined,
        passengerCount:
          parsedPassengerCount !== undefined && Number.isFinite(parsedPassengerCount)
            ? parsedPassengerCount
            : undefined,
        confirmationNumber: form.confirmationNumber.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        // On failure the dialog stays open and every field is left as-is -
        // createTransfer.isError surfaces the friendly message below.
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={createTransfer.isPending}
      aria-labelledby="create-transfer-title"
    >
      <form onSubmit={handleSubmit} className="space-y-4 p-6" noValidate>
        <h2 id="create-transfer-title" className="text-lg font-semibold">
          Add Transfer
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="transfer-provider-name" className="text-sm font-medium">
              Provider Name
            </label>
            <input
              id="transfer-provider-name"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.providerName}
              onChange={(event) => setForm({ ...form, providerName: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="transfer-vehicle-type" className="text-sm font-medium">
              Vehicle Type
            </label>
            <input
              id="transfer-vehicle-type"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.vehicleType}
              onChange={(event) => setForm({ ...form, vehicleType: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="transfer-pickup-location" className="text-sm font-medium">
              Pickup Location
            </label>
            <input
              id="transfer-pickup-location"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.pickupLocation}
              onChange={(event) => setForm({ ...form, pickupLocation: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="transfer-dropoff-location" className="text-sm font-medium">
              Dropoff Location
            </label>
            <input
              id="transfer-dropoff-location"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.dropoffLocation}
              onChange={(event) => setForm({ ...form, dropoffLocation: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="transfer-pickup-time" className="text-sm font-medium">
              Pickup Time
            </label>
            <input
              id="transfer-pickup-time"
              type="datetime-local"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.pickupTime}
              onChange={(event) => setForm({ ...form, pickupTime: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="transfer-passenger-count" className="text-sm font-medium">
              Passenger Count
            </label>
            <input
              id="transfer-passenger-count"
              type="number"
              min={1}
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.passengerCount}
              onChange={(event) => setForm({ ...form, passengerCount: event.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="transfer-confirmation-number" className="text-sm font-medium">
              Confirmation Number
            </label>
            <input
              id="transfer-confirmation-number"
              className="w-full rounded-md border px-3 py-2 text-sm"
              value={form.confirmationNumber}
              onChange={(event) => setForm({ ...form, confirmationNumber: event.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label htmlFor="transfer-type" className="text-sm font-medium">
            Transfer Type
          </label>
          <select
            id="transfer-type"
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

        {createTransfer.isError && (
          <p role="alert" className="text-sm text-danger">
            Couldn't add the transfer. Please try again.
          </p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createTransfer.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createTransfer.isPending}>
            {createTransfer.isPending ? "Adding…" : "Add Transfer"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
