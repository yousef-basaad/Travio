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
import { formatCurrency, formatDate } from "@travio/utils";
import { BookingStatusBadge } from "@/features/bookings";
import { useCustomerBookings } from "../../api/customers.api";

// Phase UI-3: replaces the previous bordered-card list with a proper
// table (Booking ID/Title/Travel dates/Status/Amount/Created date/
// Action), matching the Customer 360 spec. Same data source
// (useCustomerBookings - client-side filter over GET /api/bookings, no
// new endpoint), just a different presentation.
export function CustomerBookingsTable({ customerId }: { customerId: string }) {
  const { data: bookings, isLoading, isError } = useCustomerBookings(customerId);
  const rows = bookings ?? [];

  return (
    <DataTableState
      isLoading={isLoading}
      isError={isError}
      isEmpty={rows.length === 0}
      loadingLabel="Loading bookings"
      errorMessage="Something went wrong loading bookings. Please try again later."
      emptyMessage="No bookings yet"
    >
      <Table aria-label="Customer bookings" caption="Every booking for this customer">
        <TableHeader>
          <TableRow className="text-muted-foreground">
            <TableCell header>Booking ID</TableCell>
            <TableCell header>Title</TableCell>
            <TableCell header>Travel Dates</TableCell>
            <TableCell header>Status</TableCell>
            <TableCell header>Amount</TableCell>
            <TableCell header>Created</TableCell>
            <TableCell header align="end">
              <span className="sr-only">Actions</span>
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
                {booking.startDate ? formatDate(booking.startDate) : "—"}
                {" – "}
                {booking.endDate ? formatDate(booking.endDate) : "—"}
              </TableCell>
              <TableCell>
                <BookingStatusBadge status={booking.status} />
              </TableCell>
              <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
              <TableCell>{formatDate(booking.createdAt)}</TableCell>
              <TableCell align="end">
                <Button asChild variant="ghost" size="sm">
                  <Link href={`/bookings/${booking.id}` as Route}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataTableState>
  );
}
