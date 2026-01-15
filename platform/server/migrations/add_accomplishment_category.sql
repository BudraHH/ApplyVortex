-- Migration: Create user_accomplishments table with category column
-- Date: 2025-12-30

-- Step 1: Create the enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'accomplishment_category_enum') THEN
        CREATE TYPE accomplishment_category_enum AS ENUM ('achievement', 'award', 'leadership', 'volunteering', 'patent', 'publication', 'other');
    END IF;
END $$;

-- Step 2: Create the user_accomplishments table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_accomplishments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    category accomplishment_category_enum,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_accomplishments_user_id ON user_accomplishments(user_id);

-- Step 4: Add comments
COMMENT ON TABLE user_accomplishments IS 'User accomplishments, awards, leadership roles, and achievements';
COMMENT ON COLUMN user_accomplishments.category IS 'Category of the accomplishment: achievement, award, leadership, volunteering, patent, publication, other';
