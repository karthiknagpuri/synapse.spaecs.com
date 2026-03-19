-- Allow 'needs_reauth' status for integrations
alter table public.integrations drop constraint if exists integrations_status_check;
alter table public.integrations add constraint integrations_status_check
  check (status in ('active', 'expired', 'revoked', 'needs_reauth'));
