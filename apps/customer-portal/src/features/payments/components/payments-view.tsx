"use client";

// Payments view for the customer portal - reads the signed-in customer's own
// data only (enforced via RLS: customer_id = auth.uid() on each table).
export function PaymentsView() {
  return <div className="text-muted-foreground">Payments - your payments.</div>;
}
