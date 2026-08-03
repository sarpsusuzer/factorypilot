-- FactoryPilot schema: roles, users (as auth-linked profiles), stages,
-- order field definitions, orders, and stage history. Mirrors the shapes in
-- src/lib/types.ts as closely as SQL allows.

create table roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  permissions text[] not null default '{}',
  is_protected boolean not null default false
);

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null unique,
  role_id uuid not null references roles (id)
);

create table stages (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  position int not null,
  color text not null
);

create table field_definitions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  label text not null,
  type text not null,
  options text[] not null default '{}',
  required boolean not null default false,
  scope text not null,
  is_title_field boolean not null default false,
  position int not null
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  order_no text not null unique,
  current_stage text not null,
  created_at timestamptz not null default now(),
  created_by uuid references profiles (id),
  field_values jsonb not null default '{}',
  items jsonb not null default '[]'
);

create table stage_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  from_stage text,
  to_stage text not null,
  changed_by uuid references profiles (id),
  changed_at timestamptz not null default now()
);

-- Singleton row via a boolean primary key that can only ever be `true`.
create table settings (
  id boolean primary key default true check (id),
  overdue_threshold_days int not null default 3
);
insert into settings (overdue_threshold_days) values (3);

-- Whether the current session's user holds a given permission, via their
-- profile's role. security definer + owned by the migration role (postgres),
-- so it bypasses RLS on roles/profiles when checking — same reasoning any
-- app-level permission gate needs to see the data regardless of the caller.
create function has_permission(perm text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from profiles p
    join roles r on r.id = p.role_id
    where p.id = auth.uid() and perm = any (r.permissions)
  );
$$;

-- New auth users get a profile row from the metadata passed at creation time
-- (name, role_id) — see admin_create_user in scripts/, and addUser in the app.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, role_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', new.email),
    (new.raw_user_meta_data ->> 'role_id')::uuid
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- The bootstrap Admin role can't be deleted or lose its way back into role
-- management — same invariant the old localStorage layer enforced in code.
create function protect_admin_role() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    if old.is_protected then
      raise exception 'Bu rol silinemez.';
    end if;
    return old;
  end if;

  if old.is_protected and not ('manage_roles' = any (new.permissions)) then
    raise exception 'Bu rol için rol yönetimi kapatılamaz.';
  end if;
  return new;
end;
$$;

create trigger protect_admin_role_trigger
  before update or delete on roles
  for each row execute function protect_admin_role();

alter table roles enable row level security;
alter table profiles enable row level security;
alter table stages enable row level security;
alter table field_definitions enable row level security;
alter table orders enable row level security;
alter table stage_history enable row level security;
alter table settings enable row level security;

-- Everyone logged in can read everything — screens gate what they *show* by
-- permission, same as before; the read side was never the sensitive part.
create policy "roles: read all" on roles for select to authenticated using (true);
create policy "profiles: read all" on profiles for select to authenticated using (true);
create policy "stages: read all" on stages for select to authenticated using (true);
create policy "field_definitions: read all" on field_definitions for select to authenticated using (true);
create policy "orders: read all" on orders for select to authenticated using (true);
create policy "stage_history: read all" on stage_history for select to authenticated using (true);
create policy "settings: read all" on settings for select to authenticated using (true);

create policy "roles: write with manage_roles" on roles for all to authenticated
  using (has_permission('manage_roles')) with check (has_permission('manage_roles'));

create policy "profiles: write with manage_roles" on profiles for update to authenticated
  using (has_permission('manage_roles')) with check (has_permission('manage_roles'));
create policy "profiles: delete with manage_roles" on profiles for delete to authenticated
  using (has_permission('manage_roles'));

create policy "stages: write with manage_stages" on stages for all to authenticated
  using (has_permission('manage_stages')) with check (has_permission('manage_stages'));

create policy "field_definitions: write with manage_fields" on field_definitions for all to authenticated
  using (has_permission('manage_fields')) with check (has_permission('manage_fields'));

create policy "orders: insert with create_order" on orders for insert to authenticated
  with check (has_permission('create_order'));
create policy "orders: update with move_stage" on orders for update to authenticated
  using (has_permission('move_stage')) with check (has_permission('move_stage'));
create policy "orders: delete with move_stage" on orders for delete to authenticated
  using (has_permission('move_stage'));

create policy "stage_history: insert with create_order or move_stage" on stage_history for insert to authenticated
  with check (has_permission('create_order') or has_permission('move_stage'));

create policy "settings: write with manage_stages" on settings for update to authenticated
  using (has_permission('manage_stages')) with check (has_permission('manage_stages'));
