-- The login screen shows a list of test accounts (name, email, role) before
-- anyone is authenticated, so roles/profiles need to be readable by anon too.
-- Everything else stays authenticated-only.

alter table profiles add column email text not null default '';
update profiles p set email = u.email from auth.users u where u.id = p.id;

create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role_id, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    (new.raw_user_meta_data ->> 'role_id')::uuid,
    new.email
  );
  return new;
end;
$$;

drop policy "roles: read all" on roles;
create policy "roles: read all" on roles for select to anon, authenticated using (true);

drop policy "profiles: read all" on profiles;
create policy "profiles: read all" on profiles for select to anon, authenticated using (true);
