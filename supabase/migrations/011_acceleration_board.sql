-- Acceleration Board: inner circle of 5 key roles
create table if not exists acceleration_board (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('operator', 'investor', 'storyteller', 'protector', 'optimist')),
  contact_id uuid not null references contacts(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, role)
);

-- Index for fast lookups
create index if not exists idx_acceleration_board_user on acceleration_board(user_id);

-- RLS
alter table acceleration_board enable row level security;

create policy "Users can view own board"
  on acceleration_board for select
  using (auth.uid() = user_id);

create policy "Users can insert own board"
  on acceleration_board for insert
  with check (auth.uid() = user_id);

create policy "Users can update own board"
  on acceleration_board for update
  using (auth.uid() = user_id);

create policy "Users can delete own board"
  on acceleration_board for delete
  using (auth.uid() = user_id);
