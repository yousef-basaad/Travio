import type { BookingFlight, BookingHotel, BookingTransfer } from "@travio/api";

export type TripEventKind = "flight" | "checkIn" | "checkOut" | "transfer";

export interface TripEvent {
  id: string;
  kind: TripEventKind;
  /** ISO date or date-time the event happens. */
  at: string;
  /** What happens: airports ("JED → IST"), the hotel, the transfer route. */
  detail: string | null;
  /** Secondary line: airline + flight number, city, provider. */
  extra: string | null;
}

// Hotel check-in/out are entered as dates and come back either as
// "2026-05-28" or as UTC midnight; those have no time to show, and their
// day should be read in UTC so it never shifts in another time zone.
export function isDateOnly(value: string): boolean {
  return value.length <= 10 || /T00:00(:00(\.0+)?)?(Z|\+00(:?00)?)$/.test(value);
}

function joinParts(parts: (string | null | undefined)[], separator: string): string | null {
  const kept = parts.filter((part): part is string => Boolean(part && part.trim()));
  return kept.length > 0 ? kept.join(separator) : null;
}

// The trip, day by day (TRAVIO design 04's "جدول الرحلة"): every dated
// flight departure, hotel check-in/check-out and transfer pickup of the
// booking, in time order. Services without a date are left out - they
// have no place on a schedule.
export function buildTripSchedule(
  flights: BookingFlight[],
  hotels: BookingHotel[],
  transfers: BookingTransfer[],
): TripEvent[] {
  const events: TripEvent[] = [];

  for (const flight of flights) {
    if (!flight.departureTime) continue;
    events.push({
      id: `flight-${flight.id}`,
      kind: "flight",
      at: flight.departureTime,
      detail: joinParts([flight.departureAirport, flight.arrivalAirport], " → "),
      extra: joinParts([flight.airline, flight.flightNumber], " · "),
    });
  }
  for (const hotel of hotels) {
    const place = joinParts([hotel.city, hotel.country], ", ");
    if (hotel.checkIn) {
      events.push({ id: `in-${hotel.id}`, kind: "checkIn", at: hotel.checkIn, detail: hotel.hotelName, extra: place });
    }
    if (hotel.checkOut) {
      events.push({ id: `out-${hotel.id}`, kind: "checkOut", at: hotel.checkOut, detail: hotel.hotelName, extra: place });
    }
  }
  for (const transfer of transfers) {
    if (!transfer.pickupTime) continue;
    events.push({
      id: `transfer-${transfer.id}`,
      kind: "transfer",
      at: transfer.pickupTime,
      detail: joinParts([transfer.pickupLocation, transfer.dropoffLocation], " → "),
      extra: transfer.providerName,
    });
  }

  return events.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
