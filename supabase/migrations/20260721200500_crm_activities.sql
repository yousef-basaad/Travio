-- =========================================
-- CRM Activities
-- Travio CRM (ADR-0004 Phase 3c)
-- =========================================


-- =========================================
-- Activities
-- =========================================
-- Lead activities only for now - no customer_id, no timeline view. type is
-- plain text + a check constraint (not a Postgres enum like
-- crm_lead_status/crm_lead_source), per this issue's explicit spec.

create table public.crm_activities (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  lead_id uuid not null
    references public.crm_leads(id)
    on delete cascade,

  performed_by uuid
    references auth.users(id)
    on delete set null,


  type text not null,

  title text not null,

  description text,


  performed_at timestamptz default now(),

  created_at timestamptz default now(),

  updated_at timestamptz default now(),


  constraint crm_activities_type_check check (
    type in ('call', 'email', 'meeting', 'whatsapp', 'task', 'follow_up')
  )

);



-- =========================================
-- Indexes
-- =========================================

create index crm_activities_tenant_id_idx
on public.crm_activities(tenant_id);


create index crm_activities_lead_id_idx
on public.crm_activities(lead_id);


create index crm_activities_performed_at_idx
on public.crm_activities(performed_at desc);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.crm_activities enable row level security;



-- =========================================
-- RLS Policies
-- =========================================
-- Same tenant isolation pattern as crm_leads/crm_notes: one "for all"
-- policy covers select/insert/update/delete, all tenant-scoped.

create policy "crm_activities_tenant_access"

on public.crm_activities

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



-- =========================================
-- Updated At Trigger
-- =========================================

create trigger crm_activities_updated_at
before update on public.crm_activities
for each row
execute function public.update_updated_at();



-- =========================================
-- Grants
-- =========================================
-- Granted up front this time (unlike crm_leads/crm_notes, which needed a
-- separate follow-up migration after this exact gap was discovered) -
-- this project's default ACL for new public-schema tables never covers
-- authenticated/anon.

grant select, insert, update, delete on public.crm_activities to authenticated;
