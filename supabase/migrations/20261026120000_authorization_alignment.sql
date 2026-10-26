-- =========================================
-- Authorization alignment (Phase 2)
-- =========================================
--
-- Makes RLS no broader than the dashboard API's own role lists
-- (apps/dashboard/src/lib/auth/require-domain-access.ts), and makes
-- every child row follow its parent's visibility, so the sales-agent
-- ownership model (20260729090000) can't be sidestepped by reading a
-- child table directly through PostgREST.
--
-- Role lists used below (mirroring the API):
--   customers / leads / bookings : travio_admin, agency_owner,
--                                  branch_manager, sales_agent
--   visa                         : + visa_officer, minus nothing
--                                  (sales_agent only for customers it
--                                  can see - product decision)
--   finance writes               : travio_admin, agency_owner, accountant
--   finance reads                : + branch_manager (tenant-wide), and a
--                                  sales_agent only for invoices on a
--                                  booking/customer it can see (product
--                                  decision: agents see their own revenue)
--
-- Pattern: "x in (select id from public.parent)" re-applies the PARENT
-- table's own RLS for the calling user, so a child is visible exactly
-- when its parent is. The customer-portal policies (*_customer_access)
-- are separate permissive policies and are not touched.

-- ---------------------------------------------------------------
-- 1. Parents: keep who can READ, restrict who can WRITE
-- ---------------------------------------------------------------
-- Visibility is unchanged from 20260729090000. Writes are now limited
-- to the roles the API allows for that domain (visa_officer/accountant
-- could previously insert/update unassigned rows directly).

drop policy customers_tenant_access on public.customers;

create policy customers_tenant_select on public.customers
for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy customers_tenant_insert on public.customers
for insert to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy customers_tenant_update on public.customers
for update to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy customers_tenant_delete on public.customers
for delete to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

drop policy crm_leads_tenant_access on public.crm_leads;

create policy crm_leads_tenant_select on public.crm_leads
for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy crm_leads_tenant_insert on public.crm_leads
for insert to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy crm_leads_tenant_update on public.crm_leads
for update to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy crm_leads_tenant_delete on public.crm_leads
for delete to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

drop policy bookings_tenant_access on public.bookings;

create policy bookings_tenant_select on public.bookings
for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy bookings_tenant_insert on public.bookings
for insert to authenticated
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy bookings_tenant_update on public.bookings
for update to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

create policy bookings_tenant_delete on public.bookings
for delete to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or assigned_to = auth.uid()
    or assigned_to is null
  )
);

-- ---------------------------------------------------------------
-- 2. Booking children follow their booking
-- ---------------------------------------------------------------
-- Only the bookings-domain roles use these through the API.

drop policy "booking_flights_tenant_access" on public.booking_flights;
create policy "booking_flights_tenant_access" on public.booking_flights
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
);

drop policy "booking_hotels_tenant_access" on public.booking_hotels;
create policy "booking_hotels_tenant_access" on public.booking_hotels
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
);

drop policy "booking_transfers_tenant_access" on public.booking_transfers;
create policy "booking_transfers_tenant_access" on public.booking_transfers
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
);

drop policy "booking_notes_tenant_access" on public.booking_notes;
create policy "booking_notes_tenant_access" on public.booking_notes
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
);

drop policy "booking_timeline_tenant_access" on public.booking_timeline;
create policy "booking_timeline_tenant_access" on public.booking_timeline
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and booking_id in (select b.id from public.bookings b)
);

-- ---------------------------------------------------------------
-- 3. CRM children follow their lead / customer
-- ---------------------------------------------------------------

drop policy "crm_notes_tenant_access" on public.crm_notes;
create policy "crm_notes_tenant_access" on public.crm_notes
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    (lead_id is not null and lead_id in (select l.id from public.crm_leads l))
    or (customer_id is not null and customer_id in (select c.id from public.customers c))
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and (
    (lead_id is not null and lead_id in (select l.id from public.crm_leads l))
    or (customer_id is not null and customer_id in (select c.id from public.customers c))
  )
);

drop policy "crm_activities_tenant_access" on public.crm_activities;
create policy "crm_activities_tenant_access" on public.crm_activities
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and lead_id in (select l.id from public.crm_leads l)
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent')
  and lead_id in (select l.id from public.crm_leads l)
);

-- ---------------------------------------------------------------
-- 4. Visa applications
-- ---------------------------------------------------------------
-- admin/owner/branch_manager: tenant-wide (unchanged)
-- visa_officer: own + unassigned (unchanged visa ownership model)
-- sales_agent: only visas of customers it can see (was tenant-wide)
-- accountant: none (not a visa role in the API)

drop policy visa_applications_tenant_access on public.visa_applications;
create policy visa_applications_tenant_access on public.visa_applications
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or (
      public.current_user_role() = 'visa_officer'
      and (assigned_to = auth.uid() or assigned_to is null)
    )
    or (
      public.current_user_role() = 'sales_agent'
      and customer_id in (select c.id from public.customers c)
    )
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager')
    or (
      public.current_user_role() = 'visa_officer'
      and (assigned_to = auth.uid() or assigned_to is null)
    )
    or (
      public.current_user_role() = 'sales_agent'
      and customer_id in (select c.id from public.customers c)
    )
  )
);

-- ---------------------------------------------------------------
-- 5. Finance
-- ---------------------------------------------------------------

drop policy "invoices_tenant_access" on public.invoices;

create policy "invoices_tenant_select" on public.invoices
for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and (
    public.current_user_role() in ('travio_admin', 'agency_owner', 'branch_manager', 'accountant')
    or (
      public.current_user_role() = 'sales_agent'
      and (
        (booking_id is not null and booking_id in (select b.id from public.bookings b))
        or (customer_id is not null and customer_id in (select c.id from public.customers c))
      )
    )
  )
);

create policy "invoices_tenant_write" on public.invoices
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
);

drop policy "invoice_items_tenant_access" on public.invoice_items;

create policy "invoice_items_tenant_select" on public.invoice_items
for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and invoice_id in (select i.id from public.invoices i)
);

create policy "invoice_items_tenant_write" on public.invoice_items
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
);

drop policy "payments_tenant_access" on public.payments;

create policy "payments_tenant_select" on public.payments
for select to authenticated
using (
  tenant_id = public.current_tenant_id()
  and invoice_id in (select i.id from public.invoices i)
);

create policy "payments_tenant_write" on public.payments
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
);

drop policy "expenses_tenant_access" on public.expenses;
create policy "expenses_tenant_access" on public.expenses
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in ('travio_admin', 'agency_owner', 'accountant')
);

-- ---------------------------------------------------------------
-- 6. Documents follow their owner record
-- ---------------------------------------------------------------
-- 'agency' documents have no owner record and stay visible to every
-- staff role, as before.

drop policy "documents_tenant_access" on public.documents;
create policy "documents_tenant_access" on public.documents
for all to authenticated
using (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in (
    'travio_admin', 'agency_owner', 'branch_manager', 'sales_agent', 'visa_officer', 'accountant'
  )
  and (
    (owner_type = 'customer' and owner_id in (select c.id from public.customers c))
    or (owner_type = 'booking' and owner_id in (select b.id from public.bookings b))
    or (owner_type = 'invoice' and owner_id in (select i.id from public.invoices i))
    or owner_type = 'agency'
  )
)
with check (
  tenant_id = public.current_tenant_id()
  and public.current_user_role() in (
    'travio_admin', 'agency_owner', 'branch_manager', 'sales_agent', 'visa_officer', 'accountant'
  )
  and (
    (owner_type = 'customer' and owner_id in (select c.id from public.customers c))
    or (owner_type = 'booking' and owner_id in (select b.id from public.bookings b))
    or (owner_type = 'invoice' and owner_id in (select i.id from public.invoices i))
    or owner_type = 'agency'
  )
);

-- Stored files: previously any staff member could read every file in the
-- tenant's folder. Now a file is readable by whoever uploaded it (the
-- browser uploads the file before the documents row exists, and the
-- upload's INSERT ... RETURNING needs read access), or through a
-- documents row the caller can see.
drop policy "documents_bucket_tenant_select" on storage.objects;
create policy "documents_bucket_tenant_select" on storage.objects
for select to authenticated
using (
  bucket_id = 'documents'
  and (storage.foldername(name))[1] = public.current_tenant_id()::text
  and (
    owner_id = auth.uid()::text
    or exists (
      select 1 from public.documents d
      where d.file_path = storage.objects.name
    )
  )
);

-- ---------------------------------------------------------------
-- 7. convert_crm_lead(): respect role and ownership
-- ---------------------------------------------------------------
-- security definer, so it bypassed RLS entirely: any tenant member
-- could convert any lead, and an existing customer was matched by email
-- even if it belonged to another sales agent. Now:
--   - only the leads-domain roles may call it
--   - the lead must be one the caller can see
--   - an existing customer is only reused if the caller can see it;
--     otherwise a new customer is created (product decision)
-- Same signature, return shape and grants as before.
create or replace function public.convert_crm_lead(
  lead_id uuid,
  force_create_new boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_tenant_id uuid;
  v_role public.user_role;
  v_uid uuid := auth.uid();
  v_sees_all boolean;
  v_lead public.crm_leads;
  v_customer public.customers;
  v_outcome text;
begin
  v_tenant_id := public.current_tenant_id();
  if v_tenant_id is null then
    raise exception 'No tenant context for current user' using errcode = '42501';
  end if;

  v_role := public.current_user_role();
  if v_role is null
     or v_role not in ('travio_admin', 'agency_owner', 'branch_manager', 'sales_agent') then
    raise exception 'Not allowed to convert leads' using errcode = '42501';
  end if;
  v_sees_all := v_role in ('travio_admin', 'agency_owner', 'branch_manager');

  select *
  into v_lead
  from public.crm_leads l
  where l.id = convert_crm_lead.lead_id
    and l.tenant_id = v_tenant_id
    and (v_sees_all or l.assigned_to = v_uid or l.assigned_to is null);

  if not found or v_lead.deleted_at is not null then
    raise exception 'Lead not found' using errcode = 'P0002';
  end if;

  if v_lead.converted_customer_id is not null or v_lead.status = 'won' then
    raise exception 'Lead has already been converted' using errcode = '23505';
  end if;

  if v_lead.email is not null and not force_create_new then
    select *
    into v_customer
    from public.customers c
    where c.tenant_id = v_tenant_id
      and c.deleted_at is null
      and lower(c.email) = lower(v_lead.email)
      and (v_sees_all or c.assigned_to = v_uid or c.assigned_to is null)
    limit 1;
  end if;

  if v_customer.id is not null then
    v_outcome := 'linked';
  else
    insert into public.customers (tenant_id, branch_id, full_name, phone, email)
    values (v_tenant_id, v_lead.branch_id, v_lead.full_name, v_lead.phone, v_lead.email)
    returning * into v_customer;
    v_outcome := 'created';
  end if;

  update public.crm_leads
  set
    status = 'won',
    converted_customer_id = v_customer.id,
    converted_at = now(),
    converted_by = v_uid
  where id = v_lead.id;

  return jsonb_build_object(
    'outcome', v_outcome,
    'lead_id', v_lead.id,
    'customer_id', v_customer.id
  );
end;
$$;
