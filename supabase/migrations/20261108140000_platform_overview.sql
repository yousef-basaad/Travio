-- =========================================
-- Super Admin overview numbers
-- =========================================
--
-- The platform admin console (TRAVIO design: Super Admin overview) shows
-- totals across every agency: agencies, customers, bookings, revenue,
-- daily revenue and bookings for the last 30 days, agencies per plan,
-- the newest agencies and the latest platform activity.
--
-- SECURITY DEFINER because the numbers span every tenant; the first
-- thing it does is refuse anyone whose profile role isn't travio_admin
-- (42501), so agency staff and customers get an error, never another
-- agency's data. Counted in Postgres, so nothing is capped at 1000 rows.
--
-- Definitions match the agency analytics: bookings and invoices exclude
-- soft-deleted rows; revenue is invoiced total; collected is payments
-- with a paid_at. An agency's plan is its latest trialing/active/past_due
-- subscription; agencies without one count as "none".

create or replace function public.platform_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  this_month timestamptz := date_trunc('month', now());
  last_month timestamptz := date_trunc('month', now()) - interval '1 month';
  since timestamptz := date_trunc('day', now()) - interval '29 days';
  result jsonb;
begin
  if public.current_role() is distinct from 'travio_admin'::public.user_role then
    raise exception 'platform_overview is for Travio administrators only' using errcode = '42501';
  end if;

  with
  bookings as (
    select b.id, b.tenant_id, b.status, b.created_at from public.bookings b where b.deleted_at is null
  ),
  invoices as (
    select i.id, i.tenant_id, i.total, i.created_at from public.invoices i where i.deleted_at is null
  ),
  payments as (
    select p.tenant_id, p.amount, p.paid_at from public.payments p where p.paid_at is not null
  ),
  customers as (
    select c.id, c.tenant_id, c.created_at from public.customers c where c.deleted_at is null
  ),
  tenant_plan as (
    select distinct on (s.tenant_id) s.tenant_id, pl.name as plan_name, pl.slug as plan_slug, s.status
    from public.subscriptions s
    join public.plans pl on pl.id = s.plan_id
    where s.status in ('trialing', 'active', 'past_due')
    order by s.tenant_id, s.created_at desc
  ),
  days as (
    select generate_series(since, date_trunc('day', now()), interval '1 day') as day
  )
  select jsonb_build_object(
    'agencies', (select count(*) from public.tenants),
    'active_agencies', (select count(*) from public.tenants where is_active),
    'users', (select count(*) from public.profiles where tenant_id is not null and role <> 'customer'),
    'customers', (select count(*) from customers),
    'bookings', (select count(*) from bookings),
    'revenue', (select coalesce(sum(total), 0) from invoices),
    'collected', (select coalesce(sum(amount), 0) from payments),
    'this_month', jsonb_build_object(
      'agencies', (select count(*) from public.tenants where created_at >= this_month),
      'customers', (select count(*) from customers where created_at >= this_month),
      'bookings', (select count(*) from bookings where created_at >= this_month),
      'revenue', (select coalesce(sum(total), 0) from invoices where created_at >= this_month),
      'collected', (select coalesce(sum(amount), 0) from payments where paid_at >= this_month)
    ),
    'last_month', jsonb_build_object(
      'agencies', (select count(*) from public.tenants where created_at >= last_month and created_at < this_month),
      'customers', (select count(*) from customers where created_at >= last_month and created_at < this_month),
      'bookings', (select count(*) from bookings where created_at >= last_month and created_at < this_month),
      'revenue', (select coalesce(sum(total), 0) from invoices where created_at >= last_month and created_at < this_month),
      'collected', (select coalesce(sum(amount), 0) from payments where paid_at >= last_month and paid_at < this_month)
    ),
    'daily', (
      select jsonb_agg(jsonb_build_object(
        'day', to_char(d.day, 'YYYY-MM-DD'),
        'revenue', coalesce(r.total, 0),
        'bookings', coalesce(k.n, 0)
      ) order by d.day)
      from days d
      left join (
        select date_trunc('day', created_at) as day, sum(total) as total from invoices where created_at >= since group by 1
      ) r on r.day = d.day
      left join (
        select date_trunc('day', created_at) as day, count(*) as n from bookings where created_at >= since group by 1
      ) k on k.day = d.day
    ),
    'by_plan', coalesce((
      select jsonb_agg(jsonb_build_object('plan', plan, 'agencies', n) order by n desc, plan)
      from (
        select coalesce(tp.plan_slug, 'none') as plan, count(*) as n
        from public.tenants t
        left join tenant_plan tp on tp.tenant_id = t.id
        group by 1
      ) p
    ), '[]'::jsonb),
    'bookings_by_status', (
      select jsonb_object_agg(status, n)
      from (select status::text as status, count(*) as n from bookings group by status) s
    ),
    'recent_agencies', coalesce((
      select jsonb_agg(row_to_json(a)::jsonb order by a.created_at desc)
      from (
        select t.id, t.name, t.is_active, t.created_at, tp.plan_slug as plan,
               (select count(*) from customers c where c.tenant_id = t.id) as customers,
               (select count(*) from bookings b where b.tenant_id = t.id) as bookings,
               (select coalesce(sum(total), 0) from invoices i where i.tenant_id = t.id) as revenue
        from public.tenants t
        left join tenant_plan tp on tp.tenant_id = t.id
        order by t.created_at desc
        limit 5
      ) a
    ), '[]'::jsonb),
    'activity', coalesce((
      select jsonb_agg(row_to_json(e)::jsonb order by e.at desc)
      from (
        select * from (
          select 'agency_created' as kind, t.name as agency, null::numeric as amount, t.created_at as at
          from public.tenants t
          union all
          select 'booking_created', t.name, null, b.created_at
          from bookings b join public.tenants t on t.id = b.tenant_id
          union all
          select 'payment_received', t.name, p.amount, p.paid_at
          from payments p join public.tenants t on t.id = p.tenant_id
        ) all_events
        where at <= now()
        order by at desc
        limit 8
      ) e
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.platform_overview() from public, anon;
grant execute on function public.platform_overview() to authenticated;
