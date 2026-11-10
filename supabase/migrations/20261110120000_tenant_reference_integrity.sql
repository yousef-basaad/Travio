-- =========================================
-- Tenant isolation: references stay inside the agency
-- =========================================
--
-- RLS checked a row's own tenant_id but not what the row pointed at, so
-- an agency could write a booking or invoice for another agency's
-- customer, or a payment on another agency's invoice. Foreign keys only
-- prove the target exists.
--
-- Every reference between tenant-owned tables now has to stay inside one
-- agency, enforced on insert and whenever the reference changes. It's in
-- the database so it covers every way of writing, including direct API
-- calls. Existing rows aren't touched.
--
-- SECURITY DEFINER because RLS may hide the parent row from the writer,
-- and "hidden" must not read as "fine" or as "missing".
--
-- profiles.customer_id is left out: users can't write it, and portal
-- invites set it through the service role.
--
-- Agency owners also lose direct write access to tenants columns the app
-- never lets them edit (slug, cr_number, name, is_active). Only the
-- contact fields stay writable.

create or replace function public.enforce_same_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  reference_column text := tg_argv[0];
  parent_table text := tg_argv[1];
  reference_id uuid := (to_jsonb(new) ->> reference_column)::uuid;
  parent_tenant uuid;
  parent_rows integer;
begin
  if reference_id is null then
    return new;
  end if;

  execute format('select tenant_id from public.%I where id = $1', parent_table)
    into parent_tenant
    using reference_id;

  -- No such row: let the foreign key report it. (EXECUTE doesn't set
  -- FOUND, so the row count has to be read explicitly.)
  get diagnostics parent_rows = row_count;
  if parent_rows = 0 then
    return new;
  end if;

  if parent_tenant is distinct from new.tenant_id then
    raise exception '%.% must belong to the same agency', tg_table_name, reference_column using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_same_tenant() from public, anon, authenticated;

do $$
declare
  link record;
begin
  for link in
    select * from (values
      ('booking_flights', 'booking_id', 'bookings'),
      ('booking_hotels', 'booking_id', 'bookings'),
      ('booking_notes', 'booking_id', 'bookings'),
      ('booking_services', 'booking_id', 'bookings'),
      ('booking_timeline', 'booking_id', 'bookings'),
      ('booking_transfers', 'booking_id', 'bookings'),
      ('bookings', 'assigned_to', 'profiles'),
      ('bookings', 'branch_id', 'branches'),
      ('bookings', 'customer_id', 'customers'),
      ('crm_activities', 'lead_id', 'crm_leads'),
      ('crm_leads', 'assigned_to', 'profiles'),
      ('crm_leads', 'branch_id', 'branches'),
      ('crm_leads', 'converted_by', 'profiles'),
      ('crm_leads', 'converted_customer_id', 'customers'),
      ('crm_notes', 'created_by', 'profiles'),
      ('crm_notes', 'customer_id', 'customers'),
      ('crm_notes', 'lead_id', 'crm_leads'),
      ('customers', 'assigned_to', 'profiles'),
      ('customers', 'branch_id', 'branches'),
      ('flights', 'booking_service_id', 'booking_services'),
      ('hotels', 'booking_service_id', 'booking_services'),
      ('invoice_items', 'invoice_id', 'invoices'),
      ('invoices', 'booking_id', 'bookings'),
      ('invoices', 'customer_id', 'customers'),
      ('payments', 'invoice_id', 'invoices'),
      ('visa_applications', 'assigned_to', 'profiles'),
      ('visa_applications', 'booking_id', 'bookings'),
      ('visa_applications', 'customer_id', 'customers')
    ) as l(child, col, parent)
  loop
    execute format(
      'create trigger %I before insert or update of %I, tenant_id on public.%I
       for each row execute function public.enforce_same_tenant(%L, %L)',
      link.child || '_' || link.col || '_same_tenant',
      link.col, link.child, link.col, link.parent
    );
  end loop;
end $$;

-- A document points at its owner through owner_type + owner_id, which a
-- foreign key can't express.
create or replace function public.enforce_document_owner_tenant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_tenant uuid;
begin
  -- Agency-level documents normally have no owner_id at all.
  if new.owner_type = 'agency' then
    owner_tenant := coalesce(new.owner_id, new.tenant_id);
  elsif new.owner_type = 'customer' then
    select tenant_id into owner_tenant from public.customers where id = new.owner_id;
  elsif new.owner_type = 'booking' then
    select tenant_id into owner_tenant from public.bookings where id = new.owner_id;
  elsif new.owner_type = 'invoice' then
    select tenant_id into owner_tenant from public.invoices where id = new.owner_id;
  end if;

  if owner_tenant is distinct from new.tenant_id then
    raise exception 'a document''s owner must belong to the same agency' using errcode = '42501';
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_document_owner_tenant() from public, anon, authenticated;

create trigger documents_owner_same_tenant
before insert or update of owner_type, owner_id, tenant_id on public.documents
for each row execute function public.enforce_document_owner_tenant();

revoke insert, update, delete, truncate on public.tenants from anon, authenticated;
grant update (phone, email, address) on public.tenants to authenticated;
