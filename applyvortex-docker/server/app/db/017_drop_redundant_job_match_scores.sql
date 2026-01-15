-- Drop valid old table job_match_scores to resolve duplication
-- We are keeping job_match_analysis as the source of truth
BEGIN;

DROP TABLE IF EXISTS job_match_scores CASCADE;

COMMIT;
