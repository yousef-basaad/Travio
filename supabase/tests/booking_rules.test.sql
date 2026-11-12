-- pgTAP: booking rules (20261112130000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into public.tenants (id, name, slug, cr_number) values
  ('2b800000-0000-0000-0000-000000000001', 'Rules Travel', 'rules-travel', '1240000001');
insert into public.customers (id, tenant_id, full_name) values
  ('3b800000-0000-0000-0000-000000000001', '2b800000-0000-0000-0000-000000000001', 'Rules Customer');
insert into public.bookings (id, tenant_id, customer_id, booking_number, title, status, start_date, end_date) values
  ('4b800000-0000-0000-0000-000000000001', '2b800000-0000-0000-0000-000000000001', '3b800000-0000-0000-0000-000000000001', 'RULES-1', 'Trip', 'draft', '2026-12-10', '2026-12-15');

select throws_ok(
  $$update public.bookings set end_date = '2026-12-01' where id = '4b800000-0000-0000-0000-000000000001'$$,
  '23514', null, 'changing only the end date to before the start is refused'
);
select throws_ok(
  $$update public.bookings set start_date = '2026-12-20' where id = '4b800000-0000-0000-0000-000000000001'$$,
  '23514', null, 'changing only the start date to after the end is refused'
);
select lives_ok(
  $$update public.bookings set end_date = '2026-12-10' where id = '4b800000-0000-0000-0000-000000000001'$$,
  'a one-day trip is fine'
);

select lives_ok($$update public.bookings set status = 'confirmed' where id = '4b800000-0000-0000-0000-000000000001'$$, 'draft -> confirmed');
select lives_ok($$update public.bookings set status = 'completed' where id = '4b800000-0000-0000-0000-000000000001'$$, 'confirmed -> completed');
select throws_ok(
  $$update public.bookings set status = 'cancelled' where id = '4b800000-0000-0000-0000-000000000001'$$,
  'PL003', 'invalid_status_change', 'a completed trip cannot be cancelled'
);
select lives_ok($$update public.bookings set status = 'confirmed' where id = '4b800000-0000-0000-0000-000000000001'$$, 'completed -> confirmed undoes a mistake');
update public.bookings set status = 'cancelled' where id = '4b800000-0000-0000-0000-000000000001';
select throws_ok(
  $$update public.bookings set status = 'completed' where id = '4b800000-0000-0000-0000-000000000001'$$,
  'PL003', 'invalid_status_change', 'a cancelled booking cannot jump to completed'
);
select lives_ok($$update public.bookings set status = 'draft' where id = '4b800000-0000-0000-0000-000000000001'$$, 'a cancelled booking can be reopened as a draft');

select * from finish();
rollback;
