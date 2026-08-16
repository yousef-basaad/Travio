import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { formatDate } from "@travio/utils";
import type { BookingHotel, BoardType } from "@travio/api";

const BOARD_TYPE_LABELS: Record<BoardType, string> = {
  room_only: "Room Only",
  bed_breakfast: "Bed & Breakfast",
  half_board: "Half Board",
  full_board: "Full Board",
  all_inclusive: "All Inclusive",
};

// Read-only counterpart to the dashboard's own HotelItem.
export function HotelItem({ hotel }: { hotel: BookingHotel }) {
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
