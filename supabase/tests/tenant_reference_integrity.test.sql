-- pgTAP: references stay inside one agency (20261110120000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1b200000-0000-0000-0000-0000000000a1', 'owner-a@integrity.test', '{"full_name":"Owner A"}'),
  ('1b200000-0000-0000-0000-0000000000b1', 'owner-b@integrity.test', '{"full_name":"Owner B"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2b200000-0000-0000-0000-00000000000a', 'Integrity A', 'integrity-a', '1180000001'),
  ('2b200000-0000-0000-0000-00000000000b', 'Integrity B', 'integrity-b', '1180000002');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('1b200000-0000-0000-0000-0000000000a1'::uuid, '2b200000-0000-0000-0000-00000000000a'::uuid),
  ('1b200000-0000-0000-0000-0000000000b1'::uuid, '2b200000-0000-0000-0000-00000000000b'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

alter table public.bookings alter column title set default 'Trip';

insert into public.customers (id, tenant_id, full_name) values
  ('3b200000-0000-0000-0000-00000000000a', '2b200000-0000-0000-0000-00000000000a', 'Customer A'),
  ('3b200000-0000-0000-0000-00000000000b', '2b200000-0000-0000-0000-00000000000b', 'Customer B');
insert into public.bookings (id, tenant_id, customer_id, booking_number, status) values
  ('4b200000-0000-0000-0000-00000000000a', '2b200000-0000-0000-0000-00000000000a', '3b200000-0000-0000-0000-00000000000a', 'A-1', 'confirmed'),
  ('4b200000-0000-0000-0000-00000000000b', '2b200000-0000-0000-0000-00000000000b', '3b200000-0000-0000-0000-00000000000b', 'B-1', 'confirmed');
insert into public.invoices (id, tenant_id, customer_id, booking_id, invoice_number, status, total) values
  ('5b200000-0000-0000-0000-00000000000a', '2b200000-0000-0000-0000-00000000000a', '3b200000-0000-0000-0000-00000000000a', '4b200000-0000-0000-0000-00000000000a', 'A-INV', 'issued', 100),
  ('5b200000-0000-0000-0000-00000000000b', '2b200000-0000-0000-0000-00000000000b', '3b200000-0000-0000-0000-00000000000b', '4b200000-0000-0000-0000-00000000000b', 'B-INV', 'issued', 100);

select set_config('request.jwt.claims', '{"sub":"1b200000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$insert into public.bookings (tenant_id, customer_id, booking_number, status)
    values ('2b200000-0000-0000-0000-00000000000a', '3b200000-0000-0000-0000-00000000000b', 'X-1', 'confirmed')$$,
  '42501', null, 'a booking cannot point at another agency''s customer'
);
select lives_ok(
  $$insert into public.bookings (tenant_id, customer_id, booking_number, status)
    values ('2b200000-0000-0000-0000-00000000000a', '3b200000-0000-0000-0000-00000000000a', 'A-2', 'confirmed')$$,
  'a booking for the agency''s own customer works'
);
select throws_ok(
  $$update public.bookings set customer_id = '3b200000-0000-0000-0000-00000000000b' where id = '4b200000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'an existing booking cannot be repointed at another agency''s customer'
);
select throws_ok(
  $$update public.bookings set assigned_to = '1b200000-0000-0000-0000-0000000000b1' where id = '4b200000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'a booking cannot be assigned to another agency''s staff'
);
select throws_ok(
  $$insert into public.invoices (tenant_id, customer_id, invoice_number, status, total)
    values ('2b200000-0000-0000-0000-00000000000a', '3b200000-0000-0000-0000-00000000000b', 'X-INV', 'issued', 1)$$,
  '42501', null, 'an invoice cannot be issued to another agency''s customer'
);
select throws_ok(
  $$insert into public.invoices (tenant_id, booking_id, invoice_number, status, total)
    values ('2b200000-0000-0000-0000-00000000000a', '4b200000-0000-0000-0000-00000000000b', 'X-INV2', 'issued', 1)$$,
  '42501', null, 'an invoice cannot point at another agency''s booking'
);
select throws_ok(
  $$insert into public.payments (tenant_id, invoice_id, amount, method)
    values ('2b200000-0000-0000-0000-00000000000a', '5b200000-0000-0000-0000-00000000000b', 1, 'cash')$$,
  '42501', null, 'a payment cannot be recorded on another agency''s invoice'
);
select lives_ok(
  $$insert into public.payments (tenant_id, invoice_id, amount, method)
    values ('2b200000-0000-0000-0000-00000000000a', '5b200000-0000-0000-0000-00000000000a', 1, 'cash')$$,
  'a payment on the agency''s own invoice works'
);
select throws_ok(
  $$insert into public.visa_applications (tenant_id, customer_id, status)
    values ('2b200000-0000-0000-0000-00000000000a', '3b200000-0000-0000-0000-00000000000b', 'draft')$$,
  '42501', null, 'a visa cannot be filed for another agency''s customer'
);
select throws_ok(
  $$insert into public.bookings (tenant_id, customer_id, booking_number, status)
    values ('2b200000-0000-0000-0000-00000000000a', '3b200000-0000-0000-0000-0000000000ff', 'X-2', 'confirmed')$$,
  '23503', null, 'a reference to nothing is still a foreign key error'
);

select throws_ok(
  $$insert into public.documents (tenant_id, owner_type, owner_id, document_type, file_name, file_path, mime_type, file_size)
    values ('2b200000-0000-0000-0000-00000000000a', 'customer', '3b200000-0000-0000-0000-00000000000b', 'passport', 'a.pdf', 'p/a.pdf', 'application/pdf', 1)$$,
  '42501', null, 'a document cannot be attached to another agency''s customer'
);
select throws_ok(
  $$insert into public.documents (tenant_id, owner_type, owner_id, document_type, file_name, file_path, mime_type, file_size)
    values ('2b200000-0000-0000-0000-00000000000a', 'agency', '2b200000-0000-0000-0000-00000000000b', 'passport', 'a.pdf', 'p/b.pdf', 'application/pdf', 1)$$,
  '42501', null, 'a document cannot be attached to another agency'
);
select lives_ok(
  $$insert into public.documents (tenant_id, owner_type, owner_id, document_type, file_name, file_path, mime_type, file_size)
    values ('2b200000-0000-0000-0000-00000000000a', 'customer', '3b200000-0000-0000-0000-00000000000a', 'passport', 'a.pdf', '2b200000-0000-0000-0000-00000000000a/a.pdf', 'application/pdf', 1)$$,
  'a document on the agency''s own customer works'
);

select throws_ok(
  $$update public.tenants set slug = 'hijack' where id = '2b200000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'an owner cannot change the agency slug directly'
);
select throws_ok(
  $$update public.tenants set is_active = false where id = '2b200000-0000-0000-0000-00000000000a'$$,
  '42501', null, 'an owner cannot change the agency status directly'
);
select lives_ok(
  $$update public.tenants set phone = '+966500000000' where id = '2b200000-0000-0000-0000-00000000000a'$$,
  'an owner can still edit contact details'
);

reset role;

-- A future table linking two tenant-owned tables must add a trigger.
select is(
  (
    select coalesce(array_agg(c.conrelid::regclass::text || '.' || a.attname order by 1), '{}')
    from pg_constraint c
    join pg_attribute a on a.attrelid = c.conrelid and a.attnum = c.conkey[1]
    where c.contype = 'f'
      and c.connamespace = 'public'::regnamespace
      and array_length(c.conkey, 1) = 1
      and c.confrelid <> 'public.tenants'::regclass
      and exists (select 1 from pg_attribute x where x.attrelid = c.conrelid and x.attname = 'tenant_id' and not x.attisdropped)
      and exists (select 1 from pg_attribute x where x.attrelid = c.confrelid and x.attname = 'tenant_id' and not x.attisdropped)
      and not (c.conrelid = 'public.profiles'::regclass and a.attname = 'customer_id')
      and not exists (
        select 1 from pg_trigger t
        where t.tgrelid = c.conrelid and not t.tgisinternal
          and t.tgname = c.conrelid::regclass::text || '_' || a.attname || '_same_tenant'
      )
  ),
  '{}'::text[],
  'every reference between tenant-owned tables is protected'
);

select is(
  (select has_table_privilege('anon', 'public.tenants', 'update')),
  false,
  'anon has no write access to tenants'
);

select * from finish();
rollback;
