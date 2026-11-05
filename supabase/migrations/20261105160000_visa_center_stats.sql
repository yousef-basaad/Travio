-- =========================================
-- Visa Center numbers
-- =========================================
--
-- The Visa Center (TRAVIO design 05) shows counts per status, how many
-- applications came in this month vs last month, and the most common
-- visa types and countries. Counted in Postgres in one call, so the
-- numbers stay right past PostgREST's 1000-row cap.
--
-- Visa type and country are free text today; they are grouped as
-- written (trimmed, empty ignored), top 5 each.
--
-- SECURITY INVOKER: visa_applications RLS decides which applications
-- each caller's numbers include (managers all, a visa officer its own +
-- unassigned, a sales agent those of customers it can see).

create or replace function public.visa_center_stats()
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with visas as (
    select v.status, v.created_at, nullif(trim(v.visa_type), '') as visa_type, nullif(trim(v.country), '') as country
    from public.visa_applications v
  ),
  month_start as (
    select date_trunc('month', now()) as this_month, date_trunc('month', now()) - interval '1 month' as last_month
  )
  select jsonb_build_object(
    'total', (select count(*) from visas),
    'draft', (select count(*) from visas where status = 'draft'),
    'submitted', (select count(*) from visas where status = 'submitted'),
    'approved', (select count(*) from visas where status = 'approved'),
    'rejected', (select count(*) from visas where status = 'rejected'),
    'new_this_month', (select count(*) from visas, month_start where created_at >= this_month),
    'new_last_month', (select count(*) from visas, month_start where created_at >= last_month and created_at < this_month),
    'by_type', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc, label)
      from (select visa_type as label, count(*) as n from visas where visa_type is not null
            group by visa_type order by count(*) desc, visa_type limit 5) t
    ), '[]'::jsonb),
    'by_country', coalesce((
      select jsonb_agg(jsonb_build_object('label', label, 'count', n) order by n desc, label)
      from (select country as label, count(*) as n from visas where country is not null
            group by country order by count(*) desc, country limit 5) c
    ), '[]'::jsonb)
  );
$$;

revoke execute on function public.visa_center_stats() from public, anon;
grant execute on function public.visa_center_stats() to authenticated;
