-- =========================================
-- Website Builder: each agency's public site
-- =========================================
--
-- The content of an agency's public page. Members can read it; only the
-- owner can change or publish it.
--
-- The public can't read this table. public_agency_site() is the only
-- public way in: it returns just what's meant to be displayed, and only
-- for a published site of an active agency. Hidden sections come back
-- empty, so their content never leaves the database.
--
-- Phone and WhatsApp numbers become tel: and wa.me links, so the column
-- checks restrict them to phone characters.

create table public.agency_sites (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  is_published boolean not null default false,
  language text not null default 'ar' check (language in ('ar', 'en')),
  headline text check (char_length(headline) <= 120),
  subheadline text check (char_length(subheadline) <= 240),
  about text check (char_length(about) <= 1500),
  city text check (char_length(city) <= 80),
  phone text check (phone ~ '^\+?[0-9 ()-]{6,32}$'),
  whatsapp text check (whatsapp ~ '^\+?[0-9 ()-]{6,32}$'),
  email text check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  services text[] not null default '{}'
    check (services <@ array['flights', 'hotels', 'visas', 'packages', 'transfers', 'insurance']),
  show_services boolean not null default true,
  show_about boolean not null default true,
  show_contact boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint agency_sites_published_needs_headline
    check (not is_published or nullif(trim(headline), '') is not null)
);

alter table public.agency_sites enable row level security;

create policy "agency_sites_select"
on public.agency_sites
for select
using (
  tenant_id = public.current_tenant_id()
  or public.current_role() = 'travio_admin'
);

create policy "agency_sites_owner_insert"
on public.agency_sites
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
);

create policy "agency_sites_owner_update"
on public.agency_sites
for update
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
);

create or replace function public.public_agency_site(site_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', t.name,
    'slug', t.slug,
    'logo_path', b.logo_path,
    'tagline', b.tagline,
    'primary_color', b.primary_color,
    'language', s.language,
    'headline', s.headline,
    'subheadline', s.subheadline,
    'services', case when s.show_services then to_jsonb(s.services) else '[]'::jsonb end,
    'about', case when s.show_about then s.about end,
    'city', case when s.show_contact then s.city end,
    'phone', case when s.show_contact then s.phone end,
    'whatsapp', case when s.show_contact then s.whatsapp end,
    'email', case when s.show_contact then s.email end
  )
  from public.agency_sites s
  join public.tenants t on t.id = s.tenant_id
  left join public.tenant_branding b on b.tenant_id = t.id
  where t.slug = site_slug and t.is_active and s.is_published;
$$;

revoke execute on function public.public_agency_site(text) from public;
grant execute on function public.public_agency_site(text) to anon, authenticated;
