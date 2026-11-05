"use client";

import { BedDouble, CalendarRange, Car, LogOut, Plane, type LucideIcon } from "lucide-react";
import { Card, EmptyState, Skeleton } from "@travio/ui";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useI18n } from "@/lib/i18n/i18n-provider";
import { intlLocale } from "@/lib/i18n/format";
import { useBookingFlights, useBookingHotels, useBookingTransfers } from "../api/bookings.api";
import { buildTripSchedule, isDateOnly, type TripEventKind } from "../utils/trip-schedule";

const KIND: Record<TripEventKind, { label: MessageKey; icon: LucideIcon; tone: string }> = {
  flight: { label: "bookings.schedule.flight", icon: Plane, tone: "bg-warning/10 text-warning" },
  checkIn: { label: "bookings.schedule.checkIn", icon: BedDouble, tone: "bg-primary/10 text-primary" },
  checkOut: { label: "bookings.schedule.checkOut", icon: LogOut, tone: "bg-primary/10 text-primary" },
  transfer: { label: "bookings.schedule.transfer", icon: Car, tone: "bg-info/10 text-info" },
};

// "جدول الرحلة" from the TRAVIO design (04): the booking's dated flights,
// hotel check-in/out and transfers in time order, each with a day badge.
export function TripSchedule({ bookingId }: { bookingId: string }) {
  const { t, locale } = useI18n();
  const flights = useBookingFlights(bookingId);
  const hotels = useBookingHotels(bookingId);
  const transfers = useBookingTransfers(bookingId);
  const isLoading = flights.isLoading || hotels.isLoading || transfers.isLoading;

  const events = buildTripSchedule(flights.data ?? [], hotels.data ?? [], transfers.data ?? []);
  const tag = intlLocale(locale);
  const day = (utc: boolean) => new Intl.DateTimeFormat(tag, { day: "numeric", timeZone: utc ? "UTC" : undefined });
  const month = (utc: boolean) => new Intl.DateTimeFormat(tag, { month: "short", timeZone: utc ? "UTC" : undefined });
  const time = new Intl.DateTimeFormat(tag, { hour: "2-digit", minute: "2-digit" });

  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-foreground">{t("bookings.schedule.title")}</h2>
      {isLoading ? (
        <div className="space-y-3" role="status" aria-label={t("bookings.schedule.title")}>
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState icon={<CalendarRange size={20} />} message={t("bookings.schedule.empty")} />
      ) : (
        <ol className="space-y-4">
          {events.map((event) => {
            const kind = KIND[event.kind];
            const date = new Date(event.at);
            const dateOnly = isDateOnly(event.at);
            return (
              <li key={event.id} className="flex items-start gap-3">
                <span className="flex w-11 shrink-0 flex-col items-center rounded-lg border border-border/60 py-1 leading-tight">
                  <span className="text-sm font-bold text-foreground">{day(dateOnly).format(date)}</span>
                  <span className="text-[10px] text-muted-foreground">{month(dateOnly).format(date)}</span>
                </span>
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${kind.tone}`}>
                  <kind.icon size={15} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{t(kind.label)}</p>
                  {event.detail ? <p className="truncate text-xs text-muted-foreground">{event.detail}</p> : null}
                  {event.extra ? <p className="truncate text-xs text-muted-foreground">{event.extra}</p> : null}
                </div>
                {!dateOnly ? (
                  <span className="shrink-0 text-xs text-muted-foreground">{time.format(date)}</span>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
