-- =========================================
-- Deprecate Legacy Booking-Engine Tables
-- Travio Booking Domain
-- =========================================
--
-- Architecture audit found public.flights / public.hotels /
-- public.booking_services (from 20260718165026_booking_engine.sql, the
-- original booking-engine scaffold) sitting alongside the new
-- booking_flights/booking_timeline domain tables built for the current
-- Booking module. Investigation confirmed:
--
--   - Zero references anywhere in apps/dashboard, apps/admin,
--     apps/customer-portal, apps/website, or packages/api - only the
--     auto-generated packages/database/src/types/generated.ts mentions
--     them (unavoidable; it lists every public-schema table).
--   - Zero rows in all three tables.
--   - Their schema is not a simple rename target for booking_flights:
--     flights/hotels join through an intermediate booking_services
--     "line item" table (booking_service_id -> booking_services.id),
--     while booking_flights references bookings directly
--     (booking_id -> bookings.id); flights.tenant_id/hotels.tenant_id
--     are nullable (backfilled later via security_hardening.sql) where
--     booking_flights.tenant_id is not null from creation; neither
--     legacy table has the created_by/updated_at/CHECK-constrained
--     classification columns booking_flights has (cabin_class). Renaming
--     either table would not produce a working replacement without a
--     real data-modeling migration, which is out of scope for this
--     maintenance task (no new services, no schema restructuring).
--
-- This migration only adds documentation (COMMENT ON TABLE) - no schema
-- change, no data change, fully reversible. Tables are NOT dropped or
-- renamed: they keep their existing RLS policies and (per
-- 20260723090000_authenticated_grants_hardening.sql) their authenticated
-- grants, in case a future Hotels/Flights-v2 module reconciles and
-- reuses this schema deliberately.

comment on table public.flights is
  'DEPRECATED: legacy booking-engine flight line item (joins via booking_service_id -> booking_services). Unused by any app - use public.booking_flights (joins directly to bookings, adds cabin_class/created_by) for new booking domain features. Do not build new features against this table without first reconciling its schema.';

comment on table public.hotels is
  'DEPRECATED: legacy booking-engine hotel line item (joins via booking_service_id -> booking_services). Unused by any app - no public.booking_hotels equivalent exists yet. If/when a Hotels module is built, follow the booking_flights pattern (direct booking_id FK, not-null tenant_id, created_by/updated_at) rather than reusing this table as-is.';

comment on table public.booking_services is
  'DEPRECATED: legacy booking-engine line-item table that flights/hotels hang off of via booking_service_id. Unused by any app - the current booking domain (see booking_flights/booking_timeline) references public.bookings directly and has no line-item/price abstraction. Kept for reference only; do not build new features against it without a deliberate reconciliation.';
