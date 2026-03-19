-- API keys table for developer access
create table public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null default 'Default',
  key text not null unique,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  revoked_at timestamptz
);

alter table public.api_keys enable row level security;

create policy "Users can CRUD own API keys"
  on public.api_keys for all using (auth.uid() = user_id);

create index idx_api_keys_user on public.api_keys(user_id);
create index idx_api_keys_key on public.api_keys(key) where revoked_at is null;
