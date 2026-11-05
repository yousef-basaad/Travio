-- pgTAP: bookings destination/traveler columns (20261105140000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

insert into public.tenants (id, name, slug, cr_number)
values ('26000000-0000-0000-0000-000000000001', 'Dest Travel', 'dest-travel', '1010001212');
insert into public.customers (id, tenant_id, full_name)
values ('36000000-0000-0000-0000-0000000000c1', '26000000-0000-0000-0000-000000000001', 'Traveler');

select lives_ok($$
  insert into public.bookings (tenant_id, customer_id, booking_number, title, destination_country, destination_city, adults, children)
  values ('26000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-0000000000c1', 'D-1', 'Istanbul', 'TR', 'Istanbul', 2, 1)
$$, 'accepts a country code, city and traveler counts');

select lives_ok($$
  insert into public.bookings (tenant_id, customer_id, booking_number, title)
  values ('26000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-0000000000c1', 'D-2', 'No destination yet')
$$, 'all four columns are optional');

select throws_ok($$
  insert into public.bookings (tenant_id, customer_id, booking_number, title, destination_country)
  values ('26000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-0000000000c1', 'D-3', 'Bad', 'Turkey')
$$, '23514', null, 'rejects a country that is not a 2-letter code');

select throws_ok($$
  insert into public.bookings (tenant_id, customer_id, booking_number, title, destination_country)
  values ('26000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-0000000000c1', 'D-4', 'Bad', 'tr')
$$, '23514', null, 'rejects a lowercase code');

select throws_ok($$
  insert into public.bookings (tenant_id, customer_id, booking_number, title, adults)
  values ('26000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-0000000000c1', 'D-5', 'Bad', -1)
$$, '23514', null, 'rejects a negative traveler count');

select throws_ok($$
  insert into public.bookings (tenant_id, customer_id, booking_number, title, destination_city)
  values ('26000000-0000-0000-0000-000000000001', '36000000-0000-0000-0000-0000000000c1', 'D-6', 'Bad', repeat('x', 121))
$$, '23514', null, 'rejects a city name over 120 characters');

select * from finish();

rollback;
