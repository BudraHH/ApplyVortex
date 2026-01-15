-- Migration to replace boolean match flags with single integer match_quality column
BEGIN;

ALTER TABLE job_match_analysis 
    DROP COLUMN IF EXISTS is_strong_match,
    DROP COLUMN IF EXISTS is_good_match;

ALTER TABLE job_match_analysis 
    ADD COLUMN match_quality SMALLINT DEFAULT 1;

-- Optional: You could update existing rows if you had any data using a temporary update statement here
-- UPDATE job_match_analysis SET match_quality = CASE WHEN overall_match >= 0.8 THEN 4 ... END;

COMMIT;
