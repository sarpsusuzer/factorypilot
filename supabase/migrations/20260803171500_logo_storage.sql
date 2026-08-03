-- Company logos: public bucket (shown in the nav for anyone), but only a
-- company's own admin can upload into their own company's folder.
insert into storage.buckets (id, name, public)
values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy "logos: public read" on storage.objects for select
  using (bucket_id = 'logos');

create policy "logos: company admin upload" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = current_company_id()::text
    and has_permission('manage_company')
  );

create policy "logos: company admin update" on storage.objects for update to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = current_company_id()::text
    and has_permission('manage_company')
  )
  with check (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = current_company_id()::text
    and has_permission('manage_company')
  );

create policy "logos: company admin delete" on storage.objects for delete to authenticated
  using (
    bucket_id = 'logos'
    and (storage.foldername(name))[1] = current_company_id()::text
    and has_permission('manage_company')
  );
