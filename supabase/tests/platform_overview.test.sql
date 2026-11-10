-- pgTAP: platform_overview() (20261108140000). Two agencies, 1005
-- bookings (past PostgREST's max_rows). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

-- Platform-wide numbers: start from an empty platform (rolled back).
truncate public.tenants, public.profiles cascade;

insert into auth.users (id, email, raw_user_meta_data) values
  ('1a000000-0000-0000-0000-0000000000ad', 'admin@platform.test', '{"full_name":"Admin"}'),
  ('1a000000-0000-0000-0000-0000000000a1', 'owner1@platform.test', '{"full_name":"Owner One"}'),
  ('1a000000-0000-0000-0000-0000000000a2', 'owner2@platform.test', '{"full_name":"Owner Two"}');

insert into public.tenants (id, name, slug, cr_number, is_active, created_at) values
  ('2a000000-0000-0000-0000-000000000001', 'Alpha Travel', 'alpha-platform', '1010101010', true, now() - interval '2 months'),
  ('2a000000-0000-0000-0000-000000000002', 'Beta Travel', 'beta-platform', '1010202020', false, now());

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('1a000000-0000-0000-0000-0000000000ad'::uuid, null::uuid, 'travio_admin'),
  ('1a000000-0000-0000-0000-0000000000a1'::uuid, '2a000000-0000-0000-0000-000000000001'::uuid, 'agency_owner'),
  ('1a000000-0000-0000-0000-0000000000a2'::uuid, '2a000000-0000-0000-0000-000000000002'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

-- Alpha is on Business; Beta's only subscription was cancelled.
insert into public.subscriptions (tenant_id, plan_id, status)
select '2a000000-0000-0000-0000-000000000001', id, 'active' from public.plans where slug = 'business';
insert into public.subscriptions (tenant_id, plan_id, status)
select '2a000000-0000-0000-0000-000000000002', id, 'cancelled' from public.plans where slug = 'starter';

insert into public.customers (id, tenant_id, full_name, created_at) values
  ('3a000000-0000-0000-0000-0000000000c1', '2a000000-0000-0000-0000-000000000001', 'Alpha Customer', now() - interval '40 days'),
  ('3a000000-0000-0000-0000-0000000000c2', '2a000000-0000-0000-0000-000000000002', 'Beta Customer', now());

alter table public.bookings alter column title set default 'Trip';

-- 1000 Alpha bookings today, 4 Beta bookings today, 1 deleted.
insert into public.bookings (tenant_id, customer_id, booking_number, status, created_at)
select '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-0000000000c1', 'A-' || g, 'confirmed', now()
from generate_series(1, 1000) g;
insert into public.bookings (id, tenant_id, customer_id, booking_number, status, created_at)
values ('4a000000-0000-0000-0000-0000000000b1', '2a000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-0000000000c2', 'B-1', 'pending', now());
insert into public.bookings (tenant_id, customer_id, booking_number, status, created_at)
select '2a000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-0000000000c2', 'B-' || (g + 1), 'cancelled', now()
from generate_series(1, 3) g;
insert into public.bookings (tenant_id, customer_id, booking_number, status, deleted_at)
values ('2a000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-0000000000c2', 'B-DEL', 'confirmed', now());

-- Invoices: 1000 today at Beta, 500 last month at Alpha (one 999 deleted).
insert into public.invoices (id, tenant_id, customer_id, booking_id, invoice_number, status, total, created_at) values
  ('5a000000-0000-0000-0000-0000000000f1', '2a000000-0000-0000-0000-000000000002', '3a000000-0000-0000-0000-0000000000c2',
   '4a000000-0000-0000-0000-0000000000b1', 'B-INV-1', 'issued', 1000, now()),
  ('5a000000-0000-0000-0000-0000000000f2', '2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-0000000000c1',
   null, 'A-INV-1', 'paid', 500, date_trunc('month', now()) - interval '10 days');
insert into public.invoices (tenant_id, customer_id, invoice_number, status, total, deleted_at)
values ('2a000000-0000-0000-0000-000000000001', '3a000000-0000-0000-0000-0000000000c1', 'A-DEL', 'issued', 999, now());
insert into public.payments (tenant_id, invoice_id, amount, method, paid_at) values
  ('2a000000-0000-0000-0000-000000000001', '5a000000-0000-0000-0000-0000000000f2', 500, 'cash', date_trunc('month', now()) - interval '9 days'),
  ('2a000000-0000-0000-0000-000000000002', '5a000000-0000-0000-0000-0000000000f1', 300, 'card', now() - interval '1 minute');

-- An agency owner is refused.
select set_config('request.jwt.claims', '{"sub":"1a000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select throws_ok('select public.platform_overview()', '42501', null, 'agency staff cannot read platform numbers');

-- The Travio admin sees every agency.
select set_config('request.jwt.claims', '{"sub":"1a000000-0000-0000-0000-0000000000ad","role":"authenticated","aal":"aal2"}', true);
create temp table o on commit drop as select public.platform_overview() as s;

select is(
  (select array[(s->>'agencies')::int, (s->>'active_agencies')::int, (s->>'users')::int, (s->>'customers')::int, (s->>'bookings')::int] from o),
  array[2, 1, 2, 2, 1004],
  'totals across agencies, past the row cap, deleted bookings excluded, the admin not counted as a user'
);
select is(
  (select array[(s->>'revenue')::numeric, (s->>'collected')::numeric] from o),
  array[1500, 800]::numeric[],
  'revenue is invoiced (deleted excluded); collected is paid payments'
);
select is(
  (select array[(s->'this_month'->>'agencies')::int, (s->'this_month'->>'customers')::int, (s->'this_month'->>'bookings')::int] from o),
  array[1, 1, 1004],
  'this month counts'
);
select is(
  (select array[(s->'this_month'->>'revenue')::numeric, (s->'last_month'->>'revenue')::numeric, (s->'last_month'->>'collected')::numeric] from o),
  array[1000, 500, 500]::numeric[],
  'this month vs last month money'
);
select is((select jsonb_array_length(s->'daily') from o), 30, 'thirty days of daily figures');
select is(
  (select s->'daily'->29 from o),
  jsonb_build_object('day', to_char(now(), 'YYYY-MM-DD'), 'revenue', 1000, 'bookings', 1004),
  'today''s revenue and bookings'
);
select is(
  (select s->'by_plan' from o),
  '[{"plan":"business","agencies":1},{"plan":"none","agencies":1}]'::jsonb,
  'agencies per plan; a cancelled subscription is no plan'
);
select is(
  (select s->'bookings_by_status' from o),
  '{"confirmed":1000,"pending":1,"cancelled":3}'::jsonb,
  'bookings by status'
);
select is(
  (select s->'recent_agencies'->0->>'name' from o),
  'Beta Travel',
  'newest agency first'
);
select is(
  (select array[(s->'recent_agencies'->1->>'customers')::int, (s->'recent_agencies'->1->>'bookings')::int, (s->'recent_agencies'->1->>'revenue')::numeric::int] from o),
  array[1, 1000, 500],
  'per-agency customers, bookings and revenue'
);
select is((select s->'recent_agencies'->1->>'plan' from o), 'business', 'per-agency plan');
select is((select jsonb_array_length(s->'activity') from o), 8, 'latest eight platform events');

reset role;
select is(
  (select has_function_privilege('anon', 'public.platform_overview()', 'execute')),
  false,
  'anon cannot call platform_overview'
);

select * from finish();
rollback;
