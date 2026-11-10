-- pgTAP: agency_sites and public_agency_site() (20261109170000).
-- Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email, raw_user_meta_data) values
  ('1a100000-0000-0000-0000-0000000000a1', 'owner1@site.test', '{"full_name":"Owner One"}'),
  ('1a100000-0000-0000-0000-0000000000a2', 'agent1@site.test', '{"full_name":"Agent One"}'),
  ('1a100000-0000-0000-0000-0000000000b1', 'owner2@site.test', '{"full_name":"Owner Two"}');

insert into public.tenants (id, name, slug, cr_number) values
  ('2a100000-0000-0000-0000-000000000001', 'Site One', 'site-one', '1170000001'),
  ('2a100000-0000-0000-0000-000000000002', 'Site Two', 'site-two', '1170000002');

update public.profiles p
set tenant_id = r.tenant_id, role = r.role::public.user_role
from (values
  ('1a100000-0000-0000-0000-0000000000a1'::uuid, '2a100000-0000-0000-0000-000000000001'::uuid, 'agency_owner'),
  ('1a100000-0000-0000-0000-0000000000a2'::uuid, '2a100000-0000-0000-0000-000000000001'::uuid, 'sales_agent'),
  ('1a100000-0000-0000-0000-0000000000b1'::uuid, '2a100000-0000-0000-0000-000000000002'::uuid, 'agency_owner')
) as r(id, tenant_id, role)
where p.id = r.id;

-- The owner writes a draft.
select set_config('request.jwt.claims', '{"sub":"1a100000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

select lives_ok(
  $$insert into public.agency_sites (tenant_id, headline, about, phone, whatsapp, email, city, services)
    values ('2a100000-0000-0000-0000-000000000001', 'See the world', 'About us', '+966 50 000 0000', '966500000000', 'hi@site.test', 'Jeddah', '{flights,visas}')$$,
  'an owner can save a draft'
);
select throws_ok(
  $$update public.agency_sites set headline = null, is_published = true$$,
  '23514', null, 'a site cannot be published without a headline'
);
select throws_ok(
  $$update public.agency_sites set services = '{flights,casino}'$$,
  '23514', null, 'only known services are accepted'
);
select throws_ok(
  $$update public.agency_sites set whatsapp = '1234567&text=phish'$$,
  '23514', null, 'a phone number can only hold phone characters'
);

-- A draft isn't public.
reset role;
select set_config('request.jwt.claims', '', true);
set local role anon;
select is((select public.public_agency_site('site-one')), null, 'a draft site is not public');
select is((select count(*)::int from public.agency_sites), 0, 'the public cannot read the table');
reset role;

-- A team member reads but can't publish.
select set_config('request.jwt.claims', '{"sub":"1a100000-0000-0000-0000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;
select is((select count(*)::int from public.agency_sites), 1, 'staff can read their agency''s site');
update public.agency_sites set is_published = true;
select is((select is_published from public.agency_sites), false, 'staff cannot publish');

-- Another agency sees nothing and can't write here.
select set_config('request.jwt.claims', '{"sub":"1a100000-0000-0000-0000-0000000000b1","role":"authenticated"}', true);
select is((select count(*)::int from public.agency_sites), 0, 'another agency cannot read it');
select throws_ok(
  $$insert into public.agency_sites (tenant_id) values ('2a100000-0000-0000-0000-000000000001')$$,
  '42501', null, 'another agency cannot write it'
);

-- Publish, with a cover image and a template.
select set_config('request.jwt.claims', '{"sub":"1a100000-0000-0000-0000-0000000000a1","role":"authenticated"}', true);
select throws_ok(
  $$update public.agency_sites set template = 'neon'$$,
  '23514', null, 'only known templates are accepted'
);
update public.agency_sites set is_published = true, hero_path = 't1/hero.png', template = 'split';
reset role;

select set_config('request.jwt.claims', '', true);
set local role anon;
select is(
  (select public.public_agency_site('site-one')),
  jsonb_build_object(
    'name', 'Site One', 'slug', 'site-one', 'logo_path', null, 'hero_path', 't1/hero.png', 'template', 'split', 'tagline', null, 'primary_color', null, 'language', 'ar',
    'headline', 'See the world', 'subheadline', null, 'services', jsonb_build_array('flights', 'visas'), 'about', 'About us',
    'city', 'Jeddah', 'phone', '+966 50 000 0000', 'whatsapp', '966500000000', 'email', 'hi@site.test'
  ),
  'a published site is public'
);
select is((select public.public_agency_site('no-such-site')), null, 'an unknown slug is nothing');
reset role;

-- Hidden sections don't leave the database.
update public.agency_sites set show_contact = false, show_about = false, show_services = false;
select is(
  (select array[s->>'about', s->>'phone', s->>'whatsapp', s->>'email', s->>'city'] from (select public.public_agency_site('site-one') as s) x),
  array[null, null, null, null, null]::text[],
  'a hidden section''s content is not returned'
);
select is((select public.public_agency_site('site-one')->'services'), '[]'::jsonb, 'hidden services are not returned');

-- A deactivated agency's site goes offline.
update public.tenants set is_active = false where id = '2a100000-0000-0000-0000-000000000001';
select is((select public.public_agency_site('site-one')), null, 'a deactivated agency''s site is offline');

select is(
  (select has_function_privilege('anon', 'public.public_agency_site(text)', 'execute')),
  true,
  'the public can call public_agency_site'
);

select * from finish();
rollback;
