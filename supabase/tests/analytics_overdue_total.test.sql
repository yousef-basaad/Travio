-- pgTAP: analytics_overdue_total() (20261105120000). 1200 overdue
-- invoices on purpose: more than PostgREST's max_rows (1000). Also
-- checks which invoices count as overdue, partial payments, and that RLS
-- keeps each agency to its own invoices. Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(4);

insert into auth.users (id, email, raw_user_meta_data) values
  ('14000000-0000-0000-0000-0000000000a0', 'owner@overdue.test', '{"full_name":"Owner"}'),
  ('14000000-0000-0000-0000-0000000000b0', 'other@overdue.test', '{"full_name":"Other Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('24000000-0000-0000-0000-000000000001', 'Overdue Travel', 'overdue-travel', '1010006666'),
  ('24000000-0000-0000-0000-000000000002', 'Other Travel', 'other-overdue-travel', '1010007777');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('14000000-0000-0000-0000-0000000000a0'::uuid, '24000000-0000-0000-0000-000000000001'::uuid),
  ('14000000-0000-0000-0000-0000000000b0'::uuid, '24000000-0000-0000-0000-000000000002'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

-- First agency: 1200 issued invoices of 1.00, due yesterday (overdue).
insert into public.invoices (tenant_id, invoice_number, status, total, due_date)
select '24000000-0000-0000-0000-000000000001', 'OD-' || n, 'issued', 1, current_date - 1
from generate_series(1, 1200) as n;

-- Partially paid 100.00, 40.00 paid, overdue -> 60.00 still owed.
insert into public.invoices (id, tenant_id, invoice_number, status, total, due_date) values
  ('54000000-0000-0000-0000-0000000000a1', '24000000-0000-0000-0000-000000000001', 'PART-1', 'partially_paid', 100, current_date - 10);
insert into public.payments (tenant_id, invoice_id, amount, method)
values ('24000000-0000-0000-0000-000000000001', '54000000-0000-0000-0000-0000000000a1', 40, 'cash');

-- Never overdue: due today/later, no due date, draft, paid, cancelled, deleted.
insert into public.invoices (tenant_id, invoice_number, status, total, due_date, deleted_at) values
  ('24000000-0000-0000-0000-000000000001', 'TODAY', 'issued', 500, current_date, null),
  ('24000000-0000-0000-0000-000000000001', 'LATER', 'issued', 500, current_date + 5, null),
  ('24000000-0000-0000-0000-000000000001', 'NODUE', 'issued', 500, null, null),
  ('24000000-0000-0000-0000-000000000001', 'DRAFT', 'draft', 500, current_date - 5, null),
  ('24000000-0000-0000-0000-000000000001', 'PAID', 'paid', 500, current_date - 5, null),
  ('24000000-0000-0000-0000-000000000001', 'VOID', 'cancelled', 500, current_date - 5, null),
  ('24000000-0000-0000-0000-000000000001', 'GONE', 'issued', 500, current_date - 5, now());

-- Overpaid overdue invoice: counts as 0, not negative.
insert into public.invoices (id, tenant_id, invoice_number, status, total, due_date) values
  ('54000000-0000-0000-0000-0000000000a2', '24000000-0000-0000-0000-000000000001', 'OVER', 'issued', 10, current_date - 3);
insert into public.payments (tenant_id, invoice_id, amount, method)
values ('24000000-0000-0000-0000-000000000001', '54000000-0000-0000-0000-0000000000a2', 25, 'cash');

-- Other agency: one overdue invoice of 70.00.
insert into public.invoices (tenant_id, invoice_number, status, total, due_date)
values ('24000000-0000-0000-0000-000000000002', 'OTHER-1', 'issued', 70, current_date - 1);

select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;
select is((select overdue_amount from public.analytics_overdue_total()), 1260.00::numeric,
  'owner: 1200 x 1.00 + 60.00 still owed on the partial invoice (past the 1000-row cap)');
select is((select overdue_count from public.analytics_overdue_total()), 1201,
  'owner: counts only invoices that still owe money');

reset role;
select set_config('request.jwt.claims', '{"sub":"14000000-0000-0000-0000-0000000000b0","role":"authenticated"}', true);
set local role authenticated;
select is((select overdue_amount from public.analytics_overdue_total()), 70.00::numeric,
  'other agency owner: only its own invoices');

reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok('select * from public.analytics_overdue_total()', '42501', null,
  'anon cannot execute it');

select * from finish();

rollback;
