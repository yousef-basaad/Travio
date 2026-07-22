-- Booking Domain foundation (v0.7.0).
--
-- public.bookings already exists (20260718165026_booking_engine.sql) with
-- its own booking_status enum, tenant-isolation RLS policy, and SELECT
-- grant - this migration extends it rather than recreating it. The enum
-- already enforces the same draft/pending/confirmed/completed/cancelled
-- set a text+CHECK column would, so status is left as-is.
alter table public.bookings
  add column title text not null,
  add column start_date date,
  add column end_date date,
  add column created_by uuid references auth.users(id),
  add constraint bookings_booking_number_key unique (booking_number);

create index bookings_status_idx on public.bookings (status);
create index bookings_created_at_idx on public.bookings (created_at desc);

-- authenticated already had SELECT (20260721191957_authenticated_read_grants.sql);
-- add write access now that the service layer can insert/update. No delete -
-- bookings are soft-deleted via deleted_at.
grant insert, update on public.bookings to authenticated;
