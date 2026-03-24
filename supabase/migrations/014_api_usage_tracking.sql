-- Add monthly API usage tracking columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS monthly_search_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_research_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS usage_reset_at timestamptz;

-- Add async search jobs table for polling-based search
CREATE TABLE IF NOT EXISTS search_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text text NOT NULL,
  filters jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  results jsonb,
  has_more boolean DEFAULT false,
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for search_jobs
ALTER TABLE search_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search jobs"
  ON search_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search jobs"
  ON search_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own search jobs"
  ON search_jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- Index for polling
CREATE INDEX IF NOT EXISTS idx_search_jobs_user_status ON search_jobs(user_id, status);
