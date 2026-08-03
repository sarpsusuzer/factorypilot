-- An üretici viewing an order a müşteri submitted (or vice versa) couldn't
-- resolve "created_by"/"changed_by" to a name — profiles were scoped
-- strictly to your own company. Let either side read the name of whoever
-- created/moved an order they can already see.
create function can_see_profile(target_profile_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from orders o
    where o.created_by = target_profile_id
      and (o.company_id = current_company_id() or o.customer_company_id = current_company_id())
  ) or exists (
    select 1 from stage_history h
    join orders o on o.id = h.order_id
    where h.changed_by = target_profile_id
      and (o.company_id = current_company_id() or o.customer_company_id = current_company_id())
  );
$$;

drop policy "profiles: read own company or platform admin" on profiles;
create policy "profiles: read own, platform admin, or cross-company creator" on profiles for select to authenticated
  using (is_platform_admin() or company_id = current_company_id() or can_see_profile(id));
