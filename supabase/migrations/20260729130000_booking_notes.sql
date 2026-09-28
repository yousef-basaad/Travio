-- =========================================
-- Booking Notes
-- Travio Booking Engine
-- =========================================
--
-- Mirrors crm_notes' shape (Travio CRM, ADR-0004) but as its own
-- dedicated table scoped only to bookings - matching this codebase's
-- established per-domain pattern (booking_timeline is its own table
-- rather than a shared/composed one), not a repurposed CRM table.
-- Free-text agent notes on a booking (e.g. "Called customer to confirm
-- dietary requirements") - distinct from booking_timeline, which is a
-- read-only, system-generated log (booking_created/booking_updated/
-- status_changed) and never accepts a manual entry.

create table public.booking_notes (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  booking_id uuid not null
    references public.bookings(id)
    on delete cascade,

  created_by uuid
    references auth.users(id)
    on delete set null,

  body text not null,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);


-- =========================================
-- Indexes
-- =========================================

create index booking_notes_tenant_id_idx
on public.booking_notes(tenant_id);

create index booking_notes_booking_id_idx
on public.booking_notes(booking_id);


-- =========================================
-- Enable RLS
-- =========================================

alter table public.booking_notes enable row level security;


-- =========================================
-- RLS Policies
-- =========================================

create policy "booking_notes_tenant_access"

on public.booking_notes

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);


-- =========================================
-- Grants
-- =========================================

-- select/insert/delete only, no update - notes are added and removed,
-- never edited in place, same convention as crm_notes.
grant select, insert, delete on public.booking_notes to authenticated;


-- =========================================
-- Updated At Trigger
-- =========================================

create trigger booking_notes_updated_at
before update on public.booking_notes
for each row
execute function public.update_updated_at();
