-- Waitlist price-guess submissions from the marketing landing page.
-- Written exclusively via the /api/waitlist route using the service-role key.
create table if not exists waitlist_guesses (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  guess integer not null check (guess between 0 and 1000000),
  ip_hash text,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_waitlist_guesses_created_at on waitlist_guesses(created_at desc);
create index if not exists idx_waitlist_guesses_ip_hash_created_at on waitlist_guesses(ip_hash, created_at desc);

alter table waitlist_guesses enable row level security;
-- No policies defined — only the service role (used by the API route) can read/write.
