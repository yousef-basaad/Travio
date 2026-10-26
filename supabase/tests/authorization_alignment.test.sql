-- pgTAP: Phase 2 authorization alignment (20261026120000).
-- One agency with every staff role plus a portal customer. Checks that
-- child rows follow their parent's visibility, that writes are limited
-- to the API's role lists, and that convert_crm_lead() respects role and
-- ownership. Runs in one transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(30);

-- ---------------------------------------------------------------
-- Fixtures (as postgres, which bypasses RLS)
-- ---------------------------------------------------------------
-- Users: owner, branch manager, two sales agents, visa officer,
-- accountant, portal customer. handle_new_user() creates each profile.
insert into auth.users (id, email, raw_user_meta_data) values
  ('10000000-0000-0000-0000-0000000000a0', 'owner@aa.test', '{"full_name":"Owner"}'),
  ('10000000-0000-0000-0000-0000000000b0', 'bm@aa.test', '{"full_name":"Branch Manager"}'),
  ('10000000-0000-0000-0000-0000000000c1', 's1@aa.test', '{"full_name":"Agent One"}'),
  ('10000000-0000-0000-0000-0000000000c2', 's2@aa.test', '{"full_name":"Agent Two"}'),
  ('10000000-0000-0000-0000-0000000000d0', 'vo@aa.test', '{"full_name":"Visa Officer"}'),
  ('10000000-0000-0000-0000-0000000000e0', 'ac@aa.test', '{"full_name":"Accountant"}'),
  ('10000000-0000-0000-0000-0000000000f0', 'pc@aa.test', '{"full_name":"Portal Customer"}');

insert into public.tenants (id, name, slug, cr_number)
values ('20000000-0000-0000-0000-000000000001', 'Alignment Travel', 'alignment-travel', '1010001111');

update public.profiles p
set tenant_id = '20000000-0000-0000-0000-000000000001', role = r.role::public.user_role
from (values
  ('10000000-0000-0000-0000-0000000000a0'::uuid, 'agency_owner'),
  ('10000000-0000-0000-0000-0000000000b0'::uuid, 'branch_manager'),
  ('10000000-0000-0000-0000-0000000000c1'::uuid, 'sales_agent'),
  ('10000000-0000-0000-0000-0000000000c2'::uuid, 'sales_agent'),
  ('10000000-0000-0000-0000-0000000000d0'::uuid, 'visa_officer'),
  ('10000000-0000-0000-0000-0000000000e0'::uuid, 'accountant')
) as r(id, role)
where p.id = r.id;

-- Customers: c1 -> agent one, c2 -> agent two, c3 unassigned.
insert into public.customers (id, tenant_id, full_name, email, assigned_to) values
  ('30000000-0000-0000-0000-0000000000c1', '20000000-0000-0000-0000-000000000001', 'Customer One', 'c1@cust.test', '10000000-0000-0000-0000-0000000000c1'),
  ('30000000-0000-0000-0000-0000000000c2', '20000000-0000-0000-0000-000000000001', 'Customer Two', 'c2@cust.test', '10000000-0000-0000-0000-0000000000c2'),
  ('30000000-0000-0000-0000-0000000000c3', '20000000-0000-0000-0000-000000000001', 'Customer Three', null, null);

-- Portal customer linked to c1 (role stays 'customer', no tenant).
update public.profiles set customer_id = '30000000-0000-0000-0000-0000000000c1'
where id = '10000000-0000-0000-0000-0000000000f0';

insert into public.bookings (id, tenant_id, customer_id, booking_number, title, assigned_to) values
  ('40000000-0000-0000-0000-0000000000b1', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000c1', 'BK-1', 'Trip One', '10000000-0000-0000-0000-0000000000c1'),
  ('40000000-0000-0000-0000-0000000000b2', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000c2', 'BK-2', 'Trip Two', '10000000-0000-0000-0000-0000000000c2');

insert into public.booking_flights (tenant_id, booking_id) values
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b1'),
  ('20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-0000000000b2');

insert into public.invoices (id, tenant_id, invoice_number, booking_id, customer_id) values
  ('50000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-000000000001', 'INV-1', '40000000-0000-0000-0000-0000000000b1', '30000000-0000-0000-0000-0000000000c1'),
  ('50000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-000000000001', 'INV-2', '40000000-0000-0000-0000-0000000000b2', '30000000-0000-0000-0000-0000000000c2');

insert into public.invoice_items (tenant_id, invoice_id, description) values
  ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-0000000000a1', 'Item 1'),
  ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-0000000000a2', 'Item 2');

insert into public.payments (tenant_id, invoice_id, amount, method) values
  ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-0000000000a1', 10, 'cash'),
  ('20000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-0000000000a2', 20, 'cash');

insert into public.expenses (tenant_id, title, amount) values
  ('20000000-0000-0000-0000-000000000001', 'Rent', 5);

-- Documents: on booking 1, booking 2, invoice 2, and one agency file.
insert into public.documents (id, tenant_id, owner_type, owner_id, document_type, file_name, file_path, mime_type, file_size) values
  ('60000000-0000-0000-0000-0000000000d1', '20000000-0000-0000-0000-000000000001', 'booking', '40000000-0000-0000-0000-0000000000b1', 'booking_attachment', 'd1.pdf', '20000000-0000-0000-0000-000000000001/d1.pdf', 'application/pdf', 1),
  ('60000000-0000-0000-0000-0000000000d2', '20000000-0000-0000-0000-000000000001', 'booking', '40000000-0000-0000-0000-0000000000b2', 'booking_attachment', 'd2.pdf', '20000000-0000-0000-0000-000000000001/d2.pdf', 'application/pdf', 1),
  ('60000000-0000-0000-0000-0000000000d3', '20000000-0000-0000-0000-000000000001', 'invoice', '50000000-0000-0000-0000-0000000000a2', 'invoice_pdf', 'd3.pdf', '20000000-0000-0000-0000-000000000001/d3.pdf', 'application/pdf', 1),
  ('60000000-0000-0000-0000-0000000000d4', '20000000-0000-0000-0000-000000000001', 'agency', null, 'agency_document', 'd4.pdf', '20000000-0000-0000-0000-000000000001/d4.pdf', 'application/pdf', 1);

-- Stored files: d1/d2 uploaded by the owner, plus a file agent one just
-- uploaded that has no documents row yet.
insert into storage.objects (bucket_id, name, owner_id) values
  ('documents', '20000000-0000-0000-0000-000000000001/d1.pdf', '10000000-0000-0000-0000-0000000000a0'),
  ('documents', '20000000-0000-0000-0000-000000000001/d2.pdf', '10000000-0000-0000-0000-0000000000a0'),
  ('documents', '20000000-0000-0000-0000-000000000001/s1-upload.pdf', '10000000-0000-0000-0000-0000000000c1');

-- Leads: l1 -> agent one (email matches agent two's customer), l2 -> agent two.
insert into public.crm_leads (id, tenant_id, full_name, email, assigned_to) values
  ('70000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-000000000001', 'Lead One', 'c2@cust.test', '10000000-0000-0000-0000-0000000000c1'),
  ('70000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-000000000001', 'Lead Two', null, '10000000-0000-0000-0000-0000000000c2');

insert into public.crm_notes (tenant_id, lead_id, body) values
  ('20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-0000000000a2', 'note on lead two');

insert into public.crm_activities (tenant_id, lead_id, title, type) values
  ('20000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-0000000000a2', 'call lead two', 'call');

-- Visas: v1 on c1 and v2 on c2 (both assigned to the branch manager),
-- v3 on c3 assigned to the visa officer.
insert into public.visa_applications (id, tenant_id, customer_id, assigned_to) values
  ('80000000-0000-0000-0000-0000000000a1', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000c1', '10000000-0000-0000-0000-0000000000b0'),
  ('80000000-0000-0000-0000-0000000000a2', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000c2', '10000000-0000-0000-0000-0000000000b0'),
  ('80000000-0000-0000-0000-0000000000a3', '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-0000000000c3', '10000000-0000-0000-0000-0000000000d0');


-- ---------------------------------------------------------------
-- Sales agent one: only its own records and their children
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.booking_flights), 1,
  'sales agent sees flights only on its own booking');
select is((select count(*)::int from public.invoices), 1,
  'sales agent sees only invoices on its own booking/customer');
select is((select count(*)::int from public.invoice_items), 1,
  'sales agent sees only items of invoices it can see');
select is((select count(*)::int from public.payments), 1,
  'sales agent sees only payments of invoices it can see');
select is((select count(*)::int from public.expenses), 0,
  'sales agent sees no expenses');
select is(
  (select count(*)::int from public.documents
   where id in ('60000000-0000-0000-0000-0000000000d1', '60000000-0000-0000-0000-0000000000d4')),
  2, 'sales agent sees documents on its own booking and agency documents');
select is(
  (select count(*)::int from public.documents
   where id in ('60000000-0000-0000-0000-0000000000d2', '60000000-0000-0000-0000-0000000000d3')),
  0, 'sales agent cannot see documents on another agent''s booking or invoice');
select is(
  (select count(*)::int from storage.objects where bucket_id = 'documents'),
  2, 'sales agent can read its own upload and its own booking''s file, not another agent''s');
select is((select count(*)::int from public.crm_notes), 0,
  'sales agent cannot see notes on another agent''s lead');
select is((select count(*)::int from public.crm_activities), 0,
  'sales agent cannot see activities on another agent''s lead');
select is(
  (select array_agg(id order by id)::text from public.visa_applications),
  '{80000000-0000-0000-0000-0000000000a1,80000000-0000-0000-0000-0000000000a3}',
  'sales agent sees visas of its own and unassigned customers only');
select throws_ok(
  $$ insert into public.invoices (tenant_id, invoice_number) values (public.current_tenant_id(), 'INV-S1') $$,
  '42501', null,
  'sales agent cannot create invoices');
select results_eq(
  $$ with u as (update public.payments set amount = 0 returning 1) select count(*)::int from u $$,
  $$ values (0) $$,
  'sales agent cannot update payments');
select throws_ok(
  $$ select public.convert_crm_lead('70000000-0000-0000-0000-0000000000a2') $$,
  'P0002', 'Lead not found',
  'sales agent cannot convert another agent''s lead');
select is(
  (select (r ->> 'outcome') || ':' || ((r ->> 'customer_id') = '30000000-0000-0000-0000-0000000000c2')::text
   from (select public.convert_crm_lead('70000000-0000-0000-0000-0000000000a1') as r) x),
  'created:false',
  'converting its own lead never links to another agent''s customer');

reset role;

-- ---------------------------------------------------------------
-- Visa officer
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000d0","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.visa_applications), 1,
  'visa officer sees only visas assigned to it (or unassigned)');
select is((select count(*)::int from public.invoices), 0,
  'visa officer sees no invoices');
select throws_ok(
  $$ insert into public.customers (tenant_id, full_name) values (public.current_tenant_id(), 'VO customer') $$,
  '42501', null,
  'visa officer cannot create customers');
select throws_ok(
  $$ select public.convert_crm_lead('70000000-0000-0000-0000-0000000000a2') $$,
  '42501', 'Not allowed to convert leads',
  'visa officer cannot convert leads');

reset role;

-- ---------------------------------------------------------------
-- Branch manager
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000b0","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.booking_flights), 2,
  'branch manager sees all flights');
select is(
  (select count(*)::int from public.invoices
   where id in ('50000000-0000-0000-0000-0000000000a1', '50000000-0000-0000-0000-0000000000a2')),
  2, 'branch manager reads all invoices');
select throws_ok(
  $$ insert into public.invoices (tenant_id, invoice_number) values (public.current_tenant_id(), 'INV-BM') $$,
  '42501', null,
  'branch manager cannot create invoices (finance is accountant/owner)');

reset role;

-- ---------------------------------------------------------------
-- Accountant
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000e0","role":"authenticated"}', true);
set local role authenticated;

select is(
  (select count(*)::int from public.invoices
   where id in ('50000000-0000-0000-0000-0000000000a1', '50000000-0000-0000-0000-0000000000a2')),
  2, 'accountant reads all invoices');
select lives_ok(
  $$ insert into public.invoices (tenant_id, invoice_number) values (public.current_tenant_id(), 'INV-AC') $$,
  'accountant can create invoices');
select is((select count(*)::int from public.visa_applications), 0,
  'accountant sees no visas');
select throws_ok(
  $$ insert into public.bookings (tenant_id, customer_id, booking_number, title)
     values (public.current_tenant_id(), '30000000-0000-0000-0000-0000000000c3', 'BK-AC', 'x') $$,
  '42501', null,
  'accountant cannot create bookings');

reset role;

-- ---------------------------------------------------------------
-- Owner
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.expenses), 1,
  'owner sees expenses');
select is((select count(*)::int from public.visa_applications), 3,
  'owner sees all visas');

reset role;

-- ---------------------------------------------------------------
-- Customer portal is unaffected
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"10000000-0000-0000-0000-0000000000f0","role":"authenticated"}', true);
set local role authenticated;

select is((select count(*)::int from public.invoices), 1,
  'portal customer still sees its own invoice');
select is((select count(*)::int from public.booking_flights), 1,
  'portal customer still sees flights on its own booking');

reset role;

select * from finish();

rollback;
