-- pgTAP: visa officer can read (only read) the customers of its own visa
-- applications (20261026130000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('11000000-0000-0000-0000-0000000000d0', 'vo@vw.test', '{"full_name":"Visa Officer"}'),
  ('11000000-0000-0000-0000-0000000000c1', 's1@vw.test', '{"full_name":"Agent One"}'),
  ('11000000-0000-0000-0000-0000000000b0', 'bm@vw.test', '{"full_name":"Branch Manager"}'),
  ('11000000-0000-0000-0000-0000000000e0', 'ac@vw.test', '{"full_name":"Accountant"}');

insert into public.tenants (id, name, slug, cr_number)
values ('21000000-0000-0000-0000-000000000001', 'Visa Works', 'visa-works', '1010002222');

update public.profiles p
set tenant_id = '21000000-0000-0000-0000-000000000001', role = r.role::public.user_role
from (values
  ('11000000-0000-0000-0000-0000000000d0'::uuid, 'visa_officer'),
  ('11000000-0000-0000-0000-0000000000c1'::uuid, 'sales_agent'),
  ('11000000-0000-0000-0000-0000000000b0'::uuid, 'branch_manager'),
  ('11000000-0000-0000-0000-0000000000e0'::uuid, 'accountant')
) as r(id, role)
where p.id = r.id;

-- All three customers are assigned to the sales agent, so a visa officer
-- can't normally see any of them.
insert into public.customers (id, tenant_id, full_name, assigned_to) values
  ('31000000-0000-0000-0000-0000000000a1', '21000000-0000-0000-0000-000000000001', 'Mine', '11000000-0000-0000-0000-0000000000c1'),
  ('31000000-0000-0000-0000-0000000000a2', '21000000-0000-0000-0000-000000000001', 'Unassigned visa', '11000000-0000-0000-0000-0000000000c1'),
  ('31000000-0000-0000-0000-0000000000a3', '21000000-0000-0000-0000-000000000001', 'Not mine', '11000000-0000-0000-0000-0000000000c1');

-- Visa on a1 assigned to the visa officer, on a2 unassigned, on a3
-- assigned to the branch manager.
insert into public.visa_applications (tenant_id, customer_id, assigned_to) values
  ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-0000000000a1', '11000000-0000-0000-0000-0000000000d0'),
  ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-0000000000a2', null),
  ('21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-0000000000a3', '11000000-0000-0000-0000-0000000000b0');

select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-0000000000d0","role":"authenticated"}', true);
set local role authenticated;

select is(
  (select array_agg(full_name order by full_name)::text from public.customers),
  '{Mine,"Unassigned visa"}',
  'visa officer sees the customers of its own and unassigned visas only');

select is(
  (select count(*)::int from public.visa_applications v join public.customers c on c.id = v.customer_id),
  2,
  'visa officer can join each of its visas to the customer (the workspace list)');

select results_eq(
  $$ with u as (update public.customers set full_name = 'changed' returning 1) select count(*)::int from u $$,
  $$ values (0) $$,
  'visa officer still cannot update those customers');

reset role;

-- Other roles get nothing from the function.
select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-0000000000e0","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.visa_officer_customer_ids()), 0,
  'the helper returns nothing for a non-visa-officer (accountant)');
select is((select count(*)::int from public.customers), 0,
  'accountant still sees none of the assigned customers');

reset role;

select set_config('request.jwt.claims', '{"sub":"11000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.customers), 3,
  'sales agent visibility is unchanged');

reset role;

select is(
  has_function_privilege('anon', 'public.visa_officer_customer_ids()', 'execute'),
  false,
  'anon cannot execute the helper');

select is(
  (select prosecdef and 'search_path=""' = any(proconfig)
   from pg_proc where proname = 'visa_officer_customer_ids'),
  true,
  'helper is security definer with an empty search_path');

select * from finish();

rollback;
