-- ============================================================
-- Feature: Contact Notes
-- ============================================================
create table public.contact_notes (
  id uuid default gen_random_uuid() primary key,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.contact_notes enable row level security;

create policy "Users can CRUD own notes"
  on public.contact_notes for all using (auth.uid() = user_id);

create index idx_notes_contact on public.contact_notes(contact_id);
create index idx_notes_user on public.contact_notes(user_id);
create index idx_notes_content on public.contact_notes using gin(to_tsvector('english', content));

create trigger notes_updated_at before update on public.contact_notes
  for each row execute function public.update_updated_at();

-- ============================================================
-- Feature: Relationship Strength
-- ============================================================
alter table public.contacts add column if not exists relationship_score integer default 0;
alter table public.contacts add column if not exists score_updated_at timestamptz;

-- ============================================================
-- Feature: Pipelines
-- ============================================================
create table public.pipelines (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text,
  type text default 'custom' check (type in ('fundraising', 'hiring', 'sales', 'custom')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pipelines enable row level security;

create policy "Users can CRUD own pipelines"
  on public.pipelines for all using (auth.uid() = user_id);

create table public.pipeline_stages (
  id uuid default gen_random_uuid() primary key,
  pipeline_id uuid references public.pipelines(id) on delete cascade not null,
  name text not null,
  position integer not null default 0,
  color text default '#6B7280',
  created_at timestamptz default now()
);

alter table public.pipeline_stages enable row level security;

create policy "Users can CRUD own pipeline stages"
  on public.pipeline_stages for all
  using (exists (
    select 1 from public.pipelines p where p.id = pipeline_id and p.user_id = auth.uid()
  ));

create table public.pipeline_cards (
  id uuid default gen_random_uuid() primary key,
  stage_id uuid references public.pipeline_stages(id) on delete cascade not null,
  contact_id uuid references public.contacts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  position integer not null default 0,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.pipeline_cards enable row level security;

create policy "Users can CRUD own pipeline cards"
  on public.pipeline_cards for all using (auth.uid() = user_id);

create index idx_pipeline_cards_stage on public.pipeline_cards(stage_id);
create index idx_pipeline_cards_contact on public.pipeline_cards(contact_id);

create trigger pipelines_updated_at before update on public.pipelines
  for each row execute function public.update_updated_at();

create trigger pipeline_cards_updated_at before update on public.pipeline_cards
  for each row execute function public.update_updated_at();

-- ============================================================
-- Feature: AI Auto-Tagging (Tag Definitions)
-- ============================================================
create table public.tag_definitions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  criteria text not null,
  color text default '#6B7280',
  auto_assign boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tag_definitions enable row level security;

create policy "Users can CRUD own tag definitions"
  on public.tag_definitions for all using (auth.uid() = user_id);

create trigger tag_definitions_updated_at before update on public.tag_definitions
  for each row execute function public.update_updated_at();
