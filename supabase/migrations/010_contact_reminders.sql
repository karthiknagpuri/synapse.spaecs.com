-- Add reminder columns to contacts table
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS reminder_frequency text;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS next_reminder_at timestamptz;

-- Index for efficient reminder queries
CREATE INDEX IF NOT EXISTS idx_contacts_next_reminder
  ON contacts(user_id, next_reminder_at)
  WHERE next_reminder_at IS NOT NULL;
