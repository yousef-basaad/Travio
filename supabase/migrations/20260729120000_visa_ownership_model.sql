-- Phase 4C.2: Visa Operations Ownership
--
-- Adds assigned_to to visa_applications and layers a role-aware policy on
-- top of the existing tenant-only policy, mirroring Phase 4C.1's sales
-- ownership model (crm_leads/customers/bookings) but scoped to
-- visa_officer instead of sales_agent.
--
-- travio_admin/agency_owner/branch_manager keep full tenant visibility
-- (branch scoping for branch_manager remains deferred, same reasoning as
-- 20260729090000). sales_agent's existing (unrestricted) visibility into
-- visa_applications is intentionally preserved as-is - this migration
-- only introduces a new restriction for visa_officer, it does not change
-- anyone else's current access.
--
-- customer_id, booking_id, created_by, tenant_id, status, and the RLS
-- enforcement mechanism (current_tenant_id()/current_user_role(), added
-- in 20260729090000) are all untouched.

alter table public.visa_applications
  add column assigned_to uuid references public.profiles(id) on delete set null;

create index visa_applications_assigned_to_idx on public.visa_applications (assigned_to);

drop policy visa_applications_tenant_access on public.visa_applications;
create policy visa_applications_tenant_access on public.visa_applications
for all
using (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
)
with check (
  tenant_id = current_tenant_id()
  and (
    current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);
