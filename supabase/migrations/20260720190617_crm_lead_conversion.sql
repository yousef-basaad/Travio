-- =========================================
-- CRM Lead Conversion
-- Travio CRM (ADR-0004)
-- =========================================


-- =========================================
-- crm_leads: conversion accounting columns
-- =========================================
-- Purely additive - existing rows get NULL for both columns, which is
-- correct: no lead in the table today has been converted through this
-- function, so there is nothing to backfill.

alter table public.crm_leads
add column if not exists converted_at timestamptz;

alter table public.crm_leads
add column if not exists converted_by uuid
  references public.profiles(id)
  on delete set null;


create index if not exists crm_leads_converted_by_idx
on public.crm_leads(converted_by);



-- =========================================
-- Lead -> Customer conversion function
-- =========================================
-- security definer + explicit search_path, following the same pattern as
-- public.create_agency() (20260718172946_create_agency_function.sql).
-- Tenant scope is resolved internally via current_tenant_id() - the
-- caller never supplies a tenant_id, so there is no way to convert a
-- lead into another tenant's customer list by passing a crafted argument.

create or replace function public.convert_crm_lead(
  lead_id uuid,
  force_create_new boolean default false
)

returns jsonb

language plpgsql

security definer

set search_path = public

as $$

declare

  v_tenant_id uuid;

  v_lead public.crm_leads;

  v_customer public.customers;

  v_outcome text;

begin

  v_tenant_id := public.current_tenant_id();

  if v_tenant_id is null then
    raise exception 'No tenant context for current user' using errcode = '42501';
  end if;


  -- Scoping the lookup by tenant_id in the same query (rather than
  -- fetching by id alone and checking tenant afterwards) means a lead
  -- that exists but belongs to another tenant produces the exact same
  -- "not found" outcome as a lead that doesn't exist at all - no
  -- observable difference an attacker could use to enumerate other
  -- tenants' lead ids.
  select *
  into v_lead
  from public.crm_leads
  where id = lead_id
    and tenant_id = v_tenant_id;

  if not found then
    raise exception 'Lead not found' using errcode = 'P0002';
  end if;

  if v_lead.deleted_at is not null then
    raise exception 'Lead not found' using errcode = 'P0002';
  end if;

  if v_lead.converted_customer_id is not null or v_lead.status = 'won' then
    raise exception 'Lead has already been converted' using errcode = '23505';
  end if;


  -- Duplicate detection: exact, case-insensitive email match within the
  -- same tenant. v_customer stays an all-null record (its uninitialized
  -- default) unless this actually matches a row, so checking
  -- v_customer.id afterwards is a reliable single source of truth
  -- regardless of which branch ran.
  if v_lead.email is not null and not force_create_new then
    select *
    into v_customer
    from public.customers
    where tenant_id = v_tenant_id
      and deleted_at is null
      and lower(email) = lower(v_lead.email)
    limit 1;
  end if;

  if v_customer.id is not null then

    v_outcome := 'linked';

  else

    insert into public.customers (
      tenant_id,
      branch_id,
      full_name,
      phone,
      email
    )
    values (
      v_tenant_id,
      v_lead.branch_id,
      v_lead.full_name,
      v_lead.phone,
      v_lead.email
    )
    returning * into v_customer;

    v_outcome := 'created';

  end if;


  update public.crm_leads
  set
    status = 'won',
    converted_customer_id = v_customer.id,
    converted_at = now(),
    converted_by = auth.uid()
  where id = v_lead.id;


  return jsonb_build_object(
    'outcome', v_outcome,
    'lead_id', v_lead.id,
    'customer_id', v_customer.id
  );

end;

$$;



-- Allow authenticated users to execute - never the service role/admin
-- client. RLS is bypassed internally (security definer), but every read
-- and write inside the function is explicitly scoped to the caller's own
-- tenant, so this grants no broader access than the existing RLS
-- policies already intend.
grant execute on function public.convert_crm_lead(uuid, boolean) to authenticated;
