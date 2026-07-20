"use client";

import { useBookings } from "@travio/api";
import { useSession } from "@travio/auth";
import { formatSar, formatDate } from "@travio/utils";
import { supabase } from "@/lib/supabase";

// Unlike customers (single-app data), bookings are read via @travio/api's
// shared service layer because customer-portal also needs to read a
// customer's own bookings - the query logic must stay identical.
export function BookingsTable() {
  const { profile } = useSession();
  const { data: bookings, isLoading } = useBookings(supabase, profile?.tenantId ?? "");

  if (isLoading) return <p>Loading bookings…</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b text-left">
          <th className="py-2">Destination</th>
          <th className="py-2">Departure</th>
          <th className="py-2">Amount</th>
          <th className="py-2">Status</th>
        </tr>
      </thead>
      <tbody>
        {bookings?.map((booking) => (
          <tr key={booking.id} className="border-b">
            <td className="py-2">{booking.destination}</td>
            <td className="py-2">{formatDate(booking.departureDate)}</td>
            <td className="py-2">{formatSar(booking.totalAmountSar)}</td>
            <td className="py-2">{booking.status}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
