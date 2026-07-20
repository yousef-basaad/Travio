-- =========================================
-- Core Tables
-- Travio SaaS
-- =========================================


-- =========================================
-- Branches
-- =========================================

create table if not exists public.branches (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  name text not null,

  code text,

  phone text,

  email text,

  address text,

  is_active boolean not null default true,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  deleted_at timestamptz

);


-- Index for tenant isolation

create index if not exists branches_tenant_id_idx
on public.branches(tenant_id);



-- =========================================
-- Customers
-- =========================================

create table if not exists public.customers (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  branch_id uuid
    references public.branches(id)
    on delete set null,


  full_name text not null,

  phone text,

  email text,

  nationality text,

  passport_number text,

  date_of_birth date,


  notes text,


  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  deleted_at timestamptz

);



create index if not exists customers_tenant_id_idx
on public.customers(tenant_id);


create index if not exists customers_branch_id_idx
on public.customers(branch_id);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.branches
enable row level security;


alter table public.customers
enable row level security;



-- =========================================
-- RLS Policies
-- =========================================


create policy "branches_tenant_access"

on public.branches

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



create policy "customers_tenant_access"

on public.customers

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);