-- =========================================
-- Customer Domain: Customer 360 foundation
-- Travio CRM
-- =========================================
-- public.customers (0002_core_tables.sql) already covers most of the
-- requested Customer 360 fields: full_name, phone, email, nationality,
-- passport_number, date_of_birth, notes. first_name/last_name are
-- deliberately NOT added - full_name already serves that purpose, and
-- splitting it is a naming-convention change (affecting every existing
-- consumer, e.g. customers-table.tsx), not a missing field. Only the two
-- genuinely absent, unambiguous fields are added here.

alter table public.customers
add column if not exists passport_expiry date;

alter table public.customers
add column if not exists preferred_language text;



-- =========================================
-- Grants
-- =========================================
-- authenticated already has SELECT on customers
-- (20260721191957_authenticated_read_grants.sql), but never INSERT/
-- UPDATE/DELETE. customerService's create/update/delete would fail with
-- a permission error before RLS is ever evaluated without this, same
-- root cause fixed repeatedly for crm_leads/crm_notes/crm_activities.

grant select, insert, update, delete on public.customers to authenticated;
