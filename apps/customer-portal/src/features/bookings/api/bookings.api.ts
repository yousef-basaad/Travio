"use client";

import { useQuery } from "@tanstack/react-query";
import type { Booking } from "@travio/types";

export const BOOKINGS_QUERY_KEY = ["bookings"];

async function fetchBookings(): Promise<Booking[]> {
  const response = await fetch("/api/bookings");

  if (!response.ok) {
    throw new Error(`Failed to load bookings (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings");
  }

  return data as Booking[];
}

// GET /api/bookings -> bookingsService.listByCustomer, scoped by
// bookings_customer_access RLS - never sends or accepts a customerId
// here, the server resolves it from the caller's own session.
export function useBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: fetchBookings,
  });
}

export class BookingNotFoundError extends Error {
  constructor() {
    super("Booking not found");
    this.name = "BookingNotFoundError";
  }
}

async function fetchBooking(id: string): Promise<Booking> {
  const response = await fetch(`/api/bookings/${id}`);

  if (response.status === 404) {
    throw new BookingNotFoundError();
  }

  if (!response.ok) {
    throw new Error(`Failed to load booking (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/bookings/:id");
  }

  return data as Booking;
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: [...BOOKINGS_QUERY_KEY, id],
    queryFn: () => fetchBooking(id),
    enabled: Boolean(id),
    // A 404 won't become found by retrying, matching the dashboard's
    // useBooking's same reasoning.
    retry: false,
  });
}
