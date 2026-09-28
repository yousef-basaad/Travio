-- Phase 4C.1: Sales Ownership Model
--
-- Adds a real assigned_to column to customers and bookings (crm_leads
-- already has one, added earlier for the CRM leads module) and layers
-- role-aware RLS on top of the existing tenant-only policies for
-- customers/crm_leads/bookings.
--
-- travio_admin/agency_owner/branch_manager keep full tenant visibility -
-- branch-scoped restriction for branch_manager is intentionally deferred
-- to a later phase (no profiles.branch_id exists yet to scope by).
-- sales_agent is restricted to rows where assigned_to = auth.uid() or
-- assigned_to is null (unclaimed records remain visible to every agent).
--
-- branch_id and created_by/uploaded_by are untouched by this migration.

alter table public.customers
  add column assigned_to uuid references public.profiles(id) on delete set null;

alter table public.bookings
  add column assigned_to uuid references public.profiles(id) on delete set null;

create index customers_assigned_to_idx on public.customers (assigned_to);
create index bookings_assigned_to_idx on public.bookings (assigned_to);

-- Mirrors current_tenant_id()'s existing shape/security model exactly -
-- a single-purpose lookup, not a permissions system.
create or replace function public.current_user_role()
returns user_role
language sql
stable security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

drop policy customers_tenant_access on public.customers;
create policy customers_tenant_access on public.customers
for all
using (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
)
with check (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

drop policy crm_leads_tenant_access on public.crm_leads;
create policy crm_leads_tenant_access on public.crm_leads
for all
using (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
)
with check (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

drop policy bookings_tenant_access on public.bookings;
create policy bookings_tenant_access on public.bookings
for all
using (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
)
with check (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);
