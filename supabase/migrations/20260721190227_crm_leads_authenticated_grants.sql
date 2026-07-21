-- =========================================
-- Fix: missing authenticated grants on crm_leads
-- =========================================
-- Root cause: this project's default ACL for new tables in the public
-- schema only grants privileges to postgres/service_role - authenticated
-- and anon receive nothing by default here (confirmed directly via
-- pg_default_acl). RLS policies decide *which rows* a role may touch once
-- it already has table-level access; they are not a substitute for that
-- access. crmLeadsService always runs as the caller's own authenticated
-- session (never service_role - see requireCrmAccess), so every query
-- against crm_leads was failing with a Postgres permission error before
-- RLS was ever evaluated, regardless of tenant_id being correct.
--
-- No delete grant: crmLeadsService never issues a hard delete
-- (softDelete only sets deleted_at via update), so the privilege layer
-- now enforces the same "a lead is never deleted" invariant ADR-0004
-- and the RLS policy already assume.

grant select, insert, update on public.crm_leads to authenticated;
