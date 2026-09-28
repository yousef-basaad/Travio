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
import { formatDate } from "@travio/utils";
import { useBookings } from "../api/bookings.api";
import { BookingStatusBadge } from "./booking-status-badge";

const COLUMNS = ["Booking Number", "Title", "Status", "Start Date", "End Date"];

// Reuses the exact same Table/DataTableState primitives the dashboard's
// own BookingsTable uses - read-only here (no search/filter/New Booking
// action, none of which apply to a customer's own small booking list),
// backed by GET /api/bookings (bookingsService.listByCustomer, scoped by
// bookings_customer_access RLS).
export function BookingsView() {
  const { data: bookings, isLoading, isError } = useBookings();

  return (
    <div className="space-y-4">
      <PageHeader title="My Bookings" description="Every trip your agency has booked for you" />

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && (!bookings || bookings.length === 0)}
        loadingLabel="Loading your bookings"
        errorMessage="Something went wrong loading your bookings. Please try again later."
        emptyMessage="No bookings yet"
        emptyIcon={<CalendarCheck size={20} />}
        size="page"
      >
        <Table aria-label="My bookings" caption="Bookings made on your behalf">
          <TableHeader>
            <TableRow>
              {COLUMNS.map((column) => (
                <TableCell key={column} header>
                  {column}
                </TableCell>
              ))}
              <TableCell header>
                <span className="sr-only">Actions</span>
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
                  {booking.startDate ? formatDate(booking.startDate) : "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {booking.endDate ? formatDate(booking.endDate) : "—"}
                </TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/bookings/${booking.id}`} aria-label={`View ${booking.bookingNumber}`}>
                      View
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
