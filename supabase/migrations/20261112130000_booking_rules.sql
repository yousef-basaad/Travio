-- =========================================
-- Booking rules
-- =========================================
--
-- QA found two holes:
--   * Changing only a booking's end date skipped the date check, so a
--     trip could end before it started.
--   * Any status could jump to any other, e.g. cancelled straight to
--     completed.
--
-- Both are now enforced in the database. Existing rows aren't re-checked.
--
-- Allowed status changes:
--   draft     -> pending, confirmed, cancelled
--   pending   -> draft, confirmed, cancelled
--   confirmed -> pending, completed, cancelled
--   completed -> confirmed   (undo a mistaken completion)
--   cancelled -> draft       (reopen)

alter table public.bookings
  add constraint bookings_end_after_start
  check (start_date is null or end_date is null or end_date >= start_date) not valid;

create or replace function public.booking_check_status_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if (old.status, new.status) not in (
    ('draft', 'pending'), ('draft', 'confirmed'), ('draft', 'cancelled'),
    ('pending', 'draft'), ('pending', 'confirmed'), ('pending', 'cancelled'),
    ('confirmed', 'pending'), ('confirmed', 'completed'), ('confirmed', 'cancelled'),
    ('completed', 'confirmed'),
    ('cancelled', 'draft')
  ) then
    raise exception 'invalid_status_change'
      using errcode = 'PL003', detail = old.status::text || ' -> ' || new.status::text;
  end if;

  return new;
end;
$$;

revoke execute on function public.booking_check_status_change() from public, anon, authenticated;

create trigger bookings_check_status_change
before update of status on public.bookings
for each row execute function public.booking_check_status_change();
