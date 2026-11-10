-- pgTAP: sign-in throttling (20261110160000). Rolled back at the end.

begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select is((select public.login_is_blocked('p1', 'a1', 'e1')), false, 'nothing recorded means not blocked');

select public.login_record_failure('p1', 'a1', 'e1') from generate_series(1, 4);
select is((select public.login_is_blocked('p1', 'a1', 'e1')), false, 'four failures are still allowed');

select public.login_record_failure('p1', 'a1', 'e1');
select is((select public.login_is_blocked('p1', 'a1', 'e1')), true, 'five failures for one email from one address block it');
select is((select public.login_is_blocked('p2', 'a2', 'e1')), false, 'the same email from another address still works');

select public.login_clear_failures('p1');
select is((select public.login_is_blocked('p1', 'a1', 'e1')), false, 'a successful sign-in clears that pair');

-- One address trying many accounts.
select public.login_record_failure('p-' || g, 'a3', 'e-' || g) from generate_series(1, 50) g;
select is((select public.login_is_blocked('fresh', 'a3', 'fresh-email')), true, 'fifty failures from one address block it');

-- One account attacked from many addresses.
select public.login_record_failure('q-' || g, 'b-' || g, 'e9') from generate_series(1, 30) g;
select is((select public.login_is_blocked('fresh', 'fresh-address', 'e9')), true, 'thirty failures for one email block it from anywhere');

-- Old failures stop counting.
update public.login_failures set created_at = now() - interval '16 minutes' where key = 'e9';
select is((select public.login_is_blocked('fresh', 'fresh-address', 'e9')), false, 'failures older than 15 minutes do not count');

select is(
  (select has_function_privilege('anon', 'public.login_record_failure(text, text, text)', 'execute')),
  false,
  'the public cannot record failures against someone else'
);
select is(
  (select has_table_privilege('authenticated', 'public.login_failures', 'select')),
  false,
  'users cannot read the failures table'
);

select * from finish();
rollback;
