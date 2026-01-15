-- Migration: Create user_research table
-- Date: 2025-12-30

-- Step 1: Create the enum type if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'research_type_enum') THEN
        CREATE TYPE research_type_enum AS ENUM (
            'journal',
            'conference',
            'thesis',
            'patent',
            'preprint',
            'book-chapter'
        );
    END IF;
END $$;

-- Step 2: Create the user_research table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_research (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    research_type research_type_enum,
    authors VARCHAR(300) NOT NULL,
    publisher VARCHAR(200) NOT NULL,
    publication_month INTEGER CHECK (publication_month >= 1 AND publication_month <= 12),
    publication_year INTEGER NOT NULL CHECK (publication_year >= 1900 AND publication_year <= 2100),
    url TEXT,
    abstract TEXT NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_research_user_id ON user_research(user_id);

-- Step 4: Create index on display_order for sorting
CREATE INDEX IF NOT EXISTS idx_user_research_display_order ON user_research(user_id, display_order);

-- Step 5: Add comments
COMMENT ON TABLE user_research IS 'User research publications, papers, patents, and academic contributions';
COMMENT ON COLUMN user_research.research_type IS 'Type of research: journal, conference, thesis, patent, preprint, book-chapter';
COMMENT ON COLUMN user_research.publication_month IS 'Month of publication (1-12)';
COMMENT ON COLUMN user_research.publication_year IS 'Year of publication';
COMMENT ON COLUMN user_research.url IS 'DOI or publication URL';
