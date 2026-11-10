-- =========================================
-- Travio admins must have completed MFA
-- =========================================
--
-- A Travio admin's password alone reached every agency's data. A session
-- now only counts as travio_admin once it has passed a second factor
-- (the JWT's aal claim is aal2).
--
-- Done in the role functions, so every platform_* function and every RLS
-- policy that checks for travio_admin follows without being rewritten.
-- Before MFA the admin simply has no role here, and the admin app sends
-- them to set up or enter a code. Other roles are unaffected.

create or replace function public.current_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when p.role = 'travio_admin' and coalesce(auth.jwt() ->> 'aal', 'aal1') <> 'aal2' then null
    else p.role
  end
  from public.profiles p
  where p.id = auth.uid();
$$;

create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select public.current_role();
$$;
