"use client";

import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { RouteText } from "./route-text";
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

export const TRANSFER_TYPE_KEYS: Record<TransferType, MessageKey> = {
  airport_transfer: "transferType.airport_transfer",
  hotel_transfer: "transferType.hotel_transfer",
  private_transfer: "transferType.private_transfer",
  shared_transfer: "transferType.shared_transfer",
};

type TransferItemProps = {
  transfer: BookingTransfer;
  onEdit: (transfer: BookingTransfer) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function TransferItem({ transfer, onEdit, onDelete, isDeleting }: TransferItemProps) {
  const t = useT();
  const format = useFormat();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{transfer.providerName ?? t("services.transfer.unknown")}</span>
          {transfer.transferType && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {t(TRANSFER_TYPE_KEYS[transfer.transferType])}
            </span>
          )}
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(transfer)}
            aria-label={t("services.transfer.editLabel")}
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(transfer.id)}
            disabled={isDeleting}
            aria-label={t("services.transfer.deleteLabel")}
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          <RouteText from={transfer.pickupLocation ?? "—"} to={transfer.dropoffLocation ?? "—"} />
        </p>
        <p className="text-xs text-muted-foreground">
          {transfer.pickupTime ? format.dateTime(transfer.pickupTime) : t("services.transfer.noPickup")}
          {transfer.vehicleType ? ` · ${transfer.vehicleType}` : ""}
          {transfer.passengerCount
            ? ` · ${transfer.passengerCount === 1 ? t("services.transfer.onePassenger") : t("services.transfer.passengers", { count: transfer.passengerCount })}`
            : ""}
          {transfer.confirmationNumber
            ? ` · ${t("services.confirmation", { number: transfer.confirmationNumber })}`
            : ""}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
