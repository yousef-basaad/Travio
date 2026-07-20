-- =========================================
-- Finance System
-- =========================================


-- Invoice status

create type public.invoice_status as enum (
  'draft',
  'issued',
  'paid',
  'partially_paid',
  'cancelled'
);



-- =========================================
-- Invoices
-- =========================================

create table public.invoices (

  id uuid primary key default gen_random_uuid(),


  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  customer_id uuid
    references public.customers(id)
    on delete set null,


  booking_id uuid
    references public.bookings(id)
    on delete set null,


  invoice_number text not null,


  status public.invoice_status
    not null default 'draft',


  subtotal numeric(12,2)
    not null default 0,


  tax numeric(12,2)
    not null default 0,


  total numeric(12,2)
    not null default 0,


  currency text
    not null default 'SAR',


  issue_date date
    default current_date,


  due_date date,


  notes text,


  created_at timestamptz
    not null default now(),


  updated_at timestamptz
    not null default now(),


  deleted_at timestamptz

);



create index invoices_tenant_id_idx
on public.invoices(tenant_id);


create index invoices_customer_id_idx
on public.invoices(customer_id);



-- =========================================
-- Invoice Items
-- =========================================

create table public.invoice_items (

  id uuid primary key default gen_random_uuid(),


  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  invoice_id uuid not null
    references public.invoices(id)
    on delete cascade,


  description text not null,


  quantity integer
    not null default 1,


  unit_price numeric(12,2)
    not null default 0,


  total numeric(12,2)
    not null default 0,


  created_at timestamptz
    default now()

);



create index invoice_items_invoice_id_idx
on public.invoice_items(invoice_id);



-- =========================================
-- Payments
-- =========================================

create type public.payment_method as enum (
  'cash',
  'card',
  'bank_transfer',
  'online'
);



create table public.payments (

  id uuid primary key default gen_random_uuid(),


  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  invoice_id uuid not null
    references public.invoices(id)
    on delete cascade,


  amount numeric(12,2)
    not null,


  method public.payment_method
    not null,


  reference text,


  paid_at timestamptz
    default now(),


  created_at timestamptz
    default now()

);



create index payments_invoice_id_idx
on public.payments(invoice_id);



-- =========================================
-- Expenses
-- =========================================

create table public.expenses (

  id uuid primary key default gen_random_uuid(),


  tenant_id uuid not null
    references public.tenants(id)
    on delete cascade,


  title text not null,


  description text,


  amount numeric(12,2)
    not null,


  category text,


  expense_date date
    default current_date,


  created_at timestamptz
    default now(),


  updated_at timestamptz
    default now()

);



create index expenses_tenant_id_idx
on public.expenses(tenant_id);



-- =========================================
-- RLS
-- =========================================

alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.payments enable row level security;
alter table public.expenses enable row level security;



create policy "invoices_tenant_access"
on public.invoices
for all
using (
 tenant_id = public.current_tenant_id()
)
with check (
 tenant_id = public.current_tenant_id()
);



create policy "invoice_items_tenant_access"
on public.invoice_items
for all
using (
 tenant_id = public.current_tenant_id()
)
with check (
 tenant_id = public.current_tenant_id()
);



create policy "payments_tenant_access"
on public.payments
for all
using (
 tenant_id = public.current_tenant_id()
)
with check (
 tenant_id = public.current_tenant_id()
);



create policy "expenses_tenant_access"
on public.expenses
for all
using (
 tenant_id = public.current_tenant_id()
)
with check (
 tenant_id = public.current_tenant_id()
);