-- pgTAP: Security Phase - SaaS write lockdown + create_agency() guard.
-- Run locally with `supabase test db`. Everything happens inside one
-- transaction and is rolled back.

begin;

create extension if not exists pgtap with schema extensions;

select plan(25);

-- ---------------------------------------------------------------
-- Fixtures (as postgres). handle_new_user() creates each profile.
-- ---------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner-a@test.local', '{"account_type":"agency","full_name":"Owner A"}'),
  ('00000000-0000-0000-0000-0000000000b1', 'owner-b@test.local', '{"account_type":"agency","full_name":"Owner B"}'),
  ('00000000-0000-0000-0000-0000000000a2', 'agent-a@test.local', '{"full_name":"Agent A"}'),
  ('00000000-0000-0000-0000-0000000000c1', 'self-signup@test.local', '{"full_name":"Self Signup"}');


-- ---------------------------------------------------------------
-- Signup-path precondition: a fresh agency signup (account_type =
-- 'agency', exactly what packages/auth signUpAgency() sends) is an
-- agency_owner with no customer link when create_agency() runs, so
-- the customer-account guard never blocks it.
-- ---------------------------------------------------------------
select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'agency_owner',
  'fresh agency signup profile has role agency_owner before create_agency'
);

select is(
  (select customer_id from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  null,
  'fresh agency signup profile has no customer link before create_agency'
);


-- ---------------------------------------------------------------
-- create_agency(): new user succeeds
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ select public.create_agency('Acme Travel', '1010000001') $$,
  'create_agency works for a new user with no tenant'
);

reset role;

select isnt(
  (select tenant_id from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  null,
  'new agency owner is attached to the new tenant'
);

select is(
  (select role::text from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'agency_owner',
  'new agency owner has the agency_owner role'
);

select is(
  (select count(*)::int
   from public.subscriptions s
   join public.profiles p on p.tenant_id = s.tenant_id
   where p.id = '00000000-0000-0000-0000-0000000000a1'),
  1,
  'new agency gets exactly one default subscription'
);


-- ---------------------------------------------------------------
-- create_agency(): same agency name twice
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$ select public.create_agency('Acme Travel', '1010000002') $$,
  'a second agency with the same name also succeeds'
);

reset role;

select isnt(
  (select t.slug from public.tenants t join public.profiles p on p.tenant_id = t.id
   where p.id = '00000000-0000-0000-0000-0000000000a1'),
  (select t.slug from public.tenants t join public.profiles p on p.tenant_id = t.id
   where p.id = '00000000-0000-0000-0000-0000000000b1'),
  'same-name agencies get distinct slugs'
);


-- ---------------------------------------------------------------
-- create_agency(): callers that already have a tenant are rejected
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$ select public.create_agency('Second Agency', '1010000003') $$,
  '42501',
  'create_agency: caller already belongs to an agency',
  'create_agency fails for an agency owner who already has a tenant'
);

reset role;

-- Put Agent A into tenant A as a sales_agent (as postgres).
update public.profiles
set
  tenant_id = (select tenant_id from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  role = 'sales_agent'
where id = '00000000-0000-0000-0000-0000000000a2';

-- Remember tenant B's id for the cross-tenant check below.
select set_config(
  'test.tenant_b',
  (select tenant_id::text from public.profiles where id = '00000000-0000-0000-0000-0000000000b1'),
  true
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$ select public.create_agency('Agent Side Agency', '1010000004') $$,
  '42501',
  'create_agency: caller already belongs to an agency',
  'create_agency fails for a sales_agent who already has a tenant'
);


-- ---------------------------------------------------------------
-- sales_agent cannot write subscriptions / tenant_usage
-- ---------------------------------------------------------------
select throws_ok(
  $$ insert into public.subscriptions (tenant_id, plan_id, status)
     values (public.current_tenant_id(),
             (select id from public.plans where slug = 'enterprise'),
             'active') $$,
  '42501', null,
  'sales_agent cannot insert into subscriptions'
);

select throws_ok(
  $$ update public.subscriptions set status = 'active' $$,
  '42501', null,
  'sales_agent cannot update subscriptions'
);

select throws_ok(
  $$ delete from public.subscriptions $$,
  '42501', null,
  'sales_agent cannot delete from subscriptions'
);

select throws_ok(
  $$ insert into public.tenant_usage (tenant_id, metric, value)
     values (public.current_tenant_id(), 'bookings', 0) $$,
  '42501', null,
  'sales_agent cannot insert into tenant_usage'
);

select throws_ok(
  $$ update public.tenant_usage set value = 0 $$,
  '42501', null,
  'sales_agent cannot update tenant_usage'
);

select throws_ok(
  $$ delete from public.tenant_usage $$,
  '42501', null,
  'sales_agent cannot delete from tenant_usage'
);


-- ---------------------------------------------------------------
-- Reads still work, and stay tenant-scoped
-- ---------------------------------------------------------------
select is(
  (select count(*)::int from public.subscriptions),
  1,
  'tenant member can select their own tenant''s subscription (and only that one)'
);

select is(
  (select count(*)::int from public.subscriptions
   where tenant_id = current_setting('test.tenant_b')::uuid),
  0,
  'tenant member cannot select another tenant''s subscription'
);

select lives_ok(
  $$ select * from public.tenant_usage $$,
  'tenant member can still select tenant_usage'
);

reset role;


-- ---------------------------------------------------------------
-- Customer-portal identities cannot create an agency
-- ---------------------------------------------------------------

-- Invited portal customer linked to a customers row in tenant A (same
-- metadata shape /api/customers/:id/invite-portal sends).
insert into public.customers (id, tenant_id, full_name)
values (
  '00000000-0000-0000-0000-0000000000d1',
  (select tenant_id from public.profiles where id = '00000000-0000-0000-0000-0000000000a1'),
  'Portal Customer'
);

insert into auth.users (id, email, invited_at, raw_user_meta_data) values (
  '00000000-0000-0000-0000-0000000000c2',
  'portal-customer@test.local',
  now(),
  '{"role":"customer","customer_id":"00000000-0000-0000-0000-0000000000d1","full_name":"Portal Customer"}'
);

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$ select public.create_agency('Self Signup Agency', '1010000005') $$,
  '42501',
  'create_agency: customer accounts cannot create an agency',
  'a public self-signup (role customer, no link) cannot create an agency'
);

reset role;

select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000c2","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$ select public.create_agency('Portal Customer Agency', '1010000006') $$,
  '42501',
  'create_agency: customer accounts cannot create an agency',
  'a linked customer-portal user cannot create an agency'
);

reset role;


-- ---------------------------------------------------------------
-- anon cannot execute create_agency
-- ---------------------------------------------------------------
select is(
  has_function_privilege('anon', 'public.create_agency(text, text)', 'execute'),
  false,
  'anon has no EXECUTE on create_agency'
);

select is(
  has_function_privilege('authenticated', 'public.create_agency(text, text)', 'execute'),
  true,
  'authenticated keeps EXECUTE on create_agency'
);

select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

select throws_ok(
  $$ select public.create_agency('Anon Agency', '1010000007') $$,
  '42501',
  null,
  'anon calling create_agency is rejected'
);

reset role;


-- ---------------------------------------------------------------
-- The agency owner cannot change the plan directly either
-- ---------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select throws_ok(
  $$ update public.subscriptions
     set plan_id = (select id from public.plans where slug = 'enterprise'), status = 'active' $$,
  '42501', null,
  'agency_owner cannot update subscriptions directly'
);

reset role;

select * from finish();

rollback;
