-- =========================================
-- Visa Applications Domain Reconciliation
-- Travio v1.0.0
-- =========================================
--
-- public.visa_applications already existed (20260718170056_security_
-- hardening.sql) but was still wired to the deprecated legacy
-- booking-engine line-item table (booking_service_id -> booking_services,
-- see 20260723093000_deprecate_legacy_booking_tables.sql). The current
-- booking domain (booking_flights/booking_hotels/booking_transfers) uses
-- direct relationships instead - this migration brings visa_applications
-- in line with that model: a direct customer_id (required - a visa
-- application always belongs to a customer) and an optional booking_id
-- (a visa can be tied to a specific booking, but doesn't have to be).
--
-- Table is empty (confirmed live) - no data migration/backfill needed.
--
-- RLS (visa_applications_tenant_access) and authenticated grants
-- (select/insert/update/delete, added by
-- 20260723090000_authenticated_grants_hardening.sql) already exist and
-- are correct - neither is touched here.

alter table public.visa_applications
  drop constraint visa_applications_booking_service_id_fkey,
  drop column booking_service_id,
  add column customer_id uuid not null
    references public.customers(id)
    on delete cascade,
  add column booking_id uuid
    references public.bookings(id)
    on delete set null,
  add column created_by uuid
    references auth.users(id)
    on delete set null,
  add column updated_at timestamptz default now();

create index visa_applications_customer_id_idx
on public.visa_applications(customer_id);

create index visa_applications_booking_id_idx
on public.visa_applications(booking_id);

create trigger visa_applications_updated_at
before update on public.visa_applications
for each row
execute function public.update_updated_at();
