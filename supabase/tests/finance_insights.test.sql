-- pgTAP: finance insight functions (20261108120000). 1200 expenses on
-- purpose: more than PostgREST's max_rows (1000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, raw_user_meta_data) values
  ('19000000-0000-0000-0000-0000000000a0', 'owner@fin-insights.test', '{"full_name":"Owner"}'),
  ('19000000-0000-0000-0000-0000000000c1', 'agent@fin-insights.test', '{"full_name":"Agent"}'),
  ('19000000-0000-0000-0000-0000000000b0', 'other@fin-insights.test', '{"full_name":"Other Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('29000000-0000-0000-0000-000000000001', 'Insight Travel', 'insight-travel', '1010002323'),
  ('29000000-0000-0000-0000-000000000002', 'Other Travel', 'other-insight-travel', '1010004545');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('19000000-0000-0000-0000-0000000000a0'::uuid, '29000000-0000-0000-0000-000000000001'::uuid, 'agency_owner'),
  ('19000000-0000-0000-0000-0000000000c1'::uuid, '29000000-0000-0000-0000-000000000001'::uuid, 'sales_agent'),
  ('19000000-0000-0000-0000-0000000000b0'::uuid, '29000000-0000-0000-0000-000000000002'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

-- Expenses: 1200 x 1.00 "Flights" in March; 2 x 50 "Hotels" in April
-- (one dated by its recording time); 30 with no category in April; one
-- before the range; one for the other agency.
insert into public.expenses (tenant_id, title, amount, category, expense_date)
select '29000000-0000-0000-0000-000000000001', 'Ticket ' || n, 1, 'Flights', '2026-03-15'
from generate_series(1, 1200) as n;
insert into public.expenses (tenant_id, title, amount, category, expense_date, created_at) values
  ('29000000-0000-0000-0000-000000000001', 'Hotel A', 50, 'Hotels', '2026-04-02', now()),
  ('29000000-0000-0000-0000-000000000001', 'Hotel B', 50, ' Hotels ', null, '2026-04-20'),
  ('29000000-0000-0000-0000-000000000001', 'Misc', 30, '', '2026-04-05', now()),
  ('29000000-0000-0000-0000-000000000001', 'Old', 999, 'Flights', '2025-12-01', now()),
  ('29000000-0000-0000-0000-000000000002', 'Other', 70, 'Flights', '2026-03-01', now());

-- Invoices: two overdue (one partly paid), one not yet due, one paid.
insert into public.customers (id, tenant_id, full_name) values
  ('39000000-0000-0000-0000-0000000000c1', '29000000-0000-0000-0000-000000000001', 'Late Payer'),
  ('39000000-0000-0000-0000-0000000000c2', '29000000-0000-0000-0000-000000000001', 'Very Late Payer');
insert into public.invoices (id, tenant_id, customer_id, invoice_number, status, total, due_date) values
  ('59000000-0000-0000-0000-0000000000a1', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c1', 'INV-A', 'issued', 400, current_date - 3),
  ('59000000-0000-0000-0000-0000000000a2', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c2', 'INV-B', 'partially_paid', 1000, current_date - 20),
  ('59000000-0000-0000-0000-0000000000a3', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c1', 'INV-C', 'issued', 300, current_date + 5),
  ('59000000-0000-0000-0000-0000000000a4', '29000000-0000-0000-0000-000000000001', '39000000-0000-0000-0000-0000000000c1', 'INV-D', 'paid', 300, current_date - 30);
insert into public.payments (tenant_id, invoice_id, amount, method)
values ('29000000-0000-0000-0000-000000000001', '59000000-0000-0000-0000-0000000000a2', 250, 'cash');

select set_config('request.jwt.claims', '{"sub":"19000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;

select results_eq(
  $$ select month, expense_total from public.finance_expenses_by_month('2026-01-01') $$,
  $$ values ('2026-03', 1200.00::numeric), ('2026-04', 130.00::numeric) $$,
  'expenses per month past the row cap, undated ones by recording date, earlier ones left out');

select results_eq(
  $$ select category, expense_total from public.finance_expenses_by_category() $$,
  $$ values ('Flights', 2199.00::numeric), ('Hotels', 100.00::numeric), ('', 30.00::numeric) $$,
  'expenses per category, trimmed, uncategorized as an empty label, largest first');

select results_eq(
  $$ select invoice_number, customer_name, balance, days_overdue from public.finance_overdue_invoices(5) $$,
  $$ values ('INV-B', 'Very Late Payer', 750.00::numeric, 20), ('INV-A', 'Late Payer', 400.00::numeric, 3) $$,
  'overdue invoices with the amount still owed, most days late first');

select is((select count(*)::integer from public.finance_overdue_invoices(1)), 1, 'overdue list honours the limit');

reset role;
select set_config('request.jwt.claims', '{"sub":"19000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::integer from public.finance_expenses_by_category()), 0,
  'sales agent: expenses hidden by RLS');
select is((select count(*)::integer from public.finance_expenses_by_month('2026-01-01')), 0,
  'sales agent: no monthly expenses');

reset role;
select set_config('request.jwt.claims', '{"sub":"19000000-0000-0000-0000-0000000000b0","role":"authenticated"}', true);
set local role authenticated;
select results_eq(
  $$ select category, expense_total from public.finance_expenses_by_category() $$,
  $$ values ('Flights', 70.00::numeric) $$,
  'other agency owner: only its own expenses');
select is((select count(*)::integer from public.finance_overdue_invoices()), 0,
  'other agency owner: none of this agency''s invoices');

reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok('select * from public.finance_expenses_by_category()', '42501', null, 'anon cannot read categories');
select throws_ok('select * from public.finance_overdue_invoices()', '42501', null, 'anon cannot read overdue invoices');

select * from finish();

rollback;
