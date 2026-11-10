-- =========================================
-- Website Builder: cover image and templates
-- =========================================
--
-- Adds a cover image and a choice of three page layouts to an agency's
-- site. Cover images use the existing branding bucket, whose policies
-- already limit writes to the owner's own folder and to PNG, JPEG and
-- WebP under 2 MB.

alter table public.agency_sites
  add column hero_path text,
  add column template text not null default 'classic'
    check (template in ('classic', 'split', 'minimal'));

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
    'hero_path', s.hero_path,
    'template', s.template,
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
