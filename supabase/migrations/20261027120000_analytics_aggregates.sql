-- =========================================
-- Analytics / usage aggregates in Postgres (Phase 3)
-- =========================================
--
-- analyticsService and usageService used to select every row and sum in
-- JavaScript. PostgREST caps a response at max_rows (1000), so past 1000
-- invoices/payments/bookings/documents the totals were silently wrong.
-- These functions aggregate in the database and return one small result.
--
-- All are SECURITY INVOKER (the default, stated explicitly): RLS applies
-- exactly as if the caller had queried the tables itself, so each role
-- gets the totals it is allowed to see (e.g. a sales agent only its own
-- revenue - 20261026120000). search_path is empty and every object is
-- fully qualified. Only signed-in users may execute them.

-- Total invoiced (non-deleted invoices) and total paid.
create or replace function public.analytics_finance_totals()
returns table (total_revenue numeric, paid_amount numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce((select sum(i.total) from public.invoices i where i.deleted_at is null), 0),
    coalesce((select sum(p.amount) from public.payments p), 0);
$$;

-- Invoiced and paid per calendar month (UTC, 'YYYY-MM') from range_start.
-- Months with no activity are omitted; the service fills them with 0.
-- Payments without a paid_at can't be placed in a month and are skipped,
-- same as before.
create or replace function public.analytics_revenue_by_month(range_start date)
returns table (month text, invoice_total numeric, paid_total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  with invoiced as (
    select to_char(i.created_at at time zone 'UTC', 'YYYY-MM') as month, sum(i.total) as total
    from public.invoices i
    where i.deleted_at is null
      and i.created_at >= (range_start::timestamp at time zone 'UTC')
    group by 1
  ),
  paid as (
    select to_char(p.paid_at at time zone 'UTC', 'YYYY-MM') as month, sum(p.amount) as total
    from public.payments p
    where p.paid_at is not null
      and p.paid_at >= (range_start::timestamp at time zone 'UTC')
    group by 1
  )
  select
    coalesce(invoiced.month, paid.month),
    coalesce(invoiced.total, 0),
    coalesce(paid.total, 0)
  from invoiced
  full outer join paid on paid.month = invoiced.month;
$$;

-- Non-deleted bookings per status.
create or replace function public.analytics_booking_status_counts()
returns table (status public.booking_status, booking_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select b.status, count(*)
  from public.bookings b
  where b.deleted_at is null
  group by b.status;
$$;

-- Customers with the highest invoiced total (non-deleted invoices).
create or replace function public.analytics_top_customers(limit_count integer)
returns table (customer_id uuid, revenue numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select i.customer_id, sum(i.total) as revenue
  from public.invoices i
  where i.deleted_at is null
    and i.customer_id is not null
  group by i.customer_id
  order by revenue desc, i.customer_id
  limit greatest(limit_count, 0);
$$;

-- Number of non-deleted documents and their total size in bytes.
create or replace function public.usage_document_totals()
returns table (document_count bigint, storage_bytes numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select count(*), coalesce(sum(d.file_size), 0)
  from public.documents d
  where d.deleted_at is null;
$$;

revoke execute on function public.analytics_finance_totals() from public, anon;
revoke execute on function public.analytics_revenue_by_month(date) from public, anon;
revoke execute on function public.analytics_booking_status_counts() from public, anon;
revoke execute on function public.analytics_top_customers(integer) from public, anon;
revoke execute on function public.usage_document_totals() from public, anon;

grant execute on function public.analytics_finance_totals() to authenticated;
grant execute on function public.analytics_revenue_by_month(date) to authenticated;
grant execute on function public.analytics_booking_status_counts() to authenticated;
grant execute on function public.analytics_top_customers(integer) to authenticated;
grant execute on function public.usage_document_totals() to authenticated;
