-- =========================================
-- Security Hardening
-- Travio SaaS
-- =========================================


-- =========================================
-- Add tenant_id to service tables
-- =========================================

alter table public.flights
add column if not exists tenant_id uuid
references public.tenants(id)
on delete cascade;


alter table public.hotels
add column if not exists tenant_id uuid
references public.tenants(id)
on delete cascade;


alter table public.visa_applications
add column if not exists tenant_id uuid
references public.tenants(id)
on delete cascade;



-- =========================================
-- Indexes
-- =========================================

create index if not exists flights_tenant_id_idx
on public.flights(tenant_id);


create index if not exists hotels_tenant_id_idx
on public.hotels(tenant_id);


create index if not exists visa_applications_tenant_id_idx
on public.visa_applications(tenant_id);



-- =========================================
-- Enable RLS
-- =========================================

alter table public.flights enable row level security;

alter table public.hotels enable row level security;

alter table public.visa_applications enable row level security;



-- =========================================
-- RLS Policies
-- =========================================

create policy "flights_tenant_access"

on public.flights

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



create policy "hotels_tenant_access"

on public.hotels

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



create policy "visa_applications_tenant_access"

on public.visa_applications

for all

using (
  tenant_id = public.current_tenant_id()
)

with check (
  tenant_id = public.current_tenant_id()
);



-- =========================================
-- Updated At Triggers
-- =========================================


create trigger bookings_updated_at
before update on public.bookings
for each row
execute function public.update_updated_at();



create trigger booking_services_updated_at
before update on public.booking_services
for each row
execute function public.update_updated_at();



create trigger invoices_updated_at
before update on public.invoices
for each row
execute function public.update_updated_at();



create trigger expenses_updated_at
before update on public.expenses
for each row
execute function public.update_updated_at();