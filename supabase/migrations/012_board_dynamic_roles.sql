-- Remove restrictive check constraint to allow custom board seats
ALTER TABLE acceleration_board DROP CONSTRAINT IF EXISTS acceleration_board_role_check;

-- Add columns for custom seats
ALTER TABLE acceleration_board ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE acceleration_board ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE acceleration_board ADD COLUMN IF NOT EXISTS category text DEFAULT 'expert';
