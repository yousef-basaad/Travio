-- pgTAP: reports_overview(range_start) (20261108130000). 1010 bookings on
-- purpose: more than PostgREST's max_rows (1000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email, raw_user_meta_data) values
  ('19000000-0000-0000-0000-0000000000a0', 'owner@reports.test', '{"full_name":"Owner"}'),
  ('19000000-0000-0000-0000-0000000000a1', 'agent@reports.test', '{"full_name":"Agent Sara"}'),
  ('19000000-0000-0000-0000-0000000000b0', 'other@reports.test', '{"full_name":"Other Owner"}'),
  ('19000000-0000-0000-0000-0000000000d0', 'empty@reports.test', '{"full_name":"Empty Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('29000000-0000-0000-0000-000000000001', 'Reports Travel', 'reports-travel', '1010001212'),
  ('29000000-0000-0000-0000-000000000002', 'Other Travel', 'other-reports', '1010003434'),
  ('29000000-0000-0000-0000-000000000003', 'Empty Travel', 'empty-reports', '1010005656');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('19000000-0000-0000-0000-0000000000a0'::uuid, '29000000-0000-0000-0000-000000000001'::uuid, 'agency_owner'),
  ('19000000-0000-0000-0000-0000000000a1'::uuid, '29000000-0000-0000-0000-000000000001'::uuid, 'sales_agent'),
  ('19000000-0000-0000-0000-0000000000b0'::uuid, '29000000-0000-0000-0000-000000000002'::uuid, 'agency_owner'),
  ('19000000-0000-0000-0000-0000000000d0'::uuid, '29000000-0000-0000-0000-000000000003'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

-- Customers: two Saudi (one repeat), one Egyptian, one with a blank
-- nationality, one created long ago; and another agency's customer.
insert into public.customers (id, tenant_id, full_name, nationality, created_at) values
  ('39000000-0000-0000-0000-0000000000c1', '29000000-0000-0000-0000-000000000001', 'Repeat', 'السعودية', now()),
  ('39000000-0000-0000-0000-0000000000c2', '29000000-0000-0000-0000-000000000001', 'Once', ' السعودية ', now()),
  ('39000000-0000-0000-0000-0000000000c3', '29000000-0000-0000-0000-000000000001', 'Egypt', 'مصر', now()),
  ('39000000-0000-0000-0000-0000000000c4', '29000000-0000-0000-0000-000000000001', 'Blank', '  ', now()),
  ('39000000-0000-0000-0000-0000000000c5', '29000000-0000-0000-0000-000000000001', 'Old', null, now() - interval '3 years'),
  ('39000000-0000-0000-0000-0000000000c9', '29000000-0000-0000-0000-000000000002', 'Other', 'اليابان', now());

-- Bookings need a title; these fixtures do not care which.
alter table public.bookings alter column title set default 'Trip';

-- 1000 confirmed Turkey bookings this month for the repeat customer,
-- assigned to the agent, 5-day trips.
insert into public.bookings (tenant_id, customer_id, booking_number, status, destination_country, assigned_to, start_date, end_date, created_at)
select '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c1', 'BK-R' || g, 'confirmed', 'TR',
       '19000000-0000-0000-0000-0000000000a1', current_date, current_date + 5, now()
from generate_series(1, 1000) g;

-- 4 completed UAE trips (1 day) for "Once", assigned to the agent; 3
-- cancelled Egypt bookings; 2 drafts; 1 deleted booking.
insert into public.bookings (id, tenant_id, customer_id, booking_number, status, destination_country, assigned_to, start_date, end_date, created_at)
values ('49000000-0000-0000-0000-0000000000e1', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c2', 'BK-AE1', 'completed', 'AE',
        '19000000-0000-0000-0000-0000000000a1', current_date, current_date + 1, now());
insert into public.bookings (tenant_id, customer_id, booking_number, status, destination_country, assigned_to, start_date, end_date, created_at)
select '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c2', 'BK-AE' || (g + 1), 'completed', 'AE',
       '19000000-0000-0000-0000-0000000000a1', current_date, current_date + 1, now()
from generate_series(1, 3) g;
insert into public.bookings (tenant_id, customer_id, booking_number, status, destination_country, created_at)
select '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c3', 'BK-EG' || g, 'cancelled', 'EG', now()
from generate_series(1, 3) g;
insert into public.bookings (tenant_id, customer_id, booking_number, status, created_at)
select '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c3', 'BK-D' || g, 'draft', now()
from generate_series(1, 2) g;
insert into public.bookings (tenant_id, customer_id, booking_number, status, destination_country, deleted_at)
values ('29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c1', 'BK-DEL', 'confirmed', 'FR', now());

-- One invoice of 9000 on the first UAE booking: 6000 flight + 3000
-- hotel; a deleted invoice that must not count.
insert into public.invoices (id, tenant_id, customer_id, booking_id, invoice_number, status, total) values
  ('59000000-0000-0000-0000-0000000000f1', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c2',
   '49000000-0000-0000-0000-0000000000e1', 'INV-R1', 'issued', 9000);
insert into public.invoices (tenant_id, customer_id, booking_id, invoice_number, status, total, deleted_at) values
  ('29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c2',
   '49000000-0000-0000-0000-0000000000e1', 'INV-R2', 'issued', 777, now());
insert into public.invoice_items (tenant_id, invoice_id, description, quantity, unit_price, total, item_type) values
  ('29000000-0000-0000-0000-000000000001', '59000000-0000-0000-0000-0000000000f1', 'Flight', 1, 6000, 6000, 'flight'),
  ('29000000-0000-0000-0000-000000000001', '59000000-0000-0000-0000-0000000000f1', 'Hotel', 1, 3000, 3000, 'hotel');

-- Two flight tickets on the UAE booking.
insert into public.booking_flights (tenant_id, booking_id, airline, flight_number, departure_airport, arrival_airport, departure_time, arrival_time)
select '29000000-0000-0000-0000-000000000001', '49000000-0000-0000-0000-0000000000e1', 'SV', 'SV' || g, 'RUH', 'DXB', now(), now() + interval '2 hours'
from generate_series(1, 2) g;

-- Another agency's booking and invoice.
insert into public.bookings (id, tenant_id, customer_id, booking_number, status, destination_country)
values ('49000000-0000-0000-0000-0000000000e9', '29000000-0000-0000-0000-000000000002', '39000000-0000-0000-0000-0000000000c9', 'BK-X', 'confirmed', 'JP');
insert into public.invoices (tenant_id, customer_id, booking_id, invoice_number, status, total)
values ('29000000-0000-0000-0000-000000000002', '39000000-0000-0000-0000-0000000000c9', '49000000-0000-0000-0000-0000000000e9', 'INV-X', 'issued', 50000);

select set_config('request.jwt.claims', '{"sub":"19000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;

create temp table r on commit drop as
select public.reports_overview((date_trunc('month', now()) - interval '5 months')::date) as s;

select is(
  (select s->'bookings_by_month'->0 from r),
  jsonb_build_object('month', to_char(now() at time zone 'UTC', 'YYYY-MM'), 'total', 1009, 'confirmed', 1004, 'cancelled', 3),
  'monthly bookings count past the row cap; confirmed includes completed; deleted bookings excluded'
);
select is((select jsonb_array_length(s->'bookings_by_month') from r), 1, 'only months with bookings are returned');
select is(
  (select s->'customers_by_month' from r),
  jsonb_build_array(jsonb_build_object('month', to_char(now() at time zone 'UTC', 'YYYY-MM'), 'count', 4)),
  'new customers per month start at range_start'
);
select is(
  (select s->'sales_by_service' from r),
  '[{"type":"flight","total":6000},{"type":"hotel","total":3000}]'::jsonb,
  'sales by service from invoice items, largest first'
);
select is(
  (select s->'sales_by_destination' from r),
  '[{"country":"AE","bookings":4,"total":9000},{"country":"TR","bookings":1000,"total":0}]'::jsonb,
  'destinations by sales, then bookings; cancelled and deleted excluded'
);
select is((select s->'customers_by_nationality'->>'total' from r)::int, 5, 'nationality total counts every customer');
select is(
  (select s->'customers_by_nationality'->'items' from r),
  '[{"label":"السعودية","count":2},{"label":"مصر","count":1}]'::jsonb,
  'nationalities trimmed and grouped, blanks left out'
);
select is(
  (select s->'staff' from r),
  '[{"profile_id":"19000000-0000-0000-0000-0000000000a1","name":"Agent Sara","bookings":1004,"completed":4,"cancelled":0,"sales":9000}]'::jsonb,
  'staff performance per assigned member'
);
select is(
  (select array[(s->>'live_bookings')::int, (s->>'completed_bookings')::int, (s->>'cancelled_bookings')::int] from r),
  array[1007, 4, 3],
  'live (non-draft), completed and cancelled counts'
);
select is(
  (select array[(s->>'customers_with_bookings')::int, (s->>'repeat_customers')::int] from r),
  array[2, 2],
  'customers with bookings and repeat customers (drafts and cancelled ignored)'
);
select is((select (s->>'avg_trip_days')::numeric from r), 5.0, 'average trip length in days');
select is((select (s->>'flight_tickets')::int from r), 2, 'flight tickets on live bookings');
select is(
  (select array[(s->>'invoiced_customers')::numeric, (s->>'invoiced_bookings')::numeric, (s->>'invoiced_total')::numeric] from r),
  array[1, 1, 9000]::numeric[],
  'invoiced customers, bookings and total exclude deleted invoices and other agencies'
);

-- An agency with nothing yet: empty lists and a null average, not errors.
select set_config('request.jwt.claims', '{"sub":"19000000-0000-0000-0000-0000000000d0","role":"authenticated"}', true);
select is(
  (select public.reports_overview(current_date)),
  '{"staff":[],"live_bookings":0,"avg_trip_days":null,"flight_tickets":0,"invoiced_total":0,"invoiced_bookings":0,"sales_by_service":[],"repeat_customers":0,"bookings_by_month":[],"cancelled_bookings":0,"completed_bookings":0,"invoiced_customers":0,"sales_by_destination":[],"customers_with_bookings":0,"customers_by_month":[],"customers_by_nationality":{"total":0,"items":[]}}'::jsonb,
  'an agency without bookings gets zeros and empty lists'
);

reset role;
select is(
  (select has_function_privilege('anon', 'public.reports_overview(date)', 'execute')),
  false,
  'anon cannot call reports_overview'
);
select is(
  (select has_function_privilege('authenticated', 'public.reports_overview(date)', 'execute')),
  true,
  'authenticated can call reports_overview'
);

select * from finish();
rollback;
