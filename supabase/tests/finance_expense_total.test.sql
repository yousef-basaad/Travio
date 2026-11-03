-- pgTAP: finance_expense_total() (20261104120000). 1500 expenses on
-- purpose: more than PostgREST's max_rows (1000). Also checks RLS still
-- scopes the total per role and per tenant. Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(5);

insert into auth.users (id, email, raw_user_meta_data) values
  ('13000000-0000-0000-0000-0000000000a0', 'owner@exp.test', '{"full_name":"Owner"}'),
  ('13000000-0000-0000-0000-0000000000ac', 'acct@exp.test', '{"full_name":"Accountant"}'),
  ('13000000-0000-0000-0000-0000000000c1', 'agent@exp.test', '{"full_name":"Agent"}'),
  ('13000000-0000-0000-0000-0000000000b0', 'other@exp.test', '{"full_name":"Other Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('23000000-0000-0000-0000-000000000001', 'Expense Travel', 'expense-travel', '1010004444'),
  ('23000000-0000-0000-0000-000000000002', 'Other Travel', 'other-expense-travel', '1010005555');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('13000000-0000-0000-0000-0000000000a0'::uuid, '23000000-0000-0000-0000-000000000001'::uuid, 'agency_owner'),
  ('13000000-0000-0000-0000-0000000000ac'::uuid, '23000000-0000-0000-0000-000000000001'::uuid, 'accountant'),
  ('13000000-0000-0000-0000-0000000000c1'::uuid, '23000000-0000-0000-0000-000000000001'::uuid, 'sales_agent'),
  ('13000000-0000-0000-0000-0000000000b0'::uuid, '23000000-0000-0000-0000-000000000002'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

-- 1500 expenses of 1.50 in the first agency, one of 70.00 in the other.
insert into public.expenses (tenant_id, title, amount)
select '23000000-0000-0000-0000-000000000001', 'Expense ' || n, 1.5
from generate_series(1, 1500) as n;

insert into public.expenses (tenant_id, title, amount)
values ('23000000-0000-0000-0000-000000000002', 'Other agency rent', 70);

select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;
select is(public.finance_expense_total(), 2250.00::numeric,
  'owner: sums all 1500 expenses (past the 1000-row cap), own agency only');

reset role;
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-0000000000ac","role":"authenticated"}', true);
set local role authenticated;
select is(public.finance_expense_total(), 2250.00::numeric,
  'accountant: same agency total');

reset role;
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;
select is(public.finance_expense_total(), 0::numeric,
  'sales agent: expenses are hidden by RLS, so the total is 0');

reset role;
select set_config('request.jwt.claims', '{"sub":"13000000-0000-0000-0000-0000000000b0","role":"authenticated"}', true);
set local role authenticated;
select is(public.finance_expense_total(), 70.00::numeric,
  'other agency owner: only its own expenses');

reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok('select public.finance_expense_total()', '42501', null,
  'anon cannot execute it');

select * from finish();

rollback;
