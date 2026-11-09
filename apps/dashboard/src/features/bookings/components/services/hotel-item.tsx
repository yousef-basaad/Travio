"use client";

import { Button, ServiceItem, ServiceItemHeader, ServiceItemActions, ServiceItemContent } from "@travio/ui";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { RouteText } from "./route-text";
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

export const BOARD_TYPE_KEYS: Record<BoardType, MessageKey> = {
  room_only: "board.room_only",
  bed_breakfast: "board.bed_breakfast",
  half_board: "board.half_board",
  full_board: "board.full_board",
  all_inclusive: "board.all_inclusive",
};

type HotelItemProps = {
  hotel: BookingHotel;
  onEdit: (hotel: BookingHotel) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
};

export function HotelItem({ hotel, onEdit, onDelete, isDeleting }: HotelItemProps) {
  const t = useT();
  const format = useFormat();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{hotel.hotelName ?? t("services.hotel.unknown")}</span>
          {hotel.boardType && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {t(BOARD_TYPE_KEYS[hotel.boardType])}
            </span>
          )}
        </div>
        <ServiceItemActions>
          <Button variant="ghost" size="sm" onClick={() => onEdit(hotel)} aria-label={t("services.hotel.editLabel")}>
            {t("common.edit")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(hotel.id)}
            disabled={isDeleting}
            aria-label={t("services.hotel.deleteLabel")}
          >
            {isDeleting ? t("common.deleting") : t("common.delete")}
          </Button>
        </ServiceItemActions>
      </ServiceItemHeader>
      <ServiceItemContent>
        <p className="text-sm text-muted-foreground">
          {hotel.city ?? "—"}
          {hotel.country ? `${t("common.listSeparator")}${hotel.country}` : ""}
        </p>
        <p className="text-sm text-muted-foreground">
          <RouteText
            from={hotel.checkIn ? format.date(hotel.checkIn) : t("services.hotel.noCheckIn")}
            to={hotel.checkOut ? format.date(hotel.checkOut) : t("services.hotel.noCheckOut")}
          />
        </p>
        <p className="text-xs text-muted-foreground">
          {hotel.rooms
            ? hotel.rooms === 1
              ? t("services.hotel.oneRoom")
              : t("services.hotel.rooms", { count: hotel.rooms })
            : t("services.hotel.noRooms")}
          {hotel.roomType ? ` · ${hotel.roomType}` : ""}
          {hotel.confirmationNumber
            ? ` · ${t("services.confirmation", { number: hotel.confirmationNumber })}`
            : ""}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
