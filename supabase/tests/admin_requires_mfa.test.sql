-- pgTAP: a Travio admin needs a second factor (20261110150000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1e500000-0000-0000-0000-0000000000ad', 'admin@mfa.test', '{"full_name":"Admin"}'),
  ('1e500000-0000-0000-0000-0000000000a1', 'owner@mfa.test', '{"full_name":"Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2e500000-0000-0000-0000-000000000001', 'MFA Travel', 'mfa-travel', '1210000001');

update public.profiles set role = 'travio_admin', tenant_id = null where id = '1e500000-0000-0000-0000-0000000000ad';
update public.profiles set role = 'agency_owner', tenant_id = '2e500000-0000-0000-0000-000000000001' where id = '1e500000-0000-0000-0000-0000000000a1';

-- Password only.
select set_config('request.jwt.claims', '{"sub":"1e500000-0000-0000-0000-0000000000ad","role":"authenticated","aal":"aal1"}', true);
set local role authenticated;

select is((select public.current_role()), null, 'an admin without MFA has no admin role');
select throws_ok('select public.platform_overview()', '42501', null, 'an admin without MFA cannot read platform numbers');
select throws_ok(
  $$select public.platform_set_agency_active('2e500000-0000-0000-0000-000000000001', false)$$,
  '42501', null, 'an admin without MFA cannot deactivate an agency'
);
select is((select count(*)::int from public.tenants), 0, 'RLS gives an admin without MFA no agencies');

-- A token with no aal claim counts as password only.
select set_config('request.jwt.claims', '{"sub":"1e500000-0000-0000-0000-0000000000ad","role":"authenticated"}', true);
select is((select public.current_role()), null, 'a token without an aal claim does not count as MFA');

-- With a second factor.
select set_config('request.jwt.claims', '{"sub":"1e500000-0000-0000-0000-0000000000ad","role":"authenticated","aal":"aal2"}', true);
select is((select public.current_role()::text), 'travio_admin', 'an admin who passed MFA has the admin role');
select lives_ok('select public.platform_overview()', 'an admin who passed MFA can read platform numbers');

-- Agency roles are unaffected.
select set_config('request.jwt.claims', '{"sub":"1e500000-0000-0000-0000-0000000000a1","role":"authenticated","aal":"aal1"}', true);
select is((select public.current_role()::text), 'agency_owner', 'other roles do not need MFA');

select * from finish();
rollback;
