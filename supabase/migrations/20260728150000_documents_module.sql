-- =========================================
-- Documents Module
-- Travio v1.8.0
-- =========================================
--
-- Audit (read-only, prior to this migration) confirmed zero existing
-- document/attachment infrastructure anywhere in this project: no
-- storage.buckets rows, no storage.objects policies, no public.*
-- table matching document/attachment/file/media. This is a ground-up
-- build, not a gap-fill on top of something that already existed
-- (unlike expenses in the Finance module).
--
-- owner_type/document_type are text + CHECK, not Postgres enums - same
-- convention as item_type/cabin_class/board_type/transfer_type for
-- classifications likely to grow. Both lists are kept in sync with
-- packages/types/src/schemas/document.ts's DOCUMENT_TYPES/OWNER_TYPES -
-- this CHECK constraint is still the enforced source of truth; the
-- shared TS constant is the app-layer mirror. Changing either requires
-- updating the other.
--
-- owner_id has no FK: a document can belong to a customer, a booking,
-- or an invoice (3 possible targets, null when owner_type = 'agency'
-- for a tenant-level document with no specific owner) - same reasoning
-- as invoice_items.reference_id, which faced the identical
-- more-than-2-possible-parents situation and also has no FK.
--
-- deleted_at: soft delete only, per explicit direction - storage object
-- cleanup is out of scope for this phase, so a deleted document's file
-- stays in the bucket even though the row is hidden from every query.

create table public.documents (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  owner_type text not null check (
    owner_type in ('customer', 'booking', 'invoice', 'agency')
  ),

  owner_id uuid,

  document_type text not null check (
    document_type in (
      'passport', 'visa', 'national_id', 'flight_ticket', 'hotel_voucher',
      'insurance', 'invoice_pdf', 'receipt', 'booking_attachment',
      'customer_attachment', 'agency_document'
    )
  ),

  file_name text not null,
  file_path text not null,
  mime_type text not null,
  file_size bigint not null,

  uploaded_by uuid
    references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index documents_tenant_id_idx on public.documents(tenant_id);
create index documents_owner_idx on public.documents(owner_type, owner_id);

create trigger documents_updated_at
before update on public.documents
for each row
execute function public.update_updated_at();

alter table public.documents enable row level security;

create policy "documents_tenant_access"
on public.documents
for all
using (
  tenant_id = public.current_tenant_id()
)
with check (
  tenant_id = public.current_tenant_id()
);

grant select, insert, update, delete on public.documents to authenticated;

-- =========================================
-- Storage bucket
-- =========================================
--
-- Single private bucket for every document type - no justification for
-- one bucket per type. allowed_mime_types/file_size_limit are enforced
-- by Storage itself (not just client-side validation).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Tenant isolation on the object path itself: every upload must be
-- written to "{tenant_id}/...", and storage.foldername(name) splits the
-- object path on "/" - element 1 is that tenant_id segment. Matches the
-- tenant_id = current_tenant_id() predicate every public.* RLS policy
-- already uses, just expressed against Storage's own policy surface.
-- Only select/insert - this phase never deletes or overwrites a storage
-- object (soft delete only, no storage cleanup), so no delete/update
-- policy is created; add one when a future phase actually needs it.

create policy "documents_bucket_tenant_select"
on storage.objects
for select
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
);

create policy "documents_bucket_tenant_insert"
on storage.objects
for insert
with check (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
);
