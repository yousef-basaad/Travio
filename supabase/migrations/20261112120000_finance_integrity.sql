-- =========================================
-- Finance integrity
-- =========================================
--
-- QA found the money figures could be made inconsistent: a payment larger
-- than its invoice, an item total that wasn't quantity x unit price, an
-- invoice total that ignored its items, an invoice that stayed "draft"
-- after being paid, duplicate invoice numbers, and a due date before the
-- issue date. The app's routes trusted the browser for these.
--
-- The rules now live in the database, so they hold for every way of
-- writing. Existing rows aren't rewritten; a rule applies the next time a
-- row is written.
--
-- Errors the API should explain use their own SQLSTATE:
--   PL002  payment_exceeds_balance / invoice_total_below_paid

-- 1. An item's total is always quantity x unit price.
create or replace function public.invoice_item_set_total()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.total := round(new.quantity * new.unit_price, 2);
  return new;
end;
$$;

create trigger invoice_items_set_total
before insert or update on public.invoice_items
for each row execute function public.invoice_item_set_total();

-- 2. An invoice that has items totals to them (plus its tax). An invoice
--    without items keeps the total that was typed in.
create or replace function public.invoice_sync_total_from_items()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
  items_total numeric;
begin
  foreach target in array array[
    case when tg_op <> 'INSERT' then old.invoice_id end,
    case when tg_op <> 'DELETE' then new.invoice_id end
  ] loop
    if target is null then
      continue;
    end if;
    select sum(i.total) into items_total from public.invoice_items i where i.invoice_id = target;
    if items_total is not null then
      update public.invoices
      set subtotal = items_total, total = items_total + tax
      where id = target and (subtotal, total) is distinct from (items_total, items_total + tax);
    end if;
  end loop;
  return null;
end;
$$;

create trigger invoice_items_sync_invoice_total
after insert or update or delete on public.invoice_items
for each row execute function public.invoice_sync_total_from_items();

-- 3. Payments can't add up to more than the invoice, and an invoice's
--    total can't drop below what has been paid.
create or replace function public.payment_check_balance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  invoice_total numeric;
  already_paid numeric;
begin
  -- Locks the invoice so two payments can't both take the last balance.
  select i.total into invoice_total from public.invoices i where i.id = new.invoice_id for update;
  if not found then
    return new;
  end if;

  select coalesce(sum(p.amount), 0) into already_paid
  from public.payments p
  where p.invoice_id = new.invoice_id and p.id <> new.id;

  if already_paid + new.amount > invoice_total then
    raise exception 'payment_exceeds_balance'
      using errcode = 'PL002', detail = (invoice_total - already_paid)::text;
  end if;
  return new;
end;
$$;

create trigger payments_check_balance
before insert or update of amount, invoice_id on public.payments
for each row execute function public.payment_check_balance();

create or replace function public.invoice_check_total_covers_payments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  paid numeric;
begin
  select coalesce(sum(p.amount), 0) into paid from public.payments p where p.invoice_id = new.id;
  if new.total < paid then
    raise exception 'invoice_total_below_paid' using errcode = 'PL002', detail = paid::text;
  end if;
  return new;
end;
$$;

create trigger invoices_total_covers_payments
before update of total on public.invoices
for each row
when (new.total < old.total)
execute function public.invoice_check_total_covers_payments();

-- 4. An invoice's status follows its payments: paid when covered,
--    partially paid when some money is in, back to issued when payments
--    are removed. Cancelled invoices are left alone.
create or replace function public.invoice_sync_status(target uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  update public.invoices i
  set status = s.next_status
  from (
    select
      inv.id,
      case
        when paid.amount > 0 and paid.amount >= inv.total then 'paid'::public.invoice_status
        when paid.amount > 0 then 'partially_paid'::public.invoice_status
        when inv.status in ('paid', 'partially_paid') then 'issued'::public.invoice_status
        else inv.status
      end as next_status
    from public.invoices inv
    cross join lateral (
      select coalesce(sum(p.amount), 0) as amount from public.payments p where p.invoice_id = inv.id
    ) paid
    where inv.id = target and inv.status <> 'cancelled'
  ) s
  where i.id = s.id and i.status is distinct from s.next_status;
$$;

revoke execute on function public.invoice_sync_status(uuid) from public, anon, authenticated;

create or replace function public.payment_sync_invoice_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op <> 'INSERT' then
    perform public.invoice_sync_status(old.invoice_id);
  end if;
  if tg_op <> 'DELETE' then
    perform public.invoice_sync_status(new.invoice_id);
  end if;
  return null;
end;
$$;

create trigger payments_sync_invoice_status
after insert or update or delete on public.payments
for each row execute function public.payment_sync_invoice_status();

create or replace function public.invoice_total_sync_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.invoice_sync_status(new.id);
  return null;
end;
$$;

create trigger invoices_total_sync_status
after update of total on public.invoices
for each row
when (new.total is distinct from old.total)
execute function public.invoice_total_sync_status();

-- 5. Invoice numbers are unique within an agency (deleted invoices
--    don't count). A trigger rather than a unique index, because
--    production may already hold duplicates that an index would reject.
create or replace function public.invoice_number_unique()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('invoice-number:' || new.tenant_id::text, 0));
  if exists (
    select 1 from public.invoices i
    where i.tenant_id = new.tenant_id
      and i.invoice_number = new.invoice_number
      and i.deleted_at is null
      and i.id <> new.id
  ) then
    raise exception 'invoice_number_taken' using errcode = '23505';
  end if;
  return new;
end;
$$;

create trigger invoices_number_unique
before insert or update of invoice_number, deleted_at on public.invoices
for each row
when (new.deleted_at is null)
execute function public.invoice_number_unique();

-- 6. A due date can't be before the issue date. NOT VALID: checked on
--    every new or changed row, without failing on rows already stored.
alter table public.invoices
  add constraint invoices_due_after_issue
  check (due_date is null or issue_date is null or due_date >= issue_date) not valid;

revoke execute on function public.invoice_item_set_total() from public, anon, authenticated;
revoke execute on function public.invoice_sync_total_from_items() from public, anon, authenticated;
revoke execute on function public.payment_check_balance() from public, anon, authenticated;
revoke execute on function public.invoice_check_total_covers_payments() from public, anon, authenticated;
revoke execute on function public.payment_sync_invoice_status() from public, anon, authenticated;
revoke execute on function public.invoice_total_sync_status() from public, anon, authenticated;
revoke execute on function public.invoice_number_unique() from public, anon, authenticated;
