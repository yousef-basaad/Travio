"use client";

import { useQuery } from "@tanstack/react-query";
import type { BookingFlight, BookingHotel, BookingTransfer, VisaApplication } from "@travio/api";

// One tiny generic fetch helper, one hook per service type - mirrors
// useBooking's own shape (query key includes the booking id, enabled
// only once an id exists). Each of these four GET routes reuses the
// exact same service method the dashboard's own Booking 360 tabs call
// (bookingFlightsService.listByBooking, etc.), just scoped by this
// customer's own *_customer_access RLS policies (Product-6 migration)
// instead of a tenant policy.
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url} (${response.status})`);
  }
  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`Unexpected response from ${url}`);
  }
  return data as T;
}

export function useBookingFlights(bookingId: string) {
  return useQuery({
    queryKey: ["bookings", bookingId, "flights"],
    queryFn: () => fetchJson<BookingFlight[]>(`/api/bookings/${bookingId}/flights`),
    enabled: Boolean(bookingId),
  });
}

export function useBookingHotels(bookingId: string) {
  return useQuery({
    queryKey: ["bookings", bookingId, "hotels"],
    queryFn: () => fetchJson<BookingHotel[]>(`/api/bookings/${bookingId}/hotels`),
    enabled: Boolean(bookingId),
  });
}

export function useBookingTransfers(bookingId: string) {
  return useQuery({
    queryKey: ["bookings", bookingId, "transfers"],
    queryFn: () => fetchJson<BookingTransfer[]>(`/api/bookings/${bookingId}/transfers`),
    enabled: Boolean(bookingId),
  });
}

export function useBookingVisaApplications(bookingId: string) {
  return useQuery({
    queryKey: ["bookings", bookingId, "visa"],
    queryFn: () => fetchJson<VisaApplication[]>(`/api/bookings/${bookingId}/visa`),
    enabled: Boolean(bookingId),
  });
}
