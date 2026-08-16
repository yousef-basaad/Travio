import { MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, EmptyState } from "@travio/ui";

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
  return (
    <Card>
      <CardHeader className="pb-3">
        <h2 className="text-sm font-semibold text-foreground">Top Destinations</h2>
        <p className="text-xs text-muted-foreground">Most booked cities and countries</p>
      </CardHeader>
      <CardContent className="pt-0">
        <EmptyState
          icon={<MapPin size={20} />}
          title="Not available yet"
          description="Destination analytics requires a new aggregate across hotel and flight bookings that the current analytics API doesn't expose yet."
        />
      </CardContent>
    </Card>
  );
}
