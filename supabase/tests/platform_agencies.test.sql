-- pgTAP: agency list, deactivation and its enforcement (20261109120000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(19);

-- Platform-wide list: start from an empty platform (rolled back).
truncate public.tenants, public.profiles cascade;

insert into auth.users (id, email, raw_user_meta_data) values
  ('1b000000-0000-0000-0000-0000000000ad', 'admin@agencies.test', '{"full_name":"Admin"}'),
  ('1b000000-0000-0000-0000-0000000000a1', 'owner1@agencies.test', '{"full_name":"Owner One"}'),
  ('1b000000-0000-0000-0000-0000000000a2', 'owner2@agencies.test', '{"full_name":"Owner Two"}');

insert into public.tenants (id, name, slug, cr_number, email, created_at) values
  ('2b000000-0000-0000-0000-000000000001', 'Alpha Travel', 'alpha-agencies', '1110000001', 'hello@alpha.test', now() - interval '2 days'),
  ('2b000000-0000-0000-0000-000000000002', 'Beta 100% Tours', 'beta-agencies', '1110000002', null, now() - interval '1 day');

-- 25 more agencies to exercise paging, all older.
insert into public.tenants (name, slug, cr_number, created_at)
select 'Filler ' || g, 'filler-' || g, '12200' || lpad(g::text, 5, '0'), now() - interval '10 days' - make_interval(hours => g)
from generate_series(1, 25) g;

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('1b000000-0000-0000-0000-0000000000ad'::uuid, null::uuid, 'travio_admin'),
  ('1b000000-0000-0000-0000-0000000000a1'::uuid, '2b000000-0000-0000-0000-000000000001'::uuid, 'agency_owner'),
  ('1b000000-0000-0000-0000-0000000000a2'::uuid, '2b000000-0000-0000-0000-000000000002'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

insert into public.subscriptions (tenant_id, plan_id, status)
select '2b000000-0000-0000-0000-000000000001', id, 'trialing' from public.plans where slug = 'starter';

alter table public.bookings alter column title set default 'Trip';
insert into public.customers (id, tenant_id, full_name) values
  ('3b000000-0000-0000-0000-0000000000c1', '2b000000-0000-0000-0000-000000000001', 'Alpha Customer');
insert into public.bookings (tenant_id, customer_id, booking_number, status)
values ('2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-0000000000c1', 'A-1', 'confirmed');
insert into public.invoices (tenant_id, customer_id, invoice_number, status, total)
values ('2b000000-0000-0000-0000-000000000001', '3b000000-0000-0000-0000-0000000000c1', 'A-INV', 'issued', 750);

-- Agency staff are refused both functions.
select set_config('request.jwt.claims', '{"sub":"1b000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok('select public.platform_agencies()', '42501', null, 'agency staff cannot list agencies');
select throws_ok(
  $$select public.platform_set_agency_active('2b000000-0000-0000-0000-000000000002', false)$$,
  '42501', null, 'agency staff cannot deactivate an agency'
);
select is((select count(*)::int from public.customers), 1, 'an active agency sees its data');

-- The Travio admin lists every agency.
select set_config('request.jwt.claims', '{"sub":"1b000000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);

select is((select (public.platform_agencies()->>'total')::int), 27, 'total counts every agency');
select is((select jsonb_array_length(public.platform_agencies()->'items')), 20, 'first page holds page_size agencies');
select is((select jsonb_array_length(public.platform_agencies(null, 'all', 2, 20)->'items')), 7, 'second page holds the rest');
select is((select public.platform_agencies()->'items'->0->>'name'), 'Beta 100% Tours', 'newest agency first');
select is((select jsonb_array_length(public.platform_agencies(null, 'all', 1, 100000)->'items')), 27, 'an oversized page_size is capped');

select is(
  (select (public.platform_agencies('alpha')->'items'->0) - 'created_at'::text),
  jsonb_build_object(
    'id', '2b000000-0000-0000-0000-000000000001', 'name', 'Alpha Travel', 'slug', 'alpha-agencies', 'cr_number', '1110000001',
    'email', 'hello@alpha.test', 'phone', null, 'is_active', true, 'plan', 'starter', 'subscription_status', 'trialing',
    'owner_name', 'Owner One', 'owner_email', 'owner1@agencies.test', 'staff', 1, 'customers', 1, 'bookings', 1, 'revenue', 750
  ),
  'an agency row carries plan, owner and totals'
);
select is((select (public.platform_agencies('100%')->>'total')::int), 1, 'search treats % literally');
select is((select (public.platform_agencies('1110000002')->>'total')::int), 1, 'search matches the CR number');
select is((select (public.platform_agencies('no such agency')->>'total')::int), 0, 'no match is an empty result');

-- Deactivate Alpha.
select lives_ok(
  $$select public.platform_set_agency_active('2b000000-0000-0000-0000-000000000001', false)$$,
  'the admin can deactivate an agency'
);
select is((select (public.platform_agencies(null, 'inactive')->>'total')::int), 1, 'status filter finds the inactive agency');
select throws_ok(
  $$select public.platform_set_agency_active('2b000000-0000-0000-0000-0000000000ff', false)$$,
  'P0002', null, 'an unknown agency is an error'
);

-- Alpha's owner is now locked out of everything tenant-scoped.
select set_config('request.jwt.claims', '{"sub":"1b000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is(
  (select array[
    (select count(*)::int from public.tenants),
    (select count(*)::int from public.customers),
    (select count(*)::int from public.bookings),
    (select count(*)::int from public.invoices)
  ]),
  array[0, 0, 0, 0],
  'a deactivated agency''s staff see no tenant data'
);
select throws_ok(
  $$insert into public.customers (tenant_id, full_name) values ('2b000000-0000-0000-0000-000000000001', 'Blocked')$$,
  '42501', null, 'a deactivated agency''s staff cannot write'
);

-- Reactivating restores access.
select set_config('request.jwt.claims', '{"sub":"1b000000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);
select public.platform_set_agency_active('2b000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claims', '{"sub":"1b000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select is((select count(*)::int from public.customers), 1, 'reactivating restores access with nothing lost');

reset role;
select is(
  (select has_function_privilege('anon', 'public.platform_set_agency_active(uuid, boolean)', 'execute')),
  false,
  'anon cannot call platform_set_agency_active'
);

select * from finish();
rollback;
