-- Soft-delete for companies: a platform admin can retire a company without
-- destroying its data — orders, stage history, etc. all stay intact for
-- audit. Deleting also deactivates the company (blocks login, same as the
-- existing "Pasif yap" toggle) and additionally hides it from every read —
-- unlike merely-pasif companies, which stay visible in the admin list with
-- an "Aktif yap" toggle to bring them back.
alter table companies add column deleted_at timestamptz;

drop policy "companies: read own, matched, or platform admin" on companies;
create policy "companies: read own, matched, or platform admin" on companies for select to authenticated
  using (
    deleted_at is null
    and (
      is_platform_admin()
      or id = current_company_id()
      or is_matched_uretici(id)
      or is_matched_musteri(id)
    )
  );
