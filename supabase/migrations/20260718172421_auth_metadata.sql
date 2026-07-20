-- =========================================
-- Auth Metadata Support
-- Travio
-- =========================================


create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
declare
  account_type text;
  user_role public.user_role;
begin

  account_type :=
    new.raw_user_meta_data->>'account_type';


  if account_type = 'agency' then
    user_role := 'agency_owner';

  else
    user_role := 'customer';

  end if;



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

    user_role

  );


  return new;

end;
$$;