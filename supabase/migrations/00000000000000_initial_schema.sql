-- Baseline schema: tenants + profiles + RLS enforcement pattern.
-- Every subsequent domain table (bookings, visa_applications, invoices, ...)
-- follows the same tenant_id + RLS convention established here.

create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  cr_number text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.user_role as enum (
  'travio_admin',
  'agency_owner',
  'branch_manager',
  'sales_agent',
  'visa_officer',
  'accountant',
  'customer'
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  tenant_id uuid references public.tenants (id) on delete cascade,
  email text not null,
  full_name text not null,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenants enable row level security;
alter table public.profiles enable row level security;

-- Helper: resolve the caller's tenant_id once, reused by every domain
-- table's RLS policy instead of re-querying profiles each time.
create or replace function public.current_tenant_id()
returns uuid
language sql
security definer
stable
as $$
  select tenant_id from public.profiles where id = auth.uid();
$$;

create or replace function public.current_role()
returns public.user_role
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Profiles: users can read their own profile; Travio admins read all.
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.current_role() = 'travio_admin');

-- Tenants: scoped to the caller's own tenant, or all tenants for admins.
create policy "tenants_select_own_or_admin"
  on public.tenants for select
  using (id = public.current_tenant_id() or public.current_role() = 'travio_admin');

-- Convention for every future domain table (bookings, visa_applications, ...):
--   alter table public.<table> enable row level security;
--   create policy "<table>_tenant_isolation" on public.<table>
--     for all using (tenant_id = public.current_tenant_id());
