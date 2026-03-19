-- Research profiles table for deep profile research engine
create table public.research_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete set null,
  query_name text not null,
  query_context text,
  status text default 'pending' check (status in ('pending', 'researching', 'completed', 'failed')),
  profile_data jsonb,
  sources jsonb default '[]',
  error_message text,
  processing_time_ms integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.research_profiles enable row level security;

create policy "Users can CRUD own research"
  on public.research_profiles for all using (auth.uid() = user_id);

create index idx_research_user on public.research_profiles(user_id);
create index idx_research_contact on public.research_profiles(contact_id);
create index idx_research_status on public.research_profiles(user_id, status);

create trigger research_profiles_updated_at before update on public.research_profiles
  for each row execute function public.update_updated_at();
