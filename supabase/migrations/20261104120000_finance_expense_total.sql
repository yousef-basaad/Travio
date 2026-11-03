-- =========================================
-- Expense total in Postgres
-- =========================================
--
-- The Finance page summed the full expenses list in JavaScript. PostgREST
-- caps a response at max_rows (1000), so past 1000 expenses "Total
-- Expenses" and "Net Income" were silently wrong. Same approach as the
-- analytics aggregates (20261027120000): SECURITY INVOKER, so the
-- expenses RLS policy decides what each caller's total includes (agency
-- owner/admin/accountant see the agency's expenses, other roles none).

create or replace function public.finance_expense_total()
returns numeric
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(sum(e.amount), 0) from public.expenses e;
$$;

revoke execute on function public.finance_expense_total() from public, anon;
grant execute on function public.finance_expense_total() to authenticated;
