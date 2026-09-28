import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { formatDateTime } from "@travio/utils";
import type { BookingFlight, CabinClass } from "@travio/api";

// Read-only counterpart to the dashboard's own FlightItem - same fields,
// same layout primitives, no ServiceItemActions (a customer never
// edits/deletes a flight). Mirrors apps/dashboard's per-app label map
// convention rather than importing across apps.
const CABIN_CLASS_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  business: "Business",
  first: "First",
};

export function FlightItem({ flight }: { flight: BookingFlight }) {
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
