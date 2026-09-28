-- =========================================
-- Booking Hotels
-- Travio Booking Domain (v0.8.0)
-- =========================================
--
-- Deliberately a brand-new table, not the deprecated public.hotels (see
-- 20260723093000_deprecate_legacy_booking_tables.sql) - that table joins
-- through an intermediate booking_services line-item table and has a
-- nullable tenant_id. This follows booking_flights' pattern exactly:
-- direct booking_id FK, not-null tenant_id, created_by/updated_at, a
-- text+CHECK classification column.


-- =========================================
-- Hotels
-- =========================================
-- One hotel stay per row - a booking can have several (multi-city
-- itineraries). Every stay-detail column is nullable: a hotel can be
-- added to a booking before all its details are known. board_type is
-- plain text + a check constraint (not a Postgres enum), same reasoning
-- as booking_flights_cabin_class_check.

create table public.booking_hotels (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  booking_id uuid not null
    references public.bookings(id)
    on delete cascade,


  hotel_name text,

  city text,

  country text,

  check_in timestamptz,

  check_out timestamptz,

  rooms integer,

  room_type text,

  board_type text,

  confirmation_number text,


  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz default now(),

  updated_at timestamptz default now(),


  constraint booking_hotels_rooms_check check (
    rooms is null or rooms >= 1
  ),

  constraint booking_hotels_board_type_check check (
    board_type in ('room_only', 'bed_breakfast', 'half_board', 'full_board', 'all_inclusive')
  )

);



-- =========================================
-- Indexes
-- =========================================

create index booking_hotels_tenant_id_idx
on public.booking_hotels(tenant_id);


create index booking_hotels_booking_id_idx
on public.booking_hotels(booking_id);


create index booking_hotels_check_in_idx
on public.booking_hotels(check_in);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.booking_hotels enable row level security;



-- =========================================
-- RLS Policies
-- =========================================
-- Same tenant isolation pattern as booking_flights: one "for all" policy
-- covers select/insert/update/delete, all tenant-scoped.

create policy "booking_hotels_tenant_access"

on public.booking_hotels

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

create trigger booking_hotels_updated_at
before update on public.booking_hotels
for each row
execute function public.update_updated_at();



-- =========================================
-- Grants
-- =========================================
-- Granted up front, matching booking_flights - full CRUD, no delete
-- restriction (hotels can be removed from a booking).

grant select, insert, update, delete on public.booking_hotels to authenticated;
