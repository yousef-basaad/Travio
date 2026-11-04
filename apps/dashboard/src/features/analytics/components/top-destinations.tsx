"use client";

import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, EmptyState } from "@travio/ui";
import { useT } from "@/lib/i18n/i18n-provider";

// Deliberately not wired to any data source. A "top destinations"
// aggregate would need to summarize booking_hotels.city/country and/or
// booking_flights.arrival_airport across every booking tenant-wide -
// analyticsService (packages/api) has no such method, and adding one
// means a new API route/service method, which is out of scope for this
// task ("do not change database/API routes", "do not invent metrics
// that don't exist in API data"). This stays a real, wired-in card in
// the dashboard layout so the slot is ready the moment that aggregate
// exists, rather than fabricating city names or percentages.
export function TopDestinations() {
  const t = useT();
  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">{t("analytics.destinations.title")}</h2>
        <p className="text-xs text-muted-foreground">{t("analytics.destinations.description")}</p>
      </CardHeader>
      <CardContent className="pt-0">
        <EmptyState
          icon={<MapPin size={20} />}
          title={t("analytics.destinations.unavailable")}
          description={t("analytics.destinations.unavailableHint")}
        />
      </CardContent>
    </Card>
  );
}
