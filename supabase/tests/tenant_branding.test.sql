-- pgTAP: tenant_branding and the branding bucket (20261109160000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1f000000-0000-0000-0000-0000000000a1', 'owner1@brand.test', '{"full_name":"Owner One"}'),
  ('1f000000-0000-0000-0000-0000000000a2', 'agent1@brand.test', '{"full_name":"Agent One"}'),
  ('1f000000-0000-0000-0000-0000000000b1', 'owner2@brand.test', '{"full_name":"Owner Two"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2f000000-0000-0000-0000-000000000001', 'Brand One', 'brand-one', '1160000001'),
  ('2f000000-0000-0000-0000-000000000002', 'Brand Two', 'brand-two', '1160000002');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('1f000000-0000-0000-0000-0000000000a1'::uuid, '2f000000-0000-0000-0000-000000000001'::uuid, 'agency_owner'),
  ('1f000000-0000-0000-0000-0000000000a2'::uuid, '2f000000-0000-0000-0000-000000000001'::uuid, 'sales_agent'),
  ('1f000000-0000-0000-0000-0000000000b1'::uuid, '2f000000-0000-0000-0000-000000000002'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

-- The owner saves branding.
select set_config('request.jwt.claims', '{"sub":"1f000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$insert into public.tenant_branding (tenant_id, primary_color, tagline)
    values ('2f000000-0000-0000-0000-000000000001', '#16A34A', 'Travel well')$$,
  'an owner can save branding'
);
select is((select primary_color from public.tenant_branding), '#16A34A', 'the owner reads it back');
select throws_ok(
  $$update public.tenant_branding set primary_color = 'red'$$,
  '23514', null, 'a color must be #RRGGBB'
);
select throws_ok(
  $$update public.tenant_branding set sidebar_color = '#fff;}body{display:none}'$$,
  '23514', null, 'CSS cannot be smuggled in as a color'
);
select throws_ok(
  format($$update public.tenant_branding set tagline = %L$$, repeat('x', 201)),
  '23514', null, 'the tagline has a length limit'
);
select lives_ok(
  $$insert into storage.objects (bucket_id, name) values ('branding', '2f000000-0000-0000-0000-000000000001/logo.png')$$,
  'an owner can upload to its own folder'
);
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('branding', '2f000000-0000-0000-0000-000000000002/logo.png')$$,
  '42501', null, 'an owner cannot upload to another agency''s folder'
);

-- A team member can read but not change it.
select set_config('request.jwt.claims', '{"sub":"1f000000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
select is((select count(*)::int from public.tenant_branding), 1, 'staff can read their agency''s branding');
update public.tenant_branding set tagline = 'hijack';
select is((select tagline from public.tenant_branding), 'Travel well', 'staff cannot change branding');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('branding', '2f000000-0000-0000-0000-000000000001/agent.png')$$,
  '42501', null, 'staff cannot upload a logo'
);

-- Another agency sees nothing and can't write here.
select set_config('request.jwt.claims', '{"sub":"1f000000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select is((select count(*)::int from public.tenant_branding), 0, 'another agency cannot read it');
select throws_ok(
  $$insert into public.tenant_branding (tenant_id, tagline) values ('2f000000-0000-0000-0000-000000000001', 'x')$$,
  '42501', null, 'another agency cannot write it'
);

reset role;
select is(
  (select public::text || file_size_limit::text || array_to_string(allowed_mime_types, ',') from storage.buckets where id = 'branding'),
  'true2097152image/png,image/jpeg,image/webp',
  'the bucket is public, capped at 2 MB, and refuses SVG'
);

-- A deactivated agency loses it.
update public.tenants set is_active = false where id = '2f000000-0000-0000-0000-000000000001';
select set_config('request.jwt.claims', '{"sub":"1f000000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.tenant_branding), 0, 'a deactivated agency cannot read its branding');

select * from finish();
rollback;
