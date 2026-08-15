-- =========================================
-- Invoices: booking_id index
-- Travio v1.1.0
-- =========================================
--
-- Additive only, per the Finance domain audit: public.invoices already
-- matches the modern domain model (direct tenant_id/customer_id/
-- booking_id FKs, correct RLS, correct authenticated grants). The only
-- gap found was a missing index on booking_id despite the FK existing -
-- this closes it. No column/RLS/grant changes.

create index if not exists invoices_booking_id_idx
on public.invoices(booking_id);
