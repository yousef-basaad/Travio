-- =========================================
-- Booking Engine
-- =========================================


-- =========================================
-- Bookings
-- =========================================

create type public.booking_status as enum (
  'draft',
  'pending',
  'confirmed',
  'completed',
  'cancelled'
);


create table public.bookings (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  customer_id uuid not null
    references public.customers(id)
    on delete restrict,


  branch_id uuid
    references public.branches(id)
    on delete set null,


  booking_number text not null,


  status public.booking_status
    not null default 'draft',


  total_amount numeric(12,2)
    not null default 0,


  currency text
    default 'SAR',


  notes text,


  created_at timestamptz
    not null default now(),


  updated_at timestamptz
    not null default now(),


  deleted_at timestamptz

);



create index bookings_tenant_id_idx
on public.bookings(tenant_id);


create index bookings_customer_id_idx
on public.bookings(customer_id);



-- =========================================
-- Booking Services
-- =========================================

create type public.service_type as enum (
  'flight',
  'hotel',
  'visa'
);



create table public.booking_services (

  id uuid primary key default gen_random_uuid(),


  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  booking_id uuid not null
    references public.bookings(id)
    on delete cascade,


  type public.service_type not null,


  price numeric(12,2)
    not null default 0,


  created_at timestamptz
    not null default now(),


  updated_at timestamptz
    not null default now()

);



create index booking_services_tenant_id_idx
on public.booking_services(tenant_id);


create index booking_services_booking_id_idx
on public.booking_services(booking_id);



-- =========================================
-- Flights
-- =========================================

create table public.flights (

  id uuid primary key default gen_random_uuid(),


  booking_service_id uuid not null
    references public.booking_services(id)
    on delete cascade,


  airline text,


  flight_number text,


  departure_airport text,


  arrival_airport text,


  departure_time timestamptz,


  arrival_time timestamptz,


  created_at timestamptz
    default now()

);



-- =========================================
-- Hotels
-- =========================================

create table public.hotels (

  id uuid primary key default gen_random_uuid(),


  booking_service_id uuid not null
    references public.booking_services(id)
    on delete cascade,


  hotel_name text,


  city text,


  check_in date,


  check_out date,


  rooms integer default 1,


  created_at timestamptz
    default now()

);



-- =========================================
-- Visa Applications
-- =========================================

create type public.visa_status as enum (
  'draft',
  'submitted',
  'approved',
  'rejected'
);



create table public.visa_applications (

  id uuid primary key default gen_random_uuid(),


  booking_service_id uuid not null
    references public.booking_services(id)
    on delete cascade,


  country text,


  visa_type text,


  status public.visa_status
    default 'draft',


  submitted_at timestamptz,


  created_at timestamptz
    default now()

);



-- =========================================
-- RLS
-- =========================================

alter table public.bookings enable row level security;

alter table public.booking_services enable row level security;

alter table public.flights enable row level security;

alter table public.hotels enable row level security;

alter table public.visa_applications enable row level security;



create policy "bookings_tenant_access"
on public.bookings
for all
using (
 tenant_id = public.current_tenant_id()
)
with check (
 tenant_id = public.current_tenant_id()
);



create policy "booking_services_tenant_access"
on public.booking_services
for all
using (
 tenant_id = public.current_tenant_id()
)
with check (
 tenant_id = public.current_tenant_id()
);