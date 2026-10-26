"use client";

import { useState } from "react";
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
  Pagination,
} from "@travio/ui";
import { formatDate } from "@travio/utils";
import { useBookingsPage } from "../api/bookings.api";
import type { BookingStatus } from "../types/booking";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
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

export function BookingsTable() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  // Server-side paging, search (number/title) and status filter; each row
  // carries its customer's name, so no full customer list is loaded.
  const { page, setPage, pageSize, search, setSearch, debouncedSearch } = useListPaging(statusFilter);
  const { data, isLoading, isError, isFetching } = useBookingsPage({
    page,
    pageSize,
    search: debouncedSearch,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  });
  const bookings = data?.items ?? [];
  usePageClamp(page, setPage, pageSize, data?.total);

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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
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
        isEmpty={!isLoading && bookings.length === 0}
        loadingLabel="Loading bookings"
        errorMessage="Something went wrong loading bookings. Please try again later."
        emptyMessage={
          debouncedSearch || statusFilter !== "all" ? "No bookings match your filters" : "No bookings yet"
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
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>{booking.bookingNumber}</TableCell>
                <TableCell>{booking.title}</TableCell>
                <TableCell>
                  {booking.customerName ?? "—"}
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

      {data && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={data.total}
          onPageChange={setPage}
          disabled={isFetching}
        />
      )}
    </div>
  );
}
