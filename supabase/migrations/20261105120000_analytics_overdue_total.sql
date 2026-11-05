-- =========================================
-- Overdue receivables in Postgres
-- =========================================
--
-- The Operations Center's "Overdue Payments" KPI: what customers still
-- owe on invoices past their due date. Summed here rather than in
-- JavaScript for the same reason as the other analytics aggregates
-- (20261027120000): PostgREST caps a response at max_rows (1000).
--
-- An invoice counts when it is issued or partially paid, not deleted,
-- and its due_date is before today; its overdue amount is the total
-- minus the payments recorded against it (never below zero). Drafts,
-- paid and cancelled invoices, and invoices without a due date, are
-- never overdue. SECURITY INVOKER, so invoices/payments RLS decides
-- what each caller's total includes.

create or replace function public.analytics_overdue_total()
returns table (overdue_amount numeric, overdue_count integer)
language sql
stable
security invoker
set search_path = ''
as $$
  with overdue as (
    select greatest(
      i.total - coalesce((select sum(p.amount) from public.payments p where p.invoice_id = i.id), 0),
      0
    ) as balance
    from public.invoices i
    where i.deleted_at is null
      and i.status in ('issued', 'partially_paid')
      and i.due_date < current_date
  )
  select
    coalesce(sum(o.balance), 0),
    count(*) filter (where o.balance > 0)::integer
  from overdue o;
$$;

revoke execute on function public.analytics_overdue_total() from public, anon;
grant execute on function public.analytics_overdue_total() to authenticated;
