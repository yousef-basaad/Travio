-- =========================================
-- Performance
-- =========================================
--
-- 1. RLS policies called current_tenant_id() and friends once per row.
--    Wrapped in a scalar subquery, Postgres runs them once per statement.
--    Same rules, no behaviour change.
-- 2. Indexes for lookups that had none.
-- 3. home_overview(): the home page loaded every booking, customer and
--    visa application to count and group them in the browser, and silently
--    lost anything past the 1000-row cap. It's now one query.
-- 4. visa_workspace_page(): a real page of visa applications, with the
--    search across customer name, country and type that the Visa Center
--    used to do in the browser.
--
-- Both functions are SECURITY INVOKER, so RLS decides what each caller's
-- numbers include.

do $$
declare
  p record;
  pattern constant text := '(?<!SELECT )((?:"current_role"|current_tenant_id|current_customer_id|current_user_role|auth\.uid)\(\))';
  new_using text;
  new_check text;
  statement text;
begin
  perform set_config('search_path', 'public', true);

  for p in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
  loop
    new_using := regexp_replace(p.qual, pattern, '(SELECT \1)', 'g');
    new_check := regexp_replace(p.with_check, pattern, '(SELECT \1)', 'g');

    if new_using is distinct from p.qual or new_check is distinct from p.with_check then
      statement := format('alter policy %I on public.%I', p.policyname, p.tablename);
      if new_using is not null then
        statement := statement || format(' using (%s)', new_using);
      end if;
      if new_check is not null then
        statement := statement || format(' with check (%s)', new_check);
      end if;
      execute statement;
    end if;
  end loop;
end $$;

create index if not exists profiles_tenant_id_idx on public.profiles (tenant_id);
create index if not exists invoice_items_tenant_id_idx on public.invoice_items (tenant_id);
create index if not exists subscriptions_plan_id_idx on public.subscriptions (plan_id);
create index if not exists bookings_branch_id_idx on public.bookings (branch_id);
create index if not exists bookings_tenant_start_date_idx on public.bookings (tenant_id, start_date);
create index if not exists bookings_tenant_end_date_idx on public.bookings (tenant_id, end_date);
create index if not exists visa_applications_tenant_created_idx on public.visa_applications (tenant_id, created_at desc);

create or replace function public.home_overview(range_start date)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with live as (
    select b.id, b.status, b.title, b.booking_number, b.customer_id, b.start_date, b.end_date, b.assigned_to, b.created_at
    from public.bookings b
    where b.deleted_at is null
  ),
  since as (
    select (range_start::timestamp at time zone 'UTC') as at
  ),
  today as (
    select (now() at time zone 'UTC')::date as d
  )
  select jsonb_build_object(
    'bookings_by_month', coalesce((
      select jsonb_object_agg(month, n) from (
        select to_char(l.created_at at time zone 'UTC', 'YYYY-MM') as month, count(*) as n
        from live l, since where l.created_at >= since.at group by 1
      ) m
    ), '{}'::jsonb),
    'customers_by_month', coalesce((
      select jsonb_object_agg(month, n) from (
        select to_char(c.created_at at time zone 'UTC', 'YYYY-MM') as month, count(*) as n
        from public.customers c, since where c.deleted_at is null and c.created_at >= since.at group by 1
      ) m
    ), '{}'::jsonb),
    'visas_by_month', coalesce((
      select jsonb_object_agg(month, n) from (
        select to_char(v.created_at at time zone 'UTC', 'YYYY-MM') as month, count(*) as n
        from public.visa_applications v, since where v.created_at >= since.at group by 1
      ) m
    ), '{}'::jsonb),
    'board', (
      select jsonb_agg(jsonb_build_object(
        'status', s.status,
        'total', (select count(*) from live l where l.status = s.status),
        'items', coalesce((
          select jsonb_agg(jsonb_build_object(
            'id', r.id, 'booking_number', r.booking_number, 'title', r.title,
            'start_date', r.start_date, 'customer_name', r.full_name
          ) order by r.created_at desc)
          from (
            select l.id, l.booking_number, l.title, l.start_date, l.created_at, c.full_name
            from live l
            left join public.customers c on c.id = l.customer_id
            where l.status = s.status
            order by l.created_at desc
            limit 20
          ) r
        ), '[]'::jsonb)
      ))
      from unnest(enum_range(null::public.booking_status)) as s(status)
    ),
    'today', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'title', e.title, 'booking_number', e.booking_number, 'kind', e.kind))
      from (
        select l.id, l.title, l.booking_number, 'departure' as kind from live l, today where l.start_date = today.d
        union all
        select l.id, l.title, l.booking_number, 'return' from live l, today where l.end_date = today.d
        limit 50
      ) e
    ), '[]'::jsonb),
    'team', coalesce((
      select jsonb_object_agg(assigned_to, n) from (
        select l.assigned_to, count(*) as n from live l where l.assigned_to is not null group by 1
      ) t
    ), '{}'::jsonb)
  );
$$;

create or replace function public.visa_workspace_page(
  search_text text default null,
  status_filter text default null,
  page_number integer default 1,
  page_size integer default 25
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with term as (
    select '%' || replace(replace(replace(coalesce(trim(search_text), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%' as value
  ),
  matching as (
    select v.*, c.id as customer_ref, c.full_name as customer_name
    from public.visa_applications v
    left join public.customers c on c.id = v.customer_id, term
    where (status_filter is null or v.status::text = status_filter)
      and (term.value = '%%' or c.full_name ilike term.value or v.country ilike term.value or v.visa_type ilike term.value)
  ),
  page as (
    select * from matching
    order by created_at desc, id
    limit least(greatest(coalesce(page_size, 25), 1), 100)
    offset (greatest(coalesce(page_number, 1), 1) - 1) * least(greatest(coalesce(page_size, 25), 1), 100)
  )
  select jsonb_build_object(
    'total', (select count(*) from matching),
    'items', coalesce((
      select jsonb_agg(
        (to_jsonb(p) - 'customer_ref' - 'customer_name') || jsonb_build_object(
          'customer', case when p.customer_ref is null then null else jsonb_build_object('id', p.customer_ref, 'full_name', p.customer_name) end,
          'booking', (select jsonb_build_object('start_date', b.start_date) from public.bookings b where b.id = p.booking_id)
        )
        order by p.created_at desc, p.id
      )
      from page p
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.home_overview(date) from public, anon;
grant execute on function public.home_overview(date) to authenticated;
revoke execute on function public.visa_workspace_page(text, text, integer, integer) from public, anon;
grant execute on function public.visa_workspace_page(text, text, integer, integer) to authenticated;
