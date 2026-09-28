-- =========================================
-- Booking Timeline
-- Travio Booking Domain (v0.7.0)
-- =========================================


-- =========================================
-- Timeline
-- =========================================
-- One dedicated table (not a composition, unlike crm_timeline) - booking
-- lifecycle events (booking_created/booking_updated/status_changed) are
-- recorded here directly by bookingsService, mirroring crm_activities'
-- own-table shape. type is plain text + a check constraint (not a
-- Postgres enum), same reasoning as crm_activities_type_check.

create table public.booking_timeline (

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


  type text not null,

  description text,

  metadata jsonb,


  created_at timestamptz default now(),


  constraint booking_timeline_type_check check (
    type in ('booking_created', 'booking_updated', 'status_changed')
  )

);



-- =========================================
-- Indexes
-- =========================================

create index booking_timeline_tenant_id_idx
on public.booking_timeline(tenant_id);


create index booking_timeline_booking_id_idx
on public.booking_timeline(booking_id);


create index booking_timeline_created_at_idx
on public.booking_timeline(created_at desc);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.booking_timeline enable row level security;



-- =========================================
-- RLS Policies
-- =========================================
-- Same tenant isolation pattern as crm_notes/crm_activities: one "for all"
-- policy covers select/insert/update/delete, all tenant-scoped. The
-- authenticated grant below is narrower (select/insert only) - RLS is not
-- a substitute for that grant, but there's no harm in the policy itself
-- covering commands the grant doesn't allow anyone to reach.

create policy "booking_timeline_tenant_access"

on public.booking_timeline

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
-- Granted up front (this project's default ACL for new public-schema
-- tables never covers authenticated/anon). No update/delete - timeline
-- events are append-only.

grant select, insert on public.booking_timeline to authenticated;
