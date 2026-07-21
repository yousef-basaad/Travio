-- =========================================
-- CRM Notes
-- Travio CRM (ADR-0004)
-- =========================================


-- =========================================
-- Notes
-- =========================================

create table public.crm_notes (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  lead_id uuid
    references public.crm_leads(id)
    on delete cascade,

  customer_id uuid
    references public.customers(id)
    on delete cascade,

  created_by uuid
    references public.profiles(id)
    on delete set null,


  body text not null,


  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),


  -- A note belongs to exactly one entity - never both, never neither.
  -- Matches ADR-0004's explicit-FK decision (twin nullable FK + check)
  -- over a polymorphic subject_type/subject_id pair.
  constraint crm_notes_single_subject check (
    (lead_id is not null) <> (customer_id is not null)
  )

);



-- =========================================
-- Indexes
-- =========================================

create index crm_notes_tenant_id_idx
on public.crm_notes(tenant_id);


create index crm_notes_lead_id_idx
on public.crm_notes(lead_id);


create index crm_notes_customer_id_idx
on public.crm_notes(customer_id);


create index crm_notes_created_by_idx
on public.crm_notes(created_by);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.crm_notes enable row level security;



-- =========================================
-- RLS Policies
-- =========================================

create policy "crm_notes_tenant_access"

on public.crm_notes

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

create trigger crm_notes_updated_at
before update on public.crm_notes
for each row
execute function public.update_updated_at();
