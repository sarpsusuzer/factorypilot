-- The "companies: read own, matched, or platform admin" policy's last branch
-- (an üretici reading the name of a müşteri matched to them) queried
-- company_matches directly in a subquery — but that subquery is itself
-- subject to company_matches' own RLS, which only lets a müşteri read their
-- own matches, not an üretici. The subquery silently returned nothing for
-- any üretici. Route it through a security definer function instead, same
-- fix as is_matched_uretici().
create function is_matched_musteri(target_company_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from company_matches m
    where m.uretici_company_id = current_company_id() and m.musteri_company_id = target_company_id
  );
$$;

drop policy "companies: read own, matched, or platform admin" on companies;
create policy "companies: read own, matched, or platform admin" on companies for select to authenticated
  using (
    is_platform_admin()
    or id = current_company_id()
    or is_matched_uretici(id)
    or is_matched_musteri(id)
  );
