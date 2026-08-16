"use client";

import { useState } from "react";
import { Bed } from "lucide-react";
import { Button, Card, CardContent, CardHeader, EmptyState, Skeleton } from "@travio/ui";
import type { BookingHotel } from "../../types/booking";
import { useBookingHotels, useDeleteHotel } from "../../api/bookings.api";
import { HotelItem } from "./hotel-item";
import { CreateHotelDialog } from "./create-hotel-dialog";
import { EditHotelDialog } from "./edit-hotel-dialog";

function HotelsSkeleton() {
  return (
    <div role="status" aria-label="Loading hotels" className="space-y-2">
      {Array.from({ length: 2 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

function HotelsErrorState() {
  return (
    <div
      role="alert"
      className="rounded-md border border-danger/50 bg-danger/10 p-4 text-sm text-danger"
    >
      Something went wrong loading hotels. Please try again later.
    </div>
  );
}

// Mirrors FlightList's shape - a Card with its own header/add action,
// rendered inside BookingTabs' Services tab alongside FlightList. Uses
// the shared EmptyState (packages/ui) rather than a local
// empty-state-with-button component like FlightsEmptyState - it has no
// action-button slot, so the header's "Add Hotel" button is always
// visible instead of only appearing once hotels exist.
export function HotelList({ bookingId }: { bookingId: string }) {
  const { data: hotels, isLoading, isError } = useBookingHotels(bookingId);
  const deleteHotel = useDeleteHotel();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHotel, setEditingHotel] = useState<BookingHotel | null>(null);

  const hasHotels = !isLoading && !isError && !!hotels && hotels.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <h2 className="text-sm font-medium">Hotels</h2>
        <Button size="sm" onClick={() => setIsCreateOpen(true)}>
          Add Hotel
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <HotelsSkeleton />
        ) : isError ? (
          <HotelsErrorState />
        ) : !hasHotels ? (
          <EmptyState icon={<Bed size={20} />} message="No hotels added yet" />
        ) : (
          <ul className="space-y-2">
            {hotels.map((hotel) => (
              <HotelItem
                key={hotel.id}
                hotel={hotel}
                onEdit={setEditingHotel}
                onDelete={(id) => deleteHotel.mutate({ id, bookingId })}
                isDeleting={deleteHotel.isPending && deleteHotel.variables?.id === hotel.id}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <CreateHotelDialog bookingId={bookingId} open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      <EditHotelDialog
        hotel={editingHotel}
        bookingId={bookingId}
        open={editingHotel !== null}
        onOpenChange={(open) => {
          if (!open) setEditingHotel(null);
        }}
      />
    </Card>
  );
}
