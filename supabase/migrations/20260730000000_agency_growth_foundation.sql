-- =========================================
-- Agency Growth Foundation
-- Travio Product-4: Team Management + Agency Settings
-- =========================================
--
-- Three additive changes, no new tables (per this phase's own "prefer
-- existing tables over new tables" rule):
--   1. tenants gets contact fields (phone/email/address) - mirrors
--      branches' own contact-field shape exactly, since "Agency profile"
--      needs contact info tenants never carried.
--   2. profiles gets a second, additive SELECT policy so agency staff
--      can see their own tenant's team roster - today profiles only
--      allows reading your own row (profiles_select_own_or_admin,
--      00000000000000_initial_schema.sql), which made "view team
--      members" impossible. RLS policies for the same command are OR'd
--      together, so this only ever broadens read access, never narrows
--      the existing policy.
--   3. handle_new_user() gains a third branch for invited teammates, and
--      a new update_team_member_role() RPC lets an agency_owner change
--      an existing teammate's role - mirrors create_agency()'s exact
--      shape (security definer, re-derives the caller's own tenant_id/
--      role server-side rather than trusting client input, same defense-
--      in-depth precedent convert_crm_lead already established).


-- =========================================
-- 1. Tenant contact fields
-- =========================================

alter table public.tenants
  add column phone text,
  add column email text,
  add column address text;

-- tenants previously had select-only access for authenticated users
-- (00000000000000_initial_schema.sql's tenants_select_own_or_admin +
-- 20260723090000_authenticated_grants_hardening.sql's select grant) -
-- Agency Settings needs a real save path, restricted to the agency_owner
-- of that tenant (branch_manager/sales_agent/etc. can view Settings but
-- not edit it, matching this phase's "Agency owner should be able to"
-- framing). Column-level restriction (e.g. blocking a write to `name`/
-- `is_active`/`cr_number`) is left to the route's own zod schema, same
-- convention every other update endpoint in this app already follows
-- (e.g. updateBookingSchema) - RLS scopes rows, not columns, here.
grant update on public.tenants to authenticated;

create policy "tenants_update_owner"
on public.tenants
for update
using (
  id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
)
with check (
  id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
);


-- =========================================
-- 2. Profiles: tenant-wide read for agency staff
-- =========================================

-- Additive - profiles_select_own_or_admin (initial schema) still stands;
-- this only adds a second way to satisfy SELECT, it never removes the
-- existing "always see your own row" guarantee.
create policy "profiles_select_tenant"
on public.profiles
for select
using (
  tenant_id is not null
  and tenant_id = public.current_tenant_id()
);


-- =========================================
-- 3. Invited-teammate signup path
-- =========================================

-- Extends handle_new_user() (previously redefined in
-- 20260718172421_auth_metadata.sql) with a third case: an agency_owner
-- inviting a teammate via the dashboard's Team page uses Supabase Auth's
-- own admin.inviteUserByEmail() (see apps/dashboard's /api/team route),
-- passing { tenant_id, role } in the invited user's metadata. This
-- trigger reads that metadata back out and attaches the new profile to
-- the right tenant/role immediately, instead of falling through to the
-- generic "customer" default every other signup gets.
--
-- Security-critical: this branch is gated on `new.invited_at is not
-- null`, a column Supabase Auth only ever sets on rows created via the
-- service-role-only admin.inviteUserByEmail() API - never on rows from
-- the public supabase.auth.signUp() endpoint. Without this check, any
-- anonymous visitor could call signUp() with a forged
-- { tenant_id, role: 'agency_owner' } in their own request metadata and
-- self-assign into any tenant they could guess the id of. Gating on
-- invited_at (a column self-signup can never set) closes that off
-- entirely - metadata alone is never trusted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  account_type text;
  invited_tenant_id uuid;
  invited_role public.user_role;
  user_role public.user_role;
  resolved_tenant_id uuid;
begin

  account_type :=
    new.raw_user_meta_data->>'account_type';

  invited_tenant_id :=
    nullif(new.raw_user_meta_data->>'tenant_id', '')::uuid;

  invited_role :=
    nullif(new.raw_user_meta_data->>'role', '')::public.user_role;


  if new.invited_at is not null
     and invited_tenant_id is not null
     and invited_role is not null then

    -- Invited teammate - tenant_id/role came from the invite route
    -- (service-role only), never chosen by the invitee.
    resolved_tenant_id := invited_tenant_id;
    user_role := invited_role;

  elsif account_type = 'agency' then
    user_role := 'agency_owner';
    resolved_tenant_id := null;

  else
    user_role := 'customer';
    resolved_tenant_id := null;

  end if;


  insert into public.profiles (

    id,

    tenant_id,

    email,

    full_name,

    role

  )

  values (

    new.id,

    resolved_tenant_id,

    new.email,

    coalesce(
      new.raw_user_meta_data->>'full_name',
      'New User'
    ),

    user_role

  );


  return new;

end;
$$;


-- =========================================
-- 4. Role assignment RPC
-- =========================================

-- Mirrors create_agency()'s exact shape - security definer so it can
-- update a row that isn't the caller's own (profiles has no general
-- UPDATE policy/grant for authenticated users, by design - every write
-- to profiles happens through a privileged function like this one or
-- create_agency(), never a direct client-side .update()). Every
-- constraint is re-checked server-side rather than trusted from the
-- caller: only an agency_owner may call this, only for a target in
-- their own tenant, and only into one of the four assignable roles -
-- never travio_admin/agency_owner/customer, which would be a privilege
-- escalation or ownership transfer this RPC has no business performing.
create or replace function public.update_team_member_role(
  target_user_id uuid,
  new_role public.user_role
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role public.user_role;
  caller_tenant_id uuid;
  target_tenant_id uuid;
  updated_profile public.profiles;
begin

  select role, tenant_id
  into caller_role, caller_tenant_id
  from public.profiles
  where id = auth.uid();

  if caller_role is distinct from 'agency_owner' then
    raise exception 'Only an agency owner can change a team member''s role';
  end if;

  if new_role not in ('sales_agent', 'branch_manager', 'visa_officer', 'accountant') then
    raise exception 'new_role must be one of sales_agent, branch_manager, visa_officer, accountant';
  end if;

  select tenant_id
  into target_tenant_id
  from public.profiles
  where id = target_user_id;

  if target_tenant_id is null or target_tenant_id is distinct from caller_tenant_id then
    raise exception 'Target user is not a member of your agency';
  end if;

  update public.profiles
  set role = new_role
  where id = target_user_id
  returning * into updated_profile;

  return updated_profile;

end;
$$;

grant execute on function public.update_team_member_role(uuid, public.user_role) to authenticated;
