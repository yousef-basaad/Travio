"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import {
  Button,
  PageHeader,
  DataTableState,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  SearchInput,
  Select,
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useCustomers } from "@/features/customers";
import { useBookings } from "../api/bookings.api";
import type { Booking, BookingStatus } from "../types/booking";
import { BookingStatusBadge, BOOKING_STATUS_LABELS } from "./booking-status-badge";

const COLUMNS = ["Booking Number", "Title", "Customer", "Status", "Start Date", "End Date"];

const STATUS_FILTER_OPTIONS: BookingStatus[] = [
  "draft",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

type StatusFilter = BookingStatus | "all";

// Client-side search only (booking number/title substring match over the
// already-fetched full list) - no new endpoint, same convention as
// CustomersTable/LeadsTable's own search.
function matchesSearch(booking: Booking, query: string): boolean {
  if (!query) return true;
  const haystack = `${booking.bookingNumber} ${booking.title}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function BookingsTable() {
  const { data: bookings, isLoading, isError } = useBookings();
  // Booking only carries customerId - the customer's name is resolved
  // client-side from the already-built customers list rather than
  // fabricating a name or adding a join (out of scope: no API/packages/api
  // changes this issue). Falls back to the raw id if the lookup misses
  // (still loading, or a customer RLS can't see).
  const { data: customers } = useCustomers();
  const customerNameById = new Map(customers?.map((customer) => [customer.id, customer.fullName]));
  const [query, setQuery] = useState("");
  // Product-2: client-side status filter, mirroring DocumentFilters'
  // single-dimension <Select> pattern (features/documents) - no new
  // endpoint, filters the same already-fetched list search already does.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(
    () =>
      (bookings ?? []).filter(
        (booking) =>
          matchesSearch(booking, query) &&
          (statusFilter === "all" || booking.status === statusFilter),
      ),
    [bookings, query, statusFilter],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bookings"
        actions={
          <Button asChild>
            <Link href="/bookings/new">New Booking</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-surface-muted/50 p-3">
        <SearchInput
          placeholder="Search by booking number or title"
          aria-label="Search bookings"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          containerClassName="max-w-sm flex-1"
        />

        <div className="flex items-center gap-2">
          <label htmlFor="booking-status-filter" className="text-sm text-muted-foreground">
            Status
          </label>
          <Select
            id="booking-status-filter"
            className="w-auto"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">All statuses</option>
            {STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {BOOKING_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && filtered.length === 0}
        loadingLabel="Loading bookings"
        errorMessage="Something went wrong loading bookings. Please try again later."
        emptyMessage={
          query || statusFilter !== "all" ? "No bookings match your filters" : "No bookings yet"
        }
        emptyIcon={<CalendarCheck size={20} />}
        size="page"
      >
        <Table aria-label="Bookings" caption="List of bookings">
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
            {filtered.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.bookingNumber}</TableCell>
                <TableCell>{booking.title}</TableCell>
                <TableCell>
                  {customerNameById.get(booking.customerId) ?? booking.customerId}
                </TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
                <TableCell>{booking.startDate ? formatDate(booking.startDate) : "—"}</TableCell>
                <TableCell>{booking.endDate ? formatDate(booking.endDate) : "—"}</TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/bookings/${booking.id}`}
                      aria-label={`View ${booking.bookingNumber}`}
                    >
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
