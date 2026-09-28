-- =========================================
-- Security Phase: SaaS write lockdown + security definer search_path
-- =========================================
--
-- Fixes three findings from the project audit (confirmed live):
--
-- 1. subscriptions / tenant_usage had a `for all` tenant policy plus
--    INSERT/UPDATE/DELETE granted to `authenticated`, so any member of
--    an agency (even a sales_agent) could rewrite their own agency's
--    plan/status straight through PostgREST. No application code writes
--    either table (packages/api only SELECTs); the only writers are
--    create_agency() (security definer) and migration backfills, both of
--    which run as the table owner and are unaffected by these grants.
--
-- 2. create_agency() could be called by any authenticated user, any
--    number of times - re-parenting an existing staff member/owner into
--    a brand-new tenant as agency_owner - and failed outright when two
--    agencies shared a name (tenants.slug is unique).
--
-- 3. Every security definer function ran with the caller's
--    search_path. Their bodies already fully qualify every object, so
--    pinning search_path = '' changes no behavior - it only removes the
--    ability to shadow objects via search_path.
--
-- Nothing else is changed: no table shape, no other policy, no data.


-- ---------------------------------------------------------------
-- 1. subscriptions / tenant_usage: SELECT-only for tenant members
-- ---------------------------------------------------------------

drop policy "subscriptions_tenant_access" on public.subscriptions;

create policy "subscriptions_tenant_select"
on public.subscriptions
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
);

drop policy "tenant_usage_access" on public.tenant_usage;

create policy "tenant_usage_tenant_select"
on public.tenant_usage
for select
to authenticated
using (
  tenant_id = public.current_tenant_id()
);

-- TRUNCATE is included because it bypasses RLS entirely, and Supabase's
-- default privileges grant it to anon/authenticated on new public tables.
revoke insert, update, delete, truncate on public.subscriptions from anon, authenticated;
revoke insert, update, delete, truncate on public.tenant_usage from anon, authenticated;


-- ---------------------------------------------------------------
-- 2. create_agency(): one agency per caller, collision-safe slug
-- ---------------------------------------------------------------
--
-- Same signature, return type, and grants as before (create or replace
-- keeps the existing EXECUTE grant). Behavior changes only for callers
-- that previously produced a bad result:
--   - no session (auth.uid() is null)       -> error (previously created
--                                              an orphan tenant)
--   - caller already has a tenant_id        -> error (previously silently
--                                              moved them to a new tenant)
--   - customer-portal identity (role        -> error (previously promoted
--     'customer' or customer_id set)           to agency_owner)
--   - slug already taken by another tenant  -> "<slug>-2", "-3", ...
--                                              (previously a unique_violation)
-- EXECUTE is also revoked from PUBLIC/anon (authenticated only).
-- The happy path (a fresh agency signup) is unchanged, including the
-- default Starter/trialing subscription from Product-7.
create or replace function public.create_agency(
  agency_name text,
  agency_cr_number text
)
returns public.tenants
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  caller_profile_found boolean := false;
  caller_tenant_id uuid;
  caller_role public.user_role;
  caller_customer_id uuid;
  base_slug text;
  candidate_slug text;
  attempt integer := 1;
  violated_constraint text;
  new_tenant public.tenants;
  starter_plan_id uuid;
begin

  if caller_id is null then
    raise exception 'create_agency: caller is not authenticated'
      using errcode = '42501';
  end if;

  -- FOR UPDATE serializes concurrent create_agency() calls by the same
  -- user, so two parallel requests can't both pass the check below.
  select true, p.tenant_id, p.role, p.customer_id
  into caller_profile_found, caller_tenant_id, caller_role, caller_customer_id
  from public.profiles p
  where p.id = caller_id
  for update;

  if not coalesce(caller_profile_found, false) then
    raise exception 'create_agency: no profile exists for the calling user'
      using errcode = 'P0002';
  end if;

  if caller_tenant_id is not null then
    raise exception 'create_agency: caller already belongs to an agency'
      using errcode = '42501';
  end if;

  -- Customer-portal identities (role 'customer', or linked to a
  -- customers row) must never turn themselves into an agency owner. A
  -- fresh agency signup never hits this: handle_new_user() gives an
  -- account_type = 'agency' user role 'agency_owner', customer_id null.
  if caller_role = 'customer' or caller_customer_id is not null then
    raise exception 'create_agency: customer accounts cannot create an agency'
      using errcode = '42501';
  end if;

  -- Same slug derivation as before; only collisions are new.
  base_slug := lower(regexp_replace(agency_name, '\s+', '-', 'g'));

  loop
    candidate_slug := case
      when attempt = 1 then base_slug
      else base_slug || '-' || attempt
    end;

    begin
      insert into public.tenants (name, slug, cr_number)
      values (agency_name, candidate_slug, agency_cr_number)
      returning * into new_tenant;
      exit;
    exception when unique_violation then
      get stacked diagnostics violated_constraint = constraint_name;
      if violated_constraint is distinct from 'tenants_slug_key' or attempt >= 100 then
        raise;
      end if;
      attempt := attempt + 1;
    end;
  end loop;

  update public.profiles
  set
    tenant_id = new_tenant.id,
    role = 'agency_owner'
  where id = caller_id;

  -- Default subscription: unchanged from 20260803000000.
  select id into starter_plan_id
  from public.plans
  where slug = 'starter' and is_active = true
  limit 1;

  if starter_plan_id is not null then
    insert into public.subscriptions (tenant_id, plan_id, status, starts_at)
    values (new_tenant.id, starter_plan_id, 'trialing', now());
  else
    raise warning 'create_agency(): no active Starter plan found (slug = starter) - tenant % created without a default subscription', new_tenant.id;
  end if;

  return new_tenant;

end;
$$;

-- Functions are executable by PUBLIC by default (which includes anon).
-- Only signed-in users may call create_agency().
revoke execute on function public.create_agency(text, text) from public, anon;
grant execute on function public.create_agency(text, text) to authenticated;


-- ---------------------------------------------------------------
-- 3. Pin search_path on the remaining security definer functions
-- ---------------------------------------------------------------
--
-- Bodies are untouched: each already references only fully qualified
-- objects (public.profiles, public.user_role, auth.uid()) or pg_catalog
-- built-ins, which stay resolvable with an empty search_path.
alter function public.current_tenant_id() set search_path = '';
alter function public."current_role"() set search_path = '';
alter function public.current_user_role() set search_path = '';
alter function public.current_customer_id() set search_path = '';
alter function public.handle_new_user() set search_path = '';
