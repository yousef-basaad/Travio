"use client";

import Link from "next/link";
import type { Route } from "next";
import { ClipboardList } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  Button,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
} from "@travio/ui";
import { formatCurrency, formatDate } from "@travio/utils";
import { useBookings, BookingStatusBadge } from "@/features/bookings";
import { useCustomers } from "@/features/customers";

const RECENT_BOOKINGS_LIMIT = 5;

// Not part of analyticsService (packages/api) - this reuses the
// bookings feature's own useBookings()/useCustomers() hooks (already
// used the same way by BookingsTable) rather than adding a new
// analytics endpoint. Real, already-fetched data, just a "recent"
// slice of it - no new metric invented.
export function RecentBookings() {
  const { data: bookings, isLoading: isLoadingBookings, isError: isBookingsError } = useBookings();
  const { data: customers } = useCustomers();
  const customerNameById = new Map(customers?.map((customer) => [customer.id, customer.fullName]));

  const recent = [...(bookings ?? [])]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, RECENT_BOOKINGS_LIMIT);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Recent Bookings</h2>
          <p className="text-xs text-muted-foreground">Latest {RECENT_BOOKINGS_LIMIT} bookings created</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/bookings">View all</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoadingBookings}
          isError={isBookingsError}
          isEmpty={recent.length === 0}
          skeletonRows={RECENT_BOOKINGS_LIMIT}
          loadingLabel="Loading recent bookings"
          errorMessage="Something went wrong loading recent bookings. Please try again later."
          emptyMessage="No bookings yet"
          emptyIcon={<ClipboardList size={20} />}
        >
          <Table aria-label="Recent bookings" caption="The 5 most recently created bookings">
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>Booking</TableCell>
                <TableCell header>Customer</TableCell>
                <TableCell header>Status</TableCell>
                <TableCell header>Created</TableCell>
                <TableCell header>Total</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/bookings/${booking.id}` as Route}
                      className="hover:underline"
                    >
                      {booking.bookingNumber}
                    </Link>
                  </TableCell>
                  <TableCell>{customerNameById.get(booking.customerId) ?? "—"}</TableCell>
                  <TableCell>
                    <BookingStatusBadge status={booking.status} />
                  </TableCell>
                  <TableCell>{formatDate(booking.createdAt)}</TableCell>
                  <TableCell>{formatCurrency(booking.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
      </CardContent>
    </Card>
  );
}
