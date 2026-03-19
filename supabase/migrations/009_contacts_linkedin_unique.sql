-- Add unique constraint on linkedin_url for proper LinkedIn import upserts
-- NOTE: Non-partial index (no WHERE clause) required for PostgREST ON CONFLICT support.
-- PostgreSQL treats NULLs as distinct in unique indexes, so multiple NULL linkedin_urls are fine.
create unique index if not exists idx_contacts_linkedin_url
  on public.contacts(user_id, linkedin_url);
