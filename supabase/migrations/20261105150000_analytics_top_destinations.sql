-- =========================================
-- Top destinations
-- =========================================
--
-- "Top Destinations" on the Operations Center and Analytics (TRAVIO
-- designs 02/07): the destination countries with the most bookings.
-- Counts live (not deleted, not cancelled) bookings that have a
-- destination_country (20261105140000). Grouped in Postgres, like the
-- other analytics aggregates, so it isn't capped at PostgREST's 1000
-- rows. SECURITY INVOKER: bookings RLS decides which bookings count
-- (e.g. a sales agent's own).

create or replace function public.analytics_top_destinations(limit_count integer default 5)
returns table (country text, bookings integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select b.destination_country, count(*)::integer
  from public.bookings b
  where b.deleted_at is null
    and b.status <> 'cancelled'
    and b.destination_country is not null
  group by b.destination_country
  order by count(*) desc, b.destination_country
  limit greatest(least(coalesce(limit_count, 5), 50), 1);
$$;

revoke execute on function public.analytics_top_destinations(integer) from public, anon;
grant execute on function public.analytics_top_destinations(integer) to authenticated;
