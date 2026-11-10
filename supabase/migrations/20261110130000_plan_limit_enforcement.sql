-- =========================================
-- Plan limits: actually enforce them
-- =========================================
--
-- plan_features held each plan's limits, but they were only displayed.
-- Bookings per month, document count and storage are now enforced in the
-- database, so direct API calls are covered too. Team size is enforced by
-- the invite route, the only way a member joins.
--
-- The rules match what the Subscription page shows: an agency's limits
-- come from its latest subscription, "unlimited" or a missing value means
-- no limit, and an agency with no subscription isn't limited. Only new
-- rows are checked, so an agency already over a limit keeps its data and
-- simply can't add more.
--
-- Limit errors use their own SQLSTATE (PL001) with the limit's name in
-- DETAIL, so the API can tell them apart from real failures.

create or replace function public.tenant_plan_limit(target_tenant uuid, limit_key text)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select case when f.feature_value ~ '^[0-9]+$' then f.feature_value::bigint end
  from (
    select s.plan_id
    from public.subscriptions s
    where s.tenant_id = target_tenant
    order by s.created_at desc
    limit 1
  ) latest
  join public.plan_features f on f.plan_id = latest.plan_id and f.feature_key = limit_key
  limit 1;
$$;

revoke execute on function public.tenant_plan_limit(uuid, text) from public, anon, authenticated;

create or replace function public.enforce_booking_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  monthly_limit bigint := public.tenant_plan_limit(new.tenant_id, 'max_bookings_monthly');
  used bigint;
begin
  if monthly_limit is null then
    return new;
  end if;

  -- One writer per agency at a time, so two requests can't both take the
  -- last slot.
  perform pg_advisory_xact_lock(hashtextextended('plan-limit-bookings:' || new.tenant_id::text, 0));

  select count(*) into used
  from public.bookings b
  where b.tenant_id = new.tenant_id
    and b.deleted_at is null
    and b.created_at >= (date_trunc('month', now() at time zone 'UTC') at time zone 'UTC');

  if used >= monthly_limit then
    raise exception 'plan_limit_reached' using errcode = 'PL001', detail = 'max_bookings_monthly';
  end if;

  return new;
end;
$$;

-- The first document limit an upload of this size would break, or null.
create or replace function public.document_limit_exceeded(target_tenant uuid, added_bytes bigint)
returns text
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  document_limit bigint := public.tenant_plan_limit(target_tenant, 'max_documents');
  storage_limit_mb bigint := public.tenant_plan_limit(target_tenant, 'max_storage_mb');
  document_count bigint;
  storage_bytes numeric;
begin
  select count(*), coalesce(sum(d.file_size), 0) into document_count, storage_bytes
  from public.documents d
  where d.tenant_id = target_tenant and d.deleted_at is null;

  if document_limit is not null and document_count >= document_limit then
    return 'max_documents';
  end if;
  if storage_limit_mb is not null and storage_bytes + coalesce(added_bytes, 0) > storage_limit_mb * 1048576 then
    return 'max_storage_mb';
  end if;
  return null;
end;
$$;

revoke execute on function public.document_limit_exceeded(uuid, bigint) from public, anon, authenticated;

create or replace function public.enforce_document_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  exceeded text;
begin
  perform pg_advisory_xact_lock(hashtextextended('plan-limit-documents:' || new.tenant_id::text, 0));

  exceeded := public.document_limit_exceeded(new.tenant_id, new.file_size);
  if exceeded is not null then
    raise exception 'plan_limit_reached' using errcode = 'PL001', detail = exceeded;
  end if;

  return new;
end;
$$;

-- Asked before a file is uploaded, so a refused document doesn't leave a
-- file behind in storage. Always about the caller's own agency.
create or replace function public.check_document_quota(file_bytes bigint)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select public.document_limit_exceeded(public.current_tenant_id(), file_bytes)
  where public.current_tenant_id() is not null;
$$;

revoke execute on function public.enforce_booking_limit() from public, anon, authenticated;
revoke execute on function public.enforce_document_limit() from public, anon, authenticated;
revoke execute on function public.check_document_quota(bigint) from public, anon;
grant execute on function public.check_document_quota(bigint) to authenticated;

create trigger bookings_enforce_plan_limit
before insert on public.bookings
for each row execute function public.enforce_booking_limit();

create trigger documents_enforce_plan_limit
before insert on public.documents
for each row execute function public.enforce_document_limit();
