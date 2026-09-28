import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { formatDate } from "@travio/utils";
import type { BookingHotel, BoardType } from "../../types/booking";

// Single source of truth for board type labels - exported so
// create-hotel-dialog.tsx/edit-hotel-dialog.tsx reuse it for their
// <select> options instead of duplicating it.
export const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  room_only: "Room Only",
  bed_breakfast: "Bed & Breakfast",
  half_board: "Half Board",
  full_board: "Full Board",
  all_inclusive: "All Inclusive",
};

type HotelItemProps = {
  hotel: BookingHotel;
  onEdit: (hotel: BookingHotel) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function HotelItem({ hotel, onEdit, onDelete, isDeleting }: HotelItemProps) {
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{hotel.hotelName ?? "Unknown hotel"}</span>
          {hotel.boardType && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {BOARD_TYPE_LABELS[hotel.boardType]}
            </span>
          )}
        </div>
        <ServiceItemActions>
          <Button variant="ghost" size="sm" onClick={() => onEdit(hotel)} aria-label="Edit hotel">
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(hotel.id)}
            disabled={isDeleting}
            aria-label="Delete hotel"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          {hotel.city ?? "—"}
          {hotel.country ? `, ${hotel.country}` : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          {hotel.checkIn ? formatDate(hotel.checkIn) : "Check-in not set"}
          {" → "}
          {hotel.checkOut ? formatDate(hotel.checkOut) : "Check-out not set"}
        </p>
        <p className="text-xs text-muted-foreground">
          {hotel.rooms ? `${hotel.rooms} room${hotel.rooms === 1 ? "" : "s"}` : "Rooms not set"}
          {hotel.roomType ? ` · ${hotel.roomType}` : ""}
          {hotel.confirmationNumber ? ` · Confirmation #${hotel.confirmationNumber}` : ""}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
