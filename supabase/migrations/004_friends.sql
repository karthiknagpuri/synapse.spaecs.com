-- Friendships table (symmetric relationship)
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  friend_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, friend_id),
  check (user_id <> friend_id)
);

alter table public.friendships enable row level security;

create policy "Users can view own friendships"
  on public.friendships for select
  using (auth.uid() = user_id or auth.uid() = friend_id);

create policy "Users can insert own friendships"
  on public.friendships for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own friendships"
  on public.friendships for delete
  using (auth.uid() = user_id or auth.uid() = friend_id);

create index idx_friendships_user on public.friendships(user_id);
create index idx_friendships_friend on public.friendships(friend_id);

-- Friend requests table
create table public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references public.profiles(id) on delete cascade not null,
  to_user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(from_user_id, to_user_id),
  check (from_user_id <> to_user_id)
);

alter table public.friend_requests enable row level security;

create policy "Users can view own friend requests"
  on public.friend_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send friend requests"
  on public.friend_requests for insert
  with check (auth.uid() = from_user_id);

create policy "Users can update received requests"
  on public.friend_requests for update
  using (auth.uid() = to_user_id);

create index idx_friend_requests_to on public.friend_requests(to_user_id, status);
create index idx_friend_requests_from on public.friend_requests(from_user_id);

-- Invitations table (invite non-users via email)
create table public.invitations (
  id uuid default gen_random_uuid() primary key,
  inviter_id uuid references public.profiles(id) on delete cascade not null,
  email text not null,
  invite_code text unique not null,
  status text default 'pending' check (status in ('pending', 'accepted')),
  accepted_by uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.invitations enable row level security;

create policy "Users can view own invitations"
  on public.invitations for select
  using (auth.uid() = inviter_id);

create policy "Users can create invitations"
  on public.invitations for insert
  with check (auth.uid() = inviter_id);

create index idx_invitations_inviter on public.invitations(inviter_id);
create index idx_invitations_code on public.invitations(invite_code);

-- Allow profiles to be viewed by other authenticated users (for friend search)
create policy "Authenticated users can view profiles"
  on public.profiles for select
  using (auth.role() = 'authenticated');

create trigger friend_requests_updated_at before update on public.friend_requests
  for each row execute function public.update_updated_at();
