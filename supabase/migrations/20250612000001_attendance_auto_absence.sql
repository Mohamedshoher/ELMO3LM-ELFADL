ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS is_automatic boolean DEFAULT false;
