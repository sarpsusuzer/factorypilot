-- A "müşteri" company can be matched to one or more "üretici" companies.
-- When a müşteri creates a sipariş against a matched üretici, the order
-- lives under the üretici's company_id (their stages/fields govern it) but
-- carries customer_company_id so the müşteri can still find their own
-- orders, and only that one üretici — not other matched üretici, not other
-- müşteri sharing the same üretici — ever sees it.

create table company_matches (
  id uuid primary key default gen_random_uuid(),
  musteri_company_id uuid not null references companies (id) on delete cascade,
  uretici_company_id uuid not null references companies (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (musteri_company_id, uretici_company_id)
);

create function validate_company_match() returns trigger
language plpgsql as $$
declare
  musteri_type text;
  uretici_type text;
begin
  select company_type into musteri_type from companies where id = new.musteri_company_id;
  select company_type into uretici_type from companies where id = new.uretici_company_id;
  if musteri_type is distinct from 'musteri' then
    raise exception 'musteri_company_id bir müşteri şirketi olmalı.';
  end if;
  if uretici_type is distinct from 'uretici' then
    raise exception 'uretici_company_id bir üretici şirketi olmalı.';
  end if;
  return new;
end;
$$;

create trigger validate_company_match_trigger
  before insert or update on company_matches
  for each row execute function validate_company_match();

alter table orders add column customer_company_id uuid references companies (id);

alter table company_matches enable row level security;

create policy "company_matches: read own or platform admin" on company_matches for select to authenticated
  using (is_platform_admin() or musteri_company_id = current_company_id());
create policy "company_matches: platform admin writes" on company_matches for all to authenticated
  using (is_platform_admin()) with check (is_platform_admin());

-- Whether the caller's own company is a müşteri matched to target_company.
create function is_matched_uretici(target_company_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from company_matches m
    where m.musteri_company_id = current_company_id() and m.uretici_company_id = target_company_id
  );
$$;

-- --- Orders: a müşteri can also read/insert rows scoped to a matched
-- üretici's company_id, tagged with their own id as customer_company_id.
drop policy "orders: read own company" on orders;
create policy "orders: read own or as matched customer" on orders for select to authenticated
  using (
    caller_is_active()
    and (company_id = current_company_id() or customer_company_id = current_company_id())
  );

drop policy "orders: insert own company with create_order" on orders;
create policy "orders: insert own or as matched customer" on orders for insert to authenticated
  with check (
    has_permission('create_order')
    and (
      (company_id = current_company_id() and customer_company_id is null)
      or (customer_company_id = current_company_id() and is_matched_uretici(company_id))
    )
  );

-- --- stage_history: same read extension; insert extension for a müşteri's
-- own order-creation entry (moving stages afterward stays üretici-only).
drop policy "stage_history: read own company" on stage_history;
create policy "stage_history: read own or as matched customer" on stage_history for select to authenticated
  using (
    caller_is_active()
    and (
      company_id = current_company_id()
      or exists (
        select 1 from orders o where o.id = stage_history.order_id and o.customer_company_id = current_company_id()
      )
    )
  );

drop policy "stage_history: insert own company" on stage_history;
create policy "stage_history: insert own or as matched customer" on stage_history for insert to authenticated
  with check (
    (company_id = current_company_id() and (has_permission('create_order') or has_permission('move_stage')))
    or (
      has_permission('create_order')
      and exists (
        select 1 from orders o
        where o.id = stage_history.order_id
          and o.customer_company_id = current_company_id()
          and o.company_id = stage_history.company_id
      )
    )
  );

-- --- field_definitions / stages: a müşteri can read a matched üretici's
-- schema (needed to render the create-order form and view their own orders).
drop policy "field_definitions: read own company" on field_definitions;
create policy "field_definitions: read own or matched uretici" on field_definitions for select to authenticated
  using (caller_is_active() and (company_id = current_company_id() or is_matched_uretici(company_id)));

drop policy "stages: read own company" on stages;
create policy "stages: read own or matched uretici" on stages for select to authenticated
  using (caller_is_active() and (company_id = current_company_id() or is_matched_uretici(company_id)));

-- --- companies: a müşteri can read matched üretici names/logos; an üretici
-- can read the name of any müşteri matched to them (for the "Müşteri" column).
drop policy "companies: read own or platform admin" on companies;
create policy "companies: read own, matched, or platform admin" on companies for select to authenticated
  using (
    is_platform_admin()
    or id = current_company_id()
    or is_matched_uretici(id)
    or exists (
      select 1 from company_matches m
      where m.uretici_company_id = current_company_id() and m.musteri_company_id = companies.id
    )
  );
