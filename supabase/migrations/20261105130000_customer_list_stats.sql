-- =========================================
-- Per-customer stats for the Customers list
-- =========================================
--
-- The Customers list (TRAVIO design 03) shows, for each customer on the
-- page, how many bookings they have, how much they have paid, and when
-- they were last active. Computed here for just the ids on the current
-- page, instead of loading every booking/payment into the app.
--
--   bookings_count   - their bookings that are not deleted
--   total_spent      - payments recorded on their (non-deleted) invoices
--   last_activity_at - latest of: the customer record changing, one of
--                      their bookings being created/updated, a payment
--
-- SECURITY INVOKER: RLS on customers/bookings/invoices/payments decides
-- what each caller's numbers include (e.g. a role that can't see
-- payments gets total_spent 0).

create or replace function public.customer_list_stats(customer_ids uuid[])
returns table (
  customer_id uuid,
  bookings_count integer,
  total_spent numeric,
  last_activity_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    c.id,
    (
      select count(*)
      from public.bookings b
      where b.customer_id = c.id and b.deleted_at is null
    )::integer,
    coalesce((
      select sum(p.amount)
      from public.payments p
      join public.invoices i on i.id = p.invoice_id
      where i.customer_id = c.id and i.deleted_at is null
    ), 0),
    greatest(
      c.updated_at,
      (
        select max(greatest(b.created_at, b.updated_at))
        from public.bookings b
        where b.customer_id = c.id and b.deleted_at is null
      ),
      (
        select max(p.paid_at)
        from public.payments p
        join public.invoices i on i.id = p.invoice_id
        where i.customer_id = c.id and i.deleted_at is null
      )
    )
  from public.customers c
  where c.id = any(customer_ids)
    and c.deleted_at is null;
$$;

revoke execute on function public.customer_list_stats(uuid[]) from public, anon;
grant execute on function public.customer_list_stats(uuid[]) to authenticated;
