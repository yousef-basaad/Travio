-- =========================================
-- Fix: missing authenticated read grants
-- =========================================
-- Same root cause as 20260721190227_crm_leads_authenticated_grants.sql:
-- this project's default ACL for new tables in the public schema only
-- grants privileges to postgres/service_role, so authenticated gets
-- nothing on a table unless a migration explicitly grants it. RLS
-- decides which rows an already-privileged role may see; it is not a
-- substitute for the underlying table privilege.
--
-- Audited every direct `.from(...)` call across apps/ and packages/ to
-- confirm which tables are actually queried through a user (session-based)
-- Supabase client, as opposed to the admin/service-role client or a
-- security definer function (both of which bypass grants entirely and
-- are unaffected by this).


-- public.profiles
-- packages/auth/src/guards/require-role.ts reads this table using the
-- caller's own authenticated session (createServerSupabaseClient(), not
-- the admin client). A SELECT grant for authenticated already exists in
-- production, but it has no migration behind it - it was applied
-- out-of-band and would be missing from any fresh environment built from
-- migration history alone (a local `supabase db reset`, a new
-- staging/dev project, disaster recovery). This codifies the existing,
-- already-relied-upon state; it changes no live behavior.
grant select on public.profiles to authenticated;


-- public.bookings
-- packages/api/src/services/bookings.service.ts's list()/getById() run
-- against the caller's own session (the browser/server client wired in
-- from each app), not the admin client. Only SELECT is required - there
-- is no insert/update/delete path in application code today.
grant select on public.bookings to authenticated;


-- public.customers
-- apps/dashboard/src/features/customers/api/customers.api.ts's
-- useCustomers() reads this table via the dashboard's browser client.
-- Only SELECT is required - there is no insert/update/delete path in
-- application code today.
grant select on public.customers to authenticated;
