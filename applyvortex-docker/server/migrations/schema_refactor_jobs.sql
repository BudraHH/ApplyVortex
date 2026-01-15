-- Migration Script: Refactor Jobs Table

-- 1. Truncate table to allow NOT NULL constraints and type changes without data issues
TRUNCATE TABLE jobs AND job_applications AND job_match_scores AND generated_cover_letters AND user_scrapped_jobs CASCADE;

-- 2. Rename existing columns
ALTER TABLE jobs RENAME COLUMN portal_id TO job_portal_id;
ALTER TABLE jobs RENAME COLUMN external_job_id TO external_id;
ALTER TABLE jobs RENAME COLUMN job_url TO apply_url;

-- 3. Alter existing columns types/constraints
ALTER TABLE jobs ALTER COLUMN apply_url TYPE TEXT;
ALTER TABLE jobs ALTER COLUMN description TYPE TEXT;
ALTER TABLE jobs ALTER COLUMN location_type TYPE VARCHAR(50); -- Drop enum usage
ALTER TABLE jobs ALTER COLUMN job_type TYPE VARCHAR(50); -- Drop enum usage
ALTER TABLE jobs ALTER COLUMN experience_level TYPE VARCHAR(50); -- Drop enum usage

-- 4. Add new columns
ALTER TABLE jobs ADD COLUMN company_website VARCHAR(255);
ALTER TABLE jobs ADD COLUMN company_logo_url TEXT;
ALTER TABLE jobs ADD COLUMN application_type VARCHAR(50) DEFAULT 'external' NOT NULL;
ALTER TABLE jobs ADD COLUMN status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN metadata JSONB DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN location_raw VARCHAR(255);
ALTER TABLE jobs ALTER COLUMN location RENAME TO location_city; -- Check if location was city? Or raw? Assuming city or rename old location column? Old was generic. Let's rename old 'location' to 'location_raw' actually? Or 'location_city'? Let's Drop old location and add new ones to be clean, but rename acts as mapping.
-- Old 'location' was VARCHAR(255). Let's map it to location_raw.
ALTER TABLE jobs RENAME COLUMN location TO location_raw;
ALTER TABLE jobs ADD COLUMN location_city VARCHAR(100);
ALTER TABLE jobs ADD COLUMN location_country VARCHAR(100);

ALTER TABLE jobs ADD COLUMN salary_raw VARCHAR(255);
ALTER TABLE jobs ADD COLUMN requirements TEXT[];
ALTER TABLE jobs ADD COLUMN responsibilities TEXT[];
ALTER TABLE jobs ADD COLUMN extracted_keywords TEXT[];
ALTER TABLE jobs ADD COLUMN is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN application_count INTEGER DEFAULT 0;
ALTER TABLE jobs ADD COLUMN scraped_at TIMESTAMPTZ DEFAULT NOW();

-- 5. Finalize Constraints (after data truncated)
ALTER TABLE jobs ALTER COLUMN job_portal_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN external_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN apply_url SET NOT NULL;

-- 6. Update Unique Constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS uq_jobs_external_id;
ALTER TABLE jobs ADD CONSTRAINT jobs_job_portal_id_external_id_key UNIQUE (job_portal_id, external_id);

-- 7. Update Foreign Key to ON DELETE CASCADE (if not already)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_portal_id_fkey; -- Check constraint name from \d jobs output earlier: "jobs_job_portal_id_fkey" (no wait, I aliased it earlier in SQL file but check existing DB).
-- From Step 361: "jobs_job_portal_id_fkey" FOREIGN KEY (job_portal_id) REFERENCES job_portals(id) ON DELETE SET NULL
-- Wait, Step 361 output shows `job_portal_id` column ALREADY EXISTS?
-- Step 361 output:
-- "job_portal_id" uuid
-- "external_id" character varying
-- "apply_url" character varying
-- ...
-- Wait, did I ALREADY migrate it partially?
-- Step 361 output shows:
--  title, company_name, company_website, company_logo_url, location_type (enum), location_city, location_state, location_country, salary_min, salary_max, salary_currency, experience_level(enum), job_type(enum), description, requirements, responsibilities, apply_url, external_id, job_portal_id, scraped_at, expires_at, is_active, is_featured, application_count, view_count, extracted_keywords, created_at, updated_at.
--
-- The DB ALREADY has most of these fields from a previous migration?
-- Step 361 shows `jobs` table has `location_city`, `location_state`, `location_country`.
-- And `job_portal_id` (not portal_id).
-- And `external_id` (not external_job_id).
-- And `apply_url`.
--
-- BUT the SQL file `004` I just read had `portal_id`, `external_job_id`, `job_url`, `location` (generic).
-- SO THE SQL FILE WAS OUT OF SYNC WITH THE DB?
-- Yes, file `004` line 5 says "CREATED: 2025-12-28 (Refactored)".
-- Step 361 output confirms the DB schema is surprisingly close to what user wants, just missing `application_type`, `status`, `metadata`, `location_raw`, `salary_raw`, `posted_at`.
--
-- Wait, `posted_at` in Step 361?
-- Step 361 output does NOT show `posted_at`.
-- It shows `scraped_at`.
--
-- So I DO NOT need to rename columns `portal_id` -> `job_portal_id` because it is ALREADY `job_portal_id`.
-- I DO NOT need to rename `external_job_id` -> `external_id` because it is ALREADY `external_id`.
--
-- I need to ADD:
--  `application_type`, `status`, `metadata`.
--  `location_raw`, `salary_raw`.
--  `posted_at`.
--
-- And modify `location_type` from ENUM to VARCHAR(50).
-- And modify `job_type` from ENUM to VARCHAR(50).
-- And modify `experience_level` from ENUM to VARCHAR(50).
--
-- And ensure constraints. `job_portal_id` is currently REFERENCES ... ON DELETE SET NULL. User wants ON DELETE CASCADE.
-- `external_id` doesn't say NOT NULL in Step 361? (Wait, schema says "character varying" without NOT NULL, maybe).
--
-- So I should adjust the migration script to reflect the ACTUAL state of the DB.
--
-- Let's verify Step 361 again.
-- jobs table:
--  id (uuid)
--  title (varchar)
--  company_name (varchar)
--  company_website (varchar)
--  company_logo_url (varchar)
--  location_type (USER-DEFINED enum)
--  location_city (varchar)
--  location_state (varchar) -> User didn't ask for this but I can keep it or ignore.
--  location_country (varchar)
--  salary_min, salary_max (integer)
--  salary_currency (varchar)
--  experience_level (USER-DEFINED enum)
--  job_type (USER-DEFINED enum)
--  description (text)
--  requirements (ARRAY)
--  responsibilities (ARRAY)
--  apply_url (varchar)
--  external_id (varchar)
--  job_portal_id (uuid)
--  scraped_at (timestamptz)
--  expires_at (timestamptz)
--  is_active (boolean)
--  is_featured (boolean)
--  application_count (integer)
--  view_count (integer)
--  extracted_keywords (ARRAY)
--  created_at, updated_at
--
-- So I ONLY need to add:
-- application_type, status, metadata, location_raw, salary_raw, posted_at.
-- And change FK constraint.
-- And Drop/Change Enums to Varchars.

-- REVISED SQL SCRIPT:
TRUNCATE TABLE jobs CASCADE;

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS application_type VARCHAR(50) DEFAULT 'external' NOT NULL;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location_raw VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salary_raw VARCHAR(255);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS posted_at TIMESTAMPTZ;

-- Drop constraints relying on Enums if any, then change type.
-- Postgres `ALTER COLUMN ... TYPE ...` handles casting.
ALTER TABLE jobs ALTER COLUMN location_type TYPE VARCHAR(50) USING location_type::text;
ALTER TABLE jobs ALTER COLUMN job_type TYPE VARCHAR(50) USING job_type::text;
ALTER TABLE jobs ALTER COLUMN experience_level TYPE VARCHAR(50) USING experience_level::text;

-- Update FK to CASCADE
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS "jobs_job_portal_id_fkey";
ALTER TABLE jobs ADD CONSTRAINT jobs_job_portal_id_fkey FOREIGN KEY (job_portal_id) REFERENCES job_portals(id) ON DELETE CASCADE;

-- Ensure NOT NULLs
ALTER TABLE jobs ALTER COLUMN job_portal_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN external_id SET NOT NULL;
ALTER TABLE jobs ALTER COLUMN apply_url SET NOT NULL;

-- Constraints
-- Remove old constraints on external_id/portal if necessary. 
-- Step 368 output didn't list unique constraints explicitly besides Indexes? 
-- Actually Step 361 listed Foreign-key constraints.
-- Let's just add the UNIQUE(job_portal_id, external_id).
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS uq_jobs_external_id; -- Just in case
ALTER TABLE jobs ADD CONSTRAINT jobs_unique_portal_external UNIQUE (job_portal_id, external_id);

