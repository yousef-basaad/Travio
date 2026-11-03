-- =========================================
-- RPC execute grants: signed-in users only
-- =========================================
--
-- Postgres grants EXECUTE on every new function to PUBLIC (which
-- includes anon). convert_crm_lead() and update_team_member_role() were
-- only ever granted to authenticated on top of that default, so anon
-- could still call them through /rest/v1/rpc. Both reject a caller with
-- no tenant, so nothing was reachable - but every other RPC here is
-- already authenticated-only (create_agency, visa_officer_customer_ids,
-- analytics_*), and these two now match.
--
-- The current_* helpers stay executable by everyone on purpose: RLS
-- policies call them for every request, including anonymous ones.

revoke execute on function public.convert_crm_lead(uuid, boolean) from public, anon;
grant execute on function public.convert_crm_lead(uuid, boolean) to authenticated;

revoke execute on function public.update_team_member_role(uuid, public.user_role) from public, anon;
grant execute on function public.update_team_member_role(uuid, public.user_role) to authenticated;
