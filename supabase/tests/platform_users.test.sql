-- pgTAP: platform_users() (20261109130000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

-- Platform-wide list: start from an empty platform (rolled back).
truncate public.tenants, public.profiles cascade;

insert into auth.users (id, email, raw_user_meta_data) values
  ('1c000000-0000-0000-0000-0000000000ad', 'admin@users.test', '{"full_name":"Admin"}'),
  ('1c000000-0000-0000-0000-0000000000a1', 'owner@users.test', '{"full_name":"Owner"}'),
  ('1c000000-0000-0000-0000-0000000000a2', 'sales_agent@users.test', '{"full_name":"Agent"}');

-- 25 more accounts to exercise paging.
insert into auth.users (id, email, raw_user_meta_data)
select gen_random_uuid(), 'filler' || g || '@users.test', '{"full_name":"Filler"}'
from generate_series(1, 25) g;

insert into public.tenants (id, name, slug, cr_number) values
  ('2c000000-0000-0000-0000-000000000001', 'Gamma Travel', 'gamma-users', '1130000001');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role, created_at = r.created_at
from (values
  ('1c000000-0000-0000-0000-0000000000ad'::uuid, null::uuid, 'travio_admin', now() + interval '1 minute'),
  ('1c000000-0000-0000-0000-0000000000a1'::uuid, '2c000000-0000-0000-0000-000000000001'::uuid, 'agency_owner', now() - interval '1 day'),
  ('1c000000-0000-0000-0000-0000000000a2'::uuid, '2c000000-0000-0000-0000-000000000001'::uuid, 'sales_agent', now() - interval '2 days')
) as r(id, tenant_id, role, created_at)
where p.id = r.id;

update auth.users set last_sign_in_at = now(), email_confirmed_at = now()
where id = '1c000000-0000-0000-0000-0000000000a2';

-- Agency staff are refused.
select set_config('request.jwt.claims', '{"sub":"1c000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok('select public.platform_users()', '42501', null, 'agency staff cannot list platform users');

-- The Travio admin sees every account.
select set_config('request.jwt.claims', '{"sub":"1c000000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);

select is((select (public.platform_users()->>'total')::int), 28, 'total counts every account');
select is((select jsonb_array_length(public.platform_users()->'items')), 20, 'first page holds page_size accounts');
select is((select jsonb_array_length(public.platform_users(null, 'all', 2, 20)->'items')), 8, 'second page holds the rest');
select is((select public.platform_users()->'items'->0->>'full_name'), 'Admin', 'newest account first');
select is((select (public.platform_users(null, 'sales_agent')->>'total')::int), 1, 'role filter');

select is(
  (select (public.platform_users('sales_')->'items'->0) - 'created_at'::text - 'last_sign_in_at'::text),
  jsonb_build_object(
    'id', '1c000000-0000-0000-0000-0000000000a2', 'full_name', 'Agent', 'email', 'sales_agent@users.test', 'role', 'sales_agent',
    'agency_id', '2c000000-0000-0000-0000-000000000001', 'agency_name', 'Gamma Travel', 'agency_active', true, 'email_confirmed', true
  ),
  'a row carries role, agency and confirmation'
);
select isnt((select public.platform_users('sales_')->'items'->0->>'last_sign_in_at'), null, 'last sign-in comes from auth');
select is((select (public.platform_users('_')->>'total')::int), 1, 'search treats _ literally');
select is((select (public.platform_users('gamma')->>'total')::int), 2, 'search matches the agency name');

reset role;
select is(
  (select has_function_privilege('anon', 'public.platform_users(text, text, integer, integer)', 'execute')),
  false,
  'anon cannot call platform_users'
);

select * from finish();
rollback;
