-- =========================================
-- Subscription Lifecycle Foundation
-- Travio Product-7
-- =========================================
--
-- Product-7's audit found a complete, correctly-normalized SaaS schema
-- (plans -> subscriptions -> tenants, plan_features -> plans) that
-- nothing ever actually used: create_agency() never created a
-- subscriptions row, so every tenant's "current plan" was null in
-- practice. This migration makes "every agency has a persisted
-- subscription record" true, without touching pricing, billing, or
-- payment logic anywhere.

-- ---------------------------------------------------------------
-- 1. create_agency() - extended to also create a default Starter
-- subscription for the new tenant. Selected by slug (never a hardcoded
-- plan id), status 'trialing' (an enum value that already existed -
-- see 20260718170346_saas_layer.sql), starts_at = now(), ends_at left
-- null (no trial duration is invented here - a future billing phase
-- decides that). Soft-fail by design: if the Starter plan is ever
-- missing/inactive, the insert...select simply inserts zero rows -
-- agency creation itself must never be blocked by this addition, since
-- that would make a plans-table data problem into a signup outage. A
-- `raise warning` makes that failure loud in the Postgres/Supabase logs
-- instead of silently leaving a tenant without a subscription.
-- ---------------------------------------------------------------
create or replace function public.create_agency(
  agency_name text,
  agency_cr_number text
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  new_tenant public.tenants;
  starter_plan_id uuid;
  subscription_rows_created integer;
begin

  -- Create tenant
  insert into public.tenants (
    name,
    slug,
    cr_number
  )
  values (
    agency_name,
    lower(
      regexp_replace(
        agency_name,
        '\s+',
        '-',
        'g'
      )
    ),
    agency_cr_number
  )
  returning *
  into new_tenant;

  -- Attach current user to tenant
  update public.profiles
  set
    tenant_id = new_tenant.id,
    role = 'agency_owner'
  where id = auth.uid();

  -- Default subscription: Starter plan, trialing, no invented end date.
  select id into starter_plan_id
  from public.plans
  where slug = 'starter' and is_active = true
  limit 1;

  if starter_plan_id is not null then
    insert into public.subscriptions (tenant_id, plan_id, status, starts_at)
    values (new_tenant.id, starter_plan_id, 'trialing', now());
  else
    -- Soft-fail: log loudly, never block agency creation on a missing
    -- plans row. get diagnostics isn't needed here (the branch itself
    -- already means zero rows were/would be inserted).
    raise warning 'create_agency(): no active Starter plan found (slug = starter) - tenant % created without a default subscription', new_tenant.id;
  end if;

  return new_tenant;

end;
$$;

grant execute on function public.create_agency(
  text,
  text
)
to authenticated;

-- ---------------------------------------------------------------
-- 2. One-time backfill for tenants created before this migration -
-- same Starter/trialing default, same "not exists" guard so this is
-- safe to reason about even if re-applied against a partially-seeded
-- environment. Every tenant with no subscription row gets exactly one.
-- ---------------------------------------------------------------
insert into public.subscriptions (tenant_id, plan_id, status, starts_at)
select
  t.id,
  p.id,
  'trialing',
  now()
from public.tenants t
cross join lateral (
  select id from public.plans where slug = 'starter' and is_active = true limit 1
) p
where not exists (
  select 1 from public.subscriptions s where s.tenant_id = t.id
);

-- ---------------------------------------------------------------
-- 3. New plan_features limit keys: max_documents, max_storage_mb.
-- Same INSERT-only, per-plan shape as the existing seed migration
-- (20260718171329_seed_plans.sql). These values are INITIAL,
-- CONFIGURABLE PLACEHOLDERS - not final commercial pricing/limits -
-- scaled the same rough proportion as the existing max_users/
-- max_bookings_monthly seed (Starter < Business < Enterprise
-- unlimited). They live entirely in data (plan_features), so changing
-- them later never requires touching application code.
-- ---------------------------------------------------------------
insert into public.plan_features (plan_id, feature_key, feature_value)
select id, 'max_documents', '200'
from public.plans where slug = 'starter';

insert into public.plan_features (plan_id, feature_key, feature_value)
select id, 'max_storage_mb', '1024'
from public.plans where slug = 'starter';

insert into public.plan_features (plan_id, feature_key, feature_value)
select id, 'max_documents', '2000'
from public.plans where slug = 'business';

insert into public.plan_features (plan_id, feature_key, feature_value)
select id, 'max_storage_mb', '10240'
from public.plans where slug = 'business';

insert into public.plan_features (plan_id, feature_key, feature_value)
select id, 'max_documents', 'unlimited'
from public.plans where slug = 'enterprise';

insert into public.plan_features (plan_id, feature_key, feature_value)
select id, 'max_storage_mb', 'unlimited'
from public.plans where slug = 'enterprise';
