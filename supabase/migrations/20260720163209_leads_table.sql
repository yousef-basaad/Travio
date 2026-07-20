-- =========================================
-- Leads Table
-- Travio Website
-- =========================================


-- =========================================
-- Leads
-- =========================================

create table public.leads (

  id uuid primary key default gen_random_uuid(),


  agency_name text not null,

  email text not null,

  message text not null,


  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.leads enable row level security;

-- Intentionally no policies: RLS enabled with zero policies denies
-- anon and authenticated roles entirely. Only the service-role admin
-- client (which bypasses RLS) may insert or read leads.



-- =========================================
-- Updated At Trigger
-- =========================================

create trigger leads_updated_at
before update on public.leads
for each row
execute function public.update_updated_at();
