-- =========================================
-- Customer Portal Experience — Read Access RLS
-- Travio Product-6
-- =========================================
--
-- Product-5 introduced current_customer_id() plus additive, SELECT-only
-- "*_customer_access" policies on customers/bookings, kept structurally
-- separate from every existing "*_tenant_access" staff policy (customer
-- profiles carry tenant_id = null, so they can never satisfy a tenant
-- policy). This migration extends that exact pattern to every table a
-- customer needs to read for Documents, Trip Services (flights/hotels/
-- transfers/visa), and Finance (invoices/payments).
--
-- No new tables, no new columns, no change to any existing policy or
-- grant - every table touched here already has row level security
-- enabled and `grant select, insert, update, delete ... to authenticated`
-- from its own domain migration; RLS (not the grant) is what actually
-- scopes access. Every policy added below is "for select" only, so a
-- customer session can never insert/update/delete any of these rows -
-- the existing staff "for all" tenant policies remain the sole write
-- path, completely unaffected by anything in this file.

-- ---------------------------------------------------------------
-- Documents - owner_type/owner_id is polymorphic (customer/booking/
-- invoice/agency), there is no customer_id column to compare directly.
-- Ownership is re-derived per branch: a document owned directly by this
-- customer, or by one of this customer's bookings, or by one of this
-- customer's invoices. 'agency' documents (tenant-level, no specific
-- owner) are never visible to a customer.
-- ---------------------------------------------------------------
create policy "documents_customer_access"
on public.documents
for select
using (
  public.current_customer_id() is not null
  and (
    (owner_type = 'customer' and owner_id = public.current_customer_id())
    or (owner_type = 'booking' and owner_id in (
      select id from public.bookings where customer_id = public.current_customer_id()
    ))
    or (owner_type = 'invoice' and owner_id in (
      select id from public.invoices where customer_id = public.current_customer_id()
    ))
  )
);

-- Mirrors documents_bucket_tenant_select's role (Storage's own policy
-- surface), but a customer session has no tenant_id (Product-5), so the
-- "{tenant_id}/..." folder-prefix check that policy relies on doesn't
-- apply here. Ownership is instead re-derived by joining the object's
-- path back to its public.documents row, using the same three branches
-- as documents_customer_access above. Select-only, matching the tenant
-- policy - this phase never uploads/deletes from the customer portal.
create policy "documents_bucket_customer_select"
on storage.objects
for select
using (
  bucket_id = 'documents'
  and public.current_customer_id() is not null
  and exists (
    select 1 from public.documents d
    where d.file_path = storage.objects.name
      and d.deleted_at is null
      and (
        (d.owner_type = 'customer' and d.owner_id = public.current_customer_id())
        or (d.owner_type = 'booking' and d.owner_id in (
          select id from public.bookings where customer_id = public.current_customer_id()
        ))
        or (d.owner_type = 'invoice' and d.owner_id in (
          select id from public.invoices where customer_id = public.current_customer_id()
        ))
      )
  )
);

-- ---------------------------------------------------------------
-- Trip services (flights/hotels/transfers) - each has booking_id but no
-- direct customer_id column, so ownership is re-derived via bookings,
-- same shape as documents' 'booking' branch above.
-- ---------------------------------------------------------------
create policy "booking_flights_customer_access"
on public.booking_flights
for select
using (
  public.current_customer_id() is not null
  and booking_id in (
    select id from public.bookings where customer_id = public.current_customer_id()
  )
);

create policy "booking_hotels_customer_access"
on public.booking_hotels
for select
using (
  public.current_customer_id() is not null
  and booking_id in (
    select id from public.bookings where customer_id = public.current_customer_id()
  )
);

create policy "booking_transfers_customer_access"
on public.booking_transfers
for select
using (
  public.current_customer_id() is not null
  and booking_id in (
    select id from public.bookings where customer_id = public.current_customer_id()
  )
);

-- Visa status - visa_applications already has a direct customer_id
-- column (20260724090000), so this needs no join, mirroring
-- customers_customer_access's own shape exactly. A visa application not
-- yet linked to this customer is simply invisible - that is what "only
-- if already linked and authorized" means at the data layer; there is
-- no separate authorization check to write, RLS is the authorization.
create policy "visa_applications_customer_access"
on public.visa_applications
for select
using (
  public.current_customer_id() is not null
  and customer_id = public.current_customer_id()
);

-- ---------------------------------------------------------------
-- Finance (invoices/payments) - read-only visibility. No policy here
-- grants insert/update/delete, and no customer-portal route calls
-- anything but list/get - there is no online payment or payment action
-- in this phase.
-- ---------------------------------------------------------------
create policy "invoices_customer_access"
on public.invoices
for select
using (
  public.current_customer_id() is not null
  and customer_id = public.current_customer_id()
);

-- payments has no customer_id column (only invoice_id) - ownership is
-- re-derived via invoices.customer_id, the same two-hop shape
-- paymentService.listByBooking already uses at the application layer.
create policy "payments_customer_access"
on public.payments
for select
using (
  public.current_customer_id() is not null
  and invoice_id in (
    select id from public.invoices where customer_id = public.current_customer_id()
  )
);
