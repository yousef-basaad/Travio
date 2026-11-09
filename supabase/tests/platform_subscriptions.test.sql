-- pgTAP: platform_subscriptions() (20261109140000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

-- Platform-wide list: start from an empty platform (rolled back).
truncate public.tenants, public.profiles cascade;

insert into auth.users (id, email, raw_user_meta_data) values
  ('1d000000-0000-0000-0000-0000000000ad', 'admin@subs.test', '{"full_name":"Admin"}'),
  ('1d000000-0000-0000-0000-0000000000a1', 'owner@subs.test', '{"full_name":"Owner"}');

insert into public.plans (id, name, slug, price, "interval") values
  ('5d000000-0000-0000-0000-000000000001', 'Test Monthly', 'test-monthly', 300, 'monthly'),
  ('5d000000-0000-0000-0000-000000000002', 'Test Yearly', 'test-yearly', 1200, 'yearly');

insert into public.tenants (id, name, slug, cr_number, created_at) values
  ('2d000000-0000-0000-0000-000000000001', 'Active Monthly', 'active-monthly', '1140000001', now() - interval '1 hour'),
  ('2d000000-0000-0000-0000-000000000002', 'Active Yearly', 'active-yearly', '1140000002', now() - interval '2 hours'),
  ('2d000000-0000-0000-0000-000000000003', 'On Trial', 'on-trial', '1140000003', now() - interval '3 hours'),
  ('2d000000-0000-0000-0000-000000000004', 'Past Due', 'past-due', '1140000004', now() - interval '4 hours'),
  ('2d000000-0000-0000-0000-000000000005', 'Live Then Cancelled', 'live-cancelled', '1140000005', now() - interval '5 hours'),
  ('2d000000-0000-0000-0000-000000000006', 'No Subscription', 'no-sub', '1140000006', now() - interval '6 hours'),
  ('2d000000-0000-0000-0000-000000000007', 'Expired', 'expired-sub', '1140000007', now() - interval '7 hours');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('1d000000-0000-0000-0000-0000000000ad'::uuid, null::uuid, 'travio_admin'),
  ('1d000000-0000-0000-0000-0000000000a1'::uuid, '2d000000-0000-0000-0000-000000000001'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

insert into public.subscriptions (tenant_id, plan_id, status, starts_at, created_at) values
  ('2d000000-0000-0000-0000-000000000001', '5d000000-0000-0000-0000-000000000001', 'active', '2026-01-02T00:00:00Z', now()),
  ('2d000000-0000-0000-0000-000000000002', '5d000000-0000-0000-0000-000000000002', 'active', now(), now()),
  ('2d000000-0000-0000-0000-000000000003', '5d000000-0000-0000-0000-000000000001', 'trialing', now(), now()),
  ('2d000000-0000-0000-0000-000000000004', '5d000000-0000-0000-0000-000000000001', 'past_due', now(), now()),
  -- A newer cancelled row must not hide the live one.
  ('2d000000-0000-0000-0000-000000000005', '5d000000-0000-0000-0000-000000000001', 'active', now(), now() - interval '30 days'),
  ('2d000000-0000-0000-0000-000000000005', '5d000000-0000-0000-0000-000000000002', 'cancelled', now(), now()),
  ('2d000000-0000-0000-0000-000000000007', '5d000000-0000-0000-0000-000000000001', 'expired', now(), now());

-- Agency staff are refused.
select set_config('request.jwt.claims', '{"sub":"1d000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok('select public.platform_subscriptions()', '42501', null, 'agency staff cannot list subscriptions');

select set_config('request.jwt.claims', '{"sub":"1d000000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);

select is((select (public.platform_subscriptions()->>'total')::int), 7, 'every agency is listed, with or without a subscription');
select is(
  (select public.platform_subscriptions()->'summary'->>'expected_mrr')::numeric,
  700::numeric,
  'expected MRR counts active only, a yearly plan as 1/12'
);
select is(
  (select array[
    (s->>'active')::int, (s->>'trialing')::int, (s->>'past_due')::int,
    (s->>'cancelled')::int, (s->>'expired')::int, (s->>'none')::int
  ] from (select public.platform_subscriptions()->'summary' as s) x),
  array[3, 1, 1, 0, 1, 1],
  'counts per status, a live subscription winning over a newer cancelled one'
);
select is((select (public.platform_subscriptions(null, 'none')->>'total')::int), 1, 'filter: agencies without a subscription');
select is((select (public.platform_subscriptions(null, 'trialing')->>'total')::int), 1, 'filter: one status');
select is(
  (select (public.platform_subscriptions(null, 'trialing')->'summary'->>'active')::int),
  3,
  'the summary ignores the filter'
);
select is((select (public.platform_subscriptions('yearly')->>'total')::int), 1, 'search matches the agency name');
select is(
  (select public.platform_subscriptions('active monthly')->'items'->0->>'starts_at' is not null),
  true,
  'a row carries the subscription start'
);
select is(
  (select (public.platform_subscriptions('active monthly')->'items'->0) - 'starts_at'::text),
  jsonb_build_object(
    'id', '2d000000-0000-0000-0000-000000000001', 'name', 'Active Monthly', 'is_active', true, 'plan', 'test-monthly',
    'status', 'active', 'price', 300.00, 'billing_interval', 'monthly', 'ends_at', null
  ),
  'a row carries plan, status and price'
);
select is((select jsonb_array_length(public.platform_subscriptions(null, 'all', 4, 2)->'items')), 1, 'paging');

reset role;
select is(
  (select has_function_privilege('anon', 'public.platform_subscriptions(text, text, integer, integer)', 'execute')),
  false,
  'anon cannot call platform_subscriptions'
);

select * from finish();
rollback;
