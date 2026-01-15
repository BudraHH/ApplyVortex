-- ==========================================
-- FILE: 018_add_deep_scraping_fields.sql
-- DESCRIPTION: Add fields for deep scraping enrichment
-- DEPENDENCIES: 004_jobs_and_applications.sql
-- CREATED: 2026-01-06
-- ==========================================

SET client_min_messages TO WARNING;

-- Add deep scraping fields to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS is_easy_apply BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS applicants VARCHAR(100),
ADD COLUMN IF NOT EXISTS seniority_level VARCHAR(100),
ADD COLUMN IF NOT EXISTS deep_scraped_at TIMESTAMPTZ;

-- Add index for Easy Apply filtering
CREATE INDEX IF NOT EXISTS idx_jobs_easy_apply ON jobs(is_easy_apply) WHERE is_easy_apply = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN jobs.is_easy_apply IS 'Whether job has LinkedIn Easy Apply button (from deep scraping)';
COMMENT ON COLUMN jobs.applicants IS 'Number of applicants (e.g., "50 applicants") from LinkedIn';
COMMENT ON COLUMN jobs.seniority_level IS 'Seniority level from job criteria (Entry, Mid-Senior, Director, etc.)';
COMMENT ON COLUMN jobs.deep_scraped_at IS 'Timestamp when full job details were scraped';
