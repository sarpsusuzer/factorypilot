-- handle_new_user needs to carry company_id (and, for platform admins,
-- is_platform_admin) from signup metadata — migration 3 added the columns
-- but this function still only knew about (name, role_id, email).
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role_id, email, company_id, is_platform_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    (new.raw_user_meta_data ->> 'role_id')::uuid,
    new.email,
    (new.raw_user_meta_data ->> 'company_id')::uuid,
    coalesce((new.raw_user_meta_data ->> 'is_platform_admin')::boolean, false)
  );
  return new;
end;
$$;

-- Bootstrap: promote the existing demo account to THE platform admin,
-- detached from any company. One-time — protect_profile_fields_trigger
-- normally forbids exactly this change, for good reason everywhere else.
alter table profiles disable trigger protect_profile_fields_trigger;
update profiles
set is_platform_admin = true, company_id = null, role_id = null
where email = 'yonetici@factorypilot.app';
alter table profiles enable trigger protect_profile_fields_trigger;
