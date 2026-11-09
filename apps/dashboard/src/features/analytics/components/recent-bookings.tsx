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
import { useBookings, BookingStatusBadge } from "@/features/bookings";
import { useCustomers } from "@/features/customers";
import { useFormat, useT } from "@/lib/i18n/i18n-provider";

const RECENT_BOOKINGS_LIMIT = 5;

// Not part of analyticsService (packages/api) - this reuses the
// bookings feature's own useBookings()/useCustomers() hooks (already
// used the same way by BookingsTable) rather than adding a new
// analytics endpoint. Real, already-fetched data, just a "recent"
// slice of it - no new metric invented.
export function RecentBookings() {
  const t = useT();
  const format = useFormat();
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
          <h2 className="text-sm font-semibold text-foreground">{t("analytics.recent.title")}</h2>
          <p className="text-xs text-muted-foreground">{t("analytics.recent.description", { count: RECENT_BOOKINGS_LIMIT })}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/bookings">{t("common.viewAll")}</Link>
        </Button>
      </CardHeader>
      <CardContent className="pt-0">
        <DataTableState
          isLoading={isLoadingBookings}
          isError={isBookingsError}
          isEmpty={recent.length === 0}
          skeletonRows={RECENT_BOOKINGS_LIMIT}
          loadingLabel={t("analytics.recent.loading")}
          errorMessage={t("bookings.loadError")}
          emptyMessage={t("analytics.recent.empty")}
          emptyIcon={<ClipboardList size={20} />}
        >
          <Table aria-label={t("analytics.recent.label")} caption={t("analytics.recent.caption")}>
            <TableHeader>
              <TableRow className="text-muted-foreground">
                <TableCell header>{t("visa.booking")}</TableCell>
                <TableCell header>{t("common.customer")}</TableCell>
                <TableCell header>{t("common.status")}</TableCell>
                <TableCell header>{t("common.created")}</TableCell>
                <TableCell header>{t("common.total")}</TableCell>
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
                  <TableCell>{format.date(booking.createdAt)}</TableCell>
                  <TableCell>{format.currency(booking.totalAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </DataTableState>
      </CardContent>
    </Card>
  );
}
