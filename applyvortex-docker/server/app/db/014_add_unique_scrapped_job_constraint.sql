-- Add unique constraint to user_scrapped_jobs to enable upsert functionality
-- This prevents a user from having multiple "scraped" entries for the same job

BEGIN;

-- First, clean up any existing duplicates (keeping the most recently updated one)
DELETE FROM user_scrapped_jobs a USING user_scrapped_jobs b
WHERE a.id < b.id 
  AND a.user_id = b.user_id 
  AND a.job_id = b.job_id;

-- Now add the unique constraint
ALTER TABLE user_scrapped_jobs
ADD CONSTRAINT uq_user_scrapped_jobs_user_job UNIQUE (user_id, job_id);

COMMIT;
