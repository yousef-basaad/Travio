import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { formatDateTime } from "@travio/utils";
import type { BookingFlight, CabinClass } from "../../types/booking";

// Single source of truth for cabin class labels - exported so
// create-flight-dialog.tsx/edit-flight-dialog.tsx reuse it for their
// <select> options instead of duplicating it.
export const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  business: "Business",
  first: "First",
};

type FlightItemProps = {
  flight: BookingFlight;
  onEdit: (flight: BookingFlight) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function FlightItem({ flight, onEdit, onDelete, isDeleting }: FlightItemProps) {
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{flight.airline ?? "Unknown airline"}</span>
          {flight.flightNumber && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {flight.flightNumber}
            </span>
          )}
          {flight.cabinClass && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {CABIN_CLASS_LABELS[flight.cabinClass]}
            </span>
          )}
        </div>
        <ServiceItemActions>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(flight)}
            aria-label="Edit flight"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(flight.id)}
            disabled={isDeleting}
            aria-label="Delete flight"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          {flight.departureAirport ?? "—"} → {flight.arrivalAirport ?? "—"}
        </p>
        <p className="text-xs text-muted-foreground">
          {flight.departureTime ? formatDateTime(flight.departureTime) : "Departure time not set"}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
