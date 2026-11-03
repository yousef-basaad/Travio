-- pgTAP: every RPC (non-trigger function the app calls via /rest/v1/rpc)
-- is executable by signed-in users only, never by anon. Read-only.

begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

-- The RPCs the app calls. A new RPC should be added here.
create temporary table rpc_names (name text) on commit drop;
insert into rpc_names values
  ('create_agency'),
  ('convert_crm_lead'),
  ('update_team_member_role'),
  ('visa_officer_customer_ids'),
  ('analytics_finance_totals'),
  ('analytics_revenue_by_month'),
  ('analytics_booking_status_counts'),
  ('analytics_top_customers'),
  ('usage_document_totals');

select is(
  (select count(*)::int from pg_proc p join rpc_names r on r.name = p.proname
   where p.pronamespace = 'public'::regnamespace),
  (select count(*)::int from rpc_names),
  'every listed RPC exists');

select is(
  (select array_agg(p.proname order by p.proname)::text from pg_proc p join rpc_names r on r.name = p.proname
   where p.pronamespace = 'public'::regnamespace
     and has_function_privilege('anon', p.oid, 'EXECUTE')),
  null,
  'anon can execute none of the RPCs');

select is(
  (select bool_and(has_function_privilege('authenticated', p.oid, 'EXECUTE'))
   from pg_proc p join rpc_names r on r.name = p.proname
   where p.pronamespace = 'public'::regnamespace),
  true,
  'signed-in users can execute every RPC');

select * from finish();

rollback;
