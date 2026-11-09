-- =========================================
-- Super Admin: users list
-- =========================================
--
-- The admin console's Users page lists every account on the platform
-- with its role, agency and last sign-in. Last sign-in and email
-- confirmation live in auth.users, which the app can't read.
--
-- SECURITY DEFINER (it spans every tenant and reads auth.users); refuses
-- anyone who isn't travio_admin (42501) before reading anything. Only
-- non-secret auth fields are returned.

create or replace function public.platform_users(
  search_text text default null,
  role_filter text default 'all',
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
    raise exception 'platform_users is for Travio administrators only' using errcode = '42501';
  end if;

  -- The caller's text is matched literally: % and _ are not wildcards.
  term := '%' || replace(replace(replace(coalesce(trim(search_text), ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';

  with matching as (
    select p.id, p.full_name, p.email, p.role, p.created_at, p.tenant_id, t.name as agency_name, t.is_active as agency_active
    from public.profiles p
    left join public.tenants t on t.id = p.tenant_id
    where (role_filter is null or role_filter = 'all' or p.role::text = role_filter)
      and (
        term = '%%'
        or p.full_name ilike term
        or p.email ilike term
        or t.name ilike term
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
        'full_name', p.full_name,
        'email', p.email,
        'role', p.role,
        'agency_id', p.tenant_id,
        'agency_name', p.agency_name,
        'agency_active', p.agency_active,
        'created_at', p.created_at,
        'last_sign_in_at', u.last_sign_in_at,
        'email_confirmed', u.email_confirmed_at is not null
      ) order by p.created_at desc, p.id)
      from page p
      left join auth.users u on u.id = p.id
    ), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke execute on function public.platform_users(text, text, integer, integer) from public, anon;
grant execute on function public.platform_users(text, text, integer, integer) to authenticated;
