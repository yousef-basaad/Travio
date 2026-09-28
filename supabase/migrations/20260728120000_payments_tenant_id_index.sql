-- Finance Workspace v1.7 - paymentService.list() is the first
-- tenant-wide (unfiltered by invoice_id) query against payments, backing
-- PaymentStatus. Additive only - no columns/constraints/RLS/grants
-- touched, matching invoices_booking_id_idx's precedent.
create index if not exists payments_tenant_id_idx on public.payments (tenant_id);
