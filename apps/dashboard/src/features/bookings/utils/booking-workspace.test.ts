import { describe, it, expect } from "vitest";
import type { BookingFlight, BookingHotel, BookingTransfer } from "@travio/api";
import { buildTripSchedule, isDateOnly } from "./trip-schedule";
import { paymentState } from "./payment-state";

const base = { tenantId: "t", bookingId: "b", createdBy: null, createdAt: null, updatedAt: null };

const flight = (id: string, departureTime: string | null): BookingFlight => ({
  ...base, id, airline: "Saudia", flightNumber: "SV 123", departureAirport: "JED", arrivalAirport: "IST",
  departureTime, arrivalTime: null, cabinClass: null,
});
const hotel = (id: string, checkIn: string | null, checkOut: string | null): BookingHotel => ({
  ...base, id, hotelName: "Grand Hotel", city: "Istanbul", country: "Turkey", checkIn, checkOut,
  rooms: 1, roomType: null, boardType: null, confirmationNumber: null,
});
const transfer = (id: string, pickupTime: string | null): BookingTransfer => ({
  ...base, id, transferType: null, providerName: "City Cars", vehicleType: null, pickupLocation: "IST Airport",
  dropoffLocation: "Grand Hotel", pickupTime, passengerCount: 2, confirmationNumber: null,
});

describe("buildTripSchedule", () => {
  it("orders flights, transfers and hotel check-in/out by time", () => {
    const events = buildTripSchedule(
      [flight("f1", "2026-05-28T09:10:00Z"), flight("f2", "2026-06-05T16:45:00Z")],
      [hotel("h1", "2026-05-28", "2026-06-02")],
      [transfer("t1", "2026-05-28T14:00:00Z")],
    );
    expect(events.map((event) => event.id)).toEqual(["in-h1", "flight-f1", "transfer-t1", "out-h1", "flight-f2"]);
    expect(events[1]).toMatchObject({ kind: "flight", detail: "JED → IST", extra: "Saudia · SV 123" });
    expect(events[2]).toMatchObject({ kind: "transfer", detail: "IST Airport → Grand Hotel", extra: "City Cars" });
    expect(events[0]).toMatchObject({ kind: "checkIn", detail: "Grand Hotel", extra: "Istanbul, Turkey" });
  });

  it("leaves out services without a date", () => {
    expect(buildTripSchedule([flight("f1", null)], [hotel("h1", null, null)], [transfer("t1", null)])).toEqual([]);
  });
});

describe("isDateOnly", () => {
  it("treats plain dates and UTC midnight as dates without a time", () => {
    expect(isDateOnly("2026-05-28")).toBe(true);
    expect(isDateOnly("2026-05-28T00:00:00+00:00")).toBe(true);
    expect(isDateOnly("2026-05-28T00:00:00.000Z")).toBe(true);
    expect(isDateOnly("2026-05-28T09:10:00+00:00")).toBe(false);
    expect(isDateOnly("2026-05-28T00:00:00+03:00")).toBe(false);
  });
});

describe("paymentState", () => {
  it("reads the invoices' statuses, ignoring cancelled ones", () => {
    expect(paymentState([])).toBe("none");
    expect(paymentState([{ status: "cancelled" }])).toBe("none");
    expect(paymentState([{ status: "paid" }, { status: "cancelled" }])).toBe("paid");
    expect(paymentState([{ status: "paid" }, { status: "issued" }])).toBe("partial");
    expect(paymentState([{ status: "partially_paid" }])).toBe("partial");
    expect(paymentState([{ status: "issued" }, { status: "draft" }])).toBe("unpaid");
  });
});
