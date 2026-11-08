-- =========================================
-- Finance page insights
-- =========================================
--
-- The Finance page (TRAVIO design 06) shows revenue vs expenses per
-- month, expenses by category, and the overdue invoices to chase.
-- Computed in Postgres (not capped at PostgREST's 1000 rows), all
-- SECURITY INVOKER so invoices/expenses RLS decides what each caller's
-- numbers include (expenses are hidden from roles that can't see them,
-- so their sums are 0 for those roles).

-- Expenses per month since range_start ("YYYY-MM"). An expense counts in
-- the month of its expense_date, or of when it was recorded if it has no
-- date. Months without expenses are left out (the app fills them in).
create or replace function public.finance_expenses_by_month(range_start date)
returns table (month text, expense_total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select to_char(coalesce(e.expense_date, e.created_at::date), 'YYYY-MM'), sum(e.amount)
  from public.expenses e
  where coalesce(e.expense_date, e.created_at::date) >= range_start
  group by 1
  order by 1;
$$;

-- Expenses per category, largest first. Expenses without a category are
-- grouped under an empty label (the app names it "Uncategorized").
create or replace function public.finance_expenses_by_category()
returns table (category text, expense_total numeric)
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(nullif(trim(e.category), ''), ''), sum(e.amount)
  from public.expenses e
  group by 1
  order by 2 desc, 1;
$$;

-- Overdue invoices (same rule as analytics_overdue_total, 20261105120000:
-- issued or partially paid, past due, money still owed), most days late
-- first, with the customer's name.
create or replace function public.finance_overdue_invoices(limit_count integer default 5)
returns table (
  invoice_id uuid,
  invoice_number text,
  customer_name text,
  due_date date,
  balance numeric,
  days_overdue integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  select o.id, o.invoice_number, o.customer_name, o.due_date, o.balance, (current_date - o.due_date)::integer
  from (
    select
      i.id,
      i.invoice_number,
      c.full_name as customer_name,
      i.due_date,
      i.total - coalesce((select sum(p.amount) from public.payments p where p.invoice_id = i.id), 0) as balance
    from public.invoices i
    left join public.customers c on c.id = i.customer_id
    where i.deleted_at is null
      and i.status in ('issued', 'partially_paid')
      and i.due_date < current_date
  ) o
  where o.balance > 0
  order by o.due_date, o.invoice_number
  limit greatest(least(coalesce(limit_count, 5), 50), 1);
$$;

revoke execute on function public.finance_expenses_by_month(date) from public, anon;
revoke execute on function public.finance_expenses_by_category() from public, anon;
revoke execute on function public.finance_overdue_invoices(integer) from public, anon;
grant execute on function public.finance_expenses_by_month(date) to authenticated;
grant execute on function public.finance_expenses_by_category() to authenticated;
grant execute on function public.finance_overdue_invoices(integer) to authenticated;
