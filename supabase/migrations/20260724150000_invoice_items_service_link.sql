-- =========================================
-- Invoice Items: service link
-- Travio v1.2.0
-- =========================================
--
-- Audit confirmed public.invoice_items has no way to associate a line
-- item with the service it bills for (no column links it to
-- booking_flights/booking_hotels/booking_transfers/visa_applications).
-- This adds that link. Table is empty (confirmed live) - no data
-- migration/backfill needed.
--
-- reference_id is deliberately a single untyped uuid with no FK -
-- unlike ADR-0004's twin-nullable-FK preference for crm_notes (which
-- only ever points at one of two tables), an invoice item can reference
-- any one of four different tables depending on item_type. A clean FK
-- can't span four possible targets, and adding four separate nullable
-- FK columns for a single optional, informational link would be more
-- schema surface than this warrants. No cross-column CHECK ties
-- item_type to reference_id either, matching how booking_flights/
-- booking_hotels/booking_transfers don't enforce cross-column
-- consistency beyond their own single-column CHECKs.
--
-- RLS (invoice_items_tenant_access) and authenticated grants already
-- exist and are correct - neither is touched here.

alter table public.invoice_items
  add column item_type text not null default 'manual',
  add column reference_id uuid,
  add constraint invoice_items_item_type_check check (
    item_type in ('flight', 'hotel', 'transfer', 'visa', 'manual')
  );
