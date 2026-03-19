-- Enable pgvector extension
create extension if not exists vector with schema extensions;

-- Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  search_count integer default 0,
  plan text default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Contacts table
create table public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  full_name text not null,
  email text,
  phone text,
  company text,
  title text,
  location text,
  bio text,
  linkedin_url text,
  twitter_handle text,
  avatar_url text,
  tags text[] default '{}',
  source text default 'manual' check (source in ('gmail', 'calendar', 'linkedin', 'manual')),
  last_interaction_at timestamptz,
  interaction_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, email)
);

alter table public.contacts enable row level security;

create policy "Users can CRUD own contacts"
  on public.contacts for all using (auth.uid() = user_id);

create index idx_contacts_user_id on public.contacts(user_id);
create index idx_contacts_email on public.contacts(user_id, email);
create index idx_contacts_location on public.contacts(location);

-- Interactions table
create table public.interactions (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null check (platform in ('gmail', 'calendar', 'linkedin', 'twitter')),
  type text not null check (type in ('email_sent', 'email_received', 'meeting', 'connection')),
  subject text,
  snippet text,
  metadata jsonb,
  occurred_at timestamptz not null,
  created_at timestamptz default now()
);

alter table public.interactions enable row level security;

create policy "Users can CRUD own interactions"
  on public.interactions for all using (auth.uid() = user_id);

create index idx_interactions_contact on public.interactions(contact_id);
create index idx_interactions_user on public.interactions(user_id);
create index idx_interactions_date on public.interactions(occurred_at);

-- Contact embeddings table (pgvector)
create table public.contact_embeddings (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade unique not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  embedding vector(1536),
  content_hash text,
  updated_at timestamptz default now()
);

alter table public.contact_embeddings enable row level security;

create policy "Users can CRUD own embeddings"
  on public.contact_embeddings for all using (auth.uid() = user_id);

create index idx_embeddings_user on public.contact_embeddings(user_id);

create index idx_embeddings_vector on public.contact_embeddings
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Integrations table
create table public.integrations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null check (platform in ('google', 'linkedin')),
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  scopes text[] default '{}',
  status text default 'active' check (status in ('active', 'expired', 'revoked')),
  last_synced_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, platform)
);

alter table public.integrations enable row level security;

create policy "Users can CRUD own integrations"
  on public.integrations for all using (auth.uid() = user_id);

-- Ingestion jobs table
create table public.ingestion_jobs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  platform text not null,
  status text default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  total_items integer default 0,
  processed_items integer default 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.ingestion_jobs enable row level security;

create policy "Users can view own jobs"
  on public.ingestion_jobs for all using (auth.uid() = user_id);

-- Semantic search RPC function
create or replace function public.semantic_search(
  query_embedding vector(1536),
  match_user_id uuid,
  match_count int default 20,
  filter_location text default null,
  filter_platform text default null,
  filter_after timestamptz default null
)
returns table (
  contact_id uuid,
  full_name text,
  email text,
  company text,
  title text,
  location text,
  tags text[],
  last_interaction_at timestamptz,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    c.id as contact_id,
    c.full_name,
    c.email,
    c.company,
    c.title,
    c.location,
    c.tags,
    c.last_interaction_at,
    1 - (ce.embedding <=> query_embedding) as similarity
  from public.contact_embeddings ce
  join public.contacts c on c.id = ce.contact_id
  where ce.user_id = match_user_id
    and (filter_location is null or c.location ilike '%' || filter_location || '%')
    and (filter_platform is null or c.source = filter_platform)
    and (filter_after is null or c.last_interaction_at >= filter_after)
  order by ce.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Updated_at trigger function
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contacts_updated_at before update on public.contacts
  for each row execute function public.update_updated_at();

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger integrations_updated_at before update on public.integrations
  for each row execute function public.update_updated_at();
