-- pgTAP: platform audit log (20261110170000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

truncate public.platform_audit_log;

insert into auth.users (id, email, raw_user_meta_data) values
  ('1f600000-0000-0000-0000-0000000000ad', 'admin@audit.test', '{"full_name":"Admin"}'),
  ('1f600000-0000-0000-0000-0000000000a1', 'owner@audit.test', '{"full_name":"Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2f600000-0000-0000-0000-000000000001', 'Audited Travel', 'audited-travel', '1220000001');

update public.profiles set role = 'travio_admin', tenant_id = null where id = '1f600000-0000-0000-0000-0000000000ad';
update public.profiles set role = 'agency_owner', tenant_id = '2f600000-0000-0000-0000-000000000001' where id = '1f600000-0000-0000-0000-0000000000a1';

insert into public.plans (id, name, slug, price, "interval") values
  ('5f600000-0000-0000-0000-000000000001', 'Audit Plan', 'audit-plan', 100, 'monthly');
insert into public.plan_features (plan_id, feature_key, feature_value) values
  ('5f600000-0000-0000-0000-000000000001', 'max_users', '3');

select set_config('request.jwt.claims', '{"sub":"1f600000-0000-0000-0000-0000000000ad","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;

select public.platform_set_agency_active('2f600000-0000-0000-0000-000000000001', false);
select is((select (public.platform_audit_entries()->>'total')::int), 1, 'deactivating records an entry');
select is((select public.platform_audit_entries()->'items'->0->>'action'), 'agency_deactivated', 'the entry names the action');
select is((select public.platform_audit_entries()->'items'->0->>'actor_email'), 'admin@audit.test', 'the entry names who did it');
select is((select public.platform_audit_entries()->'items'->0->>'target_label'), 'Audited Travel', 'the entry names the agency');

select public.platform_set_agency_active('2f600000-0000-0000-0000-000000000001', false);
select is((select (public.platform_audit_entries()->>'total')::int), 1, 'repeating the same status records nothing');

select public.platform_set_agency_active('2f600000-0000-0000-0000-000000000001', true);
select is((select public.platform_audit_entries()->'items'->0->>'action'), 'agency_activated', 'activating is recorded, newest first');

select public.platform_update_plan('5f600000-0000-0000-0000-000000000001', 150, '{"max_users":"10"}');
select is(
  (select public.platform_audit_entries()->'items'->0->'details'),
  '{"before":{"price":100.00,"limits":{"max_users":"3"}},"after":{"price":150,"limits":{"max_users":"10"}}}'::jsonb,
  'a plan change records before and after'
);

select public.platform_update_plan('5f600000-0000-0000-0000-000000000001', 150, '{"max_users":"10"}');
select is((select (public.platform_audit_entries()->>'total')::int), 3, 'saving a plan unchanged records nothing');

select throws_ok(
  $$select public.platform_update_plan('5f600000-0000-0000-0000-000000000001', -1, '{}')$$,
  '22023', null, 'a refused change'
);
select is((select (public.platform_audit_entries()->>'total')::int), 3, 'a refused change records nothing');

select set_config('request.jwt.claims', '{"sub":"1f600000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok('select public.platform_audit_entries()', '42501', null, 'agency staff cannot read the log');
select throws_ok('delete from public.platform_audit_log', '42501', null, 'users cannot erase the log');

reset role;
select is(
  (select has_function_privilege('authenticated', 'public.platform_write_audit(text, uuid, text, jsonb)', 'execute')),
  false,
  'users cannot write entries directly'
);

select * from finish();
rollback;
