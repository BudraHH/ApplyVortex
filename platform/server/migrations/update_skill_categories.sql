-- Migration to add missing categories and update skill categories
-- This script will:
-- 1. Add missing categories to skill_category_enum
-- 2. Update/create skills with correct categories
-- 3. Merge JAX-RS variants

BEGIN;

-- 1. Add missing categories to the enum
DO $$
BEGIN
    -- Add Methodologies
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Methodologies' AND enumtypid = 'skill_category_enum'::regtype) THEN
        ALTER TYPE skill_category_enum ADD VALUE 'Methodologies';
        RAISE NOTICE 'Added Methodologies to skill_category_enum';
    END IF;
    
    -- Add Computer Fundamentals
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Computer Fundamentals' AND enumtypid = 'skill_category_enum'::regtype) THEN
        ALTER TYPE skill_category_enum ADD VALUE 'Computer Fundamentals';
        RAISE NOTICE 'Added Computer Fundamentals to skill_category_enum';
    END IF;
    
    -- Add Soft Skills
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Soft Skills' AND enumtypid = 'skill_category_enum'::regtype) THEN
        ALTER TYPE skill_category_enum ADD VALUE 'Soft Skills';
        RAISE NOTICE 'Added Soft Skills to skill_category_enum';
    END IF;
    
    -- Add OS
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OS' AND enumtypid = 'skill_category_enum'::regtype) THEN
        ALTER TYPE skill_category_enum ADD VALUE 'OS';
        RAISE NOTICE 'Added OS to skill_category_enum';
    END IF;
    
    -- Add Dev Tools
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'Dev Tools' AND enumtypid = 'skill_category_enum'::regtype) THEN
        ALTER TYPE skill_category_enum ADD VALUE 'Dev Tools';
        RAISE NOTICE 'Added Dev Tools to skill_category_enum';
    END IF;
END $$;

COMMIT;

-- Start a new transaction for the data updates
BEGIN;

-- 2. Create or Update Agile skill with Methodologies category
INSERT INTO skills (name, category, is_verified)
VALUES ('Agile', 'Methodologies', true)
ON CONFLICT (name) DO UPDATE
SET category = 'Methodologies', is_verified = true;

-- 3. Create or Update Algorithms skill with Computer Fundamentals category
INSERT INTO skills (name, category, is_verified)
VALUES ('Algorithms', 'Computer Fundamentals', true)
ON CONFLICT (name) DO UPDATE
SET category = 'Computer Fundamentals', is_verified = true;

-- 4. Create or Update Data Structures skill with Computer Fundamentals category
INSERT INTO skills (name, category, is_verified)
VALUES ('Data Structures', 'Computer Fundamentals', true)
ON CONFLICT (name) DO UPDATE
SET category = 'Computer Fundamentals', is_verified = true;

-- 5. Create or Update IntelliJ skills with Dev Tools category
INSERT INTO skills (name, category, aliases, is_verified)
VALUES ('IntelliJ IDEA', 'Dev Tools', ARRAY['IntelliJ'], true)
ON CONFLICT (name) DO UPDATE
SET category = 'Dev Tools', aliases = ARRAY['IntelliJ'], is_verified = true;

-- Also handle just "IntelliJ" as a separate entry that points to IntelliJ IDEA
INSERT INTO skills (name, category, aliases, is_verified)
VALUES ('IntelliJ', 'Dev Tools', ARRAY['IntelliJ IDEA'], true)
ON CONFLICT (name) DO UPDATE
SET category = 'Dev Tools', aliases = ARRAY['IntelliJ IDEA'], is_verified = true;

-- 6. Merge JAX-RS variants (Jersey, JAX-RS (Jersey), JAX-RS)
DO $$
DECLARE
    canonical_skill_id UUID;
    jersey_id UUID;
    jaxrs_jersey_id UUID;
BEGIN
    -- Create or get canonical JAX-RS skill with Backend Development category
    INSERT INTO skills (name, category, aliases, is_verified)
    VALUES ('JAX-RS', 'Backend Development', ARRAY['Jersey', 'JAX-RS (Jersey)'], true)
    ON CONFLICT (name) DO UPDATE
    SET category = 'Backend Development',
        aliases = ARRAY['Jersey', 'JAX-RS (Jersey)'],
        is_verified = true
    RETURNING id INTO canonical_skill_id;
    
    RAISE NOTICE 'JAX-RS skill ID: %', canonical_skill_id;
    
    -- Find IDs of variant skills (if they exist)
    SELECT id INTO jersey_id FROM skills WHERE LOWER(name) = 'jersey' AND id != canonical_skill_id LIMIT 1;
    SELECT id INTO jaxrs_jersey_id FROM skills WHERE LOWER(name) = 'jax-rs (jersey)' AND id != canonical_skill_id LIMIT 1;
    
    -- Merge Jersey into JAX-RS
    IF jersey_id IS NOT NULL THEN
        -- Update user skills (avoid duplicates)
        UPDATE user_skill_map 
        SET skill_id = canonical_skill_id 
        WHERE skill_id = jersey_id
        AND NOT EXISTS (
            SELECT 1 FROM user_skill_map usm
            WHERE usm.user_id = user_skill_map.user_id 
            AND usm.skill_id = canonical_skill_id
        );
        
        -- Delete duplicate user skills that couldn't be migrated
        DELETE FROM user_skill_map WHERE skill_id = jersey_id;
        
        -- Update experience skills (avoid duplicates)
        UPDATE user_experience_skill_map 
        SET skill_id = canonical_skill_id 
        WHERE skill_id = jersey_id
        AND NOT EXISTS (
            SELECT 1 FROM user_experience_skill_map uesm
            WHERE uesm.user_experience_id = user_experience_skill_map.user_experience_id 
            AND uesm.skill_id = canonical_skill_id
        );
        
        -- Delete duplicate experience skills that couldn't be migrated
        DELETE FROM user_experience_skill_map WHERE skill_id = jersey_id;
        
        -- Update project skills (avoid duplicates)
        UPDATE user_project_skill_map 
        SET skill_id = canonical_skill_id 
        WHERE skill_id = jersey_id
        AND NOT EXISTS (
            SELECT 1 FROM user_project_skill_map upsm
            WHERE upsm.user_project_id = user_project_skill_map.user_project_id 
            AND upsm.skill_id = canonical_skill_id
        );
        
        -- Delete duplicate project skills that couldn't be migrated
        DELETE FROM user_project_skill_map WHERE skill_id = jersey_id;
        
        -- Delete the duplicate skill
        DELETE FROM skills WHERE id = jersey_id;
        RAISE NOTICE 'Merged Jersey skill into JAX-RS';
    END IF;
    
    -- Merge JAX-RS (Jersey) into JAX-RS
    IF jaxrs_jersey_id IS NOT NULL THEN
        -- Update user skills (avoid duplicates)
        UPDATE user_skill_map 
        SET skill_id = canonical_skill_id 
        WHERE skill_id = jaxrs_jersey_id
        AND NOT EXISTS (
            SELECT 1 FROM user_skill_map usm
            WHERE usm.user_id = user_skill_map.user_id 
            AND usm.skill_id = canonical_skill_id
        );
        
        -- Delete duplicate user skills that couldn't be migrated
        DELETE FROM user_skill_map WHERE skill_id = jaxrs_jersey_id;
        
        -- Update experience skills (avoid duplicates)
        UPDATE user_experience_skill_map 
        SET skill_id = canonical_skill_id 
        WHERE skill_id = jaxrs_jersey_id
        AND NOT EXISTS (
            SELECT 1 FROM user_experience_skill_map uesm
            WHERE uesm.user_experience_id = user_experience_skill_map.user_experience_id 
            AND uesm.skill_id = canonical_skill_id
        );
        
        -- Delete duplicate experience skills that couldn't be migrated
        DELETE FROM user_experience_skill_map WHERE skill_id = jaxrs_jersey_id;
        
        -- Update project skills (avoid duplicates)
        UPDATE user_project_skill_map 
        SET skill_id = canonical_skill_id 
        WHERE skill_id = jaxrs_jersey_id
        AND NOT EXISTS (
            SELECT 1 FROM user_project_skill_map upsm
            WHERE upsm.user_project_id = user_project_skill_map.user_project_id 
            AND upsm.skill_id = canonical_skill_id
        );
        
        -- Delete duplicate project skills that couldn't be migrated
        DELETE FROM user_project_skill_map WHERE skill_id = jaxrs_jersey_id;
        
        -- Delete the duplicate skill
        DELETE FROM skills WHERE id = jaxrs_jersey_id;
        RAISE NOTICE 'Merged JAX-RS (Jersey) skill into JAX-RS';
    END IF;
END $$;

COMMIT;

-- Verify the changes
SELECT 
    name, 
    category, 
    aliases,
    is_verified
FROM skills 
WHERE LOWER(name) IN ('agile', 'algorithms', 'data structures', 'intellij', 'intellij idea', 'jax-rs', 'jersey', 'jax-rs (jersey)')
ORDER BY name;
