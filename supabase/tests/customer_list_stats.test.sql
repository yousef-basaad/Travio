-- pgTAP: customer_list_stats() (20261105130000). Counts, paid totals and
-- last activity per customer, deleted rows ignored, and RLS keeping each
-- agency to its own customers. Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(7);

insert into auth.users (id, email, raw_user_meta_data) values
  ('15000000-0000-0000-0000-0000000000a0', 'owner@cstats.test', '{"full_name":"Owner"}'),
  ('15000000-0000-0000-0000-0000000000b0', 'other@cstats.test', '{"full_name":"Other Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('25000000-0000-0000-0000-000000000001', 'Stats Travel', 'stats-travel', '1010008888'),
  ('25000000-0000-0000-0000-000000000002', 'Other Travel', 'other-stats-travel', '1010009999');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('15000000-0000-0000-0000-0000000000a0'::uuid, '25000000-0000-0000-0000-000000000001'::uuid),
  ('15000000-0000-0000-0000-0000000000b0'::uuid, '25000000-0000-0000-0000-000000000002'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

-- c1: 2 live bookings + 1 deleted, an invoice with 2 payments (300 + 200)
--     and a deleted invoice with a payment (ignored).
-- c2: nothing yet.
-- c3: belongs to the other agency.
insert into public.customers (id, tenant_id, full_name, updated_at) values
  ('35000000-0000-0000-0000-0000000000c1', '25000000-0000-0000-0000-000000000001', 'Busy Customer', '2026-01-01'),
  ('35000000-0000-0000-0000-0000000000c2', '25000000-0000-0000-0000-000000000001', 'New Customer', '2026-02-01'),
  ('35000000-0000-0000-0000-0000000000c3', '25000000-0000-0000-0000-000000000002', 'Other Customer', '2026-01-01');

insert into public.bookings (tenant_id, customer_id, booking_number, title, created_at, updated_at, deleted_at) values
  ('25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-0000000000c1', 'B-1', 'Trip 1', '2026-03-01', '2026-03-05', null),
  ('25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-0000000000c1', 'B-2', 'Trip 2', '2026-04-01', '2026-04-01', null),
  ('25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-0000000000c1', 'B-3', 'Deleted', '2026-09-01', '2026-09-01', now());

insert into public.invoices (id, tenant_id, customer_id, invoice_number, total, deleted_at) values
  ('55000000-0000-0000-0000-0000000000a1', '25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-0000000000c1', 'I-1', 1000, null),
  ('55000000-0000-0000-0000-0000000000a2', '25000000-0000-0000-0000-000000000001', '35000000-0000-0000-0000-0000000000c1', 'I-2', 900, now());

insert into public.payments (tenant_id, invoice_id, amount, method, paid_at) values
  ('25000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-0000000000a1', 300, 'cash', '2026-05-01'),
  ('25000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-0000000000a1', 200, 'cash', '2026-06-10'),
  ('25000000-0000-0000-0000-000000000001', '55000000-0000-0000-0000-0000000000a2', 900, 'cash', '2026-10-01');

select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;

select is(
  (select bookings_count from public.customer_list_stats(array['35000000-0000-0000-0000-0000000000c1'::uuid])),
  2, 'counts live bookings only');
select is(
  (select total_spent from public.customer_list_stats(array['35000000-0000-0000-0000-0000000000c1'::uuid])),
  500.00::numeric, 'sums payments on live invoices only');
select is(
  (select last_activity_at from public.customer_list_stats(array['35000000-0000-0000-0000-0000000000c1'::uuid])),
  '2026-06-10'::timestamptz, 'last activity = latest booking change or payment');
select is(
  (select row(bookings_count, total_spent, last_activity_at)::text
   from public.customer_list_stats(array['35000000-0000-0000-0000-0000000000c2'::uuid])),
  row(0, 0::numeric, '2026-02-01'::timestamptz)::text,
  'a customer with no bookings: zeros, last activity = the record itself');
select is(
  (select count(*)::integer from public.customer_list_stats(array[
    '35000000-0000-0000-0000-0000000000c1'::uuid,
    '35000000-0000-0000-0000-0000000000c3'::uuid])),
  1, 'another agency''s customer is not returned');

reset role;
select set_config('request.jwt.claims', '{"sub":"15000000-0000-0000-0000-0000000000b0","role":"authenticated"}', true);
set local role authenticated;
select is(
  (select count(*)::integer from public.customer_list_stats(array['35000000-0000-0000-0000-0000000000c1'::uuid])),
  0, 'other agency owner sees nothing for this agency''s customer');

reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok('select * from public.customer_list_stats(array[]::uuid[])', '42501', null,
  'anon cannot execute it');

select * from finish();

rollback;
