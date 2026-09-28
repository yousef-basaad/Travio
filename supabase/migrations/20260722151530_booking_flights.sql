-- =========================================
-- Booking Flights
-- Travio Booking Domain (v0.7.0)
-- =========================================


-- =========================================
-- Flights
-- =========================================
-- One flight leg per row - a booking can have several (outbound/return/
-- connections). Every flight-info column is nullable: a flight can be
-- added to a booking before all its details are known. cabin_class is
-- plain text + a check constraint (not a Postgres enum), same reasoning
-- as crm_activities_type_check/booking_timeline_type_check.

create table public.booking_flights (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  booking_id uuid not null
    references public.bookings(id)
    on delete cascade,


  airline text,

  flight_number text,

  departure_airport text,

  arrival_airport text,

  departure_time timestamptz,

  arrival_time timestamptz,

  cabin_class text,


  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz default now(),

  updated_at timestamptz default now(),


  constraint booking_flights_cabin_class_check check (
    cabin_class in ('economy', 'business', 'first')
  )

);



-- =========================================
-- Indexes
-- =========================================

create index booking_flights_tenant_id_idx
on public.booking_flights(tenant_id);


create index booking_flights_booking_id_idx
on public.booking_flights(booking_id);


create index booking_flights_departure_time_idx
on public.booking_flights(departure_time);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.booking_flights enable row level security;



-- =========================================
-- RLS Policies
-- =========================================
-- Same tenant isolation pattern as bookings/crm_notes/booking_timeline:
-- one "for all" policy covers select/insert/update/delete, all
-- tenant-scoped.

create policy "booking_flights_tenant_access"

on public.booking_flights

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



-- =========================================
-- Updated At Trigger
-- =========================================

create trigger booking_flights_updated_at
before update on public.booking_flights
for each row
execute function public.update_updated_at();



-- =========================================
-- Grants
-- =========================================
-- Granted up front (this project's default ACL for new public-schema
-- tables never covers authenticated/anon). Full CRUD, unlike
-- booking_timeline - flights can be edited/removed, per this issue's spec.

grant select, insert, update, delete on public.booking_flights to authenticated;
