"use client";

import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { BookingFlight } from "@travio/api";

// Read-only counterpart to the dashboard's own FlightItem - same fields,
// same layout primitives, no edit/delete actions.

export function FlightItem({ flight }: { flight: BookingFlight }) {
  const { t, format } = useI18n();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{flight.airline ?? t("flight.unknownAirline")}</span>
          {flight.flightNumber && (
            <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
              {flight.flightNumber}
            </span>
          )}
          {flight.cabinClass && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {t(`cabin.${flight.cabinClass}`)}
            </span>
          )}
        </div>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          <bdi>{flight.departureAirport ?? "—"}</bdi> {t("common.arrow")} <bdi>{flight.arrivalAirport ?? "—"}</bdi>
        </p>
        <p className="text-xs text-muted-foreground">
          {flight.departureTime ? format.dateTime(flight.departureTime) : t("flight.noDeparture")}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
