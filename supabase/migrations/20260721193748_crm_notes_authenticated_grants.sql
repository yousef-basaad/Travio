-- =========================================
-- Fix: missing authenticated grants on crm_notes
-- =========================================
-- Same root cause as crm_leads/profiles/bookings/customers before it:
-- this project's default ACL for new tables in the public schema only
-- grants privileges to postgres/service_role, so authenticated gets
-- nothing on a table unless a migration explicitly grants it. RLS
-- (crm_notes_tenant_access) decides which rows an already-privileged
-- role may touch; it is not a substitute for that access.
--
-- No UPDATE grant: crmNotesService has no update() function - only
-- listByLead, listByCustomer, create, and delete exist.

grant select, insert, delete on public.crm_notes to authenticated;
