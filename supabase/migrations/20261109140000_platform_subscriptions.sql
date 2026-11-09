-- =========================================
-- Super Admin: subscriptions list
-- =========================================
--
-- The admin console's Billing page lists every agency with its
-- subscription, plus a summary. There is no payment gateway yet, so
-- expected_mrr is what active subscriptions would bring in per month at
-- list price - it is not money collected. Trials and past-due
-- subscriptions don't count towards it; a yearly plan counts as 1/12.
--
-- An agency's subscription is its latest live one (trialing, active,
-- past_due), or its latest of any status if none is live, matching
-- platform_overview's choice of plan.
--
-- SECURITY DEFINER (it spans every tenant); refuses anyone who isn't
-- travio_admin (42501) before reading anything.

create or replace function public.platform_subscriptions(
  search_text text default null,
  status_filter text default 'all',
  page_number integer default 1,
  page_size integer default 20
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  term text;
  safe_page integer := greatest(coalesce(page_number, 1), 1);
  safe_size integer := least(greatest(coalesce(page_size, 20), 1), 100);
  result jsonb;
begin
  if public.current_role() is distinct from 'travio_admin'::public.user_role then
    raise exception 'platform_subscriptions is for Travio administrators only' using errcode = '42501';
  end if;

  -- The caller's text is matched literally: % and _ are not wildcards.
  term := '%' || replace(replace(replace(coalesce(trim(search_text), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  with latest as (
    select distinct on (s.tenant_id)
      s.tenant_id, s.status::text as status, s.starts_at, s.ends_at,
      pl.slug as plan, pl.price, pl."interval"::text as billing_interval
    from public.subscriptions s
    join public.plans pl on pl.id = s.plan_id
    order by s.tenant_id, (s.status in ('trialing', 'active', 'past_due')) desc, s.created_at desc
  ),
  agency_subs as (
    select t.id, t.name, t.slug, t.is_active, t.created_at,
           l.status, l.starts_at, l.ends_at, l.plan, l.price, l.billing_interval
    from public.tenants t
    left join latest l on l.tenant_id = t.id
  ),
  matching as (
    select *
    from agency_subs a
    where (
        status_filter is null
        or status_filter = 'all'
        or (status_filter = 'none' and a.status is null)
        or a.status = status_filter
      )
      and (term = '%%' or a.name ilike term or a.slug ilike term)
  ),
  page as (
    select * from matching
    order by created_at desc, id
    limit safe_size offset (safe_page - 1) * safe_size
  )
  select jsonb_build_object(
    'total', (select count(*) from matching),
    'summary', (
      select jsonb_build_object(
        'expected_mrr', coalesce(sum(
          case
            when status <> 'active' then 0
            when billing_interval = 'yearly' then price / 12
            else price
          end
        ), 0),
        'active', count(*) filter (where status = 'active'),
        'trialing', count(*) filter (where status = 'trialing'),
        'past_due', count(*) filter (where status = 'past_due'),
        'cancelled', count(*) filter (where status = 'cancelled'),
        'expired', count(*) filter (where status = 'expired'),
        'none', count(*) filter (where status is null)
      )
      from agency_subs
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'is_active', p.is_active,
        'plan', p.plan,
        'status', p.status,
        'price', p.price,
        'billing_interval', p.billing_interval,
        'starts_at', p.starts_at,
        'ends_at', p.ends_at
      ) order by p.created_at desc, p.id)
      from page p
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.platform_subscriptions(text, text, integer, integer) from public, anon;
grant execute on function public.platform_subscriptions(text, text, integer, integer) to authenticated;
