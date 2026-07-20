-- =========================================
-- Updated At Function
-- =========================================

create or replace function public.update_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- =========================================
-- Apply trigger to tables
-- =========================================

create trigger tenants_updated_at
before update on public.tenants
for each row
execute function public.update_updated_at();


create trigger profiles_updated_at
before update on public.profiles
for each row
execute function public.update_updated_at();


create trigger branches_updated_at
before update on public.branches
for each row
execute function public.update_updated_at();


create trigger customers_updated_at
before update on public.customers
for each row
execute function public.update_updated_at();



-- =========================================
-- Create profile after signup
-- =========================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin

  insert into public.profiles (
    id,
    email,
    full_name,
    role
  )

  values (

    new.id,

    new.email,

    coalesce(
      new.raw_user_meta_data->>'full_name',
      'New User'
    ),

    'customer'
  );


  return new;

end;
$$;


create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();