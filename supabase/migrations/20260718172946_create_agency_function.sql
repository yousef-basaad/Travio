-- =========================================
-- Create Agency Function
-- Travio SaaS
-- =========================================


create or replace function public.create_agency(
  agency_name text,
  agency_cr_number text
)

returns public.tenants

language plpgsql

security definer

set search_path = public

as $$

declare

  new_tenant public.tenants;

begin


  -- Create tenant

  insert into public.tenants (

    name,

    slug,

    cr_number

  )

  values (

    agency_name,

    lower(
      regexp_replace(
        agency_name,
        '\s+',
        '-',
        'g'
      )
    ),

    agency_cr_number

  )

  returning *
  into new_tenant;



  -- Attach current user to tenant

  update public.profiles

  set

    tenant_id = new_tenant.id,

    role = 'agency_owner'


  where id = auth.uid();



  return new_tenant;


end;

$$;



-- Allow authenticated users to execute

grant execute on function public.create_agency(
  text,
  text
)
to authenticated;