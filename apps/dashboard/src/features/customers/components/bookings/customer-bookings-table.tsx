"use client";

import Link from "next/link";
import type { Route } from "next";
import {
  Button,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { BookingStatusBadge } from "@/features/bookings";
import { useCustomerBookings } from "../../api/customers.api";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

// Phase UI-3: replaces the previous bordered-card list with a proper
// table (Booking ID/Title/Travel dates/Status/Amount/Created date/
// Action), matching the Customer 360 spec. Same data source
// (useCustomerBookings - client-side filter over GET /api/bookings, no
// new endpoint), just a different presentation.
export function CustomerBookingsTable({ customerId }: { customerId: string }) {
  const { data: bookings, isLoading, isError } = useCustomerBookings(customerId);
  const rows = bookings ?? [];
  const t = useT();
  const format = useFormat();

  return (
    <DataTableState
      isLoading={isLoading}
      isError={isError}
      isEmpty={rows.length === 0}
      loadingLabel={t("customers.bookingsLoading")}
      errorMessage={t("customers.bookingsError")}
      emptyMessage={t("customers.bookingsEmpty")}
    >
      <Table aria-label={t("customers.bookingsLabel")} caption={t("customers.bookingsCaption")}>
        <TableHeader>
          <TableRow className="text-muted-foreground">
            <TableCell header>{t("bookingField.id")}</TableCell>
            <TableCell header>{t("bookingField.title")}</TableCell>
            <TableCell header>{t("bookingField.travelDates")}</TableCell>
            <TableCell header>{t("common.status")}</TableCell>
            <TableCell header>{t("bookingField.amount")}</TableCell>
            <TableCell header>{t("bookingField.created")}</TableCell>
            <TableCell header align="end">
              <span className="sr-only">{t("common.actions")}</span>
            </TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((booking) => (
            <TableRow key={booking.id}>
              <TableCell className="font-medium">
                <Link href={`/bookings/${booking.id}` as Route} className="hover:underline">
                  {booking.bookingNumber}
                </Link>
              </TableCell>
              <TableCell>{booking.title}</TableCell>
              <TableCell>
                {booking.startDate ? format.date(booking.startDate) : "—"}
                {" – "}
                {booking.endDate ? format.date(booking.endDate) : "—"}
              </TableCell>
              <TableCell>
                <BookingStatusBadge status={booking.status} />
              </TableCell>
              <TableCell>{format.currency(booking.totalAmount)}</TableCell>
              <TableCell>{format.date(booking.createdAt)}</TableCell>
              <TableCell align="end">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/bookings/${booking.id}` as Route}>{t("common.view")}</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableState>
  );
}
