-- Groups table
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  avatar_url text,
  created_by uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.groups enable row level security;

create policy "Group members can view groups"
  on public.groups for select
  using (
    exists (
      select 1 from public.group_members
      where group_members.group_id = groups.id
      and group_members.user_id = auth.uid()
    )
    or created_by = auth.uid()
  );

create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

create policy "Group creators can update groups"
  on public.groups for update
  using (auth.uid() = created_by);

create policy "Group creators can delete groups"
  on public.groups for delete
  using (auth.uid() = created_by);

-- Group members table
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  role text default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

alter table public.group_members enable row level security;

create policy "Members can view group members"
  on public.group_members for select
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
    )
  );

create policy "Owners and admins can add members"
  on public.group_members for insert
  with check (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
    )
    or auth.uid() = user_id
  );

create policy "Owners can remove members"
  on public.group_members for delete
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_members.group_id
      and gm.user_id = auth.uid()
      and gm.role in ('owner', 'admin')
    )
    or auth.uid() = user_id
  );

create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);

create trigger groups_updated_at before update on public.groups
  for each row execute function public.update_updated_at();
