-- =========================================
-- Brand Studio: per-agency branding
-- =========================================
--
-- An agency's logo, tagline and colors. Every member can read them (they
-- style the dashboard for everyone); only the agency owner can change
-- them. Inactive agencies lose access through current_tenant_id().
--
-- Colors are injected into a <style> tag, so the column checks allow
-- exactly #RRGGBB and nothing else.
--
-- Logos live in a public bucket because they will appear on public pages
-- and documents. Writes are limited to the owner's own "{tenant_id}/"
-- folder. Only PNG, JPEG and WebP are accepted: SVG can carry scripts.

create table public.tenant_branding (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  logo_path text,
  tagline text check (char_length(tagline) <= 200),
  primary_color text check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  sidebar_color text check (sidebar_color ~ '^#[0-9a-fA-F]{6}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tenant_branding enable row level security;

create policy "tenant_branding_select"
on public.tenant_branding
for select
using (
  tenant_id = public.current_tenant_id()
  or public.current_role() = 'travio_admin'
);

create policy "tenant_branding_owner_insert"
on public.tenant_branding
for insert
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
);

create policy "tenant_branding_owner_update"
on public.tenant_branding
for update
using (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_role() = 'agency_owner'
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('branding', 'branding', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "branding_bucket_owner_select"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'branding'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and public.current_role() = 'agency_owner'
);

create policy "branding_bucket_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'branding'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and public.current_role() = 'agency_owner'
);

create policy "branding_bucket_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'branding'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and public.current_role() = 'agency_owner'
);
