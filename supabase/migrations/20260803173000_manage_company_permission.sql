-- New companies get 'manage_company' in their bootstrap admin role from the
-- platform-admin edge function; backfill it onto roles created before that
-- permission existed, so existing admins can upload their company's logo.
update roles
set permissions = permissions || array['manage_company']
where is_protected and not ('manage_company' = any (permissions));
