import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { formatDateTime } from "@travio/utils";
import type { BookingTransfer, TransferType } from "@travio/api";

const TRANSFER_TYPE_LABELS: Record<TransferType, string> = {
  airport_transfer: "Airport Transfer",
  hotel_transfer: "Hotel Transfer",
  private_transfer: "Private Transfer",
  shared_transfer: "Shared Transfer",
};

// Read-only counterpart to the dashboard's own TransferItem.
export function TransferItem({ transfer }: { transfer: BookingTransfer }) {
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
