-- Migration to add fields to user_skill_map
ALTER TABLE user_skill_map ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE;
ALTER TABLE user_skill_map ADD COLUMN IF NOT EXISTS proficiency_level VARCHAR(50);
ALTER TABLE user_skill_map ADD COLUMN IF NOT EXISTS years_of_experience INTEGER DEFAULT 0;
