-- Group bot integrations table
create table public.group_bots (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  platform text not null check (platform in ('slack', 'discord', 'email')),
  status text default 'pending' check (status in ('pending', 'active', 'disconnected')),
  config jsonb default '{}',
  -- Slack: { workspace_name, channel_id, channel_name, access_token, bot_token }
  -- Discord: { guild_name, guild_id, channel_id, bot_token }
  -- Email: { email_address }
  webhook_url text,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(group_id, platform)
);

alter table public.group_bots enable row level security;

create policy "Group members can view bots"
  on public.group_bots for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = group_bots.group_id
      and group_members.user_id = auth.uid()
    )
  );

create policy "Admins can manage bots"
  on public.group_bots for all
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = group_bots.group_id
      and group_members.user_id = auth.uid()
      and group_members.role in ('owner', 'admin')
    )
  );

create index idx_group_bots_group on public.group_bots(group_id);

create trigger group_bots_updated_at before update on public.group_bots
  for each row execute function public.update_updated_at();
