-- =========================================
-- CRM Leads
-- Travio CRM (ADR-0004)
-- =========================================


-- =========================================
-- Enums
-- =========================================

create type public.crm_lead_status as enum (
  'new',
  'contacted',
  'qualified',
  'proposal_sent',
  'won',
  'lost'
);


create type public.crm_lead_source as enum (
  'walk_in',
  'website',
  'whatsapp',
  'instagram',
  'snapchat',
  'tiktok',
  'referral',
  'phone',
  'other'
);



-- =========================================
-- Leads
-- =========================================

create table public.crm_leads (

  id uuid primary key default gen_random_uuid(),

  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,

  branch_id uuid
    references public.branches(id)
    on delete set null,

  assigned_to uuid
    references public.profiles(id)
    on delete set null,

  converted_customer_id uuid
    references public.customers(id)
    on delete set null,


  full_name text not null,

  phone text,

  email text,

  source public.crm_lead_source,

  status public.crm_lead_status
    not null default 'new',

  lost_reason text,


  created_at timestamptz default now(),

  updated_at timestamptz default now(),

  deleted_at timestamptz

);



-- =========================================
-- Indexes
-- =========================================

create index crm_leads_tenant_id_idx
on public.crm_leads(tenant_id);


create index crm_leads_branch_id_idx
on public.crm_leads(branch_id);


create index crm_leads_assigned_to_idx
on public.crm_leads(assigned_to);


create index crm_leads_status_idx
on public.crm_leads(status);


create index crm_leads_converted_customer_id_idx
on public.crm_leads(converted_customer_id);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.crm_leads enable row level security;



-- =========================================
-- RLS Policies
-- =========================================

create policy "crm_leads_tenant_access"

on public.crm_leads

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

create trigger crm_leads_updated_at
before update on public.crm_leads
for each row
execute function public.update_updated_at();
