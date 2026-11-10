-- pgTAP: platform_plans() and platform_update_plan() (20261109150000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1e000000-0000-0000-0000-0000000000ad', 'admin@plans.test', '{"full_name":"Admin"}'),
  ('1e000000-0000-0000-0000-0000000000a1', 'owner@plans.test', '{"full_name":"Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2e000000-0000-0000-0000-000000000001', 'Plans Travel', 'plans-travel', '1150000001'),
  ('2e000000-0000-0000-0000-000000000002', 'Cancelled Travel', 'cancelled-travel', '1150000002');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('1e000000-0000-0000-0000-0000000000ad'::uuid, null::uuid, 'travio_admin'),
  ('1e000000-0000-0000-0000-0000000000a1'::uuid, '2e000000-0000-0000-0000-000000000001'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

insert into public.plans (id, name, slug, price, "interval") values
  ('5e000000-0000-0000-0000-000000000001', 'Test Plan', 'test-plan', 150, 'monthly');
insert into public.plan_features (plan_id, feature_key, feature_value) values
  ('5e000000-0000-0000-0000-000000000001', 'max_users', '3');
insert into public.subscriptions (tenant_id, plan_id, status) values
  ('2e000000-0000-0000-0000-000000000001', '5e000000-0000-0000-0000-000000000001', 'active'),
  ('2e000000-0000-0000-0000-000000000002', '5e000000-0000-0000-0000-000000000001', 'cancelled');

create function pg_temp.test_plan() returns jsonb language sql as $$
  select p from jsonb_array_elements(public.platform_plans()) p where p->>'slug' = 'test-plan';
$$;

-- Agency staff are refused both functions.
select set_config('request.jwt.claims', '{"sub":"1e000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok('select public.platform_plans()', '42501', null, 'agency staff cannot read the plan settings');
select throws_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-000000000001', 1, '{}')$$,
  '42501', null, 'agency staff cannot change a plan'
);

select set_config('request.jwt.claims', '{"sub":"1e000000-0000-0000-0000-0000000000ad","role":"authenticated","aal":"aal2"}', true);

select is(
  (select pg_temp.test_plan()),
  jsonb_build_object(
    'id', '5e000000-0000-0000-0000-000000000001', 'name', 'Test Plan', 'slug', 'test-plan', 'price', 150.00,
    'billing_interval', 'monthly', 'is_active', true, 'limits', jsonb_build_object('max_users', '3'), 'agencies', 1
  ),
  'a plan carries its limits and how many agencies are live on it'
);

select lives_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-000000000001', 175.5, '{"max_users":"10","max_documents":"unlimited"}')$$,
  'the admin can update a plan'
);
select is((select (pg_temp.test_plan()->>'price')::numeric), 175.5, 'the price changed');
select is(
  (select pg_temp.test_plan()->'limits'),
  '{"max_users":"10","max_documents":"unlimited"}'::jsonb,
  'an existing limit is updated and a missing one added'
);

select throws_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-000000000001', 1, '{"max_users":"5","max_cats":"1"}')$$,
  '22023', null, 'an unknown limit is refused'
);
select is((select (pg_temp.test_plan()->>'price')::numeric), 175.5, 'a refused update changes nothing');
select throws_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-000000000001', 1, '{"max_users":"0"}')$$,
  '22023', null, 'a zero limit is refused'
);
select throws_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-000000000001', 1, '{"max_users":null}')$$,
  '22023', null, 'a null limit is refused'
);
select throws_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-000000000001', -1, '{}')$$,
  '22023', null, 'a negative price is refused'
);
select throws_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-000000000001', 1, '[]')$$,
  '22023', null, 'limits must be an object'
);
select throws_ok(
  $$select public.platform_update_plan('5e000000-0000-0000-0000-0000000000ff', 1, '{}')$$,
  'P0002', null, 'an unknown plan is an error'
);

reset role;
select is(
  (select has_function_privilege('anon', 'public.platform_update_plan(uuid, numeric, jsonb)', 'execute')),
  false,
  'anon cannot call platform_update_plan'
);

select * from finish();
rollback;
