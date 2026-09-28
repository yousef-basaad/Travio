"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import type { BookingFlight } from "../../types/booking";
import { useBookingFlights, useDeleteFlight } from "../../api/bookings.api";
import { FlightItem } from "./flight-item";
import { CreateFlightDialog } from "./create-flight-dialog";
import { EditFlightDialog } from "./edit-flight-dialog";

function FlightsSkeleton() {
  return (
    <div role="status" aria-label="Loading flights" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function FlightsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading flights. Please try again later.
    </div>
  );
}

function FlightsEmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <EmptyState
      icon={<Plane size={20} />}
      message="No flights added yet"
      action={
        <Button size="sm" onClick={onAddClick}>
          Add Flight
        </Button>
      }
    />
  );
}

// Mirrors ActivityList's shape exactly - a Card with its own header/add
// action, rendered inside BookingTabs' Services tab.
export function FlightList({ bookingId }: { bookingId: string }) {
  const { data: flights, isLoading, isError } = useBookingFlights(bookingId);
  const deleteFlight = useDeleteFlight();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<BookingFlight | null>(null);

  const hasFlights = !isLoading && !isError && !!flights && flights.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">Flights</h2>
        {hasFlights && (
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            Add Flight
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <FlightsSkeleton />
        ) : isError ? (
          <FlightsErrorState />
        ) : !hasFlights ? (
          <FlightsEmptyState onAddClick={() => setIsCreateOpen(true)} />
        ) : (
          <ul className="space-y-2">
            {flights.map((flight) => (
              <FlightItem
                key={flight.id}
                flight={flight}
                onEdit={setEditingFlight}
                onDelete={(id) => deleteFlight.mutate({ id, bookingId })}
                isDeleting={deleteFlight.isPending && deleteFlight.variables?.id === flight.id}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CreateFlightDialog bookingId={bookingId} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditFlightDialog
        flight={editingFlight}
        bookingId={bookingId}
        open={editingFlight !== null}
        onOpenChange={(open) => {
          if (!open) setEditingFlight(null);
        }}
      />
    </Card>
  );
}
