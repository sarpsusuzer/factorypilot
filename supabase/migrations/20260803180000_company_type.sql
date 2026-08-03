-- Companies are either the manufacturer running FactoryPilot ("Üretici")
-- or a customer being tracked in it ("Müşteri"). Defaults to 'uretici' for
-- every company that already exists.
alter table companies
  add column company_type text not null default 'uretici'
  check (company_type in ('uretici', 'musteri'));

-- "Müşteri adı" is superseded by company type — drop it everywhere, and
-- make sure every company still has exactly one order-scope title field
-- afterward (same invariant the app's own removeField() enforces).
delete from field_definitions where key = 'client_name';

update field_definitions f
set is_title_field = true
from (
  select distinct on (company_id) id, company_id
  from field_definitions
  where scope = 'order'
  order by company_id, position
) first_remaining
where f.id = first_remaining.id
  and not exists (
    select 1 from field_definitions t
    where t.company_id = f.company_id and t.scope = 'order' and t.is_title_field
  );
