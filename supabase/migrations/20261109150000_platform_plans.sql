-- =========================================
-- Super Admin: plan prices and limits
-- =========================================
--
-- The admin console's settings page shows each plan and lets a Travio
-- admin change its price and its four usage limits. Plans could only be
-- changed through migrations until now.
--
-- Plans can't be deactivated from here on purpose: plans_public_read
-- hides an inactive plan from agencies already subscribed to it, and
-- create_agency() needs an active Starter plan.
--
-- SECURITY DEFINER (plans have no write policy for anyone); both
-- functions refuse anyone who isn't travio_admin (42501) first. An update
-- is validated in full before anything is written, and the function runs
-- in one transaction, so a bad value changes nothing.

create or replace function public.platform_plans()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if public.current_role() is distinct from 'travio_admin'::public.user_role then
    raise exception 'platform_plans is for Travio administrators only' using errcode = '42501';
  end if;

  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', pl.id,
      'name', pl.name,
      'slug', pl.slug,
      'price', pl.price,
      'billing_interval', pl."interval",
      'is_active', pl.is_active,
      'limits', coalesce((
        select jsonb_object_agg(f.feature_key, f.feature_value)
        from public.plan_features f
        where f.plan_id = pl.id
      ), '{}'::jsonb),
      'agencies', (
        select count(distinct s.tenant_id)
        from public.subscriptions s
        where s.plan_id = pl.id and s.status in ('trialing', 'active', 'past_due')
      )
    ) order by pl.price, pl.slug)
    from public.plans pl
  ), '[]'::jsonb);
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

  update public.plans set price = new_price, updated_at = now() where id = target_plan;
  if not found then
    raise exception 'plan not found' using errcode = 'P0002';
  end if;

  for limit_key, limit_value in select key, value from jsonb_each_text(new_limits) loop
    update public.plan_features
    set feature_value = limit_value
    where plan_id = target_plan and feature_key = limit_key;
    if not found then
      insert into public.plan_features (plan_id, feature_key, feature_value)
      values (target_plan, limit_key, limit_value);
    end if;
  end loop;
end;
$$;

revoke execute on function public.platform_plans() from public, anon;
grant execute on function public.platform_plans() to authenticated;
revoke execute on function public.platform_update_plan(uuid, numeric, jsonb) from public, anon;
grant execute on function public.platform_update_plan(uuid, numeric, jsonb) to authenticated;
