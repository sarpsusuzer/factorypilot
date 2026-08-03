-- Turns the single-tenant app into a multi-tenant one: every company gets
-- its own roles/stages/fields/orders/history/settings, isolated by RLS.
-- Existing data is backfilled into one "demo" company so nothing is lost.

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

do $$
declare
  demo_company_id uuid;
begin
  insert into companies (name) values ('Demo Fabrika') returning id into demo_company_id;

  -- profiles: company_id is nullable — platform admins belong to no company.
  alter table profiles add column company_id uuid references companies (id);
  alter table profiles add column is_active boolean not null default true;
  alter table profiles add column is_platform_admin boolean not null default false;
  alter table profiles alter column role_id drop not null;
  update profiles set company_id = demo_company_id;

  alter table roles add column company_id uuid references companies (id);
  update roles set company_id = demo_company_id;
  alter table roles alter column company_id set not null;
  alter table roles drop constraint roles_name_key;
  alter table roles add constraint roles_company_name_key unique (company_id, name);

  alter table stages add column company_id uuid references companies (id);
  update stages set company_id = demo_company_id;
  alter table stages alter column company_id set not null;
  alter table stages drop constraint stages_name_key;
  alter table stages add constraint stages_company_name_key unique (company_id, name);

  alter table field_definitions add column company_id uuid references companies (id);
  update field_definitions set company_id = demo_company_id;
  alter table field_definitions alter column company_id set not null;
  alter table field_definitions drop constraint field_definitions_key_key;
  alter table field_definitions add constraint field_definitions_company_key_key unique (company_id, key);

  alter table orders add column company_id uuid references companies (id);
  update orders set company_id = demo_company_id;
  alter table orders alter column company_id set not null;
  alter table orders drop constraint orders_order_no_key;
  alter table orders add constraint orders_company_order_no_key unique (company_id, order_no);

  alter table stage_history add column company_id uuid references companies (id);
  update stage_history set company_id = demo_company_id;
  alter table stage_history alter column company_id set not null;

  -- settings becomes one row per company instead of a single global row.
  alter table settings add column company_id uuid references companies (id);
  update settings set company_id = demo_company_id;
  alter table settings alter column company_id set not null;
  alter table settings drop constraint settings_pkey;
  alter table settings drop column id;
  alter table settings add primary key (company_id);
end $$;

-- --- Helper functions --------------------------------------------------

create or replace function is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_platform_admin from profiles p where p.id = auth.uid()), false);
$$;

create or replace function current_company_id() returns uuid
language sql stable security definer set search_path = public as $$
  select p.company_id from profiles p where p.id = auth.uid();
$$;

-- False for a deactivated user or a deactivated company — used to zero out
-- permissions and hide data the moment either is switched off, without
-- having to touch every row.
create or replace function caller_is_active() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(
    (select p.is_active from profiles p where p.id = auth.uid())
    and (select c.is_active from companies c where c.id = (select p.company_id from profiles p where p.id = auth.uid())),
    false
  );
$$;

create or replace function has_permission(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    join roles r on r.id = p.role_id
    where p.id = auth.uid() and perm = any (r.permissions) and caller_is_active()
  );
$$;

-- --- Protective triggers -------------------------------------------------

-- Only a platform admin may change who's a platform admin, which company
-- someone belongs to, or flip a profile active/inactive.
create or replace function protect_profile_fields() returns trigger
language plpgsql as $$
begin
  if is_platform_admin() then
    return new;
  end if;
  if new.is_active is distinct from old.is_active
    or new.is_platform_admin is distinct from old.is_platform_admin
    or new.company_id is distinct from old.company_id then
    raise exception 'Bu alanlar yalnızca platform yöneticisi tarafından değiştirilebilir.';
  end if;
  return new;
end;
$$;

create trigger protect_profile_fields_trigger
  before update on profiles
  for each row execute function protect_profile_fields();

-- A company's own admin may only ever touch its logo; everything else
-- (name, active flag) is platform-admin-only.
create or replace function protect_company_fields() returns trigger
language plpgsql as $$
begin
  if is_platform_admin() then
    return new;
  end if;
  if new.name is distinct from old.name or new.is_active is distinct from old.is_active then
    raise exception 'Bu alanlar yalnızca platform yöneticisi tarafından değiştirilebilir.';
  end if;
  return new;
end;
$$;

create trigger protect_company_fields_trigger
  before update on companies
  for each row execute function protect_company_fields();

-- --- RLS -----------------------------------------------------------------

alter table companies enable row level security;

-- The earlier anon-readable policies were a demo convenience for a
-- single-tenant login hint list; multi-tenant login no longer shows that.
drop policy "roles: read all" on roles;
drop policy "profiles: read all" on profiles;

create policy "companies: read own or platform admin" on companies for select to authenticated
  using (is_platform_admin() or id = current_company_id());
create policy "companies: platform admin writes name/active" on companies for update to authenticated
  using (is_platform_admin() or (id = current_company_id() and has_permission('manage_company')))
  with check (is_platform_admin() or (id = current_company_id() and has_permission('manage_company')));

create policy "roles: read own company" on roles for select to authenticated
  using (company_id = current_company_id() and caller_is_active());
drop policy "roles: write with manage_roles" on roles;
create policy "roles: write own company with manage_roles" on roles for all to authenticated
  using (company_id = current_company_id() and has_permission('manage_roles'))
  with check (company_id = current_company_id() and has_permission('manage_roles'));

create policy "profiles: read own company or platform admin" on profiles for select to authenticated
  using (is_platform_admin() or company_id = current_company_id());
drop policy "profiles: write with manage_roles" on profiles;
create policy "profiles: write own company with manage_roles" on profiles for update to authenticated
  using (is_platform_admin() or (company_id = current_company_id() and has_permission('manage_roles')))
  with check (is_platform_admin() or (company_id = current_company_id() and has_permission('manage_roles')));
drop policy "profiles: delete with manage_roles" on profiles;
create policy "profiles: delete own company with manage_roles" on profiles for delete to authenticated
  using (company_id = current_company_id() and has_permission('manage_roles'));

drop policy "stages: read all" on stages;
create policy "stages: read own company" on stages for select to authenticated
  using (company_id = current_company_id() and caller_is_active());
drop policy "stages: write with manage_stages" on stages;
create policy "stages: write own company with manage_stages" on stages for all to authenticated
  using (company_id = current_company_id() and has_permission('manage_stages'))
  with check (company_id = current_company_id() and has_permission('manage_stages'));

drop policy "field_definitions: read all" on field_definitions;
create policy "field_definitions: read own company" on field_definitions for select to authenticated
  using (company_id = current_company_id() and caller_is_active());
drop policy "field_definitions: write with manage_fields" on field_definitions;
create policy "field_definitions: write own company with manage_fields" on field_definitions for all to authenticated
  using (company_id = current_company_id() and has_permission('manage_fields'))
  with check (company_id = current_company_id() and has_permission('manage_fields'));

drop policy "orders: read all" on orders;
create policy "orders: read own company" on orders for select to authenticated
  using (company_id = current_company_id() and caller_is_active());
drop policy "orders: insert with create_order" on orders;
create policy "orders: insert own company with create_order" on orders for insert to authenticated
  with check (company_id = current_company_id() and has_permission('create_order'));
drop policy "orders: update with move_stage" on orders;
create policy "orders: update own company with move_stage" on orders for update to authenticated
  using (company_id = current_company_id() and has_permission('move_stage'))
  with check (company_id = current_company_id() and has_permission('move_stage'));
drop policy "orders: delete with move_stage" on orders;
create policy "orders: delete own company with move_stage" on orders for delete to authenticated
  using (company_id = current_company_id() and has_permission('move_stage'));

drop policy "stage_history: read all" on stage_history;
create policy "stage_history: read own company" on stage_history for select to authenticated
  using (company_id = current_company_id() and caller_is_active());
drop policy "stage_history: insert with create_order or move_stage" on stage_history;
create policy "stage_history: insert own company" on stage_history for insert to authenticated
  with check (company_id = current_company_id() and (has_permission('create_order') or has_permission('move_stage')));

drop policy "settings: read all" on settings;
create policy "settings: read own company" on settings for select to authenticated
  using (company_id = current_company_id() and caller_is_active());
drop policy "settings: write with manage_stages" on settings;
create policy "settings: write own company with manage_stages" on settings for update to authenticated
  using (company_id = current_company_id() and has_permission('manage_stages'))
  with check (company_id = current_company_id() and has_permission('manage_stages'));
