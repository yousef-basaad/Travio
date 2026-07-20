-- =========================================
-- SaaS Layer
-- Travio Platform
-- =========================================


-- =========================================
-- Subscription Plans
-- =========================================

create type public.plan_interval as enum (
  'monthly',
  'yearly'
);


create table public.plans (

  id uuid primary key default gen_random_uuid(),

  name text not null,

  slug text not null unique,

  description text,

  price numeric(12,2)
    not null default 0,

  interval public.plan_interval
    not null default 'monthly',

  is_active boolean
    not null default true,


  created_at timestamptz
    not null default now(),


  updated_at timestamptz
    not null default now()

);



-- =========================================
-- Subscription Status
-- =========================================

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'cancelled',
  'expired'
);



-- =========================================
-- Tenant Subscriptions
-- =========================================

create table public.subscriptions (

  id uuid primary key default gen_random_uuid(),


  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  plan_id uuid not null
    references public.plans(id)
    on delete restrict,


  status public.subscription_status
    not null default 'trialing',


  starts_at timestamptz
    not null default now(),


  ends_at timestamptz,


  created_at timestamptz
    not null default now(),


  updated_at timestamptz
    not null default now()

);



create index subscriptions_tenant_id_idx
on public.subscriptions(tenant_id);



-- =========================================
-- Plan Features
-- =========================================

create table public.plan_features (

  id uuid primary key default gen_random_uuid(),


  plan_id uuid not null
    references public.plans(id)
    on delete cascade,


  feature_key text not null,


  feature_value text,


  created_at timestamptz
    default now()

);



create index plan_features_plan_id_idx
on public.plan_features(plan_id);



-- =========================================
-- Tenant Usage Tracking
-- =========================================

create table public.tenant_usage (

  id uuid primary key default gen_random_uuid(),


  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  metric text not null,


  value integer
    not null default 0,


  period_start date
    not null default current_date,


  period_end date,


  created_at timestamptz
    default now(),


  updated_at timestamptz
    default now()

);



create index tenant_usage_tenant_id_idx
on public.tenant_usage(tenant_id);



-- =========================================
-- RLS
-- =========================================

alter table public.plans enable row level security;

alter table public.subscriptions enable row level security;

alter table public.plan_features enable row level security;

alter table public.tenant_usage enable row level security;



-- Plans are public readable

create policy "plans_public_read"

on public.plans

for select

using (
  is_active = true
);



-- Tenant subscriptions

create policy "subscriptions_tenant_access"

on public.subscriptions

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



-- Usage tracking

create policy "tenant_usage_access"

on public.tenant_usage

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



-- Plan features follow plan visibility

create policy "plan_features_public_read"

on public.plan_features

for select

using (
  exists (
    select 1
    from public.plans
    where plans.id = plan_features.plan_id
    and plans.is_active = true
  )
);



-- =========================================
-- Updated At Triggers
-- =========================================

create trigger plans_updated_at
before update on public.plans
for each row
execute function public.update_updated_at();



create trigger subscriptions_updated_at
before update on public.subscriptions
for each row
execute function public.update_updated_at();



create trigger tenant_usage_updated_at
before update on public.tenant_usage
for each row
execute function public.update_updated_at();