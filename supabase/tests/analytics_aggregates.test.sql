-- pgTAP: analytics/usage aggregate functions (20261027120000).
-- 1500 invoices on purpose: more than PostgREST's max_rows (1000), the
-- cap that made the old JavaScript sums wrong. Also checks RLS still
-- scopes the totals per role. Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, email, raw_user_meta_data) values
  ('12000000-0000-0000-0000-0000000000a0', 'owner@agg.test', '{"full_name":"Owner"}'),
  ('12000000-0000-0000-0000-0000000000c1', 's1@agg.test', '{"full_name":"Agent One"}'),
  ('12000000-0000-0000-0000-0000000000c2', 's2@agg.test', '{"full_name":"Agent Two"}');

insert into public.tenants (id, name, slug, cr_number)
values ('22000000-0000-0000-0000-000000000001', 'Aggregates Travel', 'aggregates-travel', '1010003333');

update public.profiles p
set tenant_id = '22000000-0000-0000-0000-000000000001', role = r.role::public.user_role
from (values
  ('12000000-0000-0000-0000-0000000000a0'::uuid, 'agency_owner'),
  ('12000000-0000-0000-0000-0000000000c1'::uuid, 'sales_agent'),
  ('12000000-0000-0000-0000-0000000000c2'::uuid, 'sales_agent')
) as r(id, role)
where p.id = r.id;

insert into public.customers (id, tenant_id, full_name, assigned_to) values
  ('32000000-0000-0000-0000-0000000000c1', '22000000-0000-0000-0000-000000000001', 'Big Customer', '12000000-0000-0000-0000-0000000000c1'),
  ('32000000-0000-0000-0000-0000000000c2', '22000000-0000-0000-0000-000000000001', 'Small Customer', '12000000-0000-0000-0000-0000000000c2');

insert into public.bookings (id, tenant_id, customer_id, booking_number, title, status, assigned_to) values
  ('42000000-0000-0000-0000-0000000000b1', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-0000000000c1', 'AG-1', 'Big trip', 'confirmed', '12000000-0000-0000-0000-0000000000c1'),
  ('42000000-0000-0000-0000-0000000000b2', '22000000-0000-0000-0000-000000000001', '32000000-0000-0000-0000-0000000000c2', 'AG-2', 'Small trip', 'pending', '12000000-0000-0000-0000-0000000000c2');

-- 1500 invoices of 1.00 for agent one's customer, one of 100.00 for
-- agent two's, and one soft-deleted invoice that must never count.
insert into public.invoices (tenant_id, invoice_number, booking_id, customer_id, total)
select '22000000-0000-0000-0000-000000000001', 'BIG-' || n,
       '42000000-0000-0000-0000-0000000000b1', '32000000-0000-0000-0000-0000000000c1', 1
from generate_series(1, 1500) as n;

insert into public.invoices (id, tenant_id, invoice_number, booking_id, customer_id, total) values
  ('52000000-0000-0000-0000-0000000000a2', '22000000-0000-0000-0000-000000000001', 'SMALL-1', '42000000-0000-0000-0000-0000000000b2', '32000000-0000-0000-0000-0000000000c2', 100);

insert into public.invoices (tenant_id, invoice_number, customer_id, total, deleted_at) values
  ('22000000-0000-0000-0000-000000000001', 'DELETED-1', '32000000-0000-0000-0000-0000000000c2', 999, now());

-- 10 payments of 2.00 on agent one's invoices (paid now), plus one with
-- no paid_at (counts in the total, not in any month).
insert into public.payments (tenant_id, invoice_id, amount, method, paid_at)
select '22000000-0000-0000-0000-000000000001', i.id, 2, 'cash', now()
from public.invoices i
where i.invoice_number in (select 'BIG-' || n from generate_series(1, 10) as n);

insert into public.payments (tenant_id, invoice_id, amount, method, paid_at)
values ('22000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-0000000000a2', 5, 'cash', null);

insert into public.documents (tenant_id, owner_type, owner_id, document_type, file_name, file_path, mime_type, file_size, deleted_at) values
  ('22000000-0000-0000-0000-000000000001', 'booking', '42000000-0000-0000-0000-0000000000b1', 'booking_attachment', 'a.pdf', '22000000-0000-0000-0000-000000000001/a.pdf', 'application/pdf', 10, null),
  ('22000000-0000-0000-0000-000000000001', 'booking', '42000000-0000-0000-0000-0000000000b1', 'booking_attachment', 'b.pdf', '22000000-0000-0000-0000-000000000001/b.pdf', 'application/pdf', 20, null),
  ('22000000-0000-0000-0000-000000000001', 'booking', '42000000-0000-0000-0000-0000000000b2', 'booking_attachment', 'c.pdf', '22000000-0000-0000-0000-000000000001/c.pdf', 'application/pdf', 30, null),
  ('22000000-0000-0000-0000-000000000001', 'booking', '42000000-0000-0000-0000-0000000000b2', 'booking_attachment', 'gone.pdf', '22000000-0000-0000-0000-000000000001/gone.pdf', 'application/pdf', 999, now());

-- ---------------------------------------------------------------
-- Owner: whole agency, exact past 1000 rows
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;

select is((select total_revenue from public.analytics_finance_totals()), 1600.00::numeric,
  'owner: total revenue sums all 1501 live invoices (past the 1000-row cap), excludes deleted');
select is((select paid_amount from public.analytics_finance_totals()), 25.00::numeric,
  'owner: paid amount sums every payment');
select is(
  (select invoice_total from public.analytics_revenue_by_month(date_trunc('month', now())::date)
   where month = to_char(now() at time zone 'UTC', 'YYYY-MM')),
  1600.00::numeric,
  'owner: this month''s invoiced total');
select is(
  (select paid_total from public.analytics_revenue_by_month(date_trunc('month', now())::date)
   where month = to_char(now() at time zone 'UTC', 'YYYY-MM')),
  20.00::numeric,
  'owner: this month''s paid total skips the payment with no paid_at');
select is(
  (select array_agg(status::text || '=' || booking_count order by status)::text
   from public.analytics_booking_status_counts()),
  '{pending=1,confirmed=1}',
  'owner: bookings per status');
select is(
  (select array_agg(revenue order by revenue desc)::text from public.analytics_top_customers(5)),
  '{1500.00,100.00}',
  'owner: top customers by invoiced total');
select is((select count(*)::int from public.analytics_top_customers(1)), 1,
  'top customers respects the limit');
select is(
  (select document_count || ':' || storage_bytes from public.usage_document_totals()),
  '3:60',
  'owner: document count and bytes exclude deleted documents');

reset role;

-- ---------------------------------------------------------------
-- Sales agent two: only its own revenue (RLS applies inside)
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"12000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
set local role authenticated;

select is((select total_revenue from public.analytics_finance_totals()), 100.00::numeric,
  'sales agent: revenue covers only its own invoices');
select is((select paid_amount from public.analytics_finance_totals()), 5.00::numeric,
  'sales agent: paid covers only payments on its own invoices');
select is(
  (select array_agg(customer_id)::text from public.analytics_top_customers(5)),
  '{32000000-0000-0000-0000-0000000000c2}',
  'sales agent: top customers only from its own invoices');
select is(
  (select array_agg(status::text || '=' || booking_count)::text from public.analytics_booking_status_counts()),
  '{pending=1}',
  'sales agent: only its own bookings');
select is(
  (select document_count || ':' || storage_bytes from public.usage_document_totals()),
  '1:30',
  'sales agent: only documents on its own records');

reset role;

-- ---------------------------------------------------------------
-- Function hygiene
-- ---------------------------------------------------------------
select is(
  (select bool_and(not prosecdef) from pg_proc
   where proname in ('analytics_finance_totals', 'analytics_revenue_by_month',
                     'analytics_booking_status_counts', 'analytics_top_customers',
                     'usage_document_totals')),
  true,
  'every aggregate is security invoker (RLS applies)');
select is(
  (select bool_and('search_path=""' = any(proconfig)) from pg_proc
   where proname in ('analytics_finance_totals', 'analytics_revenue_by_month',
                     'analytics_booking_status_counts', 'analytics_top_customers',
                     'usage_document_totals')),
  true,
  'every aggregate has an empty search_path');
select is(
  has_function_privilege('anon', 'public.analytics_finance_totals()', 'execute'),
  false,
  'anon cannot execute the aggregates');

select * from finish();

rollback;
