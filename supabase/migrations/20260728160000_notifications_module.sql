-- =========================================
-- Notifications Module
-- Travio v1.9.0
-- =========================================
--
-- Audit (read-only, prior to this migration) confirmed zero existing
-- notification infrastructure: no notifications/activity_log/event/
-- queue/job table anywhere, no Edge Functions, no pg_cron, no email/SMS
-- provider installed. This is a ground-up build, in-app only - no
-- email/SMS/WhatsApp/realtime/scheduler, per explicit direction.
--
-- Personal, not tenant-shared: unlike every other table in this schema
-- (which scopes by tenant_id alone), a notification belongs to exactly
-- one user - RLS below requires both tenant_id AND user_id to match, so
-- an agency_owner cannot see a sales_agent's notification feed just by
-- sharing a tenant.
--
-- type is text + CHECK, not a Postgres enum - same convention as
-- documents.document_type/owner_type. Kept in sync with
-- packages/types/src/schemas/notification.ts's NOTIFICATION_TYPES -
-- this CHECK constraint is still the enforced source of truth.
--
-- No notification_preferences table: there is exactly one channel
-- (in-app), so there is nothing to have a preference about yet. Adding
-- one now would be schema for a feature that doesn't exist.
--
-- No retention/cleanup: no cron infrastructure exists to run one (see
-- audit). Left for a future phase alongside whatever job scheduler that
-- ends up using.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  user_id uuid not null
    references auth.users(id)
    on delete cascade,

  type text not null check (
    type in (
      'booking_created', 'booking_status_changed',
      'visa_created', 'visa_status_changed',
      'document_uploaded', 'document_deleted'
    )
  ),

  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,

  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Partial index - the only access pattern that matters at read time is
-- "this user's unread notifications, newest first"; a full index on
-- every row (including already-read ones nobody re-queries by date) is
-- unnecessary size for no query benefit.
create index notifications_user_unread_idx
on public.notifications (user_id, created_at desc)
where read_at is null;

create index notifications_tenant_id_idx on public.notifications(tenant_id);

alter table public.notifications enable row level security;

-- Split by command (not a single "for all" policy) because insert and
-- read/write-your-own have genuinely different rules: a notification is
-- created by whoever performed the triggering action (e.g. a
-- branch_manager changing a booking's status) FOR a different user
-- (e.g. the sales_agent who created that booking) - the inserting
-- session's auth.uid() is essentially never equal to the row's own
-- user_id. A single policy requiring both would make every
-- cross-user notification insert fail RLS. Read/update stay
-- strictly "your own notifications only".

create policy "notifications_select_own"
on public.notifications
for select
using (
  tenant_id = public.current_tenant_id()
  and user_id = auth.uid()
);

create policy "notifications_insert_tenant"
on public.notifications
for insert
with check (
  tenant_id = public.current_tenant_id()
);

create policy "notifications_update_own"
on public.notifications
for update
using (
  tenant_id = public.current_tenant_id()
  and user_id = auth.uid()
)
with check (
  tenant_id = public.current_tenant_id()
  and user_id = auth.uid()
);

grant select, insert, update, delete on public.notifications to authenticated;
