-- Expand interactions table to support manually-added notes as interactions
-- Add 'manual' platform and new interaction types

-- Drop existing CHECK constraints
alter table public.interactions drop constraint if exists interactions_platform_check;
alter table public.interactions drop constraint if exists interactions_type_check;

-- Re-add with expanded values
alter table public.interactions
  add constraint interactions_platform_check
  check (platform in ('gmail', 'calendar', 'linkedin', 'twitter', 'manual'));

alter table public.interactions
  add constraint interactions_type_check
  check (type in ('email_sent', 'email_received', 'meeting', 'connection', 'call', 'note', 'meeting_note'));
