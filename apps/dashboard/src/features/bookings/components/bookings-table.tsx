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
} from "@travio/ui";
import { AppPagination } from "@/components/app-pagination";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";
import type { MessageKey } from "@/lib/i18n/messages/en";
import { useBookingsPage } from "../api/bookings.api";
import type { BookingStatus } from "../types/booking";
import { useListPaging, usePageClamp } from "@/lib/hooks/use-list-paging";
import { BookingStatusBadge, BOOKING_STATUS_KEYS } from "./booking-status-badge";

const COLUMNS: MessageKey[] = [
  "bookings.field.number",
  "bookingField.title",
  "common.customer",
  "common.status",
  "bookings.field.startDate",
  "bookings.field.endDate",
];

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
  const t = useT();
  const format = useFormat();
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
        title={t("bookings.title")}
        actions={
          <Button asChild>
            <Link href="/bookings/new">{t("bookings.new")}</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-surface-muted/50 p-3">
        <SearchInput
          placeholder={t("bookings.searchPlaceholder")}
          aria-label={t("bookings.searchLabel")}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          containerClassName="max-w-sm flex-1"
        />

        <div className="flex items-center gap-2">
          <label htmlFor="booking-status-filter" className="text-sm text-muted-foreground">
            {t("common.status")}
          </label>
          <Select
            id="booking-status-filter"
            className="w-auto"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
          >
            <option value="all">{t("bookings.allStatuses")}</option>
            {STATUS_FILTER_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {t(BOOKING_STATUS_KEYS[status])}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <DataTableState
        isLoading={isLoading}
        isError={isError}
        isEmpty={!isLoading && bookings.length === 0}
        loadingLabel={t("bookings.loading")}
        errorMessage={t("bookings.loadError")}
        emptyMessage={
          debouncedSearch || statusFilter !== "all" ? t("bookings.emptyFiltered") : t("bookings.empty")
        }
        emptyIcon={<CalendarCheck size={20} />}
        size="page"
      >
        <Table aria-label={t("bookings.title")} caption={t("bookings.tableCaption")}>
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
                <TableCell>{booking.startDate ? format.date(booking.startDate) : "—"}</TableCell>
                <TableCell>{booking.endDate ? format.date(booking.endDate) : "—"}</TableCell>
                <TableCell align="end">
                  <Button asChild variant="ghost" size="sm">
                    <Link
                      href={`/bookings/${booking.id}`}
                      aria-label={t("bookings.viewNamed", { name: booking.bookingNumber })}
                    >
                      {t("common.view")}
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataTableState>

      {data && (
        <AppPagination
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
