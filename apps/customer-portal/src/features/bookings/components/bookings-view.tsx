"use client";

import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import {
  Button,
  DataTableState,
  PageHeader,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { useI18n } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useBookings } from "../api/bookings.api";
import { BookingStatusBadge } from "./booking-status-badge";

const COLUMNS: MessageKey[] = ["bookings.col.number", "bookings.col.title", "bookings.col.status", "bookings.col.start", "bookings.col.end"];

// Reuses the exact same Table/DataTableState primitives the dashboard's
// own BookingsTable uses - read-only here (no search/filter/New Booking
// action, none of which apply to a customer's own small booking list),
// backed by GET /api/bookings (bookingsService.listByCustomer, scoped by
// bookings_customer_access RLS).
export function BookingsView() {
  const { data: bookings, isLoading, isError } = useBookings();
  const { t, format } = useI18n();

  return (
    <div className="space-y-4">
      <PageHeader title={t("bookings.title")} description={t("bookings.description")} />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!bookings || bookings.length === 0)}
        loadingLabel={t("bookings.loading")}
        errorMessage={t("bookings.error")}
        emptyMessage={t("bookings.empty")}
        emptyIcon={<CalendarCheck size={20} />}
        size="page"
      >
        <Table aria-label={t("bookings.tableLabel")} caption={t("bookings.caption")}>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell key={column} header>
                  {t(column)}
                </TableCell>
              ))}
              <TableCell header>
                <span className="sr-only">{t("common.actions")}</span>
              </TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(bookings ?? []).map((booking) => (
              <TableRow key={booking.id}>
                <TableCell className="font-medium text-foreground">{booking.bookingNumber}</TableCell>
                <TableCell>{booking.title}</TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.startDate ? format.date(booking.startDate) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.endDate ? format.date(booking.endDate) : "—"}
                </TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/bookings/${booking.id}`} aria-label={t("common.viewNamed", { name: booking.bookingNumber })}>
                      {t("common.view")}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>
    </div>
  );
}
