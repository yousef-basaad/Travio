-- pgTAP: finance integrity rules (20261112120000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1a700000-0000-0000-0000-0000000000a1', 'owner-a@finint.test', '{"full_name":"Owner A"}'),
  ('1a700000-0000-0000-0000-0000000000b1', 'owner-b@finint.test', '{"full_name":"Owner B"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2a700000-0000-0000-0000-00000000000a', 'Finance A', 'finint-a', '1230000001'),
  ('2a700000-0000-0000-0000-00000000000b', 'Finance B', 'finint-b', '1230000002');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('1a700000-0000-0000-0000-0000000000a1'::uuid, '2a700000-0000-0000-0000-00000000000a'::uuid),
  ('1a700000-0000-0000-0000-0000000000b1'::uuid, '2a700000-0000-0000-0000-00000000000b'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

select set_config('request.jwt.claims', '{"sub":"1a700000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

insert into public.invoices (id, tenant_id, invoice_number, status, total) values
  ('5a700000-0000-0000-0000-000000000001', '2a700000-0000-0000-0000-00000000000a', 'FI-1', 'issued', 1000);

-- Item totals.
insert into public.invoice_items (id, tenant_id, invoice_id, description, quantity, unit_price, total) values
  ('6a700000-0000-0000-0000-000000000001', '2a700000-0000-0000-0000-00000000000a', '5a700000-0000-0000-0000-000000000001', 'Flights', 2, 100, 5);
select is((select total from public.invoice_items where id = '6a700000-0000-0000-0000-000000000001'), 200.00::numeric,
  'an item''s total is quantity x unit price, whatever was sent');
select is((select total from public.invoices where id = '5a700000-0000-0000-0000-000000000001'), 200.00::numeric,
  'an invoice with items totals to them');

insert into public.invoice_items (tenant_id, invoice_id, description, quantity, unit_price) values
  ('2a700000-0000-0000-0000-00000000000a', '5a700000-0000-0000-0000-000000000001', 'Hotel', 1, 300);
select is((select total from public.invoices where id = '5a700000-0000-0000-0000-000000000001'), 500.00::numeric,
  'adding an item raises the invoice total');

update public.invoice_items set total = 99999 where id = '6a700000-0000-0000-0000-000000000001';
select is((select total from public.invoice_items where id = '6a700000-0000-0000-0000-000000000001'), 200.00::numeric,
  'an item''s total cannot be edited away from quantity x unit price');

-- Payments and status.
insert into public.payments (id, tenant_id, invoice_id, amount, method) values
  ('7a700000-0000-0000-0000-000000000001', '2a700000-0000-0000-0000-00000000000a', '5a700000-0000-0000-0000-000000000001', 200, 'cash');
select is((select status::text from public.invoices where id = '5a700000-0000-0000-0000-000000000001'), 'partially_paid',
  'a part payment marks the invoice partially paid');

select throws_ok(
  $$insert into public.payments (tenant_id, invoice_id, amount, method)
    values ('2a700000-0000-0000-0000-00000000000a', '5a700000-0000-0000-0000-000000000001', 300.01, 'cash')$$,
  'PL002', 'payment_exceeds_balance', 'a payment over the balance is refused'
);
select throws_ok(
  $$update public.payments set amount = 501 where id = '7a700000-0000-0000-0000-000000000001'$$,
  'PL002', 'payment_exceeds_balance', 'a payment cannot be edited over the invoice total'
);

insert into public.payments (id, tenant_id, invoice_id, amount, method) values
  ('7a700000-0000-0000-0000-000000000002', '2a700000-0000-0000-0000-00000000000a', '5a700000-0000-0000-0000-000000000001', 300, 'card');
select is((select status::text from public.invoices where id = '5a700000-0000-0000-0000-000000000001'), 'paid',
  'paying the balance marks the invoice paid');

select throws_ok(
  $$delete from public.invoice_items where id = '6a700000-0000-0000-0000-000000000001'$$,
  'PL002', 'invoice_total_below_paid', 'an item cannot be removed if the total would drop below what was paid'
);
select throws_ok(
  $$update public.invoices set total = 100 where id = '5a700000-0000-0000-0000-000000000001'$$,
  'PL002', 'invoice_total_below_paid', 'a total cannot be set below what was paid'
);

delete from public.payments where id = '7a700000-0000-0000-0000-000000000002';
select is((select status::text from public.invoices where id = '5a700000-0000-0000-0000-000000000001'), 'partially_paid',
  'removing a payment steps the status back');
delete from public.payments where id = '7a700000-0000-0000-0000-000000000001';
select is((select status::text from public.invoices where id = '5a700000-0000-0000-0000-000000000001'), 'issued',
  'removing every payment returns the invoice to issued');

-- A draft or cancelled invoice.
insert into public.invoices (id, tenant_id, invoice_number, status, total) values
  ('5a700000-0000-0000-0000-000000000002', '2a700000-0000-0000-0000-00000000000a', 'FI-2', 'cancelled', 100),
  ('5a700000-0000-0000-0000-000000000003', '2a700000-0000-0000-0000-00000000000a', 'FI-3', 'draft', 100);
insert into public.payments (tenant_id, invoice_id, amount, method) values
  ('2a700000-0000-0000-0000-00000000000a', '5a700000-0000-0000-0000-000000000002', 100, 'cash');
select is((select status::text from public.invoices where id = '5a700000-0000-0000-0000-000000000002'), 'cancelled',
  'a cancelled invoice stays cancelled');
select is((select status::text from public.invoices where id = '5a700000-0000-0000-0000-000000000003'), 'draft',
  'an unpaid draft stays a draft');
select is((select total from public.invoices where id = '5a700000-0000-0000-0000-000000000003'), 100.00::numeric,
  'an invoice without items keeps its typed total');

-- Invoice numbers.
select throws_ok(
  $$insert into public.invoices (tenant_id, invoice_number, total) values ('2a700000-0000-0000-0000-00000000000a', 'FI-1', 1)$$,
  '23505', 'invoice_number_taken', 'a duplicate invoice number is refused'
);
select throws_ok(
  $$update public.invoices set invoice_number = 'FI-1' where id = '5a700000-0000-0000-0000-000000000003'$$,
  '23505', 'invoice_number_taken', 'an invoice cannot be renamed onto a used number'
);
update public.invoices set deleted_at = now() where id = '5a700000-0000-0000-0000-000000000003';
select lives_ok(
  $$insert into public.invoices (tenant_id, invoice_number, total) values ('2a700000-0000-0000-0000-00000000000a', 'FI-3', 1)$$,
  'a deleted invoice frees its number'
);

-- Dates.
select throws_ok(
  $$insert into public.invoices (tenant_id, invoice_number, total, issue_date, due_date)
    values ('2a700000-0000-0000-0000-00000000000a', 'FI-D', 1, '2026-11-10', '2026-11-01')$$,
  '23514', null, 'a due date before the issue date is refused'
);

-- Another agency may use the same number.
select set_config('request.jwt.claims', '{"sub":"1a700000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select lives_ok(
  $$insert into public.invoices (tenant_id, invoice_number, total) values ('2a700000-0000-0000-0000-00000000000b', 'FI-1', 1)$$,
  'another agency can use the same invoice number'
);

reset role;
select is(
  (select has_function_privilege('authenticated', 'public.invoice_sync_status(uuid)', 'execute')),
  false,
  'users cannot call the status sync directly'
);

select * from finish();
rollback;
