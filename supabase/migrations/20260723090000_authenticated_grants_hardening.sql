-- =========================================
-- Authenticated Grants Hardening
-- Travio Platform
-- =========================================
--
-- Fixes the same root cause already hit and fixed table-by-table for
-- crm_leads/crm_notes/bookings/customers/profiles: an RLS policy alone
-- does not grant table-level access - Postgres checks GRANTs first, then
-- RLS decides which rows within that grant are visible. Every table
-- below already has a correct tenant-isolation RLS policy but has never
-- had a table-level grant to `authenticated`, so any request through the
-- ordinary (non-admin) Supabase client currently fails outright.
--
-- Classification follows the pattern already established by crm_leads/
-- crm_notes/crm_activities/customers/bookings/booking_flights/
-- booking_timeline:
--   - Core CRUD entities backed by a `for all` tenant-isolation policy:
--     select, insert, update, delete.
--   - Read-only/config tables backed by a `for select`-only policy:
--     select only.
--
-- public.leads (the public website inquiry inbox) is intentionally left
-- untouched - it has RLS enabled with zero policies by design (see
-- 20260720163209_leads_table.sql's own comment: "Intentionally no
-- policies... Only the service-role admin client... may insert or read
-- leads"). A grant here would be inert (RLS still denies every row to
-- authenticated regardless) and would misrepresent the table as
-- authenticated-accessible when it isn't and was never meant to be. The
-- public website's anonymous inquiry submission (submit-inquiry.ts) uses
-- the service-role admin client, which is unaffected by grants to
-- authenticated either way.


-- =========================================
-- Core CRUD entities
-- =========================================
-- Each already has a `for all` tenant_id = current_tenant_id() policy
-- (booking_services_tenant_access, branches_tenant_access,
-- expenses_tenant_access, flights_tenant_access, hotels_tenant_access,
-- invoice_items_tenant_access, invoices_tenant_access,
-- payments_tenant_access, subscriptions_tenant_access,
-- tenant_usage_access, visa_applications_tenant_access) supporting all
-- four operations.

grant select, insert, update, delete on public.booking_services to authenticated;
grant select, insert, update, delete on public.branches to authenticated;
grant select, insert, update, delete on public.expenses to authenticated;
grant select, insert, update, delete on public.flights to authenticated;
grant select, insert, update, delete on public.hotels to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.payments to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.tenant_usage to authenticated;
grant select, insert, update, delete on public.visa_applications to authenticated;


-- =========================================
-- Read-only / config tables
-- =========================================
-- plans_public_read and plan_features_public_read are both `for select`
-- only policies - no insert/update/delete policy exists for either, so
-- granting anything beyond select would not be usable by any policy.

grant select on public.plans to authenticated;
grant select on public.plan_features to authenticated;


-- =========================================
-- Special case: tenants
-- =========================================
-- Only tenants_select_own_or_admin exists (select, scoped to the
-- caller's own tenant, or every tenant for travio_admin). Tenant
-- creation goes through create_agency(), a security definer function
-- that inserts as its own owner regardless of the caller's grants, and
-- no insert/update/delete policy exists for this table at all. Granting
-- anything beyond select would not be usable by any policy and would
-- risk implying broader access than actually exists.

grant select on public.tenants to authenticated;
