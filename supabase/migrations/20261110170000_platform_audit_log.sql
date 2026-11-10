-- =========================================
-- Audit log for platform admin actions
-- =========================================
--
-- Deactivating an agency or changing a plan's price or limits affects
-- paying customers, and left no record of who did it.
--
-- Entries are written inside the same function and transaction as the
-- change, so a change can't happen without its entry. No user role can
-- write, edit or delete them; admins read them through
-- platform_audit_entries().

create table public.platform_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  -- Kept as text so the record survives the account being deleted.
  actor_email text,
  action text not null check (action in ('agency_deactivated', 'agency_activated', 'plan_updated')),
  target_id uuid not null,
  target_label text not null,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index platform_audit_log_created_idx on public.platform_audit_log (created_at desc, id desc);

alter table public.platform_audit_log enable row level security;
revoke all on public.platform_audit_log from public, anon, authenticated;

create or replace function public.platform_write_audit(
  audit_action text,
  audit_target uuid,
  audit_label text,
  audit_details jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.platform_audit_log (actor_id, actor_email, action, target_id, target_label, details)
  select auth.uid(), (select p.email from public.profiles p where p.id = auth.uid()), audit_action, audit_target, audit_label, audit_details;
$$;

revoke execute on function public.platform_write_audit(text, uuid, text, jsonb) from public, anon, authenticated;

create or replace function public.platform_set_agency_active(target_tenant uuid, active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  agency_name text;
  was_active boolean;
begin
  if public.current_role() is distinct from 'travio_admin'::public.user_role then
    raise exception 'platform_set_agency_active is for Travio administrators only' using errcode = '42501';
  end if;
  if active is null then
    raise exception 'active must be true or false' using errcode = '22004';
  end if;

  select t.name, t.is_active into agency_name, was_active from public.tenants t where t.id = target_tenant;
  if not found then
    raise exception 'agency not found' using errcode = 'P0002';
  end if;

  -- Saving the same status again changes nothing, so it records nothing.
  if was_active is distinct from active then
    update public.tenants set is_active = active, updated_at = now() where id = target_tenant;
    perform public.platform_write_audit(
      case when active then 'agency_activated' else 'agency_deactivated' end,
      target_tenant, agency_name, '{}'::jsonb
    );
  end if;
end;
$$;

create or replace function public.platform_update_plan(target_plan uuid, new_price numeric, new_limits jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  limit_key text;
  limit_value text;
  plan_name text;
  old_price numeric;
  old_limits jsonb;
  saved_limits jsonb;
begin
  if public.current_role() is distinct from 'travio_admin'::public.user_role then
    raise exception 'platform_update_plan is for Travio administrators only' using errcode = '42501';
  end if;

  if new_price is null or new_price < 0 or new_price > 9999999.99 then
    raise exception 'price must be between 0 and 9999999.99' using errcode = '22023';
  end if;
  if jsonb_typeof(new_limits) is distinct from 'object' then
    raise exception 'limits must be an object' using errcode = '22023';
  end if;

  for limit_key, limit_value in select key, value from jsonb_each_text(new_limits) loop
    if limit_key not in ('max_users', 'max_bookings_monthly', 'max_documents', 'max_storage_mb') then
      raise exception 'unknown limit %', limit_key using errcode = '22023';
    end if;
    if limit_value is null or limit_value !~ '^([1-9][0-9]{0,8}|unlimited)$' then
      raise exception 'limit % must be a positive whole number or unlimited', limit_key using errcode = '22023';
    end if;
  end loop;

  select pl.name, pl.price into plan_name, old_price from public.plans pl where pl.id = target_plan;
  if not found then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;
  select coalesce(jsonb_object_agg(f.feature_key, f.feature_value), '{}'::jsonb) into old_limits
  from public.plan_features f where f.plan_id = target_plan;

  update public.plans set price = new_price, updated_at = now() where id = target_plan;

  for limit_key, limit_value in select key, value from jsonb_each_text(new_limits) loop
    update public.plan_features
    set feature_value = limit_value
    where plan_id = target_plan and feature_key = limit_key;
    if not found then
      insert into public.plan_features (plan_id, feature_key, feature_value)
      values (target_plan, limit_key, limit_value);
    end if;
  end loop;

  select coalesce(jsonb_object_agg(f.feature_key, f.feature_value), '{}'::jsonb) into saved_limits
  from public.plan_features f where f.plan_id = target_plan;

  if old_price is distinct from new_price or old_limits is distinct from saved_limits then
    perform public.platform_write_audit(
      'plan_updated', target_plan, plan_name,
      jsonb_build_object(
        'before', jsonb_build_object('price', old_price, 'limits', old_limits),
        'after', jsonb_build_object('price', new_price, 'limits', saved_limits)
      )
    );
  end if;
end;
$$;

create or replace function public.platform_audit_entries(page_number integer default 1, page_size integer default 25)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  safe_page integer := greatest(coalesce(page_number, 1), 1);
  safe_size integer := least(greatest(coalesce(page_size, 25), 1), 100);
begin
  if public.current_role() is distinct from 'travio_admin'::public.user_role then
    raise exception 'platform_audit_entries is for Travio administrators only' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'total', (select count(*) from public.platform_audit_log),
    'items', coalesce((
      select jsonb_agg(to_jsonb(e) - 'actor_id' order by e.created_at desc, e.id desc)
      from (
        select * from public.platform_audit_log
        order by created_at desc, id desc
        limit safe_size offset (safe_page - 1) * safe_size
      ) e
    ), '[]'::jsonb)
  );
end;
$$;

revoke execute on function public.platform_audit_entries(integer, integer) from public, anon;
grant execute on function public.platform_audit_entries(integer, integer) to authenticated;
