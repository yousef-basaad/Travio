-- pgTAP: plan limits are enforced (20261110130000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1c300000-0000-0000-0000-0000000000a1', 'owner-a@limits.test', '{"full_name":"Owner A"}'),
  ('1c300000-0000-0000-0000-0000000000b1', 'owner-b@limits.test', '{"full_name":"Owner B"}'),
  ('1c300000-0000-0000-0000-0000000000c1', 'owner-c@limits.test', '{"full_name":"Owner C"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2c300000-0000-0000-0000-00000000000a', 'Limited', 'limited-agency', '1190000001'),
  ('2c300000-0000-0000-0000-00000000000b', 'Unlimited', 'unlimited-agency', '1190000002'),
  ('2c300000-0000-0000-0000-00000000000c', 'No Plan', 'no-plan-agency', '1190000003');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('1c300000-0000-0000-0000-0000000000a1'::uuid, '2c300000-0000-0000-0000-00000000000a'::uuid),
  ('1c300000-0000-0000-0000-0000000000b1'::uuid, '2c300000-0000-0000-0000-00000000000b'::uuid),
  ('1c300000-0000-0000-0000-0000000000c1'::uuid, '2c300000-0000-0000-0000-00000000000c'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

insert into public.plans (id, name, slug, price, "interval") values
  ('5c300000-0000-0000-0000-00000000000a', 'Tiny', 'tiny-limits', 1, 'monthly'),
  ('5c300000-0000-0000-0000-00000000000b', 'Huge', 'huge-limits', 1, 'monthly');
insert into public.plan_features (plan_id, feature_key, feature_value) values
  ('5c300000-0000-0000-0000-00000000000a', 'max_bookings_monthly', '2'),
  ('5c300000-0000-0000-0000-00000000000a', 'max_documents', '2'),
  ('5c300000-0000-0000-0000-00000000000a', 'max_storage_mb', '1'),
  ('5c300000-0000-0000-0000-00000000000b', 'max_bookings_monthly', 'unlimited'),
  ('5c300000-0000-0000-0000-00000000000b', 'max_documents', 'unlimited');
insert into public.subscriptions (tenant_id, plan_id, status) values
  ('2c300000-0000-0000-0000-00000000000a', '5c300000-0000-0000-0000-00000000000a', 'active'),
  ('2c300000-0000-0000-0000-00000000000b', '5c300000-0000-0000-0000-00000000000b', 'active');

alter table public.bookings alter column title set default 'Trip';
insert into public.customers (id, tenant_id, full_name) values
  ('3c300000-0000-0000-0000-00000000000a', '2c300000-0000-0000-0000-00000000000a', 'A'),
  ('3c300000-0000-0000-0000-00000000000b', '2c300000-0000-0000-0000-00000000000b', 'B'),
  ('3c300000-0000-0000-0000-00000000000c', '2c300000-0000-0000-0000-00000000000c', 'C');

-- Last month's booking and a deleted one don't use up this month's limit.
insert into public.bookings (tenant_id, customer_id, booking_number, status, created_at) values
  ('2c300000-0000-0000-0000-00000000000a', '3c300000-0000-0000-0000-00000000000a', 'OLD', 'confirmed', date_trunc('month', now()) - interval '3 days');
insert into public.bookings (tenant_id, customer_id, booking_number, status, deleted_at) values
  ('2c300000-0000-0000-0000-00000000000a', '3c300000-0000-0000-0000-00000000000a', 'DEL', 'confirmed', now());

select set_config('request.jwt.claims', '{"sub":"1c300000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$insert into public.bookings (tenant_id, customer_id, booking_number, status)
    values ('2c300000-0000-0000-0000-00000000000a', '3c300000-0000-0000-0000-00000000000a', 'A-1', 'confirmed')$$,
  'first booking of the month is allowed'
);
select lives_ok(
  $$insert into public.bookings (tenant_id, customer_id, booking_number, status)
    values ('2c300000-0000-0000-0000-00000000000a', '3c300000-0000-0000-0000-00000000000a', 'A-2', 'confirmed')$$,
  'a booking up to the limit is allowed; older and deleted ones do not count'
);
select throws_ok(
  $$insert into public.bookings (tenant_id, customer_id, booking_number, status)
    values ('2c300000-0000-0000-0000-00000000000a', '3c300000-0000-0000-0000-00000000000a', 'A-3', 'confirmed')$$,
  'PL001', 'plan_limit_reached', 'a booking over the monthly limit is refused'
);

select is((select public.check_document_quota(10)), null, 'the quota check allows a small file');
select is((select public.check_document_quota(2 * 1048576)), 'max_storage_mb', 'the quota check flags a file over the storage limit');

select lives_ok(
  $$insert into public.documents (tenant_id, owner_type, document_type, file_name, file_path, mime_type, file_size)
    values ('2c300000-0000-0000-0000-00000000000a', 'agency', 'passport', 'a.pdf', '2c300000-0000-0000-0000-00000000000a/a.pdf', 'application/pdf', 100)$$,
  'a document within the limits is allowed'
);
select throws_ok(
  $$insert into public.documents (tenant_id, owner_type, document_type, file_name, file_path, mime_type, file_size)
    values ('2c300000-0000-0000-0000-00000000000a', 'agency', 'passport', 'big.pdf', '2c300000-0000-0000-0000-00000000000a/big.pdf', 'application/pdf', 2097152)$$,
  'PL001', 'plan_limit_reached', 'a document over the storage limit is refused'
);
select lives_ok(
  $$insert into public.documents (tenant_id, owner_type, document_type, file_name, file_path, mime_type, file_size)
    values ('2c300000-0000-0000-0000-00000000000a', 'agency', 'passport', 'b.pdf', '2c300000-0000-0000-0000-00000000000a/b.pdf', 'application/pdf', 100)$$,
  'a second document reaches the count limit'
);
select is((select public.check_document_quota(1)), 'max_documents', 'the quota check flags the document count');
select throws_ok(
  $$insert into public.documents (tenant_id, owner_type, document_type, file_name, file_path, mime_type, file_size)
    values ('2c300000-0000-0000-0000-00000000000a', 'agency', 'passport', 'c.pdf', '2c300000-0000-0000-0000-00000000000a/c.pdf', 'application/pdf', 1)$$,
  'PL001', 'plan_limit_reached', 'a document over the count limit is refused'
);

-- "unlimited" and no subscription mean no limit.
select set_config('request.jwt.claims', '{"sub":"1c300000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
insert into public.bookings (tenant_id, customer_id, booking_number, status)
select '2c300000-0000-0000-0000-00000000000b', '3c300000-0000-0000-0000-00000000000b', 'B-' || g, 'confirmed' from generate_series(1, 5) g;
select is((select count(*)::int from public.bookings), 5, 'an unlimited plan is not limited');

select set_config('request.jwt.claims', '{"sub":"1c300000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
insert into public.bookings (tenant_id, customer_id, booking_number, status)
select '2c300000-0000-0000-0000-00000000000c', '3c300000-0000-0000-0000-00000000000c', 'C-' || g, 'confirmed' from generate_series(1, 5) g;
select is((select count(*)::int from public.bookings), 5, 'an agency without a subscription is not limited');

reset role;
select is(
  (select has_function_privilege('authenticated', 'public.tenant_plan_limit(uuid, text)', 'execute')),
  false,
  'users cannot call the internal limit lookup'
);
select is(
  (select has_function_privilege('anon', 'public.check_document_quota(bigint)', 'execute')),
  false,
  'anon cannot call the quota check'
);

select * from finish();
rollback;
