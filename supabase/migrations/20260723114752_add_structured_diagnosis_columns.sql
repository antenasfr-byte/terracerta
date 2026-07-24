-- TerraCerta — Add new columns for structured AI diagnosis
-- These are additive ALTER TABLE statements (no data loss).

ALTER TABLE diagnoses
  ADD COLUMN IF NOT EXISTS plant_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS scientific_name text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS problem_category text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS visible_signs jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS immediate_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS biological_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS conventional_actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS safety_warnings jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS new_photos_required jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS safety_disclaimer text NOT NULL DEFAULT '';
