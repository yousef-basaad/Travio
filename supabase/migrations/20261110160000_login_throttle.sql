-- =========================================
-- Sign-in throttling
-- =========================================
--
-- Sign-in runs on the server, so the auth service sees every user coming
-- from one address and can't limit guessing per person. Failed attempts
-- are counted here instead.
--
-- Keys are SHA-256 hashes built by the app, so this table holds no email
-- addresses or IP addresses. Limits within 15 minutes:
--   5 failures for one email from one address: stops guessing quickly,
--     without letting a stranger lock someone out from elsewhere.
--   50 failures from one address: stops trying many accounts.
--   30 failures for one email from anywhere: stops guessing spread across
--     many addresses.
--
-- Only the server (service_role) can call these. If anyone could, a
-- stranger could record failures against another person's account.

create table public.login_failures (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);

create index login_failures_key_created_idx on public.login_failures (key, created_at desc);

alter table public.login_failures enable row level security;
revoke all on public.login_failures from public, anon, authenticated;

create or replace function public.login_is_blocked(pair_key text, address_key text, email_key text)
returns boolean
language sql
stable
set search_path = ''
as $$
  with recent as (
    select f.key, count(*) as n
    from public.login_failures f
    where f.key in (pair_key, address_key, email_key)
      and f.created_at > now() - interval '15 minutes'
    group by f.key
  )
  select exists (
    select 1 from recent r
    where (r.key = pair_key and r.n >= 5)
       or (r.key = address_key and r.n >= 50)
       or (r.key = email_key and r.n >= 30)
  );
$$;

create or replace function public.login_record_failure(pair_key text, address_key text, email_key text)
returns void
language sql
set search_path = ''
as $$
  delete from public.login_failures where created_at < now() - interval '1 hour';
  insert into public.login_failures (key) values (pair_key), (address_key), (email_key);
$$;

create or replace function public.login_clear_failures(pair_key text)
returns void
language sql
set search_path = ''
as $$
  delete from public.login_failures where key = pair_key;
$$;

revoke execute on function public.login_is_blocked(text, text, text) from public, anon, authenticated;
revoke execute on function public.login_record_failure(text, text, text) from public, anon, authenticated;
revoke execute on function public.login_clear_failures(text) from public, anon, authenticated;
grant execute on function public.login_is_blocked(text, text, text) to service_role;
grant execute on function public.login_record_failure(text, text, text) to service_role;
grant execute on function public.login_clear_failures(text) to service_role;
grant select, insert, delete on public.login_failures to service_role;
