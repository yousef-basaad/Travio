"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Booking,
  BookingTimelineEvent,
  BookingFlight,
  CabinClass,
  BookingHotel,
  BoardType,
  BookingTransfer,
  TransferType,
  BookingNote,
} from "../types/booking";
import type { CreateBookingFormValues } from "../schemas/create-booking.schema";
import type { UpdateBookingFormValues } from "../schemas/update-booking.schema";

// BOOKINGS_QUERY_KEY follows CUSTOMERS_QUERY_KEY's convention - a stable
// top-level key other features/mutations can invalidate by prefix later.
export const BOOKINGS_QUERY_KEY = ["bookings"];

// Unlike the previous version of this feature, this never touches Supabase
// (or @travio/api's bookingsService) directly - it goes through the REST
// endpoint, matching customers.api.ts's pattern. The route resolves the
// caller's tenant server-side, so no tenantId is needed here.
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

export function useBookings() {
  return useQuery({
    queryKey: BOOKINGS_QUERY_KEY,
    queryFn: fetchBookings,
  });
}

// Distinguished from a generic fetch failure so the details page can show
// "Booking not found" instead of a generic error message - matches
// CustomerNotFoundError/LeadNotFoundError's pattern.
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
    // A 404 won't become found by retrying, matching useCustomer's reasoning.
    retry: false,
  });
}

// customerId/title are the only required fields the form collects -
// tenantId/createdBy are resolved server-side and never sent here, same
// as createCustomerSchema's split.
async function createBooking(input: CreateBookingFormValues): Promise<Booking> {
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to create booking (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/bookings");
  }

  return data as Booking;
}

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBooking,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY });
    },
  });
}

async function updateBooking({
  id,
  input,
}: {
  id: string;
  input: UpdateBookingFormValues;
}): Promise<Booking> {
  const response = await fetch(`/api/bookings/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`Failed to update booking (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/bookings/:id");
  }

  return data as Booking;
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBooking,
    onSuccess: (updatedBooking) => {
      // Seed the detail query directly with the authoritative server
      // response so the details page shows updated values immediately,
      // without waiting on a refetch. The list query is invalidated
      // (exact match only - the detail query above is already fresh),
      // matching useUpdateLead's reasoning.
      queryClient.setQueryData([...BOOKINGS_QUERY_KEY, updatedBooking.id], updatedBooking);
      void queryClient.invalidateQueries({ queryKey: BOOKINGS_QUERY_KEY, exact: true });
    },
  });
}

function bookingTimelineQueryKey(bookingId: string) {
  return [...BOOKINGS_QUERY_KEY, bookingId, "timeline"];
}

// Read-only - bookingTimelineService returns events pre-sorted (newest
// first) server-side, matching useLeadTimeline/useCustomerTimeline's
// reasoning exactly.
async function fetchBookingTimeline(bookingId: string): Promise<BookingTimelineEvent[]> {
  const response = await fetch(`/api/bookings/${bookingId}/timeline`);

  if (!response.ok) {
    throw new Error(`Failed to load timeline (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/timeline");
  }

  return data as BookingTimelineEvent[];
}

export function useBookingTimeline(bookingId: string) {
  return useQuery({
    queryKey: bookingTimelineQueryKey(bookingId),
    queryFn: () => fetchBookingTimeline(bookingId),
    enabled: Boolean(bookingId),
  });
}

function bookingFlightsQueryKey(bookingId: string) {
  return [...BOOKINGS_QUERY_KEY, bookingId, "flights"];
}

async function fetchBookingFlights(bookingId: string): Promise<BookingFlight[]> {
  const response = await fetch(`/api/bookings/${bookingId}/flights`);

  if (!response.ok) {
    throw new Error(`Failed to load flights (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/flights");
  }

  return data as BookingFlight[];
}

export function useBookingFlights(bookingId: string) {
  return useQuery({
    queryKey: bookingFlightsQueryKey(bookingId),
    queryFn: () => fetchBookingFlights(bookingId),
    enabled: Boolean(bookingId),
  });
}

async function createFlight({
  bookingId,
  airline,
  flightNumber,
  departureAirport,
  arrivalAirport,
  departureTime,
  arrivalTime,
  cabinClass,
}: {
  bookingId: string;
  airline?: string;
  flightNumber?: string;
  departureAirport?: string;
  arrivalAirport?: string;
  departureTime?: string;
  arrivalTime?: string;
  cabinClass?: CabinClass;
}): Promise<BookingFlight> {
  const response = await fetch(`/api/bookings/${bookingId}/flights`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      airline,
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      cabinClass,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create flight (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/bookings/:id/flights");
  }

  return data as BookingFlight;
}

export function useCreateFlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFlight,
    onSuccess: (_flight, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingFlightsQueryKey(variables.bookingId),
      });
    },
  });
}

async function updateFlight({
  id,
  airline,
  flightNumber,
  departureAirport,
  arrivalAirport,
  departureTime,
  arrivalTime,
  cabinClass,
}: {
  id: string;
  bookingId: string;
  airline?: string | null;
  flightNumber?: string | null;
  departureAirport?: string | null;
  arrivalAirport?: string | null;
  departureTime?: string | null;
  arrivalTime?: string | null;
  cabinClass?: CabinClass | null;
}): Promise<BookingFlight> {
  const response = await fetch(`/api/flights/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      airline,
      flightNumber,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      cabinClass,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update flight (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/flights/:id");
  }

  return data as BookingFlight;
}

export function useUpdateFlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateFlight,
    onSuccess: (_flight, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingFlightsQueryKey(variables.bookingId),
      });
    },
  });
}

async function deleteFlight({ id }: { id: string; bookingId: string }): Promise<void> {
  const response = await fetch(`/api/flights/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete flight (${response.status})`);
  }
}

export function useDeleteFlight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFlight,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingFlightsQueryKey(variables.bookingId),
      });
    },
  });
}

function bookingHotelsQueryKey(bookingId: string) {
  return [...BOOKINGS_QUERY_KEY, bookingId, "hotels"];
}

async function fetchBookingHotels(bookingId: string): Promise<BookingHotel[]> {
  const response = await fetch(`/api/bookings/${bookingId}/hotels`);

  if (!response.ok) {
    throw new Error(`Failed to load hotels (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/hotels");
  }

  return data as BookingHotel[];
}

export function useBookingHotels(bookingId: string) {
  return useQuery({
    queryKey: bookingHotelsQueryKey(bookingId),
    queryFn: () => fetchBookingHotels(bookingId),
    enabled: Boolean(bookingId),
  });
}

async function createHotel({
  bookingId,
  hotelName,
  city,
  country,
  checkIn,
  checkOut,
  rooms,
  roomType,
  boardType,
  confirmationNumber,
}: {
  bookingId: string;
  hotelName?: string;
  city?: string;
  country?: string;
  checkIn?: string;
  checkOut?: string;
  rooms?: number;
  roomType?: string;
  boardType?: BoardType;
  confirmationNumber?: string;
}): Promise<BookingHotel> {
  const response = await fetch(`/api/bookings/${bookingId}/hotels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hotelName,
      city,
      country,
      checkIn,
      checkOut,
      rooms,
      roomType,
      boardType,
      confirmationNumber,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create hotel (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/bookings/:id/hotels");
  }

  return data as BookingHotel;
}

export function useCreateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createHotel,
    onSuccess: (_hotel, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingHotelsQueryKey(variables.bookingId),
      });
    },
  });
}

async function updateHotel({
  id,
  hotelName,
  city,
  country,
  checkIn,
  checkOut,
  rooms,
  roomType,
  boardType,
  confirmationNumber,
}: {
  id: string;
  bookingId: string;
  hotelName?: string | null;
  city?: string | null;
  country?: string | null;
  checkIn?: string | null;
  checkOut?: string | null;
  rooms?: number | null;
  roomType?: string | null;
  boardType?: BoardType | null;
  confirmationNumber?: string | null;
}): Promise<BookingHotel> {
  const response = await fetch(`/api/hotels/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      hotelName,
      city,
      country,
      checkIn,
      checkOut,
      rooms,
      roomType,
      boardType,
      confirmationNumber,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update hotel (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/hotels/:id");
  }

  return data as BookingHotel;
}

export function useUpdateHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateHotel,
    onSuccess: (_hotel, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingHotelsQueryKey(variables.bookingId),
      });
    },
  });
}

async function deleteHotel({ id }: { id: string; bookingId: string }): Promise<void> {
  const response = await fetch(`/api/hotels/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete hotel (${response.status})`);
  }
}

export function useDeleteHotel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHotel,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingHotelsQueryKey(variables.bookingId),
      });
    },
  });
}

function bookingTransfersQueryKey(bookingId: string) {
  return [...BOOKINGS_QUERY_KEY, bookingId, "transfers"];
}

async function fetchBookingTransfers(bookingId: string): Promise<BookingTransfer[]> {
  const response = await fetch(`/api/bookings/${bookingId}/transfers`);

  if (!response.ok) {
    throw new Error(`Failed to load transfers (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/transfers");
  }

  return data as BookingTransfer[];
}

export function useBookingTransfers(bookingId: string) {
  return useQuery({
    queryKey: bookingTransfersQueryKey(bookingId),
    queryFn: () => fetchBookingTransfers(bookingId),
    enabled: Boolean(bookingId),
  });
}

async function createTransfer({
  bookingId,
  transferType,
  providerName,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupTime,
  passengerCount,
  confirmationNumber,
}: {
  bookingId: string;
  transferType?: TransferType;
  providerName?: string;
  vehicleType?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  pickupTime?: string;
  passengerCount?: number;
  confirmationNumber?: string;
}): Promise<BookingTransfer> {
  const response = await fetch(`/api/bookings/${bookingId}/transfers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transferType,
      providerName,
      vehicleType,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      passengerCount,
      confirmationNumber,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create transfer (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/bookings/:id/transfers");
  }

  return data as BookingTransfer;
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTransfer,
    onSuccess: (_transfer, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingTransfersQueryKey(variables.bookingId),
      });
    },
  });
}

async function updateTransfer({
  id,
  transferType,
  providerName,
  vehicleType,
  pickupLocation,
  dropoffLocation,
  pickupTime,
  passengerCount,
  confirmationNumber,
}: {
  id: string;
  bookingId: string;
  transferType?: TransferType | null;
  providerName?: string | null;
  vehicleType?: string | null;
  pickupLocation?: string | null;
  dropoffLocation?: string | null;
  pickupTime?: string | null;
  passengerCount?: number | null;
  confirmationNumber?: string | null;
}): Promise<BookingTransfer> {
  const response = await fetch(`/api/transfers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transferType,
      providerName,
      vehicleType,
      pickupLocation,
      dropoffLocation,
      pickupTime,
      passengerCount,
      confirmationNumber,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update transfer (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/transfers/:id");
  }

  return data as BookingTransfer;
}

export function useUpdateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTransfer,
    onSuccess: (_transfer, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingTransfersQueryKey(variables.bookingId),
      });
    },
  });
}

async function deleteTransfer({ id }: { id: string; bookingId: string }): Promise<void> {
  const response = await fetch(`/api/transfers/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete transfer (${response.status})`);
  }
}

export function useDeleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteTransfer,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: bookingTransfersQueryKey(variables.bookingId),
      });
    },
  });
}

// Mirrors leads.api.ts's useLeadNotes/useCreateLeadNote/useDeleteLeadNote
// exactly, retargeted at bookings - manual agent notes, distinct from
// useBookingTimeline's read-only system log above.
function bookingNotesQueryKey(bookingId: string) {
  return [...BOOKINGS_QUERY_KEY, bookingId, "notes"];
}

async function fetchBookingNotes(bookingId: string): Promise<BookingNote[]> {
  const response = await fetch(`/api/bookings/${bookingId}/notes`);

  if (!response.ok) {
    throw new Error(`Failed to load notes (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error("Unexpected response from /api/bookings/:id/notes");
  }

  return data as BookingNote[];
}

export function useBookingNotes(bookingId: string) {
  return useQuery({
    queryKey: bookingNotesQueryKey(bookingId),
    queryFn: () => fetchBookingNotes(bookingId),
    enabled: Boolean(bookingId),
  });
}

async function createBookingNote({
  bookingId,
  body,
}: {
  bookingId: string;
  body: string;
}): Promise<BookingNote> {
  const response = await fetch(`/api/bookings/${bookingId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ body }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create note (${response.status})`);
  }

  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null) {
    throw new Error("Unexpected response from /api/bookings/:id/notes");
  }

  return data as BookingNote;
}

export function useCreateBookingNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBookingNote,
    onSuccess: (_note, variables) => {
      void queryClient.invalidateQueries({ queryKey: bookingNotesQueryKey(variables.bookingId) });
    },
  });
}

async function deleteBookingNote({ id }: { id: string; bookingId: string }): Promise<void> {
  const response = await fetch(`/api/booking-notes/${id}`, { method: "DELETE" });

  if (!response.ok) {
    throw new Error(`Failed to delete note (${response.status})`);
  }
}

export function useDeleteBookingNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBookingNote,
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: bookingNotesQueryKey(variables.bookingId) });
    },
  });
}
