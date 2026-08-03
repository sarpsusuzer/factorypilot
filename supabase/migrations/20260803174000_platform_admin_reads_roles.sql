-- The admin-panel users list shows each user's role name, which means the
-- platform admin needs read access to every company's roles, not just their
-- own (they have none) — read-only, same as they already have for profiles.
drop policy "roles: read own company" on roles;
create policy "roles: read own company or platform admin" on roles for select to authenticated
  using (is_platform_admin() or (company_id = current_company_id() and caller_is_active()));
