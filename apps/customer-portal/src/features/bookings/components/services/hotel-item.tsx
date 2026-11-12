"use client";

import { ServiceItem, ServiceItemHeader, ServiceItemContent } from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { BookingHotel } from "@travio/api";

// Read-only counterpart to the dashboard's own HotelItem.
export function HotelItem({ hotel }: { hotel: BookingHotel }) {
  const { t, format } = useI18n();
  return (
    <ServiceItem>
      <ServiceItemHeader>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{hotel.hotelName ?? t("hotel.unknown")}</span>
          {hotel.boardType && (
            <span className="inline-flex items-center rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
              {t(`board.${hotel.boardType}`)}
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
          <bdi>{hotel.checkIn ? format.date(hotel.checkIn) : t("hotel.noCheckIn")}</bdi>
          {` ${t("common.arrow")} `}
          <bdi>{hotel.checkOut ? format.date(hotel.checkOut) : t("hotel.noCheckOut")}</bdi>
        </p>
        <p className="text-xs text-muted-foreground">
          {hotel.rooms ? t("hotel.rooms", { count: hotel.rooms }) : t("hotel.noRooms")}
          {hotel.roomType ? ` · ${hotel.roomType}` : ""}
          {hotel.confirmationNumber ? ` · ${t("hotel.confirmation", { number: hotel.confirmationNumber })}` : ""}
        </p>
      </ServiceItemContent>
    </ServiceItem>
  );
}
