"use client";

import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { BookingTransfer } from "@travio/api";

// Read-only counterpart to the dashboard's own TransferItem.
export function TransferItem({ transfer }: { transfer: BookingTransfer }) {
  const { t, format } = useI18n();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{transfer.providerName ?? t("transfer.unknown")}</span>
          {transfer.transferType && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {t(`transferType.${transfer.transferType}`)}
            </span>
          )}
        </div>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          <bdi>{transfer.pickupLocation ?? "—"}</bdi> {t("common.arrow")} <bdi>{transfer.dropoffLocation ?? "—"}</bdi>
        </p>
        <p className="text-xs text-muted-foreground">
          {transfer.pickupTime ? format.dateTime(transfer.pickupTime) : t("transfer.noPickup")}
          {transfer.vehicleType ? ` · ${transfer.vehicleType}` : ""}
          {transfer.passengerCount ? ` · ${t("transfer.passengers", { count: transfer.passengerCount })}` : ""}
          {transfer.confirmationNumber ? ` · ${t("transfer.confirmation", { number: transfer.confirmationNumber })}` : ""}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
