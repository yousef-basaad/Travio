-- =========================================
-- Visa officer: read the customers of its own visa applications
-- =========================================
--
-- The visa workspace lists a visa officer's applications with each
-- customer's name. customers_tenant_select only lets a non-manager see
-- unassigned customers or customers assigned to itself, so a visa
-- officer couldn't see the customer behind most of its own visas.
--
-- A customers policy can't read visa_applications directly: the visa
-- policy already reads customers (for sales agents), and Postgres
-- rejects that as infinite recursion. This security definer function
-- applies the visa officer's own visa rule (20261026120000: assigned to
-- it, or unassigned) without going through RLS, and the new policy is
-- read-only, so it adds no write access.

create or replace function public.visa_officer_customer_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select v.customer_id
  from public.visa_applications v
  where public.current_user_role() = 'visa_officer'
    and v.tenant_id = public.current_tenant_id()
    and (v.assigned_to = auth.uid() or v.assigned_to is null);
$$;

revoke execute on function public.visa_officer_customer_ids() from public, anon;
grant execute on function public.visa_officer_customer_ids() to authenticated;

create policy customers_visa_officer_select on public.customers
for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() = 'visa_officer'
  and id in (select public.visa_officer_customer_ids())
);
