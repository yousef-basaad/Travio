-- pgTAP: visa_center_stats() (20261105160000). 1050 applications on
-- purpose: more than PostgREST's max_rows (1000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, raw_user_meta_data) values
  ('18000000-0000-0000-0000-0000000000a0', 'owner@visastats.test', '{"full_name":"Owner"}'),
  ('18000000-0000-0000-0000-0000000000b0', 'other@visastats.test', '{"full_name":"Other Owner"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('28000000-0000-0000-0000-000000000001', 'Visa Travel', 'visa-stats-travel', '1010007878'),
  ('28000000-0000-0000-0000-000000000002', 'Other Travel', 'other-visa-stats', '1010009090');

update public.profiles p
set tenant_id = r.tenant_id, role = 'agency_owner'
from (values
  ('18000000-0000-0000-0000-0000000000a0'::uuid, '28000000-0000-0000-0000-000000000001'::uuid),
  ('18000000-0000-0000-0000-0000000000b0'::uuid, '28000000-0000-0000-0000-000000000002'::uuid)
) as r(id, tenant_id)
where p.id = r.id;

insert into public.customers (id, tenant_id, full_name) values
  ('38000000-0000-0000-0000-0000000000c1', '28000000-0000-0000-0000-000000000001', 'Applicant'),
  ('38000000-0000-0000-0000-0000000000c2', '28000000-0000-0000-0000-000000000002', 'Other Applicant');

-- 1000 submitted tourist visas to Turkey this month.
insert into public.visa_applications (tenant_id, customer_id, status, visa_type, country, created_at)
select '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-0000000000c1', 'submitted', 'سياحية', 'تركيا', now()
from generate_series(1, 1000);

-- 40 approved work visas to the UAE last month; 8 rejected study visas
-- (blank country) two months ago; 2 drafts without type or country.
insert into public.visa_applications (tenant_id, customer_id, status, visa_type, country, created_at)
select '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-0000000000c1', 'approved', ' عمل ', 'الإمارات',
       date_trunc('month', now()) - interval '10 days'
from generate_series(1, 40);
insert into public.visa_applications (tenant_id, customer_id, status, visa_type, country, created_at)
select '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-0000000000c1', 'rejected', 'دراسة', '  ',
       date_trunc('month', now()) - interval '40 days'
from generate_series(1, 8);
insert into public.visa_applications (tenant_id, customer_id, status, created_at)
select '28000000-0000-0000-0000-000000000001', '38000000-0000-0000-0000-0000000000c1', 'draft', now()
from generate_series(1, 2);

-- Another agency's application.
insert into public.visa_applications (tenant_id, customer_id, status, visa_type, country)
values ('28000000-0000-0000-0000-000000000002', '38000000-0000-0000-0000-0000000000c2', 'approved', 'سياحية', 'اليابان');

select set_config('request.jwt.claims', '{"sub":"18000000-0000-0000-0000-0000000000a0","role":"authenticated"}', true);
set local role authenticated;

create temp table stats on commit drop as select public.visa_center_stats() as s;

select is((select (s->>'total')::int from stats), 1050, 'total counts every application past the row cap');
select is(
  (select array[(s->>'draft')::int, (s->>'submitted')::int, (s->>'approved')::int, (s->>'rejected')::int] from stats),
  array[2, 1000, 40, 8], 'counts per status');
select is((select (s->>'new_this_month')::int from stats), 1002, 'created this month');
select is((select (s->>'new_last_month')::int from stats), 40, 'created last month');
select is(
  (select s->'by_type' from stats),
  '[{"label":"سياحية","count":1000},{"label":"عمل","count":40},{"label":"دراسة","count":8}]'::jsonb,
  'visa types grouped as written (trimmed), most common first, unset left out');
select is(
  (select s->'by_country' from stats),
  '[{"label":"تركيا","count":1000},{"label":"الإمارات","count":40}]'::jsonb,
  'countries grouped, blank and unset left out');

reset role;
select set_config('request.jwt.claims', '{"sub":"18000000-0000-0000-0000-0000000000b0","role":"authenticated"}', true);
set local role authenticated;
select is((public.visa_center_stats()->>'total')::int, 1, 'other agency owner: only its own applications');
select is(public.visa_center_stats()->'by_country', '[{"label":"اليابان","count":1}]'::jsonb, 'other agency countries only');

reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select throws_ok('select public.visa_center_stats()', '42501', null, 'anon cannot execute it');

select * from finish();

rollback;
