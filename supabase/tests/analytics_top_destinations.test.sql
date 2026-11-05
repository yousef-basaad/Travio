-- pgTAP: analytics_top_destinations() (20261105150000). 1100 bookings
-- to one country on purpose: more than PostgREST's max_rows (1000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('17000000-0000-0000-0000-0000000000a0', 'owner@dest.test', '{"full_name":"Owner"}'),
  ('17000000-0000-0000-0000-0000000000b0', 'other@dest.test', '{"full_name":"Other Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('27000000-0000-0000-0000-000000000001', 'Dest Travel', 'top-dest-travel', '1010003434'),
  ('27000000-0000-0000-0000-000000000002', 'Other Travel', 'other-dest-travel', '1010005656');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('17000000-0000-0000-0000-0000000000a0'::uuid, '27000000-0000-0000-0000-000000000001'::uuid),
  ('17000000-0000-0000-0000-0000000000b0'::uuid, '27000000-0000-0000-0000-000000000002'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

insert into public.customers (id, tenant_id, full_name) values
  ('37000000-0000-0000-0000-0000000000c1', '27000000-0000-0000-0000-000000000001', 'Traveler'),
  ('37000000-0000-0000-0000-0000000000c2', '27000000-0000-0000-0000-000000000002', 'Other Traveler');

-- 1100 to Turkey, 3 to the UAE, 3 to Egypt (ties sort by code), 1 to
-- Saudi Arabia; plus ones that never count: cancelled, deleted, no
-- destination, and another agency's.
insert into public.bookings (tenant_id, customer_id, booking_number, title, destination_country)
select '27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'TR-' || n, 'Istanbul', 'TR'
from generate_series(1, 1100) as n;

insert into public.bookings (tenant_id, customer_id, booking_number, title, destination_country, status, deleted_at) values
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'AE-1', 'Dubai', 'AE', 'confirmed', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'AE-2', 'Dubai', 'AE', 'draft', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'AE-3', 'Dubai', 'AE', 'completed', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'EG-1', 'Cairo', 'EG', 'pending', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'EG-2', 'Cairo', 'EG', 'pending', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'EG-3', 'Cairo', 'EG', 'pending', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'SA-1', 'Makkah', 'SA', 'pending', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'FR-X', 'Paris', 'FR', 'cancelled', null),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'FR-Y', 'Paris', 'FR', 'pending', now()),
  ('27000000-0000-0000-0000-000000000001', '37000000-0000-0000-0000-0000000000c1', 'NONE', 'Somewhere', null, 'pending', null),
  ('27000000-0000-0000-0000-000000000002', '37000000-0000-0000-0000-0000000000c2', 'JP-1', 'Tokyo', 'JP', 'pending', null);

select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  'select country, bookings from public.analytics_top_destinations(5)',
  $$ values ('TR', 1100), ('AE', 3), ('EG', 3), ('SA', 1) $$,
  'ranks live bookings by destination (past the row cap), ties by code, skips cancelled/deleted/unset');

select results_eq(
  'select country from public.analytics_top_destinations(2)',
  $$ values ('TR'), ('AE') $$,
  'honours the limit');

select is(
  (select count(*)::integer from public.analytics_top_destinations(500)),
  4, 'a huge limit is capped and returns what exists');

reset role;
select set_config('request.jwt.claims', '{"sub":"17000000-0000-0000-0000-0000000000b0","role":"authenticated"}', true);
set local role authenticated;
select results_eq(
  'select country, bookings from public.analytics_top_destinations()',
  $$ values ('JP', 1) $$,
  'other agency owner: only its own bookings');

reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok('select * from public.analytics_top_destinations()', '42501', null, 'anon cannot execute it');

select * from finish();

rollback;
