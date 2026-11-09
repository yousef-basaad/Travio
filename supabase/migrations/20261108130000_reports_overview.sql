-- =========================================
-- Reports & Analytics numbers
-- =========================================
--
-- The Reports page (TRAVIO design 07) shows monthly bookings (confirmed
-- vs cancelled) and new customers, sales by service and by destination,
-- customers by nationality, staff performance and a few ratios. All of
-- it is counted in Postgres in one call, so the numbers stay right past
-- PostgREST's 1000-row cap.
--
-- Definitions:
--   * Bookings are non-deleted bookings; "confirmed" in the monthly trend
--     means confirmed or completed (a completed trip was confirmed).
--   * Sales are non-deleted invoice totals (the same base as the existing
--     analytics revenue), attached to a destination / staff member
--     through the invoice's booking.
--   * Rates are null when their base is zero - never a made-up 0%.
--
-- SECURITY INVOKER: RLS on bookings, customers, invoices and profiles
-- decides which rows each caller's numbers include.

create or replace function public.reports_overview(range_start date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with bookings as (
    select b.id, b.customer_id, b.status, b.created_at, b.start_date, b.end_date,
           b.assigned_to, nullif(upper(trim(b.destination_country)), '') as country
    from public.bookings b
    where b.deleted_at is null
  ),
  invoices as (
    select i.id, i.booking_id, i.customer_id, i.total
    from public.invoices i
    where i.deleted_at is null
  ),
  booking_sales as (
    select booking_id, sum(total) as total
    from invoices
    where booking_id is not null
    group by booking_id
  ),
  customers as (
    select c.id, c.created_at, nullif(trim(c.nationality), '') as nationality
    from public.customers c
    where c.deleted_at is null
  ),
  range_bounds as (
    select (range_start::timestamp at time zone 'UTC') as since
  ),
  status_counts as (
    select
      count(*) filter (where status <> 'draft') as live,
      count(*) filter (where status = 'completed') as completed,
      count(*) filter (where status = 'cancelled') as cancelled
    from bookings
  ),
  customer_bookings as (
    select customer_id, count(*) as n
    from bookings
    where status not in ('draft', 'cancelled')
    group by customer_id
  )
  select jsonb_build_object(
    'bookings_by_month', coalesce((
      select jsonb_agg(jsonb_build_object('month', month, 'total', total, 'confirmed', confirmed, 'cancelled', cancelled) order by month)
      from (
        select to_char(created_at at time zone 'UTC', 'YYYY-MM') as month,
               count(*) as total,
               count(*) filter (where status in ('confirmed', 'completed')) as confirmed,
               count(*) filter (where status = 'cancelled') as cancelled
        from bookings, range_bounds
        where created_at >= since
        group by 1
      ) m
    ), '[]'::jsonb),
    'customers_by_month', coalesce((
      select jsonb_agg(jsonb_build_object('month', month, 'count', n) order by month)
      from (
        select to_char(created_at at time zone 'UTC', 'YYYY-MM') as month, count(*) as n
        from customers, range_bounds
        where created_at >= since
        group by 1
      ) m
    ), '[]'::jsonb),
    'sales_by_service', coalesce((
      select jsonb_agg(jsonb_build_object('type', item_type, 'total', total) order by total desc, item_type)
      from (
        select ii.item_type, sum(ii.total) as total
        from public.invoice_items ii
        join invoices i on i.id = ii.invoice_id
        group by ii.item_type
        having sum(ii.total) > 0
      ) s
    ), '[]'::jsonb),
    'sales_by_destination', coalesce((
      select jsonb_agg(jsonb_build_object('country', country, 'bookings', n, 'total', total) order by total desc, n desc, country)
      from (
        select b.country, count(*) as n, coalesce(sum(bs.total), 0) as total
        from bookings b
        left join booking_sales bs on bs.booking_id = b.id
        where b.country is not null and b.status <> 'cancelled'
        group by b.country
        order by coalesce(sum(bs.total), 0) desc, count(*) desc, b.country
        limit 6
      ) d
    ), '[]'::jsonb),
    'customers_by_nationality', jsonb_build_object(
      'total', (select count(*) from customers),
      'items', coalesce((
        select jsonb_agg(jsonb_build_object('label', nationality, 'count', n) order by n desc, nationality)
        from (
          select nationality, count(*) as n
          from customers
          where nationality is not null
          group by nationality
          order by count(*) desc, nationality
          limit 6
        ) t
      ), '[]'::jsonb)
    ),
    'staff', coalesce((
      select jsonb_agg(jsonb_build_object(
        'profile_id', profile_id, 'name', full_name, 'bookings', n, 'completed', completed, 'cancelled', cancelled, 'sales', total
      ) order by total desc, n desc, full_name)
      from (
        select b.assigned_to as profile_id, p.full_name,
               count(*) as n,
               count(*) filter (where b.status = 'completed') as completed,
               count(*) filter (where b.status = 'cancelled') as cancelled,
               coalesce(sum(bs.total), 0) as total
        from bookings b
        join public.profiles p on p.id = b.assigned_to
        left join booking_sales bs on bs.booking_id = b.id
        where b.status <> 'draft'
        group by b.assigned_to, p.full_name
        order by coalesce(sum(bs.total), 0) desc, count(*) desc, p.full_name
        limit 5
      ) s
    ), '[]'::jsonb),
    'live_bookings', (select live from status_counts),
    'completed_bookings', (select completed from status_counts),
    'cancelled_bookings', (select cancelled from status_counts),
    'customers_with_bookings', (select count(*) from customer_bookings),
    'repeat_customers', (select count(*) from customer_bookings where n > 1),
    'avg_trip_days', (
      select round(avg(end_date - start_date)::numeric, 1)
      from bookings
      where status <> 'cancelled' and start_date is not null and end_date is not null and end_date >= start_date
    ),
    'flight_tickets', (
      select count(*)
      from public.booking_flights f
      join bookings b on b.id = f.booking_id
      where b.status <> 'cancelled'
    ),
    'invoiced_customers', (select count(distinct customer_id) from invoices where customer_id is not null),
    'invoiced_bookings', (select count(distinct booking_id) from invoices where booking_id is not null),
    'invoiced_total', (select coalesce(sum(total), 0) from invoices)
  );
$$;

revoke execute on function public.reports_overview(date) from public, anon;
grant execute on function public.reports_overview(date) to authenticated;
