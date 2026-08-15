-- Analytics Dashboard v1.4.0 - read-only audit found bookings/customers/
-- invoices/payments/booking_flights/booking_hotels/booking_transfers/
-- visa_applications already carry tenant_id + FK indexes, but none of
-- the date columns the analytics queries filter/group by are indexed.
-- Additive only - no existing columns/constraints/RLS/grants touched.

-- Revenue Overview groups invoices by month over the trailing 12 months.
create index if not exists invoices_created_at_idx on public.invoices (created_at);

-- Revenue Overview's paidTotal groups payments by the date money was
-- actually received.
create index if not exists payments_paid_at_idx on public.payments (paid_at);

-- Customer Analytics' newCustomersThisMonth/newCustomersLastMonth filter
-- by a created_at range.
create index if not exists customers_created_at_idx on public.customers (created_at);

-- Dashboard Stats' upcomingBookings filters on start_date >= today.
create index if not exists bookings_start_date_idx on public.bookings (start_date);
