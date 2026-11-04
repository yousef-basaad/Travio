import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { RouteText } from "./route-text";
import type { BookingFlight, CabinClass } from "../../types/booking";

// Single source of truth for cabin class labels - exported so
// create-flight-dialog.tsx/edit-flight-dialog.tsx reuse it for their
// <select> options instead of duplicating it.
export const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  business: "Business",
  first: "First",
};

export const CABIN_CLASS_KEYS: Record<CabinClass, MessageKey> = {
  economy: "cabin.economy",
  business: "cabin.business",
  first: "cabin.first",
};

type FlightItemProps = {
  flight: BookingFlight;
  onEdit: (flight: BookingFlight) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function FlightItem({ flight, onEdit, onDelete, isDeleting }: FlightItemProps) {
  const t = useT();
  const format = useFormat();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{flight.airline ?? t("services.flight.unknown")}</span>
          {flight.flightNumber && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {flight.flightNumber}
            </span>
          )}
          {flight.cabinClass && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {t(CABIN_CLASS_KEYS[flight.cabinClass])}
            </span>
          )}
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(flight)}
            aria-label={t("services.flight.editLabel")}
          >
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(flight.id)}
            disabled={isDeleting}
            aria-label={t("services.flight.deleteLabel")}
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          <RouteText from={flight.departureAirport ?? "—"} to={flight.arrivalAirport ?? "—"} />
        </p>
        <p className="text-xs text-muted-foreground">
          {flight.departureTime ? format.dateTime(flight.departureTime) : t("services.flight.noDeparture")}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
