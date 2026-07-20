"use client";

// Bookings view for the customer portal - reads the signed-in customer's own
// data only (enforced via RLS: customer_id = auth.uid() on each table).
export function BookingsView() {
  return <div className="text-muted-foreground">Bookings - your bookings.</div>;
}
