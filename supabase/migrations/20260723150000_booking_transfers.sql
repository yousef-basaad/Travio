-- =========================================
-- Booking Transfers
-- Travio Booking Domain (v0.9.0)
-- =========================================
--
-- Follows booking_flights/booking_hotels' pattern exactly: direct
-- booking_id FK, not-null tenant_id, created_by/updated_at, a text+CHECK
-- classification column.


-- =========================================
-- Transfers
-- =========================================
-- One transfer leg per row - a booking can have several (airport pickup,
-- inter-hotel transfer, etc.). Every transfer-detail column is nullable:
-- a transfer can be added before all its details are known. transfer_type
-- is plain text + a check constraint (not a Postgres enum), same
-- reasoning as booking_flights_cabin_class_check/
-- booking_hotels_board_type_check.

create table public.booking_transfers (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  booking_id uuid not null
    references public.bookings(id)
    on delete cascade,


  transfer_type text,

  provider_name text,

  vehicle_type text,

  pickup_location text,

  dropoff_location text,

  pickup_time timestamptz,

  passenger_count integer,

  confirmation_number text,


  created_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz default now(),

  updated_at timestamptz default now(),


  constraint booking_transfers_type_check check (
    transfer_type in ('airport_transfer', 'hotel_transfer', 'private_transfer', 'shared_transfer')
  )

);



-- =========================================
-- Indexes
-- =========================================

create index booking_transfers_tenant_id_idx
on public.booking_transfers(tenant_id);


create index booking_transfers_booking_id_idx
on public.booking_transfers(booking_id);


create index booking_transfers_pickup_time_idx
on public.booking_transfers(pickup_time);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.booking_transfers enable row level security;



-- =========================================
-- RLS Policies
-- =========================================
-- Same tenant isolation pattern as booking_flights/booking_hotels: one
-- "for all" policy covers select/insert/update/delete, all tenant-scoped.

create policy "booking_transfers_tenant_access"

on public.booking_transfers

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

create trigger booking_transfers_updated_at
before update on public.booking_transfers
for each row
execute function public.update_updated_at();



-- =========================================
-- Grants
-- =========================================
-- Granted up front, matching booking_flights/booking_hotels - full CRUD.

grant select, insert, update, delete on public.booking_transfers to authenticated;
