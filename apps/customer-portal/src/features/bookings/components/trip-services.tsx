"use client";

import type { ReactNode } from "react";
import { Plane, Bed, Car, Stamp } from "lucide-react";
import { Card, CardContent, CardHeader, Skeleton } from "@travio/ui";
import {
  useBookingFlights,
  useBookingHotels,
  useBookingTransfers,
  useBookingVisaApplications,
} from "../api/trip-services.api";
import { FlightItem } from "./services/flight-item";
import { HotelItem } from "./services/hotel-item";
import { TransferItem } from "./services/transfer-item";
import { VisaItem } from "./services/visa-item";

function ServiceSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-2">
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

function ServiceErrorState({ label }: { label: string }) {
  return (
    <div role="alert" className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger">
      Something went wrong loading {label}. Please try again later.
    </div>
  );
}

// Shared shell for the four service sections below - each is its own
// Card so isLoading/isError/empty is judged independently per service
// type rather than gating the whole booking on the slowest query. A
// section with zero rows renders nothing at all (not even an empty
// Card) - a booking with no hotel service shouldn't imply one is
// missing, same reasoning as visa status only appearing "if already
// linked and authorized."
function ServiceSection({
  icon,
  title,
  isLoading,
  isError,
  isEmpty,
  errorLabel,
  children,
}: {
  icon: ReactNode;
  title: string;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorLabel: string;
  children: ReactNode;
}) {
  if (!isLoading && !isError && isEmpty) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </h2>
      </CardHeader>
      <CardContent>
        {isLoading ? <ServiceSkeleton /> : isError ? <ServiceErrorState label={errorLabel} /> : children}
      </CardContent>
    </Card>
  );
}

// Trip Services - Flights/Hotels/Transfers/Visa status for a single
// booking, reusing the exact same booking-scoped services the
// dashboard's own Booking 360 already uses (bookingFlightsService,
// bookingHotelsService, bookingTransfersService, visaApplicationsService),
// just through this app's own customer-scoped routes/RLS.
export function TripServices({ bookingId }: { bookingId: string }) {
  const flights = useBookingFlights(bookingId);
  const hotels = useBookingHotels(bookingId);
  const transfers = useBookingTransfers(bookingId);
  const visaApplications = useBookingVisaApplications(bookingId);

  return (
    <div className="space-y-4">
      <ServiceSection
        icon={<Plane size={16} />}
        title="Flights"
        isLoading={flights.isLoading}
        isError={flights.isError}
        isEmpty={!flights.data || flights.data.length === 0}
        errorLabel="flights"
      >
        <ul className="space-y-2">
          {(flights.data ?? []).map((flight) => (
            <FlightItem key={flight.id} flight={flight} />
          ))}
        </ul>
      </ServiceSection>

      <ServiceSection
        icon={<Bed size={16} />}
        title="Hotels"
        isLoading={hotels.isLoading}
        isError={hotels.isError}
        isEmpty={!hotels.data || hotels.data.length === 0}
        errorLabel="hotels"
      >
        <ul className="space-y-2">
          {(hotels.data ?? []).map((hotel) => (
            <HotelItem key={hotel.id} hotel={hotel} />
          ))}
        </ul>
      </ServiceSection>

      <ServiceSection
        icon={<Car size={16} />}
        title="Transfers"
        isLoading={transfers.isLoading}
        isError={transfers.isError}
        isEmpty={!transfers.data || transfers.data.length === 0}
        errorLabel="transfers"
      >
        <ul className="space-y-2">
          {(transfers.data ?? []).map((transfer) => (
            <TransferItem key={transfer.id} transfer={transfer} />
          ))}
        </ul>
      </ServiceSection>

      <ServiceSection
        icon={<Stamp size={16} />}
        title="Visa Status"
        isLoading={visaApplications.isLoading}
        isError={visaApplications.isError}
        isEmpty={!visaApplications.data || visaApplications.data.length === 0}
        errorLabel="visa status"
      >
        <ul className="space-y-2">
          {(visaApplications.data ?? []).map((visa) => (
            <VisaItem key={visa.id} visa={visa} />
          ))}
        </ul>
      </ServiceSection>
    </div>
  );
}
