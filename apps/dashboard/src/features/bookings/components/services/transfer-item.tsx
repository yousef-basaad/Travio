import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { formatDateTime } from "@travio/utils";
import type { BookingTransfer, TransferType } from "../../types/booking";

// Single source of truth for transfer type labels - exported so
// create-transfer-dialog.tsx/edit-transfer-dialog.tsx reuse it for their
// <select> options instead of duplicating it.
export const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  airport_transfer: "Airport Transfer",
  hotel_transfer: "Hotel Transfer",
  private_transfer: "Private Transfer",
  shared_transfer: "Shared Transfer",
};

type TransferItemProps = {
  transfer: BookingTransfer;
  onEdit: (transfer: BookingTransfer) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function TransferItem({ transfer, onEdit, onDelete, isDeleting }: TransferItemProps) {
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{transfer.providerName ?? "Unknown provider"}</span>
          {transfer.transferType && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {TRANSFER_TYPE_LABELS[transfer.transferType]}
            </span>
          )}
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(transfer)}
            aria-label="Edit transfer"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(transfer.id)}
            disabled={isDeleting}
            aria-label="Delete transfer"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          {transfer.pickupLocation ?? "—"} → {transfer.dropoffLocation ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {transfer.pickupTime ? formatDateTime(transfer.pickupTime) : "Pickup time not set"}
          {transfer.vehicleType ? ` · ${transfer.vehicleType}` : ""}
          {transfer.passengerCount
            ? ` · ${transfer.passengerCount} passenger${transfer.passengerCount === 1 ? "" : "s"}`
            : ""}
          {transfer.confirmationNumber ? ` · Confirmation #${transfer.confirmationNumber}` : ""}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
