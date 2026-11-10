-- pgTAP: home_overview(), visa_workspace_page() and wrapped RLS calls
-- (20261110140000). 1050 bookings, past PostgREST's cap. Rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1d400000-0000-0000-0000-0000000000a1', 'owner-a@perf.test', '{"full_name":"Owner A"}'),
  ('1d400000-0000-0000-0000-0000000000b1', 'owner-b@perf.test', '{"full_name":"Owner B"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2d400000-0000-0000-0000-00000000000a', 'Perf A', 'perf-a', '1200000001'),
  ('2d400000-0000-0000-0000-00000000000b', 'Perf B', 'perf-b', '1200000002');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('1d400000-0000-0000-0000-0000000000a1'::uuid, '2d400000-0000-0000-0000-00000000000a'::uuid),
  ('1d400000-0000-0000-0000-0000000000b1'::uuid, '2d400000-0000-0000-0000-00000000000b'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

alter table public.bookings alter column title set default 'Trip';
insert into public.customers (id, tenant_id, full_name) values
  ('3d400000-0000-0000-0000-00000000000a', '2d400000-0000-0000-0000-00000000000a', 'Sara 100%'),
  ('3d400000-0000-0000-0000-00000000000c', '2d400000-0000-0000-0000-00000000000a', 'Omar'),
  ('3d400000-0000-0000-0000-00000000000b', '2d400000-0000-0000-0000-00000000000b', 'Other');

-- 1000 drafts, 40 confirmed assigned to the owner and leaving today, 10
-- returning today, 1 deleted, and another agency's booking.
insert into public.bookings (tenant_id, customer_id, booking_number, status)
select '2d400000-0000-0000-0000-00000000000a', '3d400000-0000-0000-0000-00000000000a', 'D-' || g, 'draft' from generate_series(1, 1000) g;
insert into public.bookings (tenant_id, customer_id, booking_number, status, assigned_to, start_date)
select '2d400000-0000-0000-0000-00000000000a', '3d400000-0000-0000-0000-00000000000c', 'C-' || g, 'confirmed', '1d400000-0000-0000-0000-0000000000a1', (now() at time zone 'UTC')::date from generate_series(1, 40) g;
insert into public.bookings (tenant_id, customer_id, booking_number, status, end_date)
select '2d400000-0000-0000-0000-00000000000a', '3d400000-0000-0000-0000-00000000000c', 'R-' || g, 'completed', (now() at time zone 'UTC')::date from generate_series(1, 10) g;
insert into public.bookings (tenant_id, customer_id, booking_number, status, deleted_at)
values ('2d400000-0000-0000-0000-00000000000a', '3d400000-0000-0000-0000-00000000000a', 'DEL', 'pending', now());
insert into public.bookings (tenant_id, customer_id, booking_number, status)
values ('2d400000-0000-0000-0000-00000000000b', '3d400000-0000-0000-0000-00000000000b', 'X', 'pending');

insert into public.visa_applications (tenant_id, customer_id, status, country, visa_type)
select '2d400000-0000-0000-0000-00000000000a', '3d400000-0000-0000-0000-00000000000a', 'submitted', 'Turkey', 'Tourist' from generate_series(1, 30) g;
insert into public.visa_applications (tenant_id, customer_id, status, country, visa_type) values
  ('2d400000-0000-0000-0000-00000000000a', '3d400000-0000-0000-0000-00000000000c', 'approved', 'Japan', 'Work'),
  ('2d400000-0000-0000-0000-00000000000b', '3d400000-0000-0000-0000-00000000000b', 'approved', 'Japan', 'Work');

select set_config('request.jwt.claims', '{"sub":"1d400000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

create temp table h on commit drop as select public.home_overview((date_trunc('month', now()) - interval '5 months')::date) as s;

select is(
  (select (s->'bookings_by_month'->>to_char(now() at time zone 'UTC', 'YYYY-MM'))::int from h),
  1050,
  'monthly bookings count past the row cap, without deleted or other agencies'' rows'
);
select is((select (s->'customers_by_month'->>to_char(now() at time zone 'UTC', 'YYYY-MM'))::int from h), 2, 'monthly customers');
select is((select (s->'visas_by_month'->>to_char(now() at time zone 'UTC', 'YYYY-MM'))::int from h), 31, 'monthly visas');
select is(
  (select (b->>'total')::int from h, jsonb_array_elements(s->'board') b where b->>'status' = 'draft'),
  1000,
  'a board column reports its true total'
);
select is(
  (select jsonb_array_length(b->'items') from h, jsonb_array_elements(s->'board') b where b->>'status' = 'draft'),
  20,
  'a board column carries only the latest cards'
);
select is(
  (select b->'items'->0->>'customer_name' from h, jsonb_array_elements(s->'board') b where b->>'status' = 'confirmed'),
  'Omar',
  'a card carries the customer name'
);
select is((select jsonb_array_length(s->'board') from h), 5, 'every status has a column');
select is((select jsonb_array_length(s->'today') from h), 50, 'departures and returns today');
select is(
  (select (s->'team'->>'1d400000-0000-0000-0000-0000000000a1')::int from h),
  40,
  'bookings per team member'
);

select is((select (public.visa_workspace_page()->>'total')::int), 31, 'visa total covers only the caller''s agency');
select is((select jsonb_array_length(public.visa_workspace_page(null, null, 2, 25)->'items')), 6, 'visa paging');
select is((select (public.visa_workspace_page(null, 'approved')->>'total')::int), 1, 'visa status filter');
select is((select (public.visa_workspace_page('omar')->>'total')::int), 1, 'visa search by customer name');
select is((select (public.visa_workspace_page('100%')->>'total')::int), 30, 'visa search treats % literally');
select is(
  (select public.visa_workspace_page('japan')->'items'->0->'customer'->>'full_name'),
  'Omar',
  'a visa row carries its customer'
);

reset role;
select is(
  (select count(*)::int from pg_policies where schemaname = 'public'
    and coalesce(qual, '') || coalesce(with_check, '') ~ '(?<!SELECT )(current_tenant_id|current_customer_id)\(\)'),
  0,
  'no policy calls the tenant functions per row'
);

select * from finish();
rollback;
