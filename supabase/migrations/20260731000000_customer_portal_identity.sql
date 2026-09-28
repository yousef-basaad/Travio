-- =========================================
-- Customer Portal Identity Foundation
-- Travio Product-5
-- =========================================
--
-- No new tables. One additive column + one uniqueness constraint + one
-- lookup function + two new SELECT-only RLS policies + a third branch
-- on the already-twice-extended handle_new_user().
--
-- Identity model (see Product-5's audit for the full reasoning):
--   - profiles.customer_id links a portal identity to the CRM record an
--     agent already created for that person (public.customers) - the
--     exact same "nullable FK from an identity-bearing row to a domain
--     table" shape bookings.assigned_to/visa_applications.assigned_to
--     already use.
--   - UNIQUE, per this phase's explicit requirement: one customer record
--     may never be linked to more than one portal identity, enforced at
--     the database level (a plain unique constraint on a nullable
--     column already allows any number of NULLs while still forbidding
--     two profiles from sharing the same non-null customer_id -
--     Postgres treats NULL <> NULL for uniqueness purposes, no partial
--     index needed).
--   - Customer profiles keep tenant_id = NULL, always. This is the
--     safety-critical decision: it means tenant_id = current_tenant_id()
--     is never true for a customer role (NULL never equals anything),
--     so the *existing* staff-oriented tenant/assigned_to policies on
--     bookings/customers never match a customer at all - no existing
--     policy is touched, edited, or reasoned about differently. Customer
--     access is driven exclusively by the new current_customer_id()
--     policies below, never by current_tenant_id().
--   - No self-signup path grants a real customer_id. An agent invites a
--     customer from Customer 360 via auth.admin.inviteUserByEmail() (the
--     same real Supabase Auth mechanism Product-4's team invites use),
--     stamping { customer_id, role: 'customer' } into the invited user's
--     metadata. handle_new_user() only honors that metadata when
--     new.invited_at is not null - a column only the service-role admin
--     invite API ever sets, never the public supabase.auth.signUp()
--     endpoint - which is what stops a public signup from forging a
--     customer_id to read someone else's data. Same closed vulnerability
--     class Product-4 already documented for team invites.


-- =========================================
-- 1. profiles.customer_id
-- =========================================

alter table public.profiles
  add column customer_id uuid references public.customers(id) on delete set null;

-- Nullable unique: any number of profiles may have customer_id = null
-- (every staff profile, plus any customer-role profile that signed up
-- publicly without ever being invited), but a non-null customer_id can
-- never appear on more than one profile - "one customer record, at most
-- one portal identity," enforced by the database, not just app code.
alter table public.profiles
  add constraint profiles_customer_id_key unique (customer_id);

create index profiles_customer_id_idx on public.profiles (customer_id);


-- =========================================
-- 2. current_customer_id()
-- =========================================

-- Mirrors current_tenant_id()'s exact shape/security model - a single-
-- purpose lookup, not a permissions system. Returns null for every
-- staff profile and for any customer-role profile with no linked
-- customer record yet.
create or replace function public.current_customer_id()
returns uuid
language sql
security definer
stable
as $$
  select customer_id from public.profiles where id = auth.uid();
$$;


-- =========================================
-- 3. Customer-scoped RLS (additive, SELECT-only)
-- =========================================

-- Deliberately independent of every existing policy on these tables -
-- not a rewrite of bookings_tenant_access/customers_tenant_access, not
-- an OR-branch added into them. Those policies stay behaviorally
-- identical; a customer role never satisfies their
-- `tenant_id = current_tenant_id()` clause in the first place (customer
-- profiles keep tenant_id null), so there is no overlap between "staff
-- can see unclaimed tenant-wide rows" and "a customer can see their own
-- row" to reason about. RLS policies for the same command are OR'd
-- together, so this only ever adds a narrow, additional way to satisfy
-- SELECT - it can't broaden what staff or any other role can already do.
create policy "bookings_customer_access"
on public.bookings
for select
using (
  public.current_customer_id() is not null
  and customer_id = public.current_customer_id()
);

create policy "customers_customer_access"
on public.customers
for select
using (
  public.current_customer_id() is not null
  and id = public.current_customer_id()
);


-- =========================================
-- 4. Invited-customer signup path
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  account_type text;
  invited_tenant_id uuid;
  invited_role public.user_role;
  invited_customer_id uuid;
  user_role public.user_role;
  resolved_tenant_id uuid;
  resolved_customer_id uuid;
begin

  account_type :=
    new.raw_user_meta_data->>'account_type';

  invited_tenant_id :=
    nullif(new.raw_user_meta_data->>'tenant_id', '')::uuid;

  invited_role :=
    nullif(new.raw_user_meta_data->>'role', '')::public.user_role;

  invited_customer_id :=
    nullif(new.raw_user_meta_data->>'customer_id', '')::uuid;


  if new.invited_at is not null
     and invited_customer_id is not null
     and invited_role = 'customer' then

    -- Invited customer (Customer Portal, Product-5) - never
    -- tenant-scoped, by design (see this migration's own header
    -- comment for why).
    resolved_tenant_id := null;
    resolved_customer_id := invited_customer_id;
    user_role := 'customer';

  elsif new.invited_at is not null
     and invited_tenant_id is not null
     and invited_role is not null then

    -- Invited teammate (Team Management, Product-4) - tenant_id/role
    -- came from the invite route (service-role only), never chosen by
    -- the invitee.
    resolved_tenant_id := invited_tenant_id;
    resolved_customer_id := null;
    user_role := invited_role;

  elsif account_type = 'agency' then
    user_role := 'agency_owner';
    resolved_tenant_id := null;
    resolved_customer_id := null;

  else
    -- Public self-signup with no invite - a real profile, but not
    -- linked to any customer record or tenant. The customer portal's
    -- own access gate treats this as "authenticated, no portal access
    -- yet" rather than an error.
    user_role := 'customer';
    resolved_tenant_id := null;
    resolved_customer_id := null;

  end if;


  insert into public.profiles (

    id,

    tenant_id,

    customer_id,

    email,

    full_name,

    role

  )

  values (

    new.id,

    resolved_tenant_id,

    resolved_customer_id,

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
