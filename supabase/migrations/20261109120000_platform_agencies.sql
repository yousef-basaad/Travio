-- =========================================
-- Super Admin: agencies list and deactivation
-- =========================================
--
-- The admin console's Agencies page lists every agency and can
-- deactivate one. Until now tenants.is_active was never enforced, so a
-- deactivated agency would have kept working.
--
-- 1. current_tenant_id() returns null for an inactive agency. Every
--    agency-staff RLS policy goes through it, so that agency's staff stop
--    seeing or changing any tenant data at once. Reactivating restores
--    access; nothing is deleted. Customer-portal policies key on
--    current_customer_id() and are deliberately left alone.
-- 2. platform_agencies() and platform_set_agency_active() are SECURITY
--    DEFINER (they span every tenant) and refuse anyone who isn't
--    travio_admin (42501) before touching anything.

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.tenant_id
  from public.profiles p
  join public.tenants t on t.id = p.tenant_id
  where p.id = auth.uid() and t.is_active;
$$;

create or replace function public.platform_agencies(
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
    raise exception 'platform_agencies is for Travio administrators only' using errcode = '42501';
  end if;

  -- The caller's text is matched literally: % and _ are not wildcards.
  term := '%' || replace(replace(replace(coalesce(trim(search_text), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  with matching as (
    select t.*
    from public.tenants t
    where (status_filter is distinct from 'active' or t.is_active)
      and (status_filter is distinct from 'inactive' or not t.is_active)
      and (
        term = '%%'
        or t.name ilike term
        or t.slug ilike term
        or t.cr_number ilike term
        or t.email ilike term
      )
  ),
  page as (
    select * from matching
    order by created_at desc, id
    limit safe_size offset (safe_page - 1) * safe_size
  )
  select jsonb_build_object(
    'total', (select count(*) from matching),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', p.id,
        'name', p.name,
        'slug', p.slug,
        'cr_number', p.cr_number,
        'email', p.email,
        'phone', p.phone,
        'is_active', p.is_active,
        'created_at', p.created_at,
        'plan', sub.plan_slug,
        'subscription_status', sub.status,
        'owner_name', owner.full_name,
        'owner_email', owner.email,
        'staff', (select count(*) from public.profiles s where s.tenant_id = p.id and s.role <> 'customer'),
        'customers', (select count(*) from public.customers c where c.tenant_id = p.id and c.deleted_at is null),
        'bookings', (select count(*) from public.bookings b where b.tenant_id = p.id and b.deleted_at is null),
        'revenue', (select coalesce(sum(i.total), 0) from public.invoices i where i.tenant_id = p.id and i.deleted_at is null)
      ) order by p.created_at desc, p.id)
      from page p
      left join lateral (
        select pl.slug as plan_slug, s.status
        from public.subscriptions s
        join public.plans pl on pl.id = s.plan_id
        where s.tenant_id = p.id and s.status in ('trialing', 'active', 'past_due')
        order by s.created_at desc
        limit 1
      ) sub on true
      left join lateral (
        select o.full_name, o.email
        from public.profiles o
        where o.tenant_id = p.id and o.role = 'agency_owner'
        order by o.created_at
        limit 1
      ) owner on true
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

create or replace function public.platform_set_agency_active(target_tenant uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.current_role() is distinct from 'travio_admin'::public.user_role then
    raise exception 'platform_set_agency_active is for Travio administrators only' using errcode = '42501';
  end if;
  if active is null then
    raise exception 'active must be true or false' using errcode = '22004';
  end if;

  update public.tenants set is_active = active, updated_at = now() where id = target_tenant;
  if not found then
    raise exception 'agency not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.platform_agencies(text, text, integer, integer) from public, anon;
grant execute on function public.platform_agencies(text, text, integer, integer) to authenticated;
revoke execute on function public.platform_set_agency_active(uuid, boolean) from public, anon;
grant execute on function public.platform_set_agency_active(uuid, boolean) to authenticated;
